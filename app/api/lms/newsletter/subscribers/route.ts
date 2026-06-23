import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { canPostNewsletter } from "@/lib/lms/permissions";
import { listSubscribers } from "@/lib/lms/newsletters";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The subscriber list is visible to the Director of Outreach and exec.
export async function GET() {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const canView = canPostNewsletter(me) || me.roles.exec;
  if (!canView) return NextResponse.json({ canView: false, subscribers: [] });

  const subscribers = await listSubscribers();
  return NextResponse.json({ canView: true, subscribers });
}
