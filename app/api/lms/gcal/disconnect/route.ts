import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { getConnection, removeAllSynced, removeConnection } from "@/lib/lms/gcal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const conn = await getConnection(me.email);
  if (conn) {
    // Best effort: remove the events we pushed, then forget the connection.
    try {
      await removeAllSynced(me.email, conn.refreshToken, conn.syncedKeys);
    } catch {
      /* token may already be revoked — still clear our side */
    }
    await removeConnection(me.email);
  }
  return NextResponse.json({ ok: true });
}
