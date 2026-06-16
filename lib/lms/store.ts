// ============================================================================
//  LMS — data store
// ----------------------------------------------------------------------------
//  All task/event reads + writes go through here. If Supabase env vars are
//  set, it uses your real database. If not, it falls back to an in-memory
//  store seeded with sample data — handy for previewing the UI locally before
//  the database is wired up. (In-memory data is NOT shared between people and
//  resets when the server restarts; Supabase is the real, shared store.)
// ============================================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Member } from "@/lib/members";
import type {
  ClubEvent,
  NewEventInput,
  NewTaskInput,
  Task,
  TaskStatus,
} from "@/lib/lms/types";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const usingSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

let _client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

const now = () => new Date().toISOString();
const eq = (a?: string | null, b?: string | null) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

// ----------------------------------------------------------------- row mapping
/* eslint-disable @typescript-eslint/no-explicit-any */
const taskFromRow = (r: any): Task => ({
  id: r.id,
  title: r.title,
  description: r.description ?? "",
  tags: r.tags ?? [],
  dueAt: r.due_at,
  requiresFile: r.requires_file ?? false,
  assignerEmail: r.assigner_email,
  assigneeEmail: r.assignee_email,
  status: r.status as TaskStatus,
  submittedAt: r.submitted_at ?? null,
  createdAt: r.created_at,
});

const eventFromRow = (r: any): ClubEvent => ({
  id: r.id,
  title: r.title,
  description: r.description ?? "",
  startAt: r.start_at,
  endAt: r.end_at ?? null,
  creatorEmail: r.creator_email,
  scopeKind: r.scope_kind,
  scopeEmails: r.scope_emails ?? [],
  scopeGroups: r.scope_groups ?? [],
  createdAt: r.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

// Visibility: is this event relevant to the given member?
function eventVisibleTo(e: ClubEvent, m: Member): boolean {
  if (eq(e.creatorEmail, m.email)) return true;
  switch (e.scopeKind) {
    case "club":
      return true;
    case "group":
      return e.scopeGroups.includes(m.group);
    case "members":
      return e.scopeEmails.some((x) => eq(x, m.email));
    case "all_newbies":
      return m.roles.newbie;
    default:
      return false;
  }
}

// ============================================================================
//  IN-MEMORY FALLBACK (seed data)
// ============================================================================
const seedTasks: Task[] = [
  {
    id: "seed-t1",
    title: "Draft Fall recruitment flyer",
    description: "Design the flyer for our Fall info session and share a draft.",
    tags: ["recruitment", "design"],
    dueAt: new Date(Date.now() + 3 * 864e5).toISOString(),
    requiresFile: false,
    assignerEmail: "sachitk@berkeley.edu",
    assigneeEmail: "palakprabhakar1@berkeley.edu",
    status: "not_complete",
    submittedAt: null,
    createdAt: now(),
  },
  {
    id: "seed-t2",
    title: "Confirm village contact for water testing",
    description: "Reach out to Naresh Ji and confirm the testing schedule.",
    tags: ["watsan", "logistics"],
    dueAt: new Date(Date.now() - 1 * 864e5).toISOString(),
    requiresFile: false,
    assignerEmail: "sachitk@berkeley.edu",
    assigneeEmail: "palakprabhakar1@berkeley.edu",
    status: "pending",
    submittedAt: now(), // submitted late → timestamp will show red
    createdAt: now(),
  },
  {
    id: "seed-t3",
    title: "Prepare slides for GM",
    description: "Self-assigned: put together the general meeting deck.",
    tags: ["meeting"],
    dueAt: new Date(Date.now() + 5 * 864e5).toISOString(),
    requiresFile: false,
    assignerEmail: "sachitk@berkeley.edu",
    assigneeEmail: "sachitk@berkeley.edu",
    status: "complete",
    submittedAt: now(),
    createdAt: now(),
  },
];

const seedEvents: ClubEvent[] = [
  {
    id: "seed-e1",
    title: "All-club General Meeting",
    description: "Monthly GM — everyone attends.",
    startAt: new Date(Date.now() + 2 * 864e5).toISOString(),
    endAt: null,
    creatorEmail: "sachitk@berkeley.edu",
    scopeKind: "club",
    scopeEmails: [],
    scopeGroups: [],
    createdAt: now(),
  },
  {
    id: "seed-e2",
    title: "Women's Empowerment sync",
    description: "Project-group check-in.",
    startAt: new Date(Date.now() + 4 * 864e5).toISOString(),
    endAt: null,
    creatorEmail: "palakprabhakar1@berkeley.edu",
    scopeKind: "group",
    scopeEmails: [],
    scopeGroups: ["W"],
    createdAt: now(),
  },
];

const mem = { tasks: [...seedTasks], events: [...seedEvents] };
const uid = () => Math.random().toString(36).slice(2, 10);

// ============================================================================
//  PUBLIC API  (same signatures regardless of backend)
// ============================================================================

export async function listTasksForMember(email: string): Promise<Task[]> {
  if (usingSupabase) {
    const { data, error } = await sb()
      .from("lms_tasks")
      .select("*")
      .or(`assignee_email.eq.${email},assigner_email.eq.${email}`)
      .order("due_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(taskFromRow);
  }
  return mem.tasks
    .filter((t) => eq(t.assigneeEmail, email) || eq(t.assignerEmail, email))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

export async function createTasks(
  input: NewTaskInput,
  assignerEmail: string
): Promise<Task[]> {
  const base = {
    title: input.title,
    description: input.description,
    tags: input.tags,
    due_at: input.dueAt,
    requires_file: input.requiresFile,
    assigner_email: assignerEmail,
  };
  if (usingSupabase) {
    const rows = input.assigneeEmails.map((assignee) => ({
      ...base,
      assignee_email: assignee,
      // self-assigned tasks are immediately complete once created+submitted;
      // here they start not_complete and the assignee can one-click complete.
      status: "not_complete",
    }));
    const { data, error } = await sb().from("lms_tasks").insert(rows).select("*");
    if (error) throw new Error(error.message);
    return (data ?? []).map(taskFromRow);
  }
  const created = input.assigneeEmails.map((assignee) => ({
    id: uid(),
    title: input.title,
    description: input.description,
    tags: input.tags,
    dueAt: input.dueAt,
    requiresFile: input.requiresFile,
    assignerEmail,
    assigneeEmail: assignee,
    status: "not_complete" as TaskStatus,
    submittedAt: null,
    createdAt: now(),
  }));
  mem.tasks.push(...created);
  return created;
}

export async function getTask(id: string): Promise<Task | null> {
  if (usingSupabase) {
    const { data, error } = await sb().from("lms_tasks").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? taskFromRow(data) : null;
  }
  return mem.tasks.find((t) => t.id === id) ?? null;
}

/** Assignee marks the task done. Self-assigned → completes immediately. */
export async function submitTask(task: Task): Promise<Task> {
  const selfAssigned = eq(task.assignerEmail, task.assigneeEmail);
  const status: TaskStatus = selfAssigned ? "complete" : "pending";
  const submittedAt = now();
  if (usingSupabase) {
    const { data, error } = await sb()
      .from("lms_tasks")
      .update({ status, submitted_at: submittedAt })
      .eq("id", task.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return taskFromRow(data);
  }
  const t = mem.tasks.find((x) => x.id === task.id)!;
  t.status = status;
  t.submittedAt = submittedAt;
  return t;
}

/** Assigner gives final approval. */
export async function approveTask(task: Task): Promise<Task> {
  if (usingSupabase) {
    const { data, error } = await sb()
      .from("lms_tasks")
      .update({ status: "complete" })
      .eq("id", task.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return taskFromRow(data);
  }
  const t = mem.tasks.find((x) => x.id === task.id)!;
  t.status = "complete";
  return t;
}

export type TaskEdit = {
  title: string;
  description: string;
  tags: string[];
  dueAt: string;
  requiresFile: boolean;
  assigneeEmail: string;
};

export async function updateTask(id: string, fields: TaskEdit): Promise<Task> {
  if (usingSupabase) {
    const { data, error } = await sb()
      .from("lms_tasks")
      .update({
        title: fields.title,
        description: fields.description,
        tags: fields.tags,
        due_at: fields.dueAt,
        requires_file: fields.requiresFile,
        assignee_email: fields.assigneeEmail,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return taskFromRow(data);
  }
  const t = mem.tasks.find((x) => x.id === id)!;
  Object.assign(t, {
    title: fields.title,
    description: fields.description,
    tags: fields.tags,
    dueAt: fields.dueAt,
    requiresFile: fields.requiresFile,
    assigneeEmail: fields.assigneeEmail,
  });
  return t;
}

export async function deleteTask(id: string): Promise<void> {
  if (usingSupabase) {
    const { error } = await sb().from("lms_tasks").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  mem.tasks = mem.tasks.filter((t) => t.id !== id);
}

export async function listEventsForMember(member: Member): Promise<ClubEvent[]> {
  let all: ClubEvent[];
  if (usingSupabase) {
    const { data, error } = await sb()
      .from("lms_events")
      .select("*")
      .order("start_at", { ascending: true });
    if (error) throw new Error(error.message);
    all = (data ?? []).map(eventFromRow);
  } else {
    all = [...mem.events].sort((a, b) => a.startAt.localeCompare(b.startAt));
  }
  return all.filter((e) => eventVisibleTo(e, member));
}

export async function createEvent(
  input: NewEventInput,
  creatorEmail: string
): Promise<ClubEvent> {
  if (usingSupabase) {
    const { data, error } = await sb()
      .from("lms_events")
      .insert({
        title: input.title,
        description: input.description,
        start_at: input.startAt,
        end_at: input.endAt,
        creator_email: creatorEmail,
        scope_kind: input.scopeKind,
        scope_emails: input.scopeEmails,
        scope_groups: input.scopeGroups,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return eventFromRow(data);
  }
  const e: ClubEvent = {
    id: uid(),
    title: input.title,
    description: input.description,
    startAt: input.startAt,
    endAt: input.endAt,
    creatorEmail,
    scopeKind: input.scopeKind,
    scopeEmails: input.scopeEmails,
    scopeGroups: input.scopeGroups,
    createdAt: now(),
  };
  mem.events.push(e);
  return e;
}

export type EventEdit = {
  title: string;
  description: string;
  startAt: string;
  endAt: string | null;
  scopeKind: ClubEvent["scopeKind"];
  scopeEmails: string[];
  scopeGroups: ClubEvent["scopeGroups"];
};

export async function updateEvent(id: string, fields: EventEdit): Promise<ClubEvent> {
  if (usingSupabase) {
    const { data, error } = await sb()
      .from("lms_events")
      .update({
        title: fields.title,
        description: fields.description,
        start_at: fields.startAt,
        end_at: fields.endAt,
        scope_kind: fields.scopeKind,
        scope_emails: fields.scopeEmails,
        scope_groups: fields.scopeGroups,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return eventFromRow(data);
  }
  const e = mem.events.find((x) => x.id === id)!;
  Object.assign(e, fields);
  return e;
}

export async function getEvent(id: string): Promise<ClubEvent | null> {
  if (usingSupabase) {
    const { data, error } = await sb().from("lms_events").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? eventFromRow(data) : null;
  }
  return mem.events.find((e) => e.id === id) ?? null;
}

export async function deleteEvent(id: string): Promise<void> {
  if (usingSupabase) {
    const { error } = await sb().from("lms_events").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  mem.events = mem.events.filter((e) => e.id !== id);
}
