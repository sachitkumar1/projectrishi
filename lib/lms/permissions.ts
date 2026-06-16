// ============================================================================
//  LMS — permission engine
// ----------------------------------------------------------------------------
//  Pure functions that encode the rules from the spec. These are used on the
//  SERVER (in the API routes) to enforce who can do what, and on the client to
//  decide which buttons/options to show. Server enforcement is the source of
//  truth — the UI is just a convenience.
// ============================================================================

import { MEMBERS, findMember, type Member } from "@/lib/members";
import type { ClubEvent, EventScopeKind, ProjectGroup, Task } from "@/lib/lms/types";

const eq = (a?: string | null, b?: string | null) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

// ---------------------------------------------------------------- task assign
/** Can this member assign tasks to anyone at all? */
export function canAssignTasks(m: Member): boolean {
  return m.roles.lead || m.roles.nmtLeader || m.roles.vpp;
}

/** Can `assigner` assign a task to `assignee`? */
export function canAssignTaskTo(assigner: Member, assignee: Member): boolean {
  if (assigner.roles.vpp) return true; // VP/P → anyone in the club
  if (assigner.roles.lead && assignee.group === assigner.group) return true; // Lead → own group (incl. self)
  if (assigner.roles.nmtLeader && assignee.roles.newbie) return true; // NMT leader → newbies
  return false;
}

/** Every member this person is allowed to assign tasks to. */
export function assignableMembers(assigner: Member): Member[] {
  return MEMBERS.filter((m) => canAssignTaskTo(assigner, m));
}

// -------------------------------------------------------------- task complete
/** The assignee marks their task done → moves it to "pending" (awaiting approval). */
export function canSubmitTask(task: Task, actorEmail: string): boolean {
  return eq(task.assigneeEmail, actorEmail);
}

/** The assigner gives final approval → moves it to "complete". */
export function canApproveTask(task: Task, actorEmail: string): boolean {
  return eq(task.assignerEmail, actorEmail);
}

// --------------------------------------------------------------- event create
/** Can this member create events at all? */
export function canCreateEvents(m: Member): boolean {
  return m.roles.nmtLeader || m.roles.lead || m.roles.internal || m.roles.vpp;
}

/** Which audience options this member may pick from when creating an event. */
export function allowedEventScopes(m: Member): EventScopeKind[] {
  const s = new Set<EventScopeKind>();
  if (m.roles.nmtLeader) {
    s.add("members");
    s.add("all_newbies");
  }
  if (m.roles.lead) {
    s.add("members");
    s.add("group"); // their own project group
  }
  if (m.roles.internal || m.roles.vpp) {
    s.add("members");
    s.add("group");
    s.add("club");
  }
  return Array.from(s);
}

/**
 * For a Lead/NMT leader, an event can only target their own people. This
 * returns the set of project groups a member is allowed to target with a
 * "group"-scoped event. VP/P and Internal may target any group.
 */
export function targetableGroups(m: Member): ProjectGroup[] {
  if (m.roles.internal || m.roles.vpp) return ["E", "R", "W", "H"];
  if (m.roles.lead) return [m.group];
  return [];
}

/**
 * Which individual members this person may pick when creating a
 * "specific members" event.
 *   - Internal / VP/P → anyone in the club.
 *   - Lead           → only members of their OWN project group.
 *   - NMT leader     → newbies (NMT events target new members).
 * Roles stack (e.g. a Lead who is also an NMT leader gets both sets).
 */
export function targetableMembers(m: Member): Member[] {
  if (m.roles.internal || m.roles.vpp) return MEMBERS;
  const picked = new Map<string, Member>();
  if (m.roles.lead) {
    MEMBERS.filter((x) => x.group === m.group).forEach((x) => picked.set(x.email, x));
  }
  if (m.roles.nmtLeader) {
    MEMBERS.filter((x) => x.roles.newbie).forEach((x) => picked.set(x.email, x));
  }
  return Array.from(picked.values());
}

/** Server-side check: may this member target exactly these emails with a "members" event? */
export function canTargetMembers(m: Member, emails: string[]): boolean {
  const allowed = new Set(targetableMembers(m).map((x) => x.email.toLowerCase()));
  return emails.every((e) => allowed.has(e.trim().toLowerCase()));
}

// ----------------------------------------------------------- edit / delete
//  Who may edit or delete an existing task/event.
//   - The person who CREATED it (assigner of a task / creator of an event).
//   - A Lead, for OTHER people in their own project group (oversight).
//  No blanket VP/P override: a VP/P (or Lead) can still be assigned things by
//  their own group's lead, and must not be able to edit/delete those.

/** Can `actor` edit or delete this task? */
export function canManageTask(actor: Member, task: Task): boolean {
  if (eq(actor.email, task.assignerEmail)) return true; // creator
  if (actor.roles.lead) {
    const assignee = findMember(task.assigneeEmail);
    if (
      assignee &&
      assignee.group === actor.group &&
      !eq(assignee.email, actor.email) // not a task assigned TO the lead
    ) {
      return true;
    }
  }
  return false;
}

/** Can `actor` edit or delete this event? */
export function canManageEvent(actor: Member, event: ClubEvent): boolean {
  if (eq(actor.email, event.creatorEmail)) return true; // creator
  if (
    actor.roles.lead &&
    event.scopeKind === "group" &&
    event.scopeGroups.includes(actor.group) &&
    !eq(actor.email, event.creatorEmail)
  ) {
    return true; // lead overseeing a group-scoped event for their group
  }
  return false;
}
