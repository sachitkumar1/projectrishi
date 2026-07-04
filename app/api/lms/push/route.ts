import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { pushPublicKey, removeSubscription, saveSubscription } from "@/lib/lms/push";

export const dynamic = "force-dynamic";

// Client fetches the VAPID public key so it can subscribe.
export async function GET() {
  return NextResponse.json({ publicKey: pushPublicKey() });
}

// Register this browser's push subscription for the signed-in member.
export async function POST(req: Request) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  let body: { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth)
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  await saveSubscription(me.email, {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
  });
  return NextResponse.json({ ok: true });
}

// Unregister a subscription (e.g. user turned notifications off).
export async function DELETE(req: Request) {
  let body: { endpoint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (!body.endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  await removeSubscription(body.endpoint);
  return NextResponse.json({ ok: true });
}
