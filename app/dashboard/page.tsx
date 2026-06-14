"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Reveal from "@/components/Reveal";
import Contours from "@/components/Contours";

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.firstName || "Member";

  return (
    <>
      {/* Welcome hero */}
      <section className="relative overflow-hidden bg-pine pt-[var(--header-h)] text-paper">
        <Contours className="absolute inset-0 h-full w-full text-paper" opacity={0.12} />
        <div className="container-rishi relative z-10 py-16 lg:py-20">
          <Reveal>
            <span className="eyebrow text-marigold-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-marigold" />
              Member Dashboard
            </span>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] sm:text-6xl">
              Welcome, {firstName}
            </h1>
            <p className="mt-5 max-w-xl text-paper/80">
              Your space for everything Project RISHI. More tools are on the way —
              for now, explore the chapter&rsquo;s lineage below.
            </p>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-7 rounded-full border border-paper/30 px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-paper hover:text-pine-deep"
            >
              Sign out
            </button>
          </Reveal>
        </div>
      </section>

      {/* Dashboard tiles */}
      <section className="container-rishi py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Lineage card */}
          <Reveal>
            <Link
              href="/dashboard/lineage"
              className="group flex h-full flex-col justify-between rounded-3xl border border-pine/15 bg-pine/[0.03] p-8 transition-colors hover:border-pine hover:bg-pine hover:text-paper"
            >
              <div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-marigold text-pine-deep">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="5" r="2.5" />
                    <circle cx="5" cy="19" r="2.5" />
                    <circle cx="19" cy="19" r="2.5" />
                    <path d="M12 7.5v4m0 0H5.5a1 1 0 0 0-1 1v3.5m7.5-4.5H18.5a1 1 0 0 1 1 1v3.5" />
                  </svg>
                </span>
                <h2 className="mt-5 font-display text-2xl font-semibold">
                  RISHI Lineage
                </h2>
                <p className="mt-2 max-w-sm text-sm opacity-80">
                  View the historic family trees of bigs and littles — your own
                  lineage shown first.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                View lineages
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
          </Reveal>

          {/* Placeholder for future tools */}
          <Reveal delay={0.1}>
            <div className="flex h-full flex-col justify-center rounded-3xl border border-dashed border-pine/25 bg-pine/[0.02] p-8 text-center">
              <p className="font-display text-lg font-semibold text-pine-deep">
                More coming soon
              </p>
              <p className="mx-auto mt-2 max-w-xs text-sm text-ink/55">
                Tasks, calendar, meeting notes, and announcements will live here.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
