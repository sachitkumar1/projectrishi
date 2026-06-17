import { NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { buildConsentUrl } from "@/lib/lms/gcal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const me = await getCurrentMember();
  if (!me) return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL));

  const state = crypto.randomBytes(16).toString("hex");
  const res = NextResponse.redirect(buildConsentUrl(state));
  // short-lived CSRF cookie, checked in the callback
  res.cookies.set("gcal_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
