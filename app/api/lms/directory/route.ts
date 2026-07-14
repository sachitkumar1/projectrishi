import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { getContactOverride, listDirectory, setContactOverride } from "@/lib/lms/directory";

export const dynamic = "force-dynamic";

// Any signed-in member can view the full directory.
export async function GET() {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const entries = await listDirectory();
  return NextResponse.json({ entries, me: me.email.toLowerCase() });
}

// A member edits THEIR OWN directory contact info (email + phone) only.
export async function PUT(req: Request) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  let body: { contactEmail?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // Light validation — both fields are optional; empty string clears the override.
  if (body.contactEmail !== undefined) {
    const e = body.contactEmail.trim();
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      return NextResponse.json({ error: "That doesn't look like a valid email." }, { status: 400 });
  }
  if (body.phone !== undefined && body.phone.trim().length > 40)
    return NextResponse.json({ error: "Phone number is too long." }, { status: 400 });

  await setContactOverride(me.email, { contactEmail: body.contactEmail, phone: body.phone });
  const override = await getContactOverride(me.email);
  return NextResponse.json({ ok: true, override });
}
