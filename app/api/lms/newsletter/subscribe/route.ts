import { NextResponse } from "next/server";
import { addSubscriber } from "@/lib/lms/newsletters";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

// Public endpoint: anyone on the website can sign up for the newsletter from
// the footer form. Stores (idempotently) into the subscriber list that the
// Director of Outreach's newsletters are sent to.
export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  if (!isEmail(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });

  try {
    await addSubscriber(email);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't sign you up. Please try again." }, { status: 500 });
  }
}
