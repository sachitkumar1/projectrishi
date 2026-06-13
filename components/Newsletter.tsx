"use client";

import { useState } from "react";
import { LINKS } from "@/lib/content";

/**
 * Newsletter — email capture for the semesterly newsletter.
 * Until LINKS.newsletterAction is set, this just confirms locally.
 * To wire it up, point newsletterAction at a Google Form / Mailchimp /
 * your own API endpoint and submit `email` to it.
 */
export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // TODO: send `email` to LINKS.newsletterAction here.
    setDone(true);
  };

  return (
    <div>
      <p className="font-display text-xl font-semibold text-paper">
        Sign up for our newsletter
      </p>
      <p className="mt-1 text-sm text-paper/60">
        The Director of Outreach&rsquo;s semesterly update, in your inbox.
      </p>

      {done ? (
        <p className="mt-4 rounded-xl bg-marigold/15 px-4 py-3 text-sm text-marigold-soft">
          Thanks for subscribing — we&rsquo;ll be in touch.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@berkeley.edu"
            className="min-w-0 flex-1 rounded-full border border-paper/20 bg-paper/5 px-4 py-2.5 text-sm text-paper placeholder:text-paper/40 focus:border-marigold focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-marigold px-5 py-2.5 text-sm font-semibold text-pine-deep transition-colors hover:bg-marigold-deep hover:text-paper"
          >
            Submit
          </button>
        </form>
      )}
    </div>
  );
}
