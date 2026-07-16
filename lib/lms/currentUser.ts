import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findMember, type Member } from "@/lib/members";
import { ensureRoster } from "@/lib/lms/roster";

/**
 * Resolve the currently logged-in member (with roles) on the server.
 * Returns null if not signed in or not on the allowlist.
 *
 * DEV PREVIEW ONLY: if LMS_PREVIEW_EMAIL is set and there is no session, we
 * fall back to that member. This lets the dashboard be previewed locally
 * without logging in. It does nothing in production unless the env var is set.
 */
export async function getCurrentMember(): Promise<Member | null> {
  // Keep the live roster fresh so sheet edits take effect without a redeploy.
  await ensureRoster();
  let email: string | null = null;
  try {
    const session = await getServerSession(authOptions);
    email = session?.user?.email ?? null;
  } catch {
    email = null;
  }
  email = email ?? process.env.LMS_PREVIEW_EMAIL ?? null;
  const member = findMember(email) ?? null;
  if (!member) return null;

  // The Webmaster implicitly holds every capability on the site. We expand the
  // flags HERE — the single point every permission check flows through — rather
  // than storing them expanded, so the roster/sheet/directory keep showing the
  // person's real, honest roles.
  if (!member.roles.webmaster) return member;
  return {
    ...member,
    roles: {
      ...member.roles,
      nmtLeader: true, newbie: true, lead: true,
      internal: true, vpp: true, exec: true, outreach: true,
    },
  };
}
