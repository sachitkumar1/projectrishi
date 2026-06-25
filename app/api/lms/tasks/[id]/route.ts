import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { canSeeMember, findMember } from "@/lib/members";
import {
  canApproveTask,
  canAssignTaskTo,
  canManageTask,
  canRejectTask,
  canSubmitTask,
  canUnmarkTask,
} from "@/lib/lms/permissions";
import {
  addTaskComment,
  approveTask,
  deleteTask,
  editTaskGroup,
  getTask,
  getTasksByGroup,
  rejectTask,
  setTaskArchived,
  submitTask,
  unmarkTask,
  updateTask,
} from "@/lib/lms/store";
import {
  notifyTaskApproved,
  notifyTaskArchived,
  notifyTaskAssigned,
  notifyTaskDeleted,
  notifyTaskRejected,
  notifyTaskSubmitted,
  notifyTaskUnmarked,
} from "@/lib/lms/notify";

export const dynamic = "force-dynamic";

const str = (v: unknown) => (typeof v === "string" ? v : "");
const trimOrNull = (v: unknown) => {
  const s = str(v).trim();
  return s ? s : null;
};

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

  // ---- assignee marks done (with optional text/link submission + comment) ----
  if (body.action === "submit") {
    if (!canSubmitTask(task, me.email))
      return NextResponse.json({ error: "Only the assignee can do that." }, { status: 403 });
    const text = trimOrNull(body.submissionText);
    const link = trimOrNull(body.submissionLink);
    if (task.requireSubmission && !text && !link)
      return NextResponse.json(
        { error: "This task requires a written note or a link before you can mark it done." },
        { status: 400 }
      );
    const note = trimOrNull(body.note);
    let updated = await submitTask(task, { text, link });
    if (note) updated = await addTaskComment(updated, me.email, note, null);
    if (!task.assigneeEmail || task.assignerEmail.toLowerCase() !== task.assigneeEmail.toLowerCase()) {
      await notifyTaskSubmitted(updated, note).catch(() => {});
    }
    return NextResponse.json({ task: updated });
  }

  // ---- manager approves ----
  if (body.action === "approve") {
    if (!canApproveTask(me, task))
      return NextResponse.json({ error: "You can't approve this task." }, { status: 403 });
    const updated = await approveTask(task, me.email);
    if (task.assigneeEmail.toLowerCase() !== me.email.toLowerCase())
      await notifyTaskApproved(updated, me.email).catch(() => {});
    return NextResponse.json({ task: updated });
  }

  // ---- manager rejects a pending submission (with optional comment) ----
  if (body.action === "reject") {
    if (!canRejectTask(me, task))
      return NextResponse.json({ error: "You can't reject this task." }, { status: 403 });
    const note = trimOrNull(body.note);
    let updated = await rejectTask(task, me.email, note);
    if (note) updated = await addTaskComment(updated, me.email, note, null);
    await notifyTaskRejected(updated, me.email, note).catch(() => {});
    return NextResponse.json({ task: updated });
  }

  // ---- unmark complete: doer (changed mind) or manager (with optional note) ----
  if (body.action === "unmark") {
    if (!canUnmarkTask(me, task))
      return NextResponse.json({ error: "You can't unmark this task." }, { status: 403 });
    const note = trimOrNull(body.note);
    let updated = await unmarkTask(task, me.email, note);
    if (note) updated = await addTaskComment(updated, me.email, note, null);
    // Only email the doer when someone ELSE unmarked it (per spec).
    if (task.assigneeEmail.toLowerCase() !== me.email.toLowerCase())
      await notifyTaskUnmarked(updated, me.email, note).catch(() => {});
    return NextResponse.json({ task: updated });
  }

  // ---- comment / reply (either party) ----
  if (body.action === "comment") {
    const isParty =
      canManageTask(me, task) || task.assigneeEmail.toLowerCase() === me.email.toLowerCase();
    if (!isParty)
      return NextResponse.json({ error: "You can't comment on this task." }, { status: 403 });
    const text = str(body.body).trim();
    if (!text) return NextResponse.json({ error: "Comment can't be empty." }, { status: 400 });
    const parentId = trimOrNull(body.parentId);
    const updated = await addTaskComment(task, me.email, text, parentId);
    return NextResponse.json({ task: updated });
  }

  // ---- archive / unarchive ----
  if (body.action === "archive" || body.action === "unarchive") {
    if (!canManageTask(me, task))
      return NextResponse.json({ error: "You can't archive this task." }, { status: 403 });
    const updated = await setTaskArchived(task.id, body.action === "archive");
    if (body.action === "archive" && task.assigneeEmail.toLowerCase() !== me.email.toLowerCase())
      await notifyTaskArchived(updated, me.email).catch(() => {});
    return NextResponse.json({ task: updated });
  }

  // ---- edit the WHOLE task group (shared fields + add/remove assignees) ----
  if (body.action === "editGroup") {
    if (!canManageTask(me, task))
      return NextResponse.json({ error: "You can't edit this task." }, { status: 403 });

    const title = str(body.title).trim();
    const dueAt = str(body.dueAt);
    if (!title) return NextResponse.json({ error: "A title is required." }, { status: 400 });
    if (!dueAt) return NextResponse.json({ error: "A due date is required." }, { status: 400 });

    const assigneeEmails = Array.isArray(body.assigneeEmails)
      ? (body.assigneeEmails as string[]).map((e) => String(e))
      : [];
    if (assigneeEmails.length === 0)
      return NextResponse.json({ error: "Keep at least one person on the task." }, { status: 400 });

    // Any NEWLY-added assignee must be someone this person may assign to.
    const existing = await getTasksByGroup(task.groupId);
    const existingSet = new Set(existing.map((r) => r.assigneeEmail.toLowerCase()));
    for (const email of assigneeEmails) {
      if (existingSet.has(email.toLowerCase())) continue; // unchanged
      const target = findMember(email);
      if (!target || !canAssignTaskTo(me, target) || !canSeeMember(me.email, target))
        return NextResponse.json({ error: `You can't assign to ${email}.` }, { status: 403 });
    }

    const et = body.emailTemplate as { subject?: string; bodyHtml?: string } | null | undefined;
    const emailTemplate =
      et && (et.subject || et.bodyHtml) ? { subject: et.subject ?? "", bodyHtml: et.bodyHtml ?? "" } : null;

    const { added } = await editTaskGroup(task.groupId, task.assignerEmail, {
      title,
      description: str(body.description).trim(),
      tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
      dueAt,
      requiresFile: Boolean(body.requiresFile),
      requireSubmission: Boolean(body.requireSubmission),
      emailTemplate,
      assigneeEmails,
    });
    // Email any newly-added assignees just like a fresh assignment.
    await Promise.allSettled(added.map((t) => notifyTaskAssigned(t)));
    return NextResponse.json({ ok: true, added: added.length });
  }

  // ---- edit ----
  if (body.action === "edit") {
    if (!canManageTask(me, task))
      return NextResponse.json({ error: "You can't edit this task." }, { status: 403 });
    if (task.status === "complete")
      return NextResponse.json({ error: "Completed tasks can't be edited." }, { status: 400 });

    const title = str(body.title).trim();
    const dueAt = str(body.dueAt);
    const assigneeEmail = str(body.assigneeEmail) || task.assigneeEmail;
    if (!title) return NextResponse.json({ error: "A title is required." }, { status: 400 });
    if (!dueAt) return NextResponse.json({ error: "A due date is required." }, { status: 400 });

    if (assigneeEmail.toLowerCase() !== task.assigneeEmail.toLowerCase()) {
      const target = findMember(assigneeEmail);
      if (!target || !canAssignTaskTo(me, target))
        return NextResponse.json({ error: `You can't assign to ${assigneeEmail}.` }, { status: 403 });
    }

    const et = body.emailTemplate as { subject?: string; bodyHtml?: string } | null | undefined;
    const emailTemplate =
      et && (et.subject || et.bodyHtml)
        ? { subject: et.subject ?? "", bodyHtml: et.bodyHtml ?? "" }
        : null;

    const updated = await updateTask(task, {
      title,
      description: str(body.description).trim(),
      tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
      dueAt,
      requiresFile: Boolean(body.requiresFile),
      requireSubmission: Boolean(body.requireSubmission),
      assigneeEmail,
      emailTemplate,
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
  if (task.assigneeEmail.toLowerCase() !== me.email.toLowerCase())
    await notifyTaskDeleted(task, me.email).catch(() => {});
  await deleteTask(task.id);
  return NextResponse.json({ ok: true });
}
