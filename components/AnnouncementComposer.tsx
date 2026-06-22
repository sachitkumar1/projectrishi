"use client";

import { useMemo, useState } from "react";
import RichTextEditor from "@/components/editor/RichTextEditor";

type Lite = { email: string; name: string; group: string };
type Compose = {
  scopes: Array<"members" | "group" | "club">;
  groups: string[];
  targetableMembers: Lite[];
  senders: {
    clubConnected: boolean;
    clubAddress: string;
    personalConnected: boolean;
    personalAddress: string;
  };
};

const GROUP_LABELS: Record<string, string> = {
  E: "Education",
  R: "Water & Sanitation",
  W: "Women's Empowerment",
  H: "Health",
};

export default function AnnouncementComposer({
  compose,
  onClose,
  onPosted,
}: {
  compose: Compose;
  onClose: () => void;
  onPosted: (msg: string) => void;
}) {
  const [subject, setSubject] = useState("");
  const [scopeKind, setScopeKind] = useState<"members" | "group" | "club">(compose.scopes[0] ?? "members");
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [bodyHtml, setBodyHtml] = useState("");
  const [sender, setSender] = useState<"club" | "personal">(
    compose.senders.clubConnected ? "club" : "personal",
  );
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const filtered = useMemo(
    () => compose.targetableMembers.filter((m) => m.name.toLowerCase().includes(q.toLowerCase())),
    [compose.targetableMembers, q],
  );

  function toggle<T>(list: T[], v: T): T[] {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/lms/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, bodyHtml, scopeKind, memberEmails, groups, sender }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Couldn't post the announcement.");
      onPosted(
        data.emailSent
          ? `Announcement sent to ${data.recipients} member${data.recipients === 1 ? "" : "s"}.`
          : `Posted, but the email didn't send: ${data.sendError ?? "unknown error"}.`,
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const senderUnavailable =
    (sender === "club" && !compose.senders.clubConnected) ||
    (sender === "personal" && !compose.senders.personalConnected);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-paper p-6 text-ink shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-semibold text-pine-deep">New announcement</h3>

        {/* Subject */}
        <label className="mt-4 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">Subject</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="[ANNOUNCEMENT]"
            className="mt-1.5 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm text-ink placeholder:text-ink/40"
          />
        </label>

        {/* Audience */}
        <div className="mt-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">Send to</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {compose.scopes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScopeKind(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  scopeKind === s ? "bg-pine text-paper" : "border border-ink/15 text-ink/70 hover:bg-ink/5"
                }`}
              >
                {s === "members" ? "Specific people" : s === "group" ? "Project group" : "Whole club"}
              </button>
            ))}
          </div>

          {scopeKind === "members" && (
            <div className="mt-3 rounded-xl border border-ink/12 p-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search people…"
                className="mb-2 w-full rounded-lg border border-ink/15 px-2.5 py-1.5 text-sm text-ink placeholder:text-ink/40"
              />
              <div className="max-h-40 space-y-0.5 overflow-y-auto">
                {filtered.map((m) => (
                  <label key={m.email} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm text-ink hover:bg-ink/5">
                    <input
                      type="checkbox"
                      checked={memberEmails.includes(m.email)}
                      onChange={() => setMemberEmails((l) => toggle(l, m.email))}
                      className="accent-pine"
                    />
                    {m.name}
                    <span className="text-xs text-ink/40">{GROUP_LABELS[m.group] ?? m.group}</span>
                  </label>
                ))}
                {filtered.length === 0 && <p className="px-2 py-1 text-xs text-ink/40">No matches.</p>}
              </div>
            </div>
          )}

          {scopeKind === "group" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {compose.groups.map((g) => (
                <label key={g} className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium ${groups.includes(g) ? "bg-marigold text-pine-deep" : "border border-ink/15 text-ink/70"}`}>
                  <input type="checkbox" checked={groups.includes(g)} onChange={() => setGroups((l) => toggle(l, g))} className="hidden" />
                  {GROUP_LABELS[g] ?? g}
                </label>
              ))}
            </div>
          )}

          {scopeKind === "club" && (
            <p className="mt-3 text-sm text-ink/60">This will go to every member of the club.</p>
          )}
        </div>

        {/* Sender */}
        <div className="mt-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">Send from</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSender("club")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${sender === "club" ? "bg-pine text-paper" : "border border-ink/15 text-ink/70 hover:bg-ink/5"}`}
            >
              Club ({compose.senders.clubAddress})
            </button>
            <button
              type="button"
              onClick={() => setSender("personal")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${sender === "personal" ? "bg-pine text-paper" : "border border-ink/15 text-ink/70 hover:bg-ink/5"}`}
            >
              My email ({compose.senders.personalAddress})
            </button>
          </div>
          {senderUnavailable && (
            <p className="mt-2 text-xs text-marigold-deep">
              That account isn&rsquo;t connected yet — connect it from Account settings before sending.
            </p>
          )}
        </div>

        {/* Body */}
        <div className="mt-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">Message</span>
          <div className="mt-1.5">
            <RichTextEditor value="" onChange={setBodyHtml} placeholder="Write your announcement…" />
          </div>
        </div>

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} disabled={busy} className="rounded-full px-4 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/5">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || senderUnavailable}
            className="rounded-full bg-pine px-5 py-2 text-sm font-semibold text-paper hover:bg-pine-deep disabled:opacity-50"
          >
            {busy ? "Sending…" : "Post & send"}
          </button>
        </div>
      </div>
    </div>
  );
}
