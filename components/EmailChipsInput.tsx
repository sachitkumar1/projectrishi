"use client";

import { useState } from "react";

const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

/**
 * Tag-style email input. Type an address and press Space (or Enter / comma) to
 * turn it into a bubble. Hover a bubble for an ✕ to remove it. With the input
 * empty, one Backspace pulls the last bubble back in to edit it; a second
 * Backspace (before editing) deletes it. Invalid addresses show in red.
 */
export default function EmailChipsInput({
  value,
  onChange,
  placeholder = "Type an email and press space…",
}: {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [pulled, setPulled] = useState<string | null>(null);

  function commit(raw: string) {
    const t = raw.trim().replace(/[,;]+$/, "").trim();
    if (t && !value.includes(t)) onChange([...value, t]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === " " || e.key === "Enter" || e.key === ",") && text.trim()) {
      e.preventDefault();
      commit(text);
      setText("");
      setPulled(null);
    } else if (e.key === "Backspace") {
      if (text === "" && value.length > 0) {
        e.preventDefault();
        const last = value[value.length - 1];
        onChange(value.slice(0, -1));
        setText(last);
        setPulled(last); // single backspace → editing the last bubble
      } else if (pulled !== null && text === pulled) {
        e.preventDefault();
        setText(""); // second backspace (untouched) → delete it
        setPulled(null);
      }
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const parts = e.clipboardData.getData("text").split(/[\s,;]+/).filter(Boolean);
    if (parts.length > 1) {
      e.preventDefault();
      const next = [...value];
      parts.forEach((p) => { const t = p.trim(); if (t && !next.includes(t)) next.push(t); });
      onChange(next);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-ink/15 px-2 py-1.5">
      {value.map((email, i) => (
        <span
          key={`${email}-${i}`}
          className={`group inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
            isEmail(email) ? "bg-pine/10 text-pine-deep" : "bg-red-50 text-red-600"
          }`}
        >
          {email}
          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="ml-0.5 hidden h-3.5 w-3.5 place-items-center rounded-full text-current/60 hover:text-current group-hover:grid"
            aria-label={`Remove ${email}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-2.5 w-2.5"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => { setText(e.target.value); if (pulled !== null && e.target.value !== pulled) setPulled(null); }}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onBlur={() => { if (text.trim()) { commit(text); setText(""); setPulled(null); } }}
        placeholder={value.length === 0 ? placeholder : ""}
        className="min-w-[10rem] flex-1 bg-transparent px-1 py-1 text-sm text-ink placeholder:text-ink/40 focus:outline-none"
      />
    </div>
  );
}
