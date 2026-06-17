import { NextResponse, type NextRequest } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { exchangeCodeForRefreshToken, saveConnection } from "@/lib/lms/gcal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const base = process.env.NEXTAUTH_URL;
  const me = await getCurrentMember();
  if (!me) return NextResponse.redirect(new URL("/login", base));

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.cookies.get("gcal_state")?.value;

  // The user may have declined, or CSRF state mismatch.
  if (!code || !state || !cookieState || state !== cookieState)
    return NextResponse.redirect(new URL("/dashboard?calendar=error", base));

  const refreshToken = await exchangeCodeForRefreshToken(code);
  if (!refreshToken)
    return NextResponse.redirect(new URL("/dashboard?calendar=error", base));

  await saveConnection(me.email, refreshToken);
  const res = NextResponse.redirect(new URL("/dashboard?calendar=connected", base));
  res.cookies.delete("gcal_state");
  return res;
}
