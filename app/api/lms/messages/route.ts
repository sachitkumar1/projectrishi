import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { MEMBERS, findMember, memberFullName } from "@/lib/members";
import { type ProjectGroup } from "@/lib/lms/types";
import {
  announceGroups,
  announceScopes,
  canAnnounceToEmails,
  canEmailFromClub,
  canPostAnnouncements,
  canPostNewsletter,
} from "@/lib/lms/permissions";
import {
  getGmailConnection,
  sendViaConnection,
  SHARED_SENDER,
  SHARED_FROM_NAME,
  type GmailConnection,
} from "@/lib/lms/gmail";
import { createAnnouncement } from "@/lib/lms/announcements";
import { createNewsletter, listSubscribers } from "@/lib/lms/newsletters";
import { applyMergeTags } from "@/lib/lms/merge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const lc = (e: string) => e.trim().toLowerCase();
const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

type Body = {
  mode?: "announcement" | "email" | "newsletter";
  subject?: string;
  bodyHtml?: string;
  mailMerge?: boolean;
  sender?: "club" | "personal";
  // announcement
  scopeKind?: "members" | "group" | "club";
  groups?: string[];
  // announcement + email
  memberEmails?: string[];
  // email
  externalEmails?: string[];
};

// Send to everyone, personalizing per-recipient when mail merge is on.
async function deliver(
  conn: GmailConnection,
  fromName: string,
  recipients: string[],
  subject: string,
  html: string,
  mailMerge: boolean,
): Promise<{ sent: boolean; error: string | null }> {
  const fromEmail = conn.connectedGoogleEmail ?? conn.accountEmail;
  try {
    if (mailMerge) {
      for (const r of recipients) {
        await sendViaConnection(conn, {
          fromEmail,
          fromName,
          to: [r],
          subject: applyMergeTags(subject, r),
          html: applyMergeTags(html, r),
        });
      }
    } else {
      await sendViaConnection(conn, { fromEmail, fromName, to: [fromEmail], bcc: recipients, subject, html });
    }
    return { sent: true, error: null };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

export async function POST(req: Request) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const mode = body.mode ?? "email";
  const bodyHtml = (body.bodyHtml ?? "").trim();
  if (!bodyHtml || bodyHtml === "<p></p>")
    return NextResponse.json({ error: "Your message needs a body." }, { status: 400 });

  // =========================================================================
  //  NEWSLETTER
  // =========================================================================
  if (mode === "newsletter") {
    if (!canPostNewsletter(me))
      return NextResponse.json({ error: "Only the Director of Outreach can post newsletters." }, { status: 403 });
    const subject = (body.subject ?? "").trim() || "[NEWSLETTER]";
    const mailMerge = body.mailMerge !== false; // newsletters default ON

    const conn = await getGmailConnection(SHARED_SENDER);
    if (!conn)
      return NextResponse.json({ error: "The club email isn't connected yet. An exec needs to connect it." }, { status: 400 });

    const subs = await listSubscribers();
    const recipients = Array.from(new Set([...MEMBERS.map((m) => m.email), ...subs].map(lc)));

    const nl = await createNewsletter({
      authorEmail: me.email,
      authorName: memberFullName(me),
      senderEmail: conn.accountEmail,
      subject,
      bodyHtml,
      mailMerge,
    });
    const { sent, error } = await deliver(conn, SHARED_FROM_NAME, recipients, subject, bodyHtml, mailMerge);
    return NextResponse.json({ ok: true, id: nl.id, recipients: recipients.length, emailSent: sent, sendError: error });
  }

  // =========================================================================
  //  ANNOUNCEMENT
  // =========================================================================
  if (mode === "announcement") {
    if (!canPostAnnouncements(me))
      return NextResponse.json({ error: "You can't post announcements." }, { status: 403 });
    const subject = (body.subject ?? "").trim() || "[ANNOUNCEMENT]";
    const mailMerge = body.mailMerge === true; // off by default

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
    recipients = Array.from(new Set(recipients.map(lc))).filter((e) => findMember(e));

    const senderChoice = body.sender === "personal" ? "personal" : "club";
    const conn = await getGmailConnection(senderChoice === "club" ? SHARED_SENDER : me.email);
    if (!conn)
      return NextResponse.json(
        { error: senderChoice === "club" ? "The club email isn't connected yet." : "Connect your Gmail first." },
        { status: 400 },
      );
    const fromName = senderChoice === "club" ? SHARED_FROM_NAME : memberFullName(me);

    const ann = await createAnnouncement({
      authorEmail: me.email,
      authorName: memberFullName(me),
      senderEmail: conn.accountEmail,
      subject,
      bodyHtml,
      recipientEmails: recipients,
      mailMerge,
    });
    const { sent, error } = await deliver(conn, fromName, recipients, subject, bodyHtml, mailMerge);
    return NextResponse.json({ ok: true, id: ann.id, recipients: recipients.length, emailSent: sent, sendError: error });
  }

  // =========================================================================
  //  EMAIL (any member -> any members and/or any addresses)
  // =========================================================================
  const subject = (body.subject ?? "").trim();
  if (!subject) return NextResponse.json({ error: "Emails need a subject." }, { status: 400 });
  const mailMerge = body.mailMerge === true;

  const memberEmails = (body.memberEmails ?? []).map(lc).filter((e) => findMember(e));
  const externalEmails = (body.externalEmails ?? []).map((e) => e.trim()).filter(isEmail).map(lc);
  const recipients = Array.from(new Set([...memberEmails, ...externalEmails]));
  if (recipients.length === 0)
    return NextResponse.json({ error: "Add at least one recipient." }, { status: 400 });

  let senderChoice = body.sender === "club" ? "club" : "personal";
  if (senderChoice === "club" && !canEmailFromClub(me, recipients)) {
    return NextResponse.json(
      { error: "You can only use the club email when writing to your own project group. Use your own email instead." },
      { status: 403 },
    );
  }
  const conn = await getGmailConnection(senderChoice === "club" ? SHARED_SENDER : me.email);
  if (!conn)
    return NextResponse.json(
      { error: senderChoice === "club" ? "The club email isn't connected yet." : "Connect your Gmail first in Account settings." },
      { status: 400 },
    );
  const fromName = senderChoice === "club" ? SHARED_FROM_NAME : memberFullName(me);

  const { sent, error } = await deliver(conn, fromName, recipients, subject, bodyHtml, mailMerge);
  return NextResponse.json({ ok: true, recipients: recipients.length, emailSent: sent, sendError: error });
}
