import { NextResponse, type NextRequest } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { removeGmailConnection, NOTIFY_SENDER, SHARED_SENDER } from "@/lib/lms/gmail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const rawTarget = new URL(req.url).searchParams.get("target");
  const target = rawTarget === "club" ? "club" : rawTarget === "notify" ? "notify" : "personal";
  if (target === "club" || target === "notify") {
    if (!me.roles.exec) return NextResponse.json({ error: "Only exec can disconnect a club account." }, { status: 403 });
    await removeGmailConnection(target === "club" ? SHARED_SENDER : NOTIFY_SENDER);
  } else {
    await removeGmailConnection(me.email);
  }
  return NextResponse.json({ ok: true });
}
