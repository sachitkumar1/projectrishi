import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { listEventsForMember, listTasksForMember } from "@/lib/lms/store";
import { getConnection, setSyncedKeys, syncToCalendar, type SyncItem } from "@/lib/lms/gcal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const conn = await getConnection(me.email);
  if (!conn || !conn.syncEnabled)
    return NextResponse.json({ error: "calendar_not_connected" }, { status: 403 });

  const allTasks = await listTasksForMember(me.email);
  // Only non-archived tasks assigned TO me (self-assigned included) sync to the
  // calendar — tasks I assigned to others, and archived tasks, are not pushed.
  const tasks = allTasks.filter(
    (t) => !t.archived && t.assigneeEmail.toLowerCase() === me.email.toLowerCase()
  );
  const events = (await listEventsForMember(me)).filter((e) => !e.archived);

  const items: SyncItem[] = [
    ...tasks.map((t) => {
      const start = new Date(t.dueAt);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      return {
        key: `task:${t.id}`,
        kind: "task" as const,
        id: t.id,
        summary: `📋 ${t.title}`,
        description:
          `Project RISHI task` +
          (t.description ? `\n\n${t.description}` : "") +
          `\n\nStatus: ${t.status.replace("_", " ")}`,
        start: start.toISOString(),
        end: end.toISOString(),
      };
    }),
    ...events.map((ev) => {
      const start = new Date(ev.startAt);
      const end = ev.endAt ? new Date(ev.endAt) : new Date(start.getTime() + 60 * 60 * 1000);
      return {
        key: `event:${ev.id}`,
        kind: "event" as const,
        id: ev.id,
        summary: ev.title,
        description: `Project RISHI event` + (ev.description ? `\n\n${ev.description}` : ""),
        start: start.toISOString(),
        end: end.toISOString(),
      };
    }),
  ];

  try {
    const result = await syncToCalendar(me.email, conn.refreshToken, conn.syncedKeys, items);
    await setSyncedKeys(me.email, items.map((i) => i.key));
    return NextResponse.json({ ok: true, ...result, total: result.created + result.updated });
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 400 || status === 401 || status === 403)
      return NextResponse.json({ error: "calendar_permission" }, { status: 403 });
    return NextResponse.json({ error: "sync_failed" }, { status: 502 });
  }
}
