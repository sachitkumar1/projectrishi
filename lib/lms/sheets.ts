// ============================================================================
//  Google Sheets sync — mirror the member directory into a Google Sheet.
// ----------------------------------------------------------------------------
//  Uses a Google service account (no user OAuth): the server signs a JWT with
//  the service account's private key, exchanges it for an access token, and
//  overwrites the sheet with the current directory. Entirely best-effort — if
//  the service-account env vars aren't set, everything no-ops and nothing else
//  breaks.
//
//  Setup (one time):
//   1. Google Cloud Console → same project → APIs & Services → Enable
//      "Google Sheets API".
//   2. IAM & Admin → Service Accounts → Create service account → create a JSON
//      key and download it.
//   3. Open the target Google Sheet → Share → add the service account's email
//      (client_email) as an Editor.
//   4. Set env vars (Vercel):
//        GOOGLE_SA_EMAIL        = the service account's client_email
//        GOOGLE_SA_PRIVATE_KEY  = the service account's private_key (PEM)
//        DIRECTORY_SHEET_ID     = the sheet ID (optional; defaults below)
//      Redeploy.
// ============================================================================

import crypto from "crypto";
import { listDirectory } from "@/lib/lms/directory";

const DEFAULT_SHEET_ID = "1Ez251GH36MZ3Wq45BqkIe5h3HYzge2xpXInhUZiQRBo";

function sheetId(): string {
  return process.env.DIRECTORY_SHEET_ID || DEFAULT_SHEET_ID;
}

const b64url = (buf: Buffer | string) =>
  (Buffer.isBuffer(buf) ? buf : Buffer.from(buf)).toString("base64url");

async function getAccessToken(): Promise<string | null> {
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
  const assertion = `${unsigned}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    console.error("sheets: token exchange failed", await res.text().catch(() => ""));
    return null;
  }
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

/**
 * Overwrite the directory sheet with the current directory data. Called after
 * any directory change. Safe to call anywhere; returns immediately if the
 * service account isn't configured.
 */
export async function syncDirectoryToSheet(): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;

  const id = sheetId();
  const entries = await listDirectory();
  const values = [
    ["Name", "Role", "Project Group", "Email", "Phone"],
    ...entries.map((e) => [e.name, e.role, e.group, e.email, e.phone]),
  ];

  try {
    // Clear the existing A:E block first so removed rows don't linger.
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/A:E:clear`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } },
    );
    // Write the fresh table starting at A1.
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/A1?valueInputOption=RAW`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ range: "A1", majorDimension: "ROWS", values }),
      },
    );
    if (!res.ok) console.error("sheets: write failed", await res.text().catch(() => ""));
  } catch (e) {
    console.error("sheets: sync error", (e as Error).message);
  }
}
