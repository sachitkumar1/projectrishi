"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import Reveal from "@/components/Reveal";
import Contours from "@/components/Contours";
import {
  LINEAGES,
  orderLineagesFor,
  treeContains,
  type LineageNode,
} from "@/lib/lineage";

function TreeNode({
  node,
  userName,
}: {
  node: LineageNode;
  userName: string;
}) {
  const isUser = !!userName && node.name === userName;
  const kids = node.children ?? [];

  return (
    <li className="relative">
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
          isUser
            ? "bg-marigold font-semibold text-pine-deep ring-2 ring-marigold-deep ring-offset-2 ring-offset-paper"
            : "border border-pine/15 bg-paper text-ink/80"
        }`}
      >
        {node.name}
        {isUser && (
          <span className="rounded-full bg-pine-deep px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-paper">
            You
          </span>
        )}
      </span>

      {kids.length > 0 && (
        <ul className="ml-4 mt-2 space-y-2 border-l border-pine/15 pl-5">
          {kids.map((child, i) => (
            <TreeNode key={`${child.name}-${i}`} node={child} userName={userName} />
          ))}
        </ul>
      )}
    </li>
  );
}

function LineageCard({
  tree,
  userName,
  isMine,
}: {
  tree: LineageNode;
  userName: string;
  isMine: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-6 sm:p-8 ${
        isMine
          ? "border-marigold/50 bg-marigold/[0.06]"
          : "border-pine/12 bg-paper"
      }`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-sage">
            <span className="h-1.5 w-1.5 rounded-full bg-pine" />
            Lineage Head
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold text-pine-deep">
            {tree.name}
          </h3>
        </div>
        {isMine && (
          <span className="shrink-0 rounded-full bg-marigold px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-pine-deep">
            Your lineage
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <ul className="min-w-max space-y-2">
          <TreeNode node={tree} userName={userName} />
        </ul>
      </div>
    </div>
  );
}

export default function LineagePage() {
  const { data: session } = useSession();
  const userName =
    session?.user?.firstName && session?.user?.lastName
      ? `${session.user.firstName} ${session.user.lastName}`
      : "";

  const ordered = orderLineagesFor(userName);

  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden bg-pine-deep pt-[var(--header-h)] text-paper">
        <Contours className="absolute inset-0 h-full w-full text-paper" opacity={0.1} />
        <div className="container-rishi relative z-10 py-14">
          <Reveal>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-paper/70 transition-colors hover:text-paper"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
              Back to dashboard
            </Link>
            <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
              RISHI Lineage
            </h1>
            <p className="mt-3 max-w-2xl text-paper/75">
              The historic family trees of bigs and littles. Each head sits at
              the top, with their littles branching below.
              {userName && " Your own lineage is shown first, with your name highlighted."}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Trees */}
      <section className="container-rishi space-y-6 py-14">
        {ordered.map((tree, i) => {
          const isMine = !!userName && treeContains(tree, userName);
          return (
            <Reveal key={tree.name} delay={i === 0 ? 0 : 0.05}>
              <LineageCard tree={tree} userName={userName} isMine={isMine} />
            </Reveal>
          );
        })}

        {LINEAGES.length === 0 && (
          <p className="text-center text-ink/60">No lineages have been added yet.</p>
        )}
      </section>
    </>
  );
}
