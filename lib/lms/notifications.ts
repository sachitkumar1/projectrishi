// ============================================================================
//  Notification center — store (Supabase when configured, in-memory otherwise)
// ----------------------------------------------------------------------------
//  Every task/event email is mirrored here as an in-dashboard notification so
//  the bell icon can show a feed (title = email subject, body = email body).
// ============================================================================

import crypto from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Notification } from "@/lib/lms/types";

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

/* eslint-disable @typescript-eslint/no-explicit-any */
const fromRow = (r: any): Notification => ({
  id: r.id,
  userEmail: r.user_email,
  title: r.title,
  body: r.body,
  kind: r.kind ?? "info",
  refId: r.ref_id ?? null,
  read: r.read ?? false,
  createdAt: r.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

const mem: Notification[] = [];

export type NewNotification = {
  userEmail: string;
  title: string;
  body: string;
  kind?: string;
  refId?: string | null;
};

/** Create one notification for one member. */
export async function addNotification(input: NewNotification): Promise<Notification> {
  const record: Notification = {
    id: crypto.randomUUID(),
    userEmail: lc(input.userEmail),
    title: input.title,
    body: input.body,
    kind: input.kind ?? "info",
    refId: input.refId ?? null,
    read: false,
    createdAt: now(),
  };
  if (usingSupabase) {
    const { error } = await sb().from("lms_notifications").insert({
      id: record.id,
      user_email: record.userEmail,
      title: record.title,
      body: record.body,
      kind: record.kind,
      ref_id: record.refId,
      read: false,
      created_at: record.createdAt,
    });
    if (error) throw new Error(error.message);
    return record;
  }
  mem.unshift(record);
  return record;
}

/** Most-recent notifications for one member. */
export async function listNotifications(email: string, limit = 50): Promise<Notification[]> {
  const me = lc(email);
  if (usingSupabase) {
    const { data, error } = await sb()
      .from("lms_notifications")
      .select("*")
      .eq("user_email", me)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []).map(fromRow);
  }
  return mem.filter((n) => n.userEmail === me).slice(0, limit);
}

/** Mark one notification read (must belong to the caller), or all of them. */
export async function markNotificationsRead(email: string, id?: string): Promise<void> {
  const me = lc(email);
  if (usingSupabase) {
    let q = sb().from("lms_notifications").update({ read: true }).eq("user_email", me);
    if (id) q = q.eq("id", id);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return;
  }
  for (const n of mem) if (n.userEmail === me && (!id || n.id === id)) n.read = true;
}
