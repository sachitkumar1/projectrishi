import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { allowedEventScopes, canManageEvent, canTargetMembers, targetableGroups } from "@/lib/lms/permissions";
import { createEvent, listEventsForMember } from "@/lib/lms/store";
import { notifyEventCreated } from "@/lib/lms/notify";
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

  if (!allowedEventScopes(me).includes(scopeKind))
    return NextResponse.json({ error: "You can't create that kind of event." }, { status: 403 });

  const scopeGroups = (body.scopeGroups ?? []) as ProjectGroup[];
  if (scopeKind === "group") {
    const allowed = targetableGroups(me);
    if (scopeGroups.length === 0 || scopeGroups.some((g) => !allowed.includes(g)))
      return NextResponse.json({ error: "You can't target those groups." }, { status: 403 });
  }

  const scopeEmails = Array.isArray(body.scopeEmails) ? body.scopeEmails : [];
  if (scopeKind === "members") {
    if (scopeEmails.length === 0)
      return NextResponse.json({ error: "Pick at least one member." }, { status: 400 });
    if (!canTargetMembers(me, scopeEmails))
      return NextResponse.json(
        { error: "You can only create events for members of your own project group." },
        { status: 403 }
      );
  }

  // Optional end time; ignored for all-day single-day events but kept if provided.
  const allDay = Boolean(body.allDay);
  const endAt = body.endAt ? body.endAt : null;

  const event = await createEvent(
    {
      title,
      description: (body.description ?? "").trim(),
      startAt: body.startAt,
      endAt,
      allDay,
      scopeKind,
      scopeEmails,
      scopeGroups,
    },
    me.email
  );

  await notifyEventCreated(event).catch(() => {});

  return NextResponse.json({ event }, { status: 201 });
}
