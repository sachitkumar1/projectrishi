import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { findMember } from "@/lib/members";
import { ensureRoster } from "@/lib/lms/roster";

/**
 * Login uses ONLY basic, non-sensitive scopes (email/profile), so members get
 * a clean Google sign-in with no "unverified app" warning. Calendar access is
 * requested separately and on-demand (see app/api/lms/gcal/*) only when a
 * member chooses to connect their Google Calendar.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      // Load the sheet-backed roster first, so someone added in the Google Sheet
      // can log in immediately without a code change or redeploy.
      await ensureRoster();
      return Boolean(findMember(user.email));
    },
    async jwt({ token }) {
      await ensureRoster();
      const member = findMember(token.email);
      if (member) {
        token.firstName = member.firstName;
        token.lastName = member.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { firstName?: string }).firstName = (token.firstName as string) ?? null;
        (session.user as { lastName?: string }).lastName = (token.lastName as string) ?? null;
      }
      return session;
    },
  },
};
