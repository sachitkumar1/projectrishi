import { NextResponse, type NextRequest } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { exchangeGmailCode, saveGmailConnection, NOTIFY_SENDER, SHARED_SENDER } from "@/lib/lms/gmail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const base = process.env.NEXTAUTH_URL;
  const me = await getCurrentMember();
  if (!me) return NextResponse.redirect(new URL("/login", base));

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.cookies.get("gmail_state")?.value;
  const rawTarget = req.cookies.get("gmail_target")?.value;
  const target = rawTarget === "club" ? "club" : rawTarget === "notify" ? "notify" : "personal";

  const fail = (reason: string) => {
    const r = NextResponse.redirect(new URL(`/dashboard?gmail=${reason}`, base));
    r.cookies.delete("gmail_state");
    r.cookies.delete("gmail_target");
    return r;
  };

  if (!code || !state || !cookieState || state !== cookieState) return fail("error");
  if ((target === "club" || target === "notify") && !me.roles.exec) return fail("forbidden");

  const result = await exchangeGmailCode(code);
  if (!result) return fail("error");

  if (target === "club") {
    // The connected Google account MUST actually be the club address — this
    // prevents anyone saving a personal account as the shared sender.
    if (!result.email || result.email.toLowerCase() !== SHARED_SENDER.toLowerCase())
      return fail("wrong_account");
    await saveGmailConnection(SHARED_SENDER, result.refreshToken, result.email, true, me.email);
  } else if (target === "notify") {
    // The notifications account must actually be the notify address.
    if (!result.email || result.email.toLowerCase() !== NOTIFY_SENDER.toLowerCase())
      return fail("wrong_account");
    await saveGmailConnection(NOTIFY_SENDER, result.refreshToken, result.email, true, me.email);
  } else {
    await saveGmailConnection(me.email, result.refreshToken, result.email, false, me.email);
  }

  const res = NextResponse.redirect(new URL(`/dashboard?gmail=connected_${target}`, base));
  res.cookies.delete("gmail_state");
  res.cookies.delete("gmail_target");
  return res;
}
