import type { Metadata } from "next";
import Media from "@/components/Media";
import Reveal from "@/components/Reveal";
import Contours from "@/components/Contours";
import SectionHeading from "@/components/SectionHeading";
import { ABOUT } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Project RISHI is a student-run non-profit working with the village of Bharog Baneri, Himachal Pradesh.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-pine pt-[var(--header-h)] text-paper">
        <Contours className="absolute inset-0 h-full w-full text-paper" opacity={0.12} />
        <div className="container-rishi relative z-10 py-20 lg:py-28">
          <Reveal>
            <span className="eyebrow text-marigold-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-marigold" />
              About Us
            </span>
            <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[1.02] sm:text-6xl">
              {ABOUT.heading}
            </h1>
          </Reveal>
        </div>
      </section>

      {/* Mission + Methodology */}
      <section className="container-rishi py-20">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <SectionHeading eyebrow="What drives us" title={ABOUT.mission.title} />
            <Reveal delay={0.1}>
              <p className="mt-6 text-lg leading-relaxed text-ink/75">
                {ABOUT.mission.body}
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <div className="rounded-3xl border border-pine/12 bg-pine/[0.03] p-8">
              <p className="eyebrow text-sage">{ABOUT.methodology.title}</p>
              <ol className="mt-5 space-y-3">
                {ABOUT.methodology.steps.map((step, i) => (
                  <li key={step} className="flex items-center gap-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-marigold font-display text-sm font-semibold text-pine-deep">
                      {i + 1}
                    </span>
                    <span className="font-display text-lg font-semibold text-pine-deep">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </section>

      {/* History + Location */}
      <section className="bg-pine-deep py-20 text-paper">
        <div className="container-rishi grid gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="eyebrow text-marigold-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-marigold" />
              {ABOUT.history.title}
            </span>
            <p className="mt-5 text-lg leading-relaxed text-paper/80">
              {ABOUT.history.body}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <span className="eyebrow text-marigold-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-marigold" />
              {ABOUT.location.title}
            </span>
            <p className="mt-5 text-lg leading-relaxed text-paper/80">
              {ABOUT.location.body}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Life at Project RISHI — gallery */}
      <section className="container-rishi py-20">
        <SectionHeading eyebrow="In the field" title="Life at Project RISHI" />
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
          {ABOUT.gallery.map((src, i) => (
            <Reveal
              key={i}
              delay={(i % 3) * 0.08}
              className={i % 5 === 0 ? "md:row-span-2" : ""}
            >
              <Media
                src={src}
                alt={`Project RISHI gallery photo ${i + 1}`}
                label={`Gallery ${i + 1}`}
                className={`w-full ${i % 5 === 0 ? "aspect-[3/4] md:h-full" : "aspect-[4/3]"}`}
                rounded="rounded-2xl"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Our Team */}
      <section className="container-rishi pb-20">
        <SectionHeading eyebrow="The people" title="Our Team" />
        <Reveal delay={0.1}>
          <Media
            src={ABOUT.teamImage}
            alt="The Project RISHI Berkeley team"
            label="Team group photo"
            className="mt-8 aspect-[3/2] w-full"
            rounded="rounded-3xl"
            sizes="100vw"
          />
          <p className="mt-4 text-sm text-ink/50">
            Replace this with your current team photo — or swap in a roster grid
            later from the member dashboard.
          </p>
        </Reveal>
      </section>

      {/* Chapters around the country */}
      <section className="bg-marigold/10 py-20">
        <div className="container-rishi">
          <SectionHeading eyebrow="A national network" title="Chapters around the country" />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ABOUT.chapters.map((c, i) => (
              <Reveal key={c.name} delay={(i % 4) * 0.05}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-xl border border-pine/12 bg-paper px-4 py-3.5 transition-colors hover:border-pine hover:bg-pine hover:text-paper"
                >
                  <span className="text-sm font-medium">{c.name}</span>
                  <svg
                    className="h-4 w-4 opacity-40 transition-opacity group-hover:opacity-100"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
