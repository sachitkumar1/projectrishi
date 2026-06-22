import { NextResponse, type NextRequest } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { removeGmailConnection, SHARED_SENDER } from "@/lib/lms/gmail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const target = new URL(req.url).searchParams.get("target") === "club" ? "club" : "personal";
  if (target === "club") {
    if (!me.roles.exec) return NextResponse.json({ error: "Only exec can disconnect the club account." }, { status: 403 });
    await removeGmailConnection(SHARED_SENDER);
  } else {
    await removeGmailConnection(me.email);
  }
  return NextResponse.json({ ok: true });
}
