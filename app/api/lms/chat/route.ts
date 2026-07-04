import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { MEMBERS, canSeeMember, findMember, memberFullName } from "@/lib/members";
import { createChat, listChats, type ChatSummary } from "@/lib/lms/chat";
import { getAvatars } from "@/lib/lms/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  // Contacts come purely from the member roster — NEVER from the database — so
  // they must always be returned even if the chat tables or avatar lookups fail.
  const contacts = MEMBERS.filter(
    (m) => m.email.toLowerCase() !== me.email.toLowerCase() && canSeeMember(me.email, m),
  ).map((m) => ({ email: m.email, name: memberFullName(m), group: m.group }));

  // The conversation list depends on the chat tables; if those aren't set up
  // yet, don't let it take down the whole response (and therefore the picker).
  let chats: ChatSummary[] = [];
  let chatsError: string | null = null;
  try {
    chats = await listChats(me.email);
  } catch (e) {
    chatsError = e instanceof Error ? e.message : "Could not load conversations.";
    console.error("[chat] listChats failed — are the chat tables created?", e);
  }

  // Build the name/avatar map. Avatars are best-effort; a failure here must not
  // blank the picker either.
  const emails = new Set<string>([me.email.toLowerCase()]);
  contacts.forEach((c) => emails.add(c.email.toLowerCase()));
  chats.forEach((c) => c.memberEmails.forEach((e) => emails.add(e.toLowerCase())));
  let avatars: Record<string, string> = {};
  try {
    avatars = await getAvatars(Array.from(emails));
  } catch (e) {
    console.error("[chat] getAvatars failed:", e);
  }
  const members: Record<string, { name: string; avatar: string | null }> = {};
  for (const e of Array.from(emails)) {
    const m = findMember(e);
    members[e] = { name: m ? memberFullName(m) : e, avatar: avatars[e] ?? null };
  }

  return NextResponse.json({ me: me.email.toLowerCase(), chats, contacts, members, chatsError });
}

export async function POST(req: Request) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  let body: { memberEmails?: string[]; title?: string; isGroup?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const targets = Array.isArray(body.memberEmails) ? body.memberEmails.map(String) : [];
  if (targets.length === 0)
    return NextResponse.json({ error: "Pick at least one person to chat with." }, { status: 400 });

  // Validate every target is someone this member may see.
  for (const email of targets) {
    const m = findMember(email);
    if (!m || !canSeeMember(me.email, m))
      return NextResponse.json({ error: `You can't start a chat with ${email}.` }, { status: 403 });
  }

  const isGroup = Boolean(body.isGroup) || targets.length > 1;
  try {
    const chat = await createChat(me.email, targets, { isGroup, title: body.title ?? null });
    return NextResponse.json({ chat });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create the chat.";
    console.error("[chat] createChat failed — are the chat tables created?", e);
    return NextResponse.json({ error: `Couldn't start the chat: ${msg}` }, { status: 500 });
  }
}
