import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { getGmailConnection, NOTIFY_SENDER, SHARED_SENDER } from "@/lib/lms/gmail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const [personal, club, notify] = await Promise.all([
    getGmailConnection(me.email),
    getGmailConnection(SHARED_SENDER),
    getGmailConnection(NOTIFY_SENDER),
  ]);

  return NextResponse.json({
    personal: Boolean(personal),
    personalEmail: personal?.connectedGoogleEmail ?? me.email,
    club: Boolean(club),
    notify: Boolean(notify),
    canConnectClub: me.roles.exec,
    sharedSender: SHARED_SENDER,
    notifySender: NOTIFY_SENDER,
  });
}
