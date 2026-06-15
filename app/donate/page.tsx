import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Contours from "@/components/Contours";
import { ORG } from "@/lib/content";

export const metadata: Metadata = {
  title: "Donate",
  description: "Support Project RISHI's work in Bharog Baneri.",
};

const VENMO_URL = "https://venmo.com/u/projectrishical";
const VENMO_HANDLE = "@projectrishical";

export default function DonatePage() {
  return (
    <section className="relative overflow-hidden bg-pine pt-[var(--header-h)] text-paper">
      <Contours className="absolute inset-0 h-full w-full text-paper" opacity={0.1} />
      <div className="container-rishi relative z-10 grid min-h-[70vh] place-items-center py-20 text-center">
        <Reveal className="max-w-2xl">
          <span className="eyebrow text-marigold-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-marigold" />
            Support our work
          </span>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] sm:text-6xl">
            Every gift reaches the village.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-paper/80">
            We appreciate donations of all sizes — they keep us running as an
            organization and directly support our projects in Bharog Baneri.
          </p>
        </Reveal>

        {/* Venmo donation block */}
        <Reveal delay={0.12} className="mt-12 w-full max-w-3xl">
          <div className="grid gap-5 text-left sm:grid-cols-[1.15fr_0.85fr]">
            {/* CTA card */}
            <div className="flex flex-col rounded-3xl border border-paper/15 bg-paper/[0.06] p-8">
              <p className="font-display text-2xl font-semibold text-paper">
                Donate with Venmo
              </p>
              <p className="mt-2 text-sm leading-relaxed text-paper/70">
                The fastest way to give. Send any amount in a few taps — it goes
                straight to supporting our work on the ground.
              </p>

              <a
                href={VENMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white shadow-sm transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                style={{ backgroundColor: "#008CFF" }}
              >
                Donate via Venmo
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </a>

              <div className="mt-5 flex items-center gap-2 text-sm">
                <span className="text-paper/55">Our handle:</span>
                <span className="font-display text-base font-semibold text-marigold-soft">
                  {VENMO_HANDLE}
                </span>
              </div>
            </div>

            {/* QR card */}
            <div className="flex flex-col items-center justify-center rounded-3xl bg-paper p-6 text-center text-ink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/venmo-qr.svg"
                alt={`QR code to donate to Project RISHI on Venmo (${VENMO_HANDLE})`}
                width={168}
                height={168}
                className="h-40 w-40 rounded-xl"
              />
              <p className="mt-3 text-sm font-semibold text-ink/80">Scan to donate</p>
              <p className="text-xs text-ink/50">Point your phone camera here</p>
            </div>
          </div>

          {/* Secondary option */}
          <p className="mt-8 text-center text-sm text-paper/60">
            Prefer another way to give, or giving on behalf of an organization?{" "}
            <a
              href={`mailto:${ORG.email}`}
              className="font-medium text-paper underline decoration-marigold/60 underline-offset-4 hover:text-marigold-soft"
            >
              Reach out about other options
            </a>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}
