"use client";

import { formatPhoneInput } from "@/lib/lms/phone";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Contours from "@/components/Contours";
import Avatar from "@/components/Avatar";
import ProfilePhotoModal from "@/components/ProfilePhotoModal";

type Profile = {
  email: string;
  firstName: string;
  lastName: string;
  groupLabel: string;
  roleLabels: string[];
  avatar: string | null;
};

type GmailStatus = {
  personal: boolean;
  personalEmail: string;
  club: boolean;
  notify: boolean;
  canConnectClub: boolean;
  sharedSender: string;
  notifySender: string;
};

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</span>
      <div className="mt-1.5 cursor-not-allowed select-none rounded-xl border border-ink/10 bg-ink/[0.04] px-4 py-3 text-sm text-ink/60">
        {value || "—"}
      </div>
    </label>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [gmail, setGmail] = useState<GmailStatus | null>(null);
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cSaving, setCSaving] = useState(false);
  const [cMsg, setCMsg] = useState<string | null>(null);

  const loadGmail = () =>
    fetch("/api/lms/gmail/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setGmail(d))
      .catch(() => {});

  useEffect(() => {
    fetch("/api/lms/profile")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d?.error || "Couldn't load your settings.");
        return d as Profile;
      })
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : "Something went wrong."))
      .finally(() => setLoading(false));
    loadGmail();
    fetch("/api/lms/directory")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        const mine = (d.entries as { loginEmail: string; email: string; phone: string }[]).find(
          (e) => e.loginEmail === d.me,
        );
        if (mine) { setCEmail(mine.email); setCPhone(mine.phone); }
      })
      .catch(() => {});
  }, []);

  async function saveContact() {
    setCSaving(true);
    setCMsg(null);
    try {
      const r = await fetch("/api/lms/directory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactEmail: cEmail, phone: cPhone }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "Couldn't save.");
      setCMsg("Saved!");
      setTimeout(() => setCMsg(null), 2000);
    } catch (e) {
      setCMsg(e instanceof Error ? e.message : "Couldn't save.");
    }
    setCSaving(false);
  }

  async function disconnectGmail(target: "personal" | "club" | "notify") {
    await fetch(`/api/lms/gmail/disconnect?target=${target}`, { method: "POST" });
    loadGmail();
  }

  return (
    <>
      <section className="relative overflow-hidden bg-pine pt-[var(--header-h)] text-paper">
        <Contours className="absolute inset-0 h-full w-full text-paper" opacity={0.12} />
        <div className="container-rishi relative z-10 py-12">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-paper/80 hover:text-paper">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            Back to dashboard
          </Link>
          <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">Account settings</h1>
        </div>
      </section>

      <section className="container-rishi py-12">
        {loading && <p className="text-ink/60">Loading…</p>}
        {error && <p className="text-red-600">{error}</p>}

        {profile && (
          <Reveal>
            <div className="mx-auto max-w-xl rounded-3xl border border-pine/15 bg-pine/[0.03] p-8">
              {/* Photo (the one editable setting for now) */}
              <div className="flex items-center gap-5">
                <Avatar src={profile.avatar} name={`${profile.firstName} ${profile.lastName}`} size={88} />
                <div>
                  <button
                    onClick={() => setShowModal(true)}
                    className="rounded-full bg-pine px-5 py-2 text-sm font-semibold text-paper transition-colors hover:bg-pine-deep"
                  >
                    Change photo
                  </button>
                  <p className="mt-2 text-xs text-ink/50">JPG or PNG. You can crop and zoom after choosing.</p>
                </div>
              </div>

              {/* Read-only account details */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <ReadonlyField label="First name" value={profile.firstName} />
                <ReadonlyField label="Last name" value={profile.lastName} />
                <div className="sm:col-span-2">
                  <ReadonlyField label="Email" value={profile.email} />
                </div>
                <div className="sm:col-span-2">
                  <ReadonlyField label="Project group" value={profile.groupLabel} />
                </div>
                <div className="sm:col-span-2">
                  <ReadonlyField label="Role(s)" value={profile.roleLabels.join(", ")} />
                </div>
              </div>
              <p className="mt-5 text-xs text-ink/45">
                Name, email, and roles are managed by the club and can&rsquo;t be edited here. If
                something looks wrong, let a lead know.
              </p>
            </div>

            {/* Directory contact info (editable) */}
            <div className="mx-auto mt-6 max-w-xl rounded-3xl border border-pine/15 bg-pine/[0.03] p-8">
              <h2 className="font-display text-lg font-semibold text-pine-deep">Directory contact info</h2>
              <p className="mt-1 text-sm text-ink/60">
                How you appear in the <a href="/dashboard/directory" className="text-pine underline">member directory</a>.
                Editing this does <strong>not</strong> change the email you log in with.
              </p>
              <div className="mt-5 grid gap-4">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">Email</span>
                  <input value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="you@example.com"
                    className="mt-1.5 w-full rounded-xl border border-pine/20 px-4 py-3 text-sm outline-none focus:border-pine" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">Phone</span>
                  <input value={cPhone} onChange={(e) => setCPhone(formatPhoneInput(e.target.value))} placeholder="(555) 123-4567"
                    className="mt-1.5 w-full rounded-xl border border-pine/20 px-4 py-3 text-sm outline-none focus:border-pine" />
                </label>
              </div>
              <p className="mt-2 text-[11px] text-ink/40">Leave a field blank to reset it to your default from the club roster.</p>
              <div className="mt-4 flex items-center gap-3">
                <button onClick={saveContact} disabled={cSaving}
                  className="rounded-full bg-pine px-5 py-2 text-sm font-semibold text-paper hover:bg-pine-deep disabled:opacity-60">
                  {cSaving ? "Saving\u2026" : "Save contact info"}
                </button>
                {cMsg && <span className="text-sm text-pine-deep">{cMsg}</span>}
              </div>
            </div>

            {/* Email sending (Gmail) */}
            {gmail && (
              <div className="mx-auto mt-6 max-w-xl rounded-3xl border border-pine/15 bg-pine/[0.03] p-8">
                <h2 className="font-display text-lg font-semibold text-pine-deep">Email sending</h2>
                <p className="mt-1 text-sm text-ink/60">
                  Connect an account so the dashboard can send announcements and emails on your behalf.
                  This uses send-only access &mdash; it can never read or delete your mail.
                </p>

                {/* Personal */}
                <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-ink/10 p-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">Your email</p>
                    <p className="text-xs text-ink/50">{gmail.personalEmail}</p>
                  </div>
                  {gmail.personal ? (
                    <button onClick={() => disconnectGmail("personal")} className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5">
                      Disconnect
                    </button>
                  ) : (
                    <a href="/api/lms/gmail/connect?target=personal" className="rounded-full bg-pine px-4 py-2 text-xs font-semibold text-paper hover:bg-pine-deep">
                      Connect
                    </a>
                  )}
                </div>

                {/* Club — announcements, newsletters, composed emails (exec only) */}
                {gmail.canConnectClub && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-ink/10 p-4">
                    <div>
                      <p className="text-sm font-semibold text-ink">Announcements &amp; newsletters</p>
                      <p className="text-xs text-ink/50">{gmail.sharedSender}</p>
                    </div>
                    {gmail.club ? (
                      <button onClick={() => disconnectGmail("club")} className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5">
                        Disconnect
                      </button>
                    ) : (
                      <a href="/api/lms/gmail/connect?target=club" className="rounded-full bg-marigold px-4 py-2 text-xs font-semibold text-pine-deep hover:brightness-95">
                        Connect
                      </a>
                    )}
                  </div>
                )}

                {/* Notifications — reminders + task/event notification emails (exec only) */}
                {gmail.canConnectClub && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-ink/10 p-4">
                    <div>
                      <p className="text-sm font-semibold text-ink">Task &amp; reminder notifications</p>
                      <p className="text-xs text-ink/50">{gmail.notifySender}</p>
                    </div>
                    {gmail.notify ? (
                      <button onClick={() => disconnectGmail("notify")} className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5">
                        Disconnect
                      </button>
                    ) : (
                      <a href="/api/lms/gmail/connect?target=notify" className="rounded-full bg-marigold px-4 py-2 text-xs font-semibold text-pine-deep hover:brightness-95">
                        Connect
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </Reveal>
        )}
      </section>

      {showModal && profile && (
        <ProfilePhotoModal
          currentAvatar={profile.avatar}
          onClose={() => setShowModal(false)}
          onSaved={(avatar) => {
            setProfile((p) => (p ? { ...p, avatar } : p));
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}
