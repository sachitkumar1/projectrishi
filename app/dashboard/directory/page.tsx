"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Contours from "@/components/Contours";

type Entry = { loginEmail: string; name: string; role: string; group: string; email: string; phone: string };

export default function DirectoryPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [me, setMe] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  // self-edit
  const [editing, setEditing] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const load = () =>
    fetch("/api/lms/directory")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d?.error || "Couldn't load the directory.");
        return d as { entries: Entry[]; me: string };
      })
      .then((d) => { setEntries(d.entries); setMe(d.me); })
      .catch((e) => setError(e instanceof Error ? e.message : "Something went wrong."))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const mine = useMemo(() => entries.find((e) => e.loginEmail === me), [entries, me]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return entries;
    return entries.filter((e) =>
      [e.name, e.role, e.group, e.email, e.phone].some((f) => f.toLowerCase().includes(s)),
    );
  }, [entries, q]);

  function startEdit() {
    if (!mine) return;
    setEditEmail(mine.email);
    setEditPhone(mine.phone);
    setSaveErr(null);
    setEditing(true);
  }

  async function saveEdit() {
    setSaving(true);
    setSaveErr(null);
    try {
      const res = await fetch("/api/lms/directory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactEmail: editEmail, phone: editPhone }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error || "Couldn't save.");
      setEditing(false);
      await load();
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : "Couldn't save.");
    }
    setSaving(false);
  }

  return (
    <>
      <section className="relative overflow-hidden bg-pine pt-[var(--header-h)] text-paper">
        <Contours className="absolute inset-0 h-full w-full text-paper" opacity={0.12} />
        {/* Close (X) */}
        <Link href="/dashboard" aria-label="Close directory"
          className="absolute right-5 top-[calc(var(--header-h)+1.25rem)] z-20 grid h-10 w-10 place-items-center rounded-full border border-paper/30 text-paper transition-colors hover:bg-paper hover:text-pine-deep">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </Link>
        <div className="container-rishi relative z-10 py-12">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-paper/80 hover:text-paper">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
            Back to dashboard
          </Link>
          <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">Member Directory</h1>
        </div>
      </section>

      <section className="container-rishi py-10">
        {loading && <p className="text-ink/60">Loading…</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search members…"
                className="w-full max-w-sm rounded-full border border-pine/20 px-4 py-2.5 text-sm outline-none focus:border-pine"
              />
              {mine && (
                <button onClick={startEdit}
                  className="rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-pine-deep">
                  Edit my contact info
                </button>
              )}
            </div>

            <p className="mt-3 text-xs text-ink/45">{filtered.length} of {entries.length} members</p>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-pine/12">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-pine/12 bg-pine/[0.03] text-xs uppercase tracking-wide text-ink/50">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Project Group</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => {
                    const isMe = e.loginEmail === me;
                    return (
                      <tr key={e.loginEmail} className={`border-b border-pine/8 ${isMe ? "bg-marigold-soft/20" : "hover:bg-pine/[0.02]"}`}>
                        <td className="px-4 py-3 font-medium text-ink">
                          {e.name}{isMe && <span className="ml-2 rounded-full bg-pine/10 px-2 py-0.5 text-[10px] font-semibold text-pine-deep">You</span>}
                        </td>
                        <td className="px-4 py-3 text-ink/70">{e.role}</td>
                        <td className="px-4 py-3 text-ink/70">{e.group}</td>
                        <td className="px-4 py-3">
                          <a href={`mailto:${e.email}`} className="text-pine hover:underline">{e.email}</a>
                        </td>
                        <td className="px-4 py-3 text-ink/70">
                          {e.phone ? <a href={`tel:${e.phone}`} className="hover:underline">{e.phone}</a> : <span className="text-ink/30">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/45">No members match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Edit-my-contact modal */}
      {editing && mine && (
        <div className="fixed inset-0 z-[1100] grid place-items-center bg-ink/40 p-4" onClick={() => setEditing(false)}>
          <div className="w-full max-w-md rounded-3xl bg-paper p-6 shadow-xl" onClick={(ev) => ev.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h2 className="font-display text-xl font-semibold text-pine-deep">Your contact info</h2>
              <button onClick={() => setEditing(false)} className="grid h-8 w-8 place-items-center rounded-full text-ink/50 hover:bg-ink/5" aria-label="Close">✕</button>
            </div>
            <p className="mt-1 text-xs text-ink/50">This only changes how you appear in this directory. It does not change the email you log in with.</p>

            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">Email</span>
              <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="you@example.com"
                className="mt-1.5 w-full rounded-xl border border-pine/20 px-4 py-2.5 text-sm outline-none focus:border-pine" />
            </label>
            <label className="mt-3 block">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">Phone</span>
              <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+1 555 123 4567"
                className="mt-1.5 w-full rounded-xl border border-pine/20 px-4 py-2.5 text-sm outline-none focus:border-pine" />
            </label>
            <p className="mt-2 text-[11px] text-ink/40">Leave a field blank to reset it to your default from the club roster.</p>

            {saveErr && <p className="mt-2 text-xs text-red-600">{saveErr}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="rounded-full border border-pine/20 px-4 py-2 text-sm font-semibold text-pine-deep hover:bg-pine/5">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="rounded-full bg-pine px-5 py-2 text-sm font-semibold text-paper hover:bg-pine-deep disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
