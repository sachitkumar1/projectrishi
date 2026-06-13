import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Contours from "@/components/Contours";
import { ORG } from "@/lib/content";

export const metadata: Metadata = {
  title: "Donate",
  description: "Support Project RISHI's work in Bharog Baneri.",
};

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

          {/* TODO: replace this with your real donation embed/processor
              (e.g. a Givebutter / PayPal / university fund link). */}
          <div className="mx-auto mt-10 max-w-md rounded-3xl border border-dashed border-paper/30 bg-paper/[0.04] p-8">
            <p className="font-display text-xl font-semibold text-paper">
              Donation link goes here
            </p>
            <p className="mt-2 text-sm text-paper/60">
              Connect your processor in the code, then this becomes your
              &ldquo;Donate&rdquo; button.
            </p>
            <a href={`mailto:${ORG.email}`} className="btn-accent mt-6">
              Ask about giving
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
