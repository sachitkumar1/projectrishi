import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { findMember } from "@/lib/members";
import { canAssignTasks, canAssignTaskTo, canManageTask } from "@/lib/lms/permissions";
import { createTasks, listTasksForMember } from "@/lib/lms/store";
import type { NewTaskInput } from "@/lib/lms/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const tasks = await listTasksForMember(me.email);
  const withFlags = tasks.map((t) => ({ ...t, canManage: canManageTask(me, t) }));
  return NextResponse.json({ tasks: withFlags });
}

export async function POST(req: Request) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  if (!canAssignTasks(me))
    return NextResponse.json({ error: "You can't assign tasks." }, { status: 403 });

  let body: Partial<NewTaskInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const assigneeEmails = Array.isArray(body.assigneeEmails) ? body.assigneeEmails : [];
  if (!title) return NextResponse.json({ error: "A title is required." }, { status: 400 });
  if (!body.dueAt) return NextResponse.json({ error: "A due date is required." }, { status: 400 });
  if (assigneeEmails.length === 0)
    return NextResponse.json({ error: "Pick at least one person." }, { status: 400 });

  // Enforce: every assignee must be someone this person is allowed to assign to.
  for (const email of assigneeEmails) {
    const target = findMember(email);
    if (!target || !canAssignTaskTo(me, target)) {
      return NextResponse.json(
        { error: `You can't assign tasks to ${email}.` },
        { status: 403 }
      );
    }
  }

  const created = await createTasks(
    {
      title,
      description: (body.description ?? "").trim(),
      tags: Array.isArray(body.tags) ? body.tags : [],
      dueAt: body.dueAt,
      requiresFile: Boolean(body.requiresFile),
      assigneeEmails,
    },
    me.email
  );
  return NextResponse.json({ tasks: created }, { status: 201 });
}
