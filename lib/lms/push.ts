// ============================================================================
//  Web Push — background notifications even when the dashboard is closed
// ----------------------------------------------------------------------------
//  Stores each browser's push subscription (Supabase when configured, in-memory
//  otherwise) and sends a push to every device a member has registered. Wired
//  into addNotification(), so EVERY notification (task, event, archive, chat, …)
//  also arrives as an OS-level push. Entirely best-effort: if VAPID keys aren't
//  configured the whole module no-ops and nothing else breaks.
// ============================================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const usingSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:ucberkeley@projectrishi.org";
const pushEnabled = Boolean(VAPID_PUBLIC && VAPID_PRIVATE);

export function pushPublicKey(): string {
  return VAPID_PUBLIC;
}

let _client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!_client)
    _client = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string, {
      auth: { persistSession: false },
    });
  return _client;
}

const lc = (e: string) => e.trim().toLowerCase();

export type PushSubscriptionRecord = {
  endpoint: string;
  userEmail: string;
  p256dh: string;
  auth: string;
};

// In-memory fallback store, keyed by endpoint.
const mem = new Map<string, PushSubscriptionRecord>();

export async function saveSubscription(
  userEmail: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
): Promise<void> {
  const record: PushSubscriptionRecord = {
    endpoint: sub.endpoint,
    userEmail: lc(userEmail),
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
  };
  if (usingSupabase) {
    const { error } = await sb().from("lms_push_subscriptions").upsert(
      {
        endpoint: record.endpoint,
        user_email: record.userEmail,
        p256dh: record.p256dh,
        auth: record.auth,
      },
      { onConflict: "endpoint" },
    );
    if (error) throw new Error(error.message);
    return;
  }
  mem.set(record.endpoint, record);
}

export async function removeSubscription(endpoint: string): Promise<void> {
  if (usingSupabase) {
    await sb().from("lms_push_subscriptions").delete().eq("endpoint", endpoint);
    return;
  }
  mem.delete(endpoint);
}

async function subscriptionsFor(email: string): Promise<PushSubscriptionRecord[]> {
  const me = lc(email);
  if (usingSupabase) {
    const { data, error } = await sb()
      .from("lms_push_subscriptions")
      .select("*")
      .eq("user_email", me);
    if (error) throw new Error(error.message);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (data ?? []).map((r: any) => ({
      endpoint: r.endpoint,
      userEmail: r.user_email,
      p256dh: r.p256dh,
      auth: r.auth,
    }));
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
  return Array.from(mem.values()).filter((s) => s.userEmail === me);
}

/**
 * Send a push notification to every device a member has registered. Safe to
 * call from anywhere — returns immediately when push isn't configured, and
 * prunes subscriptions that the browser has expired (404/410).
 */
export async function sendPushToUser(
  email: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  if (!pushEnabled) return;
  let webpush;
  try {
    // Lazy import so environments without the dependency / keys never crash.
    webpush = (await import("web-push")).default;
  } catch {
    return;
  }
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  } catch {
    return;
  }

  const subs = await subscriptionsFor(email).catch(() => [] as PushSubscriptionRecord[]);
  const data = JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? "/dashboard" });

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data,
        );
      } catch (e: unknown) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await removeSubscription(s.endpoint).catch(() => {});
      }
    }),
  );
}
