import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { MEMBERS } from "@/lib/members";
import {
  allowedAssignScopes,
  allowedEventScopes,
  assignableGroups,
  assignableMembers,
  canAssignTasks,
  canCreateEvents,
  targetableGroups,
  targetableMembers,
} from "@/lib/lms/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const lite = (m: typeof MEMBERS[number]) => ({
    email: m.email,
    name: `${m.firstName} ${m.lastName}`,
    group: m.group,
  });

  return NextResponse.json({
    me: { email: me.email, name: `${me.firstName} ${me.lastName}`, group: me.group, roles: me.roles },
    can: {
      assignTasks: canAssignTasks(me),
      createEvents: canCreateEvents(me),
    },
    assignableMembers: assignableMembers(me).map(lite),
    assignScopes: allowedAssignScopes(me),
    assignableGroups: assignableGroups(me),
    eventScopes: allowedEventScopes(me),
    targetableGroups: targetableGroups(me),
    eventMemberTargets: targetableMembers(me).map(lite),
    allMembers: MEMBERS.map(lite),
  });
}
