/**
 * ============================================================================
 *  MEMBER ALLOWLIST
 * ============================================================================
 *  ONLY the emails listed here can log in to the Member Dashboard.
 *  This list is checked on the server when someone signs in with Google, so
 *  it cannot be bypassed from the browser.
 *
 *  TO ADD / REMOVE A MEMBER: just edit the MEMBERS array below. Use the
 *  member's Google (school) email, exactly as they sign in with. Capitalization
 *  doesn't matter — emails are compared case-insensitively.
 * ============================================================================
 */

export type Member = {
  email: string;
  firstName: string;
  lastName: string;
};

export const MEMBERS: Member[] = [
  { email: "sachitk@berkeley.edu", firstName: "Sachit", lastName: "Kumar" },
  { email: "palakprabhakar1@berkeley.edu", firstName: "Palak", lastName: "Prabhakar" },
  // { email: "newmember@berkeley.edu", firstName: "New", lastName: "Member" },
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
