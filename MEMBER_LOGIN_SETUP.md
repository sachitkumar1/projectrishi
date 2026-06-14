# Member Login — Setup Guide

The member login uses **Google Sign-In** with a server-checked allowlist, so only
the emails in `lib/members.ts` can get in. This is one-time setup.

---

## 1. Install the new dependency

A new package (`next-auth`) was added. In your project folder run:

```bash
npm install
```

## 2. Create Google OAuth credentials

1. Go to **https://console.cloud.google.com/** and sign in.
2. Create a project (or pick one) — top-left project dropdown → **New Project**.
3. Left menu → **APIs & Services → OAuth consent screen**:
   - User type: **External** → Create.
   - Fill App name (e.g. "Project RISHI Members"), your support email, developer email. Save.
   - (You can leave it in "Testing" mode; add member emails under **Test users**, or hit **Publish** later.)
4. Left menu → **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**: add
     - `http://localhost:3000`
     - `https://YOUR-DOMAIN.com` (your real site, once you have it)
   - **Authorized redirect URIs**: add
     - `http://localhost:3000/api/auth/callback/google`
     - `https://YOUR-DOMAIN.com/api/auth/callback/google`
   - Create. Copy the **Client ID** and **Client Secret**.

## 3. Add environment variables

1. Copy `.env.local.example` to a new file named **`.env.local`** in the project root.
2. Fill it in:
   - `NEXTAUTH_SECRET` — run `openssl rand -base64 32` in your terminal and paste the output.
   - `NEXTAUTH_URL` — `http://localhost:3000` for local.
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from step 2.

## 4. Run it

```bash
npm run dev
```

Open the site → scroll to the footer → **Member Login** → **Sign in with Google**.
Only emails in `lib/members.ts` will be let in; anyone else is bounced back with a
"not on the member list" message.

---

## Deploying to Vercel

In your Vercel project → **Settings → Environment Variables**, add the same four
variables. For production set:

- `NEXTAUTH_URL` = your real site URL (e.g. `https://ucbprojectrishi.org`)

And make sure your real domain's origin + `/api/auth/callback/google` redirect URI
are added in the Google Cloud credentials (step 2).

---

## Managing members

- **Who can log in:** edit `lib/members.ts` — add `{ email, firstName, lastName }`
  for each member. Emails are matched case-insensitively.
- **The lineage trees:** `lib/lineage.ts`. For a member's own leaf to highlight,
  their `"FirstName LastName"` in `members.ts` must match the name in the tree exactly.

## A note on security

The allowlist check runs on the server (in the sign-in step), so it can't be
bypassed from the browser — non-members genuinely cannot sign in or reach the
dashboard. Keep `.env.local` private (never commit it); it contains your secret.
