import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { allowedEventScopes, canManageEvent, targetableGroups } from "@/lib/lms/permissions";
import { createEvent, listEventsForMember } from "@/lib/lms/store";
import type { NewEventInput, ProjectGroup } from "@/lib/lms/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const events = await listEventsForMember(me);
  const withFlags = events.map((e) => ({ ...e, canManage: canManageEvent(me, e) }));
  return NextResponse.json({ events: withFlags });
}

export async function POST(req: Request) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  let body: Partial<NewEventInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const scopeKind = body.scopeKind;
  if (!title) return NextResponse.json({ error: "A title is required." }, { status: 400 });
  if (!body.startAt) return NextResponse.json({ error: "A start time is required." }, { status: 400 });
  if (!scopeKind) return NextResponse.json({ error: "Pick an audience." }, { status: 400 });

  // Enforce: the chosen audience must be one this member is allowed to use.
  if (!allowedEventScopes(me).includes(scopeKind))
    return NextResponse.json({ error: "You can't create that kind of event." }, { status: 403 });

  // Enforce: for group-scoped events, only groups they may target.
  const scopeGroups = (body.scopeGroups ?? []) as ProjectGroup[];
  if (scopeKind === "group") {
    const allowed = targetableGroups(me);
    if (scopeGroups.length === 0 || scopeGroups.some((g) => !allowed.includes(g)))
      return NextResponse.json({ error: "You can't target those groups." }, { status: 403 });
  }

  const event = await createEvent(
    {
      title,
      description: (body.description ?? "").trim(),
      startAt: body.startAt,
      endAt: body.endAt ?? null,
      scopeKind,
      scopeEmails: Array.isArray(body.scopeEmails) ? body.scopeEmails : [],
      scopeGroups,
    },
    me.email
  );
  return NextResponse.json({ event }, { status: 201 });
}
