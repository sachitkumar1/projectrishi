import { NextResponse } from "next/server";
import { pullRosterFromSheet, pushRosterToSheet, syncDirectoryToSheet, syncTasksToSheet } from "@/lib/lms/sheets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Same auth as the reminders cron: Authorization: Bearer, x-cron-secret, or ?secret=.
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  if (auth === `Bearer ${secret}`) return true;
  if (req.headers.get("x-cron-secret") === secret) return true;
  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;
  return false;
}

/**
 * Rebuilds both Google Sheets from scratch. Runs on a schedule as a safety net:
 * task actions already push in real time (unless SHEETS_SYNC_MODE=cron), but a
 * transient Sheets/network failure would otherwise leave the sheet stale until
 * the next action. This reconciles everything, so the sheets are never wrong for
 * longer than one cron interval.
 */
async function run(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Forbidden" }, { status: 401 });
  const started = Date.now();

  // 1) Sheet → site. Do this FIRST so roster edits land before anything is
  //    pushed back. Only push the normalized roster back if the pull succeeded,
  //    otherwise we'd overwrite someone's in-progress edits with stale data.
  const rosterIn = await pullRosterFromSheet();
  const rosterOut = rosterIn.ok ? await pushRosterToSheet() : { ok: false, skipped: "skipped — pull failed" };

  // 2) Site → sheets.
  const tasks = await syncTasksToSheet();
  const directory = await syncDirectoryToSheet();

  return NextResponse.json({
    ok: tasks.ok && directory.ok && rosterIn.ok,
    ms: Date.now() - started,
    rosterPull: rosterIn,
    rosterPush: rosterOut,
    tasks,
    directory,
  });
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}
