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
 *                        vpp (VP/President), exec, outreach (Director of Outreach)
 *
 *  TO ADD A MEMBER: copy a line below, fill in their email, name, group, and
 *  roles. Capitalization of the email doesn't matter.
 * ============================================================================
 */

import type { ProjectGroup, RoleFlags } from "@/lib/lms/types";
import { PROJECT_GROUP_LABELS } from "@/lib/lms/types";

export type Member = {
  email: string;
  firstName: string;
  lastName: string;
  group: ProjectGroup;
  roles: RoleFlags;
  /** Contact phone number (used for the member directory + SMS). Empty = none. */
  phone?: string;
  /** Test accounts: only the owner + the account itself can see/select these. */
  hidden?: boolean;
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
    outreach: false,
    ...flags,
  };
}

export const MEMBERS: Member[] = [
  { email: "sachitk@berkeley.edu", firstName: "Sachit", lastName: "Kumar", phone: "(949) 406-9649", group: "E", roles: roles({ nmtLeader: true, lead: true, internal: true, vpp: true, exec: true, outreach: true, newbie: true }) },
  { email: "palakprabhakar1@berkeley.edu", firstName: "Palak", lastName: "Prabhakar", phone: "", group: "W", roles: roles({ lead: true }) },
  { email: "thanuj@berkeley.edu", firstName: "Thanuj", lastName: "Komatireddy", phone: "", group: "H", roles: roles({ exec: true }) },
  { email: "riaprathinidhi1@berkeley.edu", firstName: "Ria", lastName: "Prathinidhi", phone: "", group: "R", roles: roles({ lead: true }) },
  { email: "aarushimupparti@berkeley.edu", firstName: "Aarushi", lastName: "Mupparti", phone: "", group: "H", roles: roles({ lead: true }) },
  { email: "arnavmishra@berkeley.edu", firstName: "Arnav", lastName: "Mishra", phone: "", group: "R", roles: roles({}) },
  { email: "megha_ramachandran@berkeley.edu", firstName: "Megha", lastName: "Ramachandran", phone: "", group: "E", roles: roles({ lead: true }) },
  { email: "nikita_jadhav@berkeley.edu", firstName: "Nikita", lastName: "Jadhav", phone: "", group: "W", roles: roles({ exec: true, outreach: true }) },
  { email: "autkarsh@berkeley.edu", firstName: "Utkarsh", lastName: "Agarwal", phone: "", group: "E", roles: roles({ lead: true }) },
  { email: "tanyagoel101@berkeley.edu", firstName: "Tanya", lastName: "Goel", phone: "", group: "H", roles: roles({ vpp: true, exec: true }) },
  { email: "grishma_jain@berkeley.edu", firstName: "Grishma", lastName: "Jain", phone: "", group: "E", roles: roles({ vpp: true, exec: true }) },
  { email: "akotte@berkeley.edu", firstName: "Advik", lastName: "Kotte", phone: "", group: "W", roles: roles({ nmtLeader: true }) },
  { email: "aryaprince@berkeley.edu", firstName: "Arya", lastName: "Prince", phone: "", group: "E", roles: roles({}) },
  { email: "platy07@berkeley.edu", firstName: "Maia", lastName: "Berges", phone: "", group: "R", roles: roles({ lead: true }) },
  { email: "sachitkumar2025@gmail.com", firstName: "SachitLead", lastName: "Kumar", phone: "", group: "W", roles: roles({ lead: true }), hidden: true },
  { email: "sachitkumar2020@gmail.com", firstName: "SachitInternal", lastName: "Kumar", phone: "", group: "W", roles: roles({ internal: true }), hidden: true },
  { email: "kumarsachit2007@gmail.com", firstName: "SachitNMT", lastName: "Kumar", phone: "", group: "W", roles: roles({ nmtLeader: true }), hidden: true },
  { email: "anonymousposter1029@gmail.com", firstName: "SachitNewbie", lastName: "Kumar", phone: "", group: "W", roles: roles({ newbie: true }), hidden: true },
  { email: "ryancr@berkeley.edu", firstName: "Ryan", lastName: "Raphael", phone: "", group: "E", roles: roles({ vpp: true, exec: true }) },
  { email: "narayannirali@berkeley.edu", firstName: "Nirali", lastName: "Narayan", phone: "", group: "R", roles: roles({nmtLeader: true})},
  { email: "dilpreetvohra@berkeley.edu", firstName: "Jannat", lastName: "Vohra", phone: "", group: "W", roles: roles({ lead: true})}
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

/** A short, human-readable role label for the member directory. */
export function memberRoleLabel(m: Member): string {
  const r = m.roles;
  const g = PROJECT_GROUP_LABELS[m.group];
  const parts: string[] = [];
  if (r.vpp) parts.push("VP / President");
  if (r.outreach) parts.push("Director of Outreach");
  if (r.lead) parts.push(`${g} Lead`);
  if (r.nmtLeader) parts.push("NMT Leader");
  if (r.exec && !r.vpp) parts.push("Exec");
  if (r.internal && parts.length === 0) parts.push("Internal");
  if (r.newbie && parts.length === 0) parts.push("Newbie");
  if (parts.length === 0) parts.push(`${g} Member`);
  return parts.join(" · ");
}

/**
 * TEST-ACCOUNT VISIBILITY
 * Members flagged `hidden` (the SachitLead / SachitNMT / etc. test accounts)
 * are only visible to their owner and to the account itself. Everyone else
 * never sees or can select them in task/event pickers.
 */
const TEST_ACCOUNT_OWNER = "sachitk@berkeley.edu";
export function canSeeMember(viewerEmail: string | null | undefined, target: Member): boolean {
  if (!target.hidden) return true;
  const v = (viewerEmail ?? "").trim().toLowerCase();
  return v === TEST_ACCOUNT_OWNER || v === target.email.toLowerCase();
}
export function visibleMembers(viewerEmail: string | null | undefined): Member[] {
  return MEMBERS.filter((m) => canSeeMember(viewerEmail, m));
}
