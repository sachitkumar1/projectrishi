// ============================================================================
//  Newsletters & subscribers — store
// ----------------------------------------------------------------------------
//  Newsletters go to every member + every website subscriber, and appear on
//  every member's dashboard. Posted only by the Director of Outreach.
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

export type Newsletter = {
  id: string;
  authorEmail: string;
  authorName: string;
  senderEmail: string;
  subject: string;
  bodyHtml: string;
  mailMerge: boolean;
  createdAt: string;
};
export type NewsletterForMember = Newsletter & { read: boolean };
export type NewNewsletter = Omit<Newsletter, "id" | "createdAt">;

const memNl: Newsletter[] = [];
const memNlReads = new Map<string, boolean>();
const memSubs = new Set<string>();

/* eslint-disable @typescript-eslint/no-explicit-any */
const fromRow = (r: any): Newsletter => ({
  id: r.id,
  authorEmail: r.author_email,
  authorName: r.author_name,
  senderEmail: r.sender_email,
  subject: r.subject,
  bodyHtml: r.body_html,
  mailMerge: r.mail_merge ?? true,
  createdAt: r.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function createNewsletter(n: NewNewsletter): Promise<Newsletter> {
  const id = crypto.randomUUID();
  const record: Newsletter = { id, ...n, createdAt: now() };
  if (usingSupabase) {
    const { error } = await sb().from("lms_newsletters").insert({
      id,
      author_email: lc(n.authorEmail),
      author_name: n.authorName,
      sender_email: lc(n.senderEmail),
      subject: n.subject,
      body_html: n.bodyHtml,
      mail_merge: n.mailMerge,
      created_at: record.createdAt,
    });
    if (error) throw new Error(error.message);
    return record;
  }
  memNl.unshift(record);
  return record;
}

export async function listNewslettersForMember(email: string): Promise<NewsletterForMember[]> {
  const me = lc(email);
  if (usingSupabase) {
    const { data, error } = await sb().from("lms_newsletters").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const nls = (data ?? []).map(fromRow);
    if (nls.length === 0) return [];
    const { data: reads } = await sb()
      .from("lms_newsletter_reads")
      .select("newsletter_id, read")
      .eq("user_email", me)
      .in("newsletter_id", nls.map((n) => n.id));
    const readMap = new Map((reads ?? []).map((r) => [r.newsletter_id, r.read]));
    return nls.map((n) => ({ ...n, read: readMap.get(n.id) ?? false }));
  }
  return memNl.map((n) => ({ ...n, read: memNlReads.get(`${n.id}|${me}`) ?? false }));
}

export async function setNewsletterRead(id: string, email: string, read: boolean): Promise<void> {
  const me = lc(email);
  if (usingSupabase) {
    const { error } = await sb()
      .from("lms_newsletter_reads")
      .upsert({ newsletter_id: id, user_email: me, read, updated_at: now() }, { onConflict: "newsletter_id,user_email" });
    if (error) throw new Error(error.message);
    return;
  }
  memNlReads.set(`${id}|${me}`, read);
}

export async function getNewsletterById(id: string): Promise<Newsletter | null> {
  if (usingSupabase) {
    const { data, error } = await sb().from("lms_newsletters").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromRow(data) : null;
  }
  return memNl.find((n) => n.id === id) ?? null;
}

export async function deleteNewsletter(id: string): Promise<void> {
  if (usingSupabase) {
    const { error } = await sb().from("lms_newsletters").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await sb().from("lms_newsletter_reads").delete().eq("newsletter_id", id);
    return;
  }
  const i = memNl.findIndex((n) => n.id === id);
  if (i >= 0) memNl.splice(i, 1);
  for (const k of Array.from(memNlReads.keys())) if (k.startsWith(`${id}|`)) memNlReads.delete(k);
}

// ---- Subscribers -----------------------------------------------------------
export async function addSubscriber(email: string): Promise<void> {
  const e = lc(email);
  if (usingSupabase) {
    const { error } = await sb().from("lms_newsletter_subscribers").upsert({ email: e }, { onConflict: "email" });
    if (error) throw new Error(error.message);
    return;
  }
  memSubs.add(e);
}

export async function listSubscribers(): Promise<string[]> {
  if (usingSupabase) {
    const { data, error } = await sb().from("lms_newsletter_subscribers").select("email");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.email as string);
  }
  return Array.from(memSubs);
}
