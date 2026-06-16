import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findMember, type Member } from "@/lib/members";

/**
 * Resolve the currently logged-in member (with roles) on the server.
 * Returns null if not signed in or not on the allowlist.
 *
 * DEV PREVIEW ONLY: if LMS_PREVIEW_EMAIL is set and there is no session, we
 * fall back to that member. This lets the dashboard be previewed locally
 * without logging in. It does nothing in production unless the env var is set.
 */
export async function getCurrentMember(): Promise<Member | null> {
  let email: string | null = null;
  try {
    const session = await getServerSession(authOptions);
    email = session?.user?.email ?? null;
  } catch {
    email = null;
  }
  email = email ?? process.env.LMS_PREVIEW_EMAIL ?? null;
  return findMember(email) ?? null;
}
