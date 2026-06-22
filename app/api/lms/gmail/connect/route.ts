import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { buildGmailConsentUrl } from "@/lib/lms/gmail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL));

  const target = new URL(req.url).searchParams.get("target") === "club" ? "club" : "personal";
  // Only exec may connect the shared club sending account.
  if (target === "club" && !me.roles.exec)
    return NextResponse.redirect(new URL("/dashboard?gmail=forbidden", process.env.NEXTAUTH_URL));

  const state = crypto.randomBytes(16).toString("hex");
  const res = NextResponse.redirect(buildGmailConsentUrl(state));
  const cookieOpts = { httpOnly: true, secure: true, sameSite: "lax" as const, maxAge: 600, path: "/" };
  res.cookies.set("gmail_state", state, cookieOpts);
  res.cookies.set("gmail_target", target, cookieOpts);
  return res;
}
