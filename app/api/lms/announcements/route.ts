import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { findMember, memberFullName, type Member } from "@/lib/members";
import { type ProjectGroup } from "@/lib/lms/types";
import {
  announceGroups,
  announceScopes,
  announceTargetableMembers,
  canAnnounceToEmails,
  canPostAnnouncements,
} from "@/lib/lms/permissions";
import { getAvatars } from "@/lib/lms/store";
import {
  createAnnouncement,
  listAnnouncementsForMember,
} from "@/lib/lms/announcements";
import {
  getGmailConnection,
  sendViaConnection,
  SHARED_SENDER,
  SHARED_FROM_NAME,
} from "@/lib/lms/gmail";
import { MEMBERS } from "@/lib/members";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const lc = (e: string) => e.trim().toLowerCase();

export async function GET() {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const announcements = await listAnnouncementsForMember(me.email);

  // avatars for the authors shown in the panel
  const authorEmails = Array.from(new Set(announcements.map((a) => a.authorEmail)));
  const avatarMap = await getAvatars(authorEmails);
  const withAvatars = announcements.map((a) => ({
    ...a,
    authorAvatar: avatarMap[lc(a.authorEmail)] ?? null,
    canDelete: lc(a.authorEmail) === lc(me.email),
  }));

  const [personal, club] = await Promise.all([
    getGmailConnection(me.email),
    getGmailConnection(SHARED_SENDER),
  ]);

  const lite = (m: Member) => ({ email: m.email, name: memberFullName(m), group: m.group });
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

  return NextResponse.json({
    announcements: withAvatars,
    unread: withAvatars.filter((a) => !a.read).length,
    compose: {
      canPost: canPostAnnouncements(me),
      scopes: announceScopes(me),
      groups: announceGroups(me),
      targetableMembers: announceTargetableMembers(me).map(lite).sort(byName),
      senders: {
        clubConnected: Boolean(club),
        clubAddress: SHARED_SENDER,
        personalConnected: Boolean(personal),
        personalAddress: personal?.connectedGoogleEmail ?? me.email,
      },
    },
  });
}

export async function POST(req: Request) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  if (!canPostAnnouncements(me))
    return NextResponse.json({ error: "You can't post announcements." }, { status: 403 });

  let body: {
    subject?: string;
    bodyHtml?: string;
    scopeKind?: "members" | "group" | "club";
    memberEmails?: string[];
    groups?: string[];
    sender?: "club" | "personal";
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const subject = (body.subject ?? "").trim() || "[ANNOUNCEMENT]";
  const bodyHtml = (body.bodyHtml ?? "").trim();
  if (!bodyHtml || bodyHtml === "<p></p>")
    return NextResponse.json({ error: "Your announcement needs a message." }, { status: 400 });

  // ---- resolve recipients from the chosen scope, enforcing permissions -----
  const allowedScopes = new Set(announceScopes(me));
  const scopeKind = body.scopeKind ?? "members";
  if (!allowedScopes.has(scopeKind))
    return NextResponse.json({ error: "You can't post to that audience." }, { status: 403 });

  let recipients: string[] = [];
  if (scopeKind === "club") {
    recipients = MEMBERS.map((m) => m.email);
  } else if (scopeKind === "group") {
    const allowedGroups = new Set(announceGroups(me));
    const picked = (body.groups ?? []).filter((g) => allowedGroups.has(g as ProjectGroup));
    if (picked.length === 0) return NextResponse.json({ error: "Pick at least one group." }, { status: 400 });
    recipients = MEMBERS.filter((m) => picked.includes(m.group)).map((m) => m.email);
  } else {
    const picked = body.memberEmails ?? [];
    if (picked.length === 0) return NextResponse.json({ error: "Pick at least one person." }, { status: 400 });
    if (!canAnnounceToEmails(me, picked))
      return NextResponse.json({ error: "You can't message one or more of those people." }, { status: 403 });
    recipients = picked;
  }
  // de-dupe + drop hidden test accounts you can't see
  recipients = Array.from(new Set(recipients.map(lc))).filter((e) => {
    const m = findMember(e);
    return m !== undefined;
  });

  // ---- choose the sending account ------------------------------------------
  const senderChoice = body.sender === "personal" ? "personal" : "club";
  const conn = await getGmailConnection(senderChoice === "club" ? SHARED_SENDER : me.email);
  if (!conn) {
    return NextResponse.json(
      {
        error:
          senderChoice === "club"
            ? "The club email isn't connected yet. An exec needs to connect it in settings."
            : "Connect your Gmail first to send from your own address.",
      },
      { status: 400 },
    );
  }
  const fromName = senderChoice === "club" ? SHARED_FROM_NAME : memberFullName(me);

  // ---- record the in-app announcement (so it's never lost) -----------------
  const ann = await createAnnouncement({
    authorEmail: me.email,
    authorName: memberFullName(me),
    senderEmail: conn.accountEmail,
    subject,
    bodyHtml,
    recipientEmails: recipients,
  });

  // ---- send the email (BCC recipients to keep the list private) ------------
  let emailSent = true;
  let sendError: string | null = null;
  try {
    await sendViaConnection(conn, {
      fromEmail: conn.connectedGoogleEmail ?? conn.accountEmail,
      fromName,
      to: [conn.connectedGoogleEmail ?? conn.accountEmail],
      bcc: recipients,
      subject,
      html: bodyHtml,
    });
  } catch (e) {
    emailSent = false;
    sendError = e instanceof Error ? e.message : "send failed";
  }

  return NextResponse.json({ ok: true, id: ann.id, recipients: recipients.length, emailSent, sendError });
}
