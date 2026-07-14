// ============================================================================
//  Google Sheets sync — mirrors dashboard data into Google Sheets.
// ----------------------------------------------------------------------------
//  Two independent syncs:
//    • syncDirectoryToSheet()  → the member directory (DIRECTORY_SHEET_ID)
//    • syncTasksToSheet()      → every task + submission (TASK_SHEET_ID), split
//                                across "Active Tasks", "Archived Tasks" and
//                                "Submissions" tabs.
//
//  Uses a Google service account (no user OAuth): the server signs a JWT with
//  the service account's private key, exchanges it for an access token, and
//  overwrites the sheet. Entirely best-effort — if the service-account env vars
//  aren't set, everything no-ops and nothing else breaks.
//
//  Setup (one time):
//   1. Google Cloud Console → same project → APIs & Services → Enable
//      "Google Sheets API".
//   2. IAM & Admin → Service Accounts → Create service account → create a JSON
//      key and download it.
//   3. Open EACH target Google Sheet → Share → add the service account's email
//      (client_email) as an Editor.
//   4. Set env vars (Vercel):
//        GOOGLE_SA_EMAIL        = the service account's client_email
//        GOOGLE_SA_PRIVATE_KEY  = the service account's private_key (PEM)
//        DIRECTORY_SHEET_ID     = the directory sheet ID (optional; default below)
//        TASK_SHEET_ID          = the task sheet ID      (optional; default below)
//        SHEETS_SYNC_MODE       = "realtime" (default) or "cron"
//      Redeploy.
//
//  SHEETS_SYNC_MODE controls the TASK sync only:
//    realtime — every task action pushes to the sheet immediately (~½s added to
//               the action; the hourly cron still runs as a safety net).
//    cron     — task actions don't touch the sheet; the hourly cron does it all.
// ============================================================================

import crypto from "crypto";
import { listDirectory } from "@/lib/lms/directory";
import { listAllTasks } from "@/lib/lms/store";
import { findMember, memberFullName } from "@/lib/members";
import type { Task } from "@/lib/lms/types";

const DEFAULT_DIRECTORY_SHEET_ID = "1Ez251GH36MZ3Wq45BqkIe5h3HYzge2xpXInhUZiQRBo";
const DEFAULT_TASK_SHEET_ID = "1hW24j9Iag3BJMxne7T8H4jMzGJoa8NQNTWcWmaOigOE";

const directorySheetId = () => process.env.DIRECTORY_SHEET_ID || DEFAULT_DIRECTORY_SHEET_ID;
const taskSheetId = () => process.env.TASK_SHEET_ID || DEFAULT_TASK_SHEET_ID;

/** Should a task action push to the sheet immediately? */
export function taskSyncIsRealtime(): boolean {
  return (process.env.SHEETS_SYNC_MODE || "realtime").toLowerCase() !== "cron";
}

const TAB_ACTIVE = "Active Tasks";
const TAB_ARCHIVED = "Archived Tasks";
const TAB_SUBMISSIONS = "Submissions";

const b64url = (buf: Buffer | string) =>
  (Buffer.isBuffer(buf) ? buf : Buffer.from(buf)).toString("base64url");

// ---------------------------------------------------------------- auth token
// Access tokens last an hour, so cache it in the module — this removes a full
// round-trip from every sync and keeps real-time syncing cheap.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;

  const email = process.env.GOOGLE_SA_EMAIL;
  let key = process.env.GOOGLE_SA_PRIVATE_KEY;
  if (!email || !key) return null; // not configured → no-op
  key = key.replace(/\\n/g, "\n"); // env may store escaped newlines

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  let signature: string;
  try {
    signature = b64url(crypto.sign("RSA-SHA256", Buffer.from(unsigned), key));
  } catch (e) {
    console.error("sheets: failed to sign JWT (check GOOGLE_SA_PRIVATE_KEY)", (e as Error).message);
    return null;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!res.ok) {
    console.error("sheets: token exchange failed", await res.text().catch(() => ""));
    return null;
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + ((data.expires_in ?? 3600) - 120) * 1000, // refresh 2min early
  };
  return cachedToken.token;
}

// --------------------------------------------------------------- sheet utils
type Row = (string | number)[];

/** Create any tabs that don't exist yet (the sheet may only have "Sheet1"). */
async function ensureTabs(token: string, id: string, titles: string[]): Promise<void> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${id}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    console.error("sheets: could not read spreadsheet", await res.text().catch(() => ""));
    return;
  }
  const data = (await res.json()) as { sheets?: { properties?: { title?: string } }[] };
  const existing = new Set((data.sheets ?? []).map((s) => s.properties?.title).filter(Boolean));
  const missing = titles.filter((t) => !existing.has(t));
  if (missing.length === 0) return;

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
    }),
  });
}

/** Overwrite whole tabs in one shot: clear the old block, then write the new. */
async function writeTabs(
  token: string,
  id: string,
  tabs: { title: string; values: Row[]; lastColumn: string }[],
): Promise<void> {
  // 1) Clear every tab's block in a single call.
  const clearRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${id}/values:batchClear`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ranges: tabs.map((t) => `'${t.title}'!A:${t.lastColumn}`) }),
    },
  );
  if (!clearRes.ok) console.error("sheets: clear failed", await clearRes.text().catch(() => ""));

  // 2) Write every tab's fresh data in a single call.
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${id}/values:batchUpdate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        valueInputOption: "RAW",
        data: tabs.map((t) => ({
          range: `'${t.title}'!A1`,
          majorDimension: "ROWS",
          values: t.values,
        })),
      }),
    },
  );
  if (!writeRes.ok) console.error("sheets: write failed", await writeRes.text().catch(() => ""));
}

// ------------------------------------------------------------- directory sync
export async function syncDirectoryToSheet(): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;
  const id = directorySheetId();
  const entries = await listDirectory();
  const values: Row[] = [
    ["Name", "Role", "Project Group", "Email", "Phone"],
    ...entries.map((e) => [e.name, e.role, e.group, e.email, e.phone]),
  ];
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/A:E:clear`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/A1?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ range: "A1", majorDimension: "ROWS", values }),
      },
    );
    if (!res.ok) console.error("sheets: directory write failed", await res.text().catch(() => ""));
  } catch (e) {
    console.error("sheets: directory sync error", (e as Error).message);
  }
}

// ------------------------------------------------------------------ task sync
const nameOf = (email: string) => {
  const m = findMember(email);
  return m ? memberFullName(m) : email;
};
const who = (email: string) => `${nameOf(email)} <${email}>`;

const STATUS_LABEL: Record<string, string> = {
  not_complete: "Not complete",
  pending: "Pending approval",
  complete: "Complete",
};

const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles" }) : "";

/** Strip HTML so an email template reads sensibly in a spreadsheet cell. */
const htmlToText = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const TASK_HEADER: Row = [
  "Task ID", "Group ID", "Title", "Description", "Tags",
  "Date Assigned", "Due Date", "Assigned By", "Assigned To", "All Assignees",
  "Status", "Submitted At", "Submission Text", "Submission Link", "Submission File",
  "Submission Required", "Email Subject", "Email Body", "Submission History", "Last Activity",
];

/** One row per assignee — mirrors the dashboard's row-per-assignee task model. */
function taskRow(t: Task, groupAssignees: string[]): Row {
  const tpl = t.emailTemplate;
  // Every submit/approve/return event for this person, oldest first.
  const submissionEvents = t.history
    .filter((h) => ["submitted", "approved", "rejected", "unmarked"].includes(h.action))
    .map((h) => {
      const label =
        h.action === "submitted" ? "Submitted"
        : h.action === "approved" ? "Approved"
        : h.action === "rejected" ? "Returned"
        : "Unmarked";
      return `${fmtDate(h.at)} — ${label} by ${nameOf(h.actorEmail)}${h.note ? `: ${h.note}` : ""}`;
    })
    .join("\n");
  const last = t.history.length > 0 ? t.history[t.history.length - 1] : null;

  return [
    t.id,
    t.groupId || "",
    t.title,
    t.description || "",
    (t.tags || []).join(", "),
    fmtDate(t.createdAt),
    fmtDate(t.dueAt),
    who(t.assignerEmail),
    who(t.assigneeEmail),
    groupAssignees.map(nameOf).join(", "),
    STATUS_LABEL[t.status] ?? t.status,
    fmtDate(t.submittedAt),
    t.submissionText || "",
    t.submissionLink || "",
    "", // Submission File — reserved for file uploads (populated once implemented)
    t.requireSubmission ? "Yes" : "No",
    tpl?.subject || "",
    tpl?.bodyHtml ? htmlToText(tpl.bodyHtml) : "",
    submissionEvents,
    last ? `${fmtDate(last.at)} — ${last.action} by ${nameOf(last.actorEmail)}` : "",
  ];
}

const SUBMISSION_HEADER: Row = [
  "When", "Task ID", "Task Title", "Person", "Event",
  "By", "Note", "Submission Text", "Submission Link", "Submission File",
];

/** One row per submission-related event, across every task — the full history. */
function submissionRows(tasks: Task[]): Row[] {
  const rows: { at: string; row: Row }[] = [];
  for (const t of tasks) {
    for (const h of t.history) {
      if (!["submitted", "approved", "rejected", "unmarked"].includes(h.action)) continue;
      const label =
        h.action === "submitted" ? "Submitted"
        : h.action === "approved" ? "Approved"
        : h.action === "rejected" ? "Returned for changes"
        : "Unmarked (approval taken back)";
      rows.push({
        at: h.at,
        row: [
          fmtDate(h.at),
          t.id,
          t.title,
          who(t.assigneeEmail),
          label,
          who(h.actorEmail),
          h.note || "",
          t.submissionText || "",
          t.submissionLink || "",
          "", // Submission File — reserved for file uploads
        ],
      });
    }
  }
  // Newest first.
  return rows.sort((a, b) => b.at.localeCompare(a.at)).map((r) => r.row);
}

/**
 * Mirror every task into the task sheet: active tasks, archived tasks, and the
 * full submission history, each on its own tab. Overwrites the tabs each run so
 * the sheet always matches the dashboard exactly.
 */
export async function syncTasksToSheet(): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;
  const id = taskSheetId();

  try {
    const tasks = await listAllTasks();

    // Everyone assigned within each batch, so a row can list its co-assignees.
    const byGroup = new Map<string, string[]>();
    for (const t of tasks) {
      const key = t.groupId || t.id;
      const arr = byGroup.get(key) ?? [];
      arr.push(t.assigneeEmail);
      byGroup.set(key, arr);
    }
    const rowFor = (t: Task) => taskRow(t, byGroup.get(t.groupId || t.id) ?? [t.assigneeEmail]);

    const sortByDue = (a: Task, b: Task) => a.dueAt.localeCompare(b.dueAt);
    const active = tasks.filter((t) => !t.archived).sort(sortByDue);
    const archived = tasks.filter((t) => t.archived).sort((a, b) => b.dueAt.localeCompare(a.dueAt));

    await ensureTabs(token, id, [TAB_ACTIVE, TAB_ARCHIVED, TAB_SUBMISSIONS]);
    await writeTabs(token, id, [
      { title: TAB_ACTIVE, lastColumn: "T", values: [TASK_HEADER, ...active.map(rowFor)] },
      { title: TAB_ARCHIVED, lastColumn: "T", values: [TASK_HEADER, ...archived.map(rowFor)] },
      { title: TAB_SUBMISSIONS, lastColumn: "J", values: [SUBMISSION_HEADER, ...submissionRows(tasks)] },
    ]);
  } catch (e) {
    console.error("sheets: task sync error", (e as Error).message);
  }
}

/** Fire the task sync only when real-time mode is on. Never throws. */
export async function syncTasksIfRealtime(): Promise<void> {
  if (!taskSyncIsRealtime()) return;
  await syncTasksToSheet().catch(() => {});
}
