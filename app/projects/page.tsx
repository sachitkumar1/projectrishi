import type { Metadata } from "next";
import Link from "next/link";
import Media from "@/components/Media";
import Reveal from "@/components/Reveal";
import Contours from "@/components/Contours";
import { PROJECTS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description: "The four project teams of Project RISHI at UC Berkeley.",
};

export default function ProjectsIndex() {
  return (
    <>
      <section className="relative overflow-hidden bg-pine pt-[var(--header-h)] text-paper">
        <Contours className="absolute inset-0 h-full w-full text-paper" opacity={0.12} />
        <div className="container-rishi relative z-10 py-20 lg:py-28">
          <Reveal>
            <span className="eyebrow text-marigold-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-marigold" />
              What We Do
            </span>
            <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[1.02] sm:text-6xl">
              Four teams, one village
            </h1>
            <p className="mt-6 max-w-xl text-paper/80">
              Each team focuses on a pillar of sustainable development in Bharog
              Baneri, Himachal Pradesh.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container-rishi py-20">
        <div className="grid gap-6 md:grid-cols-2">
          {PROJECTS.map((p, i) => (
            <Reveal as="article" key={p.slug} delay={i * 0.08}>
              <Link
                href={`/projects/${p.slug}`}
                className="group block overflow-hidden rounded-3xl border border-pine/12 transition-colors hover:border-pine"
              >
                <Media
                  src={p.image}
                  alt={p.name}
                  label={`${p.name} cover`}
                  className="aspect-[16/9] w-full"
                  rounded="rounded-none"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="p-7">
                  <h2 className="font-display text-2xl font-semibold text-pine-deep">
                    {p.name}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-ink/70">{p.intro}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-pine">
                    Explore team
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
