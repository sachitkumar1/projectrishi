// ============================================================================
//  LMS — shared types
// ============================================================================

export type ProjectGroup = "E" | "R" | "W" | "H";

export const PROJECT_GROUPS: ProjectGroup[] = ["E", "R", "W", "H"];

export const PROJECT_GROUP_LABELS: Record<ProjectGroup, string> = {
  E: "Education",
  R: "Water & Sanitation",
  W: "Women's Empowerment",
  H: "Health",
};

export type RoleFlags = {
  nmtLeader: boolean; // New Member Training leader
  newbie: boolean;
  lead: boolean; // head of a project group
  internal: boolean;
  vpp: boolean; // VP / President
  exec: boolean;
};

export type MemberProfile = {
  email: string;
  firstName: string;
  lastName: string;
  group: ProjectGroup;
  roles: RoleFlags;
};

// ---- Tasks ----
export type TaskStatus = "not_complete" | "pending" | "complete";

export type Task = {
  id: string;
  groupId: string; // shared by all copies created in one "assign to multiple people" action
  title: string;
  description: string;
  tags: string[];
  dueAt: string; // ISO datetime
  requiresFile: boolean; // upload deferred — flag kept for the future
  assignerEmail: string;
  assigneeEmail: string;
  status: TaskStatus;
  submittedAt: string | null; // when the assignee marked it done
  archived: boolean;
  createdAt: string;
};

export type NewTaskInput = {
  title: string;
  description: string;
  tags: string[];
  dueAt: string;
  requiresFile: boolean;
  assigneeEmails: string[]; // one task row is created per assignee
};

// ---- Events ----
export type EventScopeKind = "members" | "group" | "club" | "all_newbies";

export type ClubEvent = {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string | null;
  creatorEmail: string;
  scopeKind: EventScopeKind;
  scopeEmails: string[]; // when scopeKind === "members"
  scopeGroups: ProjectGroup[]; // when scopeKind === "group"
  archived: boolean;
  createdAt: string;
};

export type NewEventInput = {
  title: string;
  description: string;
  startAt: string;
  endAt: string | null;
  scopeKind: EventScopeKind;
  scopeEmails: string[];
  scopeGroups: ProjectGroup[];
};
