import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { listNotifications, markNotificationsRead } from "@/lib/lms/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const notifications = await listNotifications(me.email);
  const unread = notifications.filter((n) => !n.read).length;
  return NextResponse.json({ notifications, unread });
}

// Mark notifications read: { id } for one, or {} for all.
export async function POST(req: Request) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  let body: { id?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body = mark all */
  }
  await markNotificationsRead(me.email, body.id);
  return NextResponse.json({ ok: true });
}
