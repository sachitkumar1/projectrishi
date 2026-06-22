"use client";

import { useCallback, useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import AnnouncementComposer from "@/components/AnnouncementComposer";
import "@/components/editor/editor.css";

type Item = {
  id: string;
  authorName: string;
  authorAvatar: string | null;
  subject: string;
  bodyHtml: string;
  createdAt: string;
  read: boolean;
};
type Compose = {
  canPost: boolean;
  scopes: Array<"members" | "group" | "club">;
  groups: string[];
  targetableMembers: Array<{ email: string; name: string; group: string }>;
  senders: { clubConnected: boolean; clubAddress: string; personalConnected: boolean; personalAddress: string };
};

const relTime = (iso: string) => {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

function Megaphone({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

export default function AnnouncementsPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [compose, setCompose] = useState<Compose | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/lms/announcements");
      if (!r.ok) return;
      const d = await r.json();
      setItems(d.announcements ?? []);
      setCompose(d.compose ?? null);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unread = items.filter((i) => !i.read).length;

  async function setRead(id: string, read: boolean) {
    setItems((list) => list.map((i) => (i.id === id ? { ...i, read } : i)));
    try {
      await fetch(`/api/lms/announcements/${id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
      });
    } catch {
      /* optimistic */
    }
  }

  function toggleExpand(item: Item) {
    if (expanded === item.id) {
      setExpanded(null);
    } else {
      setExpanded(item.id);
      if (!item.read) setRead(item.id, true);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-3xl border border-pine/15 bg-pine/[0.03] p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-marigold text-pine-deep">
            <Megaphone className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-semibold text-pine-deep">Announcements</h2>
            <p className="text-sm text-ink/55">
              {unread > 0 ? `${unread} unread` : "You're all caught up"}
            </p>
          </div>
        </div>
        {compose?.canPost && (
          <button
            onClick={() => setShowComposer(true)}
            className="shrink-0 rounded-full bg-pine px-4 py-2 text-xs font-semibold text-paper transition-colors hover:bg-pine-deep"
          >
            + New
          </button>
        )}
      </div>

      {flash && (
        <p className="mt-4 rounded-xl bg-marigold-soft/40 px-3 py-2 text-xs text-pine-deep">{flash}</p>
      )}

      {/* List */}
      <div className="mt-5 -mx-2 max-h-72 flex-1 overflow-y-auto px-2">
        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-ink/50">No announcements yet.</p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className={`mb-2 rounded-2xl border ${!item.read ? "border-marigold/40 bg-marigold-soft/20" : "border-pine/10 bg-paper"}`}
          >
            <button onClick={() => toggleExpand(item)} className="flex w-full items-start gap-3 p-3 text-left">
              <Avatar src={item.authorAvatar} name={item.authorName} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-ink/55">{item.authorName}</span>
                  {!item.read && <span className="h-2 w-2 rounded-full bg-marigold" />}
                  <span className="ml-auto text-[11px] text-ink/40">{relTime(item.createdAt)}</span>
                </div>
                <p className="mt-0.5 truncate font-semibold text-ink">{item.subject}</p>
              </div>
            </button>
            {expanded === item.id && (
              <div className="px-3 pb-3">
                <div className="rte-content text-sm" dangerouslySetInnerHTML={{ __html: item.bodyHtml }} />
                <button
                  onClick={() => setRead(item.id, !item.read)}
                  className="mt-3 text-xs font-semibold text-pine underline"
                >
                  Mark as {item.read ? "unread" : "read"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showComposer && compose && (
        <AnnouncementComposer
          compose={compose}
          onClose={() => setShowComposer(false)}
          onPosted={(msg) => {
            setShowComposer(false);
            setFlash(msg);
            load();
            setTimeout(() => setFlash(null), 6000);
          }}
        />
      )}
    </div>
  );
}
