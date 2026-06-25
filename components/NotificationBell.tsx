"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Notification = {
  id: string;
  title: string;
  body: string;
  kind: string;
  refId: string | null;
  read: boolean;
  createdAt: string;
};

const fmtWhen = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export default function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission>("default");
  const seen = useRef<Set<string> | null>(null); // null until first load (so we don't notify the backlog)
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Fire OS-level browser notifications for items we haven't seen before.
  const fireBrowser = useCallback((list: Notification[]) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (seen.current === null) return; // first load: nothing is "new" yet
    for (const n of list) {
      if (!seen.current.has(n.id) && !n.read) {
        try {
          new Notification(n.title, { body: n.body, tag: n.id });
        } catch {
          /* ignore */
        }
      }
    }
  }, []);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/notifications", { headers: { "Content-Type": "application/json" } });
      if (!res.ok) return;
      const data = await res.json();
      const list: Notification[] = data.notifications ?? [];
      fireBrowser(list);
      seen.current = new Set(list.map((n) => n.id));
      setItems(list);
      setUnread(data.unread ?? list.filter((n) => !n.read).length);
    } catch {
      /* offline / not signed in */
    }
  }, [fireBrowser]);

  // Poll for new notifications.
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) setPerm(Notification.permission);
    fetchNotifs();
    const t = setInterval(fetchNotifs, 20000);
    return () => clearInterval(t);
  }, [fetchNotifs]);

  // Close the panel on outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function requestPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const p = await Notification.requestPermission();
      setPerm(p);
    } catch {
      /* ignore */
    }
  }

  async function markRead(id?: string) {
    try {
      await fetch("/api/lms/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : {}),
      });
      setItems((prev) => prev.map((n) => (!id || n.id === id ? { ...n, read: true } : n)));
      setUnread((u) => (id ? Math.max(0, u - 1) : 0));
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (perm === "default") requestPermission();
        }}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-paper/30 text-paper transition-colors hover:bg-paper hover:text-pine-deep"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-marigold px-1 text-[11px] font-bold text-pine-deep">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-pine/15 bg-paper text-ink shadow-xl">
          <div className="flex items-center justify-between border-b border-pine/10 px-4 py-3">
            <p className="font-display text-sm font-semibold text-pine-deep">Notifications</p>
            {items.some((n) => !n.read) && (
              <button onClick={() => markRead()} className="text-xs font-medium text-pine-deep hover:underline">Mark all read</button>
            )}
          </div>

          {perm !== "granted" && (
            <button onClick={requestPermission} className="block w-full border-b border-pine/10 bg-marigold-soft/30 px-4 py-2 text-left text-xs text-marigold-deep hover:bg-marigold-soft/50">
              Turn on browser notifications →
            </button>
          )}

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink/40">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`block w-full border-b border-pine/8 px-4 py-3 text-left transition-colors hover:bg-pine/[0.03] ${n.read ? "" : "bg-marigold-soft/15"}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-marigold" />}
                    <div className={n.read ? "pl-4" : ""}>
                      <p className="text-sm font-semibold text-ink">{n.title}</p>
                      <p className="mt-0.5 text-xs text-ink/65">{n.body}</p>
                      <p className="mt-1 text-[11px] text-ink/40">{fmtWhen(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
