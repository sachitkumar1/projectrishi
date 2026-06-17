import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { findMember } from "@/lib/members";
import {
  canApproveTask,
  canAssignTaskTo,
  canManageTask,
  canSubmitTask,
} from "@/lib/lms/permissions";
import { approveTask, deleteTask, getTask, setTaskArchived, submitTask, updateTask } from "@/lib/lms/store";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  let body: { action?: string; [k: string]: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const task = await getTask(params.id);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  if (body.action === "submit") {
    if (!canSubmitTask(task, me.email))
      return NextResponse.json({ error: "Only the assignee can do that." }, { status: 403 });
    return NextResponse.json({ task: await submitTask(task) });
  }

  if (body.action === "approve") {
    if (!canApproveTask(task, me.email))
      return NextResponse.json(
        { error: "Only the person who assigned it can mark it complete." },
        { status: 403 }
      );
    return NextResponse.json({ task: await approveTask(task) });
  }

  if (body.action === "archive" || body.action === "unarchive") {
    if (!canManageTask(me, task))
      return NextResponse.json({ error: "You can't archive this task." }, { status: 403 });
    return NextResponse.json({ task: await setTaskArchived(task.id, body.action === "archive") });
  }

  if (body.action === "edit") {
    if (!canManageTask(me, task))
      return NextResponse.json({ error: "You can't edit this task." }, { status: 403 });
    if (task.status === "complete")
      return NextResponse.json({ error: "Completed tasks can't be edited." }, { status: 400 });

    const title = String(body.title ?? "").trim();
    const dueAt = String(body.dueAt ?? "");
    const assigneeEmail = String(body.assigneeEmail ?? task.assigneeEmail);
    if (!title) return NextResponse.json({ error: "A title is required." }, { status: 400 });
    if (!dueAt) return NextResponse.json({ error: "A due date is required." }, { status: 400 });

    // If the assignee is being changed, the editor must be allowed to assign to them.
    if (assigneeEmail.toLowerCase() !== task.assigneeEmail.toLowerCase()) {
      const target = findMember(assigneeEmail);
      if (!target || !canAssignTaskTo(me, target))
        return NextResponse.json({ error: `You can't assign to ${assigneeEmail}.` }, { status: 403 });
    }

    const updated = await updateTask(task.id, {
      title,
      description: String(body.description ?? "").trim(),
      tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
      dueAt,
      requiresFile: Boolean(body.requiresFile),
      assigneeEmail,
    });
    return NextResponse.json({ task: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const task = await getTask(params.id);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  if (!canManageTask(me, task))
    return NextResponse.json({ error: "You can't delete this task." }, { status: 403 });
  await deleteTask(task.id);
  return NextResponse.json({ ok: true });
}
