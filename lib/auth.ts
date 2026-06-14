import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { findMember } from "@/lib/members";

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
    error: "/login", // show "not allowed" message on the login page
  },
  callbacks: {
    // GATE: only allow sign-in if the Google email is in the members allowlist.
    async signIn({ user }) {
      return Boolean(findMember(user.email));
    },
    // Attach the member's first/last name (from our table) to the token.
    async jwt({ token }) {
      const member = findMember(token.email);
      if (member) {
        token.firstName = member.firstName;
        token.lastName = member.lastName;
      }
      return token;
    },
    // Expose first/last name on the session for use in the UI.
    async session({ session, token }) {
      if (session.user) {
        (session.user as { firstName?: string }).firstName =
          (token.firstName as string) ?? null;
        (session.user as { lastName?: string }).lastName =
          (token.lastName as string) ?? null;
      }
      return session;
    },
  },
};
