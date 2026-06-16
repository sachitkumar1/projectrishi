import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/lms/currentUser";
import { allowedEventScopes, canManageEvent, targetableGroups } from "@/lib/lms/permissions";
import { deleteEvent, getEvent, updateEvent } from "@/lib/lms/store";
import type { ProjectGroup } from "@/lib/lms/types";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const event = await getEvent(params.id);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (!canManageEvent(me, event))
    return NextResponse.json({ error: "You can't edit this event." }, { status: 403 });

  const title = String(body.title ?? "").trim();
  const startAt = String(body.startAt ?? "");
  const scopeKind = body.scopeKind as typeof event.scopeKind;
  if (!title) return NextResponse.json({ error: "A title is required." }, { status: 400 });
  if (!startAt) return NextResponse.json({ error: "A start time is required." }, { status: 400 });

  // Re-validate the audience the same way creation does.
  if (!allowedEventScopes(me).includes(scopeKind))
    return NextResponse.json({ error: "You can't use that audience." }, { status: 403 });
  const scopeGroups = (body.scopeGroups ?? []) as ProjectGroup[];
  if (scopeKind === "group") {
    const allowed = targetableGroups(me);
    if (scopeGroups.length === 0 || scopeGroups.some((g) => !allowed.includes(g)))
      return NextResponse.json({ error: "You can't target those groups." }, { status: 403 });
  }

  const updated = await updateEvent(event.id, {
    title,
    description: String(body.description ?? "").trim(),
    startAt,
    endAt: (body.endAt as string) ?? null,
    scopeKind,
    scopeEmails: Array.isArray(body.scopeEmails) ? (body.scopeEmails as string[]) : [],
    scopeGroups,
  });
  return NextResponse.json({ event: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const event = await getEvent(params.id);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (!canManageEvent(me, event))
    return NextResponse.json({ error: "You can't delete this event." }, { status: 403 });
  await deleteEvent(event.id);
  return NextResponse.json({ ok: true });
}
