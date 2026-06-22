import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { MEMBERS, memberFullName, visibleMembers, type Member } from "@/lib/members";
import {
  announceGroups,
  announceScopes,
  announceTargetableMembers,
  availableModes,
} from "@/lib/lms/permissions";
import { getGmailConnection, SHARED_SENDER } from "@/lib/lms/gmail";
import { listSubscribers } from "@/lib/lms/newsletters";
import { MERGE_TAGS } from "@/lib/lms/merge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const lite = (m: Member) => ({ email: m.email, name: memberFullName(m), group: m.group });
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

  const [personal, club, subs] = await Promise.all([
    getGmailConnection(me.email),
    getGmailConnection(SHARED_SENDER),
    listSubscribers(),
  ]);

  return NextResponse.json({
    modes: availableModes(me),
    me: { exec: me.roles.exec, lead: me.roles.lead, group: me.group },
    announce: {
      scopes: announceScopes(me),
      groups: announceGroups(me),
      targetableMembers: announceTargetableMembers(me).map(lite).sort(byName),
    },
    email: {
      allMembers: visibleMembers(me.email).map(lite).sort(byName),
    },
    newsletter: {
      memberCount: MEMBERS.length,
      subscriberCount: subs.length,
    },
    senders: {
      clubConnected: Boolean(club),
      clubAddress: SHARED_SENDER,
      personalConnected: Boolean(personal),
      personalAddress: personal?.connectedGoogleEmail ?? me.email,
    },
    mergeTags: MERGE_TAGS,
  });
}
