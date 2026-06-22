// ============================================================================
//  Announcements — store (Supabase when configured, in-memory otherwise)
// ============================================================================

import crypto from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const usingSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

let _client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!_client)
    _client = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string, {
      auth: { persistSession: false },
    });
  return _client;
}

const lc = (e: string) => e.trim().toLowerCase();
const now = () => new Date().toISOString();

export type Announcement = {
  id: string;
  authorEmail: string;
  authorName: string;
  senderEmail: string;
  subject: string;
  bodyHtml: string;
  recipientEmails: string[];
  createdAt: string;
};

export type AnnouncementForMember = Announcement & { read: boolean };

export type NewAnnouncement = {
  authorEmail: string;
  authorName: string;
  senderEmail: string;
  subject: string;
  bodyHtml: string;
  recipientEmails: string[];
};

// in-memory fallback
const memAnn: Announcement[] = [];
const memReads = new Map<string, boolean>(); // `${id}|${email}` -> read

/* eslint-disable @typescript-eslint/no-explicit-any */
const fromRow = (r: any): Announcement => ({
  id: r.id,
  authorEmail: r.author_email,
  authorName: r.author_name,
  senderEmail: r.sender_email,
  subject: r.subject,
  bodyHtml: r.body_html,
  recipientEmails: r.recipient_emails ?? [],
  createdAt: r.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function createAnnouncement(a: NewAnnouncement): Promise<Announcement> {
  const id = crypto.randomUUID();
  const recipients = Array.from(new Set(a.recipientEmails.map(lc)));
  const record: Announcement = { id, ...a, recipientEmails: recipients, createdAt: now() };
  if (usingSupabase) {
    const { error } = await sb().from("lms_announcements").insert({
      id,
      author_email: lc(a.authorEmail),
      author_name: a.authorName,
      sender_email: lc(a.senderEmail),
      subject: a.subject,
      body_html: a.bodyHtml,
      recipient_emails: recipients,
      created_at: record.createdAt,
    });
    if (error) throw new Error(error.message);
    return record;
  }
  memAnn.unshift(record);
  return record;
}

export async function listAnnouncementsForMember(email: string): Promise<AnnouncementForMember[]> {
  const me = lc(email);
  if (usingSupabase) {
    const { data, error } = await sb()
      .from("lms_announcements")
      .select("*")
      .contains("recipient_emails", [me])
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const anns = (data ?? []).map(fromRow);
    if (anns.length === 0) return [];
    const { data: reads } = await sb()
      .from("lms_announcement_reads")
      .select("announcement_id, read")
      .eq("user_email", me)
      .in("announcement_id", anns.map((a) => a.id));
    const readMap = new Map((reads ?? []).map((r) => [r.announcement_id, r.read]));
    return anns.map((a) => ({ ...a, read: readMap.get(a.id) ?? false }));
  }
  return memAnn
    .filter((a) => a.recipientEmails.includes(me))
    .map((a) => ({ ...a, read: memReads.get(`${a.id}|${me}`) ?? false }));
}

export async function setAnnouncementRead(id: string, email: string, read: boolean): Promise<void> {
  const me = lc(email);
  if (usingSupabase) {
    const { error } = await sb()
      .from("lms_announcement_reads")
      .upsert({ announcement_id: id, user_email: me, read, updated_at: now() }, { onConflict: "announcement_id,user_email" });
    if (error) throw new Error(error.message);
    return;
  }
  memReads.set(`${id}|${me}`, read);
}

/** Look up one announcement (to check authorship before deleting). */
export async function getAnnouncementById(id: string): Promise<Announcement | null> {
  if (usingSupabase) {
    const { data, error } = await sb().from("lms_announcements").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromRow(data) : null;
  }
  return memAnn.find((a) => a.id === id) ?? null;
}

/** Delete an announcement and its read records. Does NOT affect sent emails. */
export async function deleteAnnouncement(id: string): Promise<void> {
  if (usingSupabase) {
    const { error } = await sb().from("lms_announcements").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await sb().from("lms_announcement_reads").delete().eq("announcement_id", id);
    return;
  }
  const i = memAnn.findIndex((a) => a.id === id);
  if (i >= 0) memAnn.splice(i, 1);
  for (const key of Array.from(memReads.keys())) if (key.startsWith(`${id}|`)) memReads.delete(key);
}
