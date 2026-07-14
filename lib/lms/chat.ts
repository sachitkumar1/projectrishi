// ============================================================================
//  Chat — direct messages + group chats (Supabase when configured, else memory)
// ----------------------------------------------------------------------------
//  Tables: lms_chats, lms_chat_members, lms_messages. Reactions ("tapbacks")
//  live as a jsonb array on each message row for simplicity. Everything is
//  keyed by member email, matching the rest of the LMS.
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
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export type Reaction = { email: string; emoji: string };
export type ChatMessage = {
  id: string;
  chatId: string;
  senderEmail: string;
  body: string;
  reactions: Reaction[];
  createdAt: string;
};
export type Chat = {
  id: string;
  isGroup: boolean;
  title: string | null;
  createdBy: string;
  createdAt: string;
  memberEmails: string[];
};
export type ChatSummary = Chat & { lastMessage: string | null; lastAt: string | null };

/* eslint-disable @typescript-eslint/no-explicit-any */
const chatFromRow = (r: any, memberEmails: string[]): Chat => ({
  id: r.id,
  isGroup: r.is_group,
  title: r.title ?? null,
  createdBy: r.created_by,
  createdAt: r.created_at,
  memberEmails,
});
const msgFromRow = (r: any): ChatMessage => ({
  id: r.id,
  chatId: r.chat_id,
  senderEmail: r.sender_email,
  body: r.body,
  reactions: Array.isArray(r.reactions) ? r.reactions : [],
  createdAt: r.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

// ----- in-memory fallback -----
const mem = {
  chats: [] as Chat[],
  messages: [] as ChatMessage[],
  hidden: new Map<string, string>(), // `${chatId}|${email}` -> hiddenAt ISO
};
const hiddenKey = (chatId: string, email: string) => `${chatId}|${lc(email)}`;

const sameMembers = (a: string[], b: string[]) => {
  const sa = new Set(a.map(lc));
  const sb2 = new Set(b.map(lc));
  if (sa.size !== sb2.size) return false;
  for (const x of Array.from(sa)) if (!sb2.has(x)) return false;
  return true;
};

// ------------------------------------------------------------------ chats
export async function listChats(email: string): Promise<ChatSummary[]> {
  const me = lc(email);
  if (usingSupabase) {
    const { data: memRows, error: e1 } = await sb()
      .from("lms_chat_members").select("chat_id,hidden_at").eq("email", me);
    if (e1) throw new Error(e1.message);
    const ids = (memRows ?? []).map((r) => r.chat_id);
    if (ids.length === 0) return [];
    const { data: chatRows, error: e2 } = await sb()
      .from("lms_chats").select("*").in("id", ids);
    if (e2) throw new Error(e2.message);
    const { data: allMembers } = await sb()
      .from("lms_chat_members").select("chat_id,email").in("chat_id", ids);
    const { data: msgs } = await sb()
      .from("lms_messages").select("chat_id,body,created_at").in("chat_id", ids)
      .order("created_at", { ascending: false });

    const membersByChat = new Map<string, string[]>();
    for (const m of allMembers ?? []) {
      const arr = membersByChat.get(m.chat_id) ?? [];
      arr.push(m.email);
      membersByChat.set(m.chat_id, arr);
    }
    const lastByChat = new Map<string, { body: string; at: string }>();
    for (const m of msgs ?? []) {
      if (!lastByChat.has(m.chat_id)) lastByChat.set(m.chat_id, { body: m.body, at: m.created_at });
    }
    const hiddenByChat = new Map<string, string | null>();
    for (const r of memRows ?? []) hiddenByChat.set(r.chat_id, (r as { hidden_at?: string | null }).hidden_at ?? null);
    const out: ChatSummary[] = (chatRows ?? [])
      .map((r) => {
        const last = lastByChat.get(r.id);
        return {
          ...chatFromRow(r, membersByChat.get(r.id) ?? []),
          lastMessage: last?.body ?? null,
          lastAt: last?.at ?? null,
        };
      })
      // Drop chats the member has deleted for themselves, UNLESS a newer message arrived since.
      .filter((c) => {
        const h = hiddenByChat.get(c.id);
        return !h || (c.lastAt !== null && c.lastAt > h);
      });
    return out.sort((a, b) => (b.lastAt ?? b.createdAt).localeCompare(a.lastAt ?? a.createdAt));
  }

  const mine = mem.chats.filter((c) => c.memberEmails.map(lc).includes(me));
  return mine
    .map((c) => {
      const msgs = mem.messages.filter((m) => m.chatId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const last = msgs[0];
      return { ...c, lastMessage: last?.body ?? null, lastAt: last?.createdAt ?? null };
    })
    .filter((c) => {
      const h = mem.hidden.get(hiddenKey(c.id, me));
      return !h || (c.lastAt !== null && c.lastAt > h);
    })
    .sort((a, b) => (b.lastAt ?? b.createdAt).localeCompare(a.lastAt ?? a.createdAt));
}

export async function getChat(id: string): Promise<Chat | null> {
  if (usingSupabase) {
    const { data: r } = await sb().from("lms_chats").select("*").eq("id", id).maybeSingle();
    if (!r) return null;
    const { data: members } = await sb().from("lms_chat_members").select("email").eq("chat_id", id);
    return chatFromRow(r, (members ?? []).map((m) => m.email));
  }
  return mem.chats.find((c) => c.id === id) ?? null;
}

export async function isChatMember(chatId: string, email: string): Promise<boolean> {
  const chat = await getChat(chatId);
  return !!chat && chat.memberEmails.map(lc).includes(lc(email));
}

async function findDM(a: string, b: string): Promise<Chat | null> {
  const want = [lc(a), lc(b)];
  if (usingSupabase) {
    const { data: memRows } = await sb().from("lms_chat_members").select("chat_id").eq("email", lc(a));
    const ids = (memRows ?? []).map((r) => r.chat_id);
    for (const id of ids) {
      const chat = await getChat(id);
      if (chat && !chat.isGroup && sameMembers(chat.memberEmails, want)) return chat;
    }
    return null;
  }
  return mem.chats.find((c) => !c.isGroup && sameMembers(c.memberEmails, want)) ?? null;
}

export async function createChat(
  creatorEmail: string,
  memberEmails: string[],
  opts: { isGroup: boolean; title?: string | null },
): Promise<Chat> {
  const creator = lc(creatorEmail);
  const members = Array.from(new Set([creator, ...memberEmails.map(lc)]));
  // A 1:1 chat is deduped so you never get two DMs with the same person.
  if (!opts.isGroup && members.length === 2) {
    const existing = await findDM(members[0], members[1]);
    if (existing) { await clearHiddenForUser(existing.id, creator).catch(() => {}); return existing; }
  }
  const chat: Chat = {
    id: uid(),
    isGroup: opts.isGroup,
    title: opts.title?.trim() || null,
    createdBy: creator,
    createdAt: now(),
    memberEmails: members,
  };
  if (usingSupabase) {
    const { error } = await sb().from("lms_chats").insert({
      id: chat.id, is_group: chat.isGroup, title: chat.title, created_by: chat.createdBy, created_at: chat.createdAt,
    });
    if (error) throw new Error(error.message);
    const { error: e2 } = await sb().from("lms_chat_members")
      .insert(members.map((email) => ({ chat_id: chat.id, email })));
    if (e2) throw new Error(e2.message);
    return chat;
  }
  mem.chats.push(chat);
  return chat;
}

/** Delete a conversation for one member only (hides it from their list). */
export async function hideChatForUser(chatId: string, email: string): Promise<void> {
  if (usingSupabase) {
    await sb().from("lms_chat_members").update({ hidden_at: now() }).eq("chat_id", chatId).eq("email", lc(email));
    return;
  }
  mem.hidden.set(hiddenKey(chatId, email), now());
}

async function clearHiddenForUser(chatId: string, email: string): Promise<void> {
  if (usingSupabase) {
    await sb().from("lms_chat_members").update({ hidden_at: null }).eq("chat_id", chatId).eq("email", lc(email));
    return;
  }
  mem.hidden.delete(hiddenKey(chatId, email));
}

// ----------------------------------------------------------------- messages
export async function listMessages(chatId: string): Promise<ChatMessage[]> {
  if (usingSupabase) {
    const { data, error } = await sb().from("lms_messages").select("*").eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(msgFromRow);
  }
  return mem.messages.filter((m) => m.chatId === chatId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function sendMessage(chatId: string, senderEmail: string, body: string): Promise<ChatMessage> {
  const msg: ChatMessage = {
    id: uid(), chatId, senderEmail: lc(senderEmail), body, reactions: [], createdAt: now(),
  };
  if (usingSupabase) {
    const { error } = await sb().from("lms_messages").insert({
      id: msg.id, chat_id: chatId, sender_email: msg.senderEmail, body, reactions: [], created_at: msg.createdAt,
    });
    if (error) throw new Error(error.message);
    return msg;
  }
  mem.messages.push(msg);
  return msg;
}

export async function getMessage(messageId: string): Promise<ChatMessage | null> {
  if (usingSupabase) {
    const { data } = await sb().from("lms_messages").select("*").eq("id", messageId).maybeSingle();
    return data ? msgFromRow(data) : null;
  }
  return mem.messages.find((m) => m.id === messageId) ?? null;
}

/** Toggle a tapback: same member + same emoji removes it, otherwise adds it. */
export async function toggleReaction(messageId: string, email: string, emoji: string): Promise<ChatMessage | null> {
  const msg = await getMessage(messageId);
  if (!msg) return null;
  const me = lc(email);
  const has = msg.reactions.some((r) => r.email === me && r.emoji === emoji);
  const reactions = has
    ? msg.reactions.filter((r) => !(r.email === me && r.emoji === emoji))
    : [...msg.reactions, { email: me, emoji }];
  if (usingSupabase) {
    const { error } = await sb().from("lms_messages").update({ reactions }).eq("id", messageId);
    if (error) throw new Error(error.message);
  } else {
    msg.reactions = reactions;
  }
  return { ...msg, reactions };
}
