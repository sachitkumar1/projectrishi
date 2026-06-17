import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { getConnection } from "@/lib/lms/gcal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const conn = await getConnection(me.email);
  return NextResponse.json({ connected: Boolean(conn && conn.syncEnabled) });
}
