import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { getAvatars } from "@/lib/lms/store";
import { listNewslettersForMember } from "@/lib/lms/newsletters";
import { applyMergeTags } from "@/lib/lms/merge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const lc = (e: string) => e.trim().toLowerCase();

export async function GET() {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const newsletters = await listNewslettersForMember(me.email);
  const authorEmails = Array.from(new Set(newsletters.map((n) => n.authorEmail)));
  const avatarMap = await getAvatars(authorEmails);

  const items = newsletters.map((n) => ({
    id: n.id,
    authorName: n.authorName,
    authorAvatar: avatarMap[lc(n.authorEmail)] ?? null,
    subject: n.mailMerge ? applyMergeTags(n.subject, me.email) : n.subject,
    bodyHtml: n.mailMerge ? applyMergeTags(n.bodyHtml, me.email) : n.bodyHtml,
    createdAt: n.createdAt,
    read: n.read,
    canDelete: lc(n.authorEmail) === lc(me.email),
  }));

  return NextResponse.json({ newsletters: items, unread: items.filter((i) => !i.read).length });
}
