import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { getAvatars } from "@/lib/lms/store";
import { listAnnouncementsForMember } from "@/lib/lms/announcements";
import { applyMergeTags } from "@/lib/lms/merge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const lc = (e: string) => e.trim().toLowerCase();

export async function GET() {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const announcements = await listAnnouncementsForMember(me.email);
  const authorEmails = Array.from(new Set(announcements.map((a) => a.authorEmail)));
  const avatarMap = await getAvatars(authorEmails);

  const items = announcements.map((a) => {
    const override = a.mailMerge ? a.mergeData?.[lc(me.email)] : undefined;
    return {
      id: a.id,
      authorName: a.authorName,
      authorAvatar: avatarMap[lc(a.authorEmail)] ?? null,
      subject: a.mailMerge ? applyMergeTags(a.subject, me.email, override) : a.subject,
      bodyHtml: a.mailMerge ? applyMergeTags(a.bodyHtml, me.email, override) : a.bodyHtml,
      createdAt: a.createdAt,
      read: a.read,
      canDelete: lc(a.authorEmail) === lc(me.email),
    };
  });

  return NextResponse.json({ announcements: items, unread: items.filter((i) => !i.read).length });
}
