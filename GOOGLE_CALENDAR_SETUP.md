# Google Calendar Sync — Setup Guide (on-demand version)

The **"Connect Google Calendar"** button on the Member Dashboard lets each
member push their own tasks and events into their own Google Calendar.

What's different from before: calendar permission is **no longer requested at
login**, so normal sign-ins are clean (no "unverified app" warning for anyone).
A member only grants calendar access if/when they click **Connect**. After they
connect, syncing happens **automatically** each time they open the dashboard,
and they can press **Unsync** to stop and remove the synced items.

Properties:
- **One-way** — pushes the dashboard's items out; never reads the member's
  Google Calendar.
- **Per person** — Palak's tasks (including ones Sachit assigned her) sync to
  Palak's calendar when Palak connects.
- **No duplicates** — fixed event ids, so re-syncing updates in place.
- **Deletions sync** — if a task/event is removed from the dashboard, it's
  removed from the member's Google Calendar on their next (auto) sync.

---

## 1. Place the code files

| File | Destination |
|---|---|
| `auth.ts` | `lib/auth.ts` (overwrite — now clean login scopes) |
| `lms__gcal.ts` | `lib/lms/gcal.ts` (new) |
| `api-lms-gcal-connect__route.ts` | `app/api/lms/gcal/connect/route.ts` |
| `api-lms-gcal-callback__route.ts` | `app/api/lms/gcal/callback/route.ts` |
| `api-lms-gcal-sync__route.ts` | `app/api/lms/gcal/sync/route.ts` (overwrite) |
| `api-lms-gcal-status__route.ts` | `app/api/lms/gcal/status/route.ts` |
| `api-lms-gcal-disconnect__route.ts` | `app/api/lms/gcal/disconnect/route.ts` |
| `LmsBoard.tsx` | `components/LmsBoard.tsx` (overwrite) |
| `privacy__page.tsx` | `app/privacy/page.tsx` (new) |

## 2. Add the calendar connection table

Run this in the Supabase SQL Editor (the full `supabase-schema.sql` now
includes it too, but you only need this part since the other tables exist):

```sql
create table if not exists lms_gcal (
  user_email    text primary key,
  refresh_token text not null,
  sync_enabled  boolean not null default true,
  synced_keys   text[] default '{}',
  updated_at    timestamptz not null default now()
);
alter table lms_gcal enable row level security;
grant all privileges on table lms_gcal to service_role;
```

## 3. Turn on the Google Calendar API

Google Cloud Console → **APIs & Services → Library** → "Google Calendar API" →
**Enable** (if you haven't already).

## 4. Add the NEW redirect URI

The connect flow uses its own callback, so add it to your OAuth client:
**APIs & Services → Credentials → your OAuth 2.0 Client ID → Authorized redirect
URIs → Add**:

```
https://YOUR-DOMAIN/api/lms/gcal/callback
http://localhost:3000/api/lms/gcal/callback     (for local testing)
```

(Keep your existing login redirect URIs — these are additional.)

## 5. Add the calendar scope to the consent screen

**APIs & Services → OAuth consent screen → Data Access → Add scopes** →
`https://www.googleapis.com/auth/calendar.events`. This is the sensitive scope
that verification covers. Until you're verified, members will see the
"unverified app" screen **only when they click Connect** (not at login) — they
choose Advanced → continue, or you add them as Test users.

## 6. Deploy

Push to GitHub (Vercel redeploys). No member needs to re-login — logins are
clean now. Calendar is purely opt-in via the Connect button.

---

## How members use it
1. Click **Connect Google Calendar** → approve calendar access with Google.
2. Their items sync immediately, and re-sync automatically whenever they open
   the dashboard. They can also press **Sync now**.
3. **Unsync from Google Calendar** stops syncing and removes the items we added.

## Notes
- The connect flow needs `NEXTAUTH_URL` set correctly (it builds the callback
  URL from it) — you already have this in Vercel.
- The refresh token is stored server-side in `lms_gcal` and never exposed to the
  browser.
