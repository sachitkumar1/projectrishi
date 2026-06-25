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

  // Decide visibility FIRST, from roles only — so the "View subscribers" button
  // never disappears just because the subscriber query hit a snag.
  const canView = canPostNewsletter(me) || me.roles.exec;
  if (!canView) return NextResponse.json({ canView: false, subscribers: [] });

  try {
    const subscribers = await listSubscribers();
    return NextResponse.json({ canView: true, subscribers });
  } catch (e) {
    // The member IS allowed to view; don't let a DB hiccup hide the button.
    // Return an empty list plus an error the modal can surface.
    return NextResponse.json({
      canView: true,
      subscribers: [],
      error: e instanceof Error ? e.message : "Couldn't load subscribers right now.",
    });
  }
}
