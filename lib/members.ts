/**
 * ============================================================================
 *  MEMBER ALLOWLIST + ROLES
 * ============================================================================
 *  ONLY the emails listed here can log in to the Member Dashboard. This list
 *  is checked on the server when someone signs in with Google, so it cannot be
 *  bypassed from the browser.
 *
 *  Each member also has a PROJECT GROUP and a set of ROLES, used by the LMS to
 *  decide what they can do (assign tasks, create events, etc.).
 *
 *  PROJECT GROUP codes:  E = Education,  R = Water & Sanitation,
 *                        W = Women's Empowerment,  H = Health
 *  ROLES (Y/N in the spreadsheet):  nmtLeader, newbie, lead, internal,
 *                        vpp (VP/President), exec
 *
 *  TO ADD A MEMBER: copy a line below, fill in their email, name, group, and
 *  roles. Capitalization of the email doesn't matter.
 * ============================================================================
 */

import type { ProjectGroup, RoleFlags } from "@/lib/lms/types";

export type Member = {
  email: string;
  firstName: string;
  lastName: string;
  group: ProjectGroup;
  roles: RoleFlags;
};

// Small helper so the list below stays short and readable.
function roles(flags: Partial<RoleFlags>): RoleFlags {
  return {
    nmtLeader: false,
    newbie: false,
    lead: false,
    internal: false,
    vpp: false,
    exec: false,
    ...flags,
  };
}

export const MEMBERS: Member[] = [
  {
    email: "sachitk@berkeley.edu",
    firstName: "Sachit",
    lastName: "Kumar",
    group: "E",
    roles: roles({ nmtLeader: true, lead: true, internal: true, vpp: true, exec: true }),
  },
  {
    email: "palakprabhakar1@berkeley.edu",
    firstName: "Palak",
    lastName: "Prabhakar",
    group: "W",
    roles: roles({ lead: true }),
  },
  // {
  //   email: "newmember@berkeley.edu",
  //   firstName: "New",
  //   lastName: "Member",
  //   group: "R",
  //   roles: roles({ newbie: true }),
  // },
];

/** Look up a member by email (case-insensitive). Returns undefined if not allowed. */
export function findMember(email?: string | null): Member | undefined {
  if (!email) return undefined;
  const e = email.trim().toLowerCase();
  return MEMBERS.find((m) => m.email.toLowerCase() === e);
}

/** The full "First Last" name used to match a member to their lineage leaf. */
export function memberFullName(m: Member): string {
  return `${m.firstName} ${m.lastName}`;
}
