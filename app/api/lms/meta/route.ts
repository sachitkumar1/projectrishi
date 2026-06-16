import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { MEMBERS, visibleMembers } from "@/lib/members";
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
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

  return NextResponse.json({
    me: { email: me.email, name: `${me.firstName} ${me.lastName}`, group: me.group, roles: me.roles },
    can: {
      assignTasks: canAssignTasks(me),
      createEvents: canCreateEvents(me),
    },
    assignableMembers: assignableMembers(me).map(lite).sort(byName),
    assignScopes: allowedAssignScopes(me),
    assignableGroups: assignableGroups(me),
    eventScopes: allowedEventScopes(me),
    targetableGroups: targetableGroups(me),
    eventMemberTargets: targetableMembers(me).map(lite).sort(byName),
    allMembers: visibleMembers(me.email).map(lite).sort(byName),
  });
}
