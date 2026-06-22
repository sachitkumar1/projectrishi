import { NextResponse } from "next/server";
import { addSubscriber } from "@/lib/lms/newsletters";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

// Public endpoint — the footer signup form on the website posts here.
export async function POST(req: Request) {
  let body: { email?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const email = (body.email ?? "").trim();
  if (!isEmail(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  await addSubscriber(email);
  return NextResponse.json({ ok: true });
}
