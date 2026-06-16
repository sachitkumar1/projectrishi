# Member Dashboard LMS — Setup Guide

This adds a task + event system to the Member Dashboard. Members can be assigned
tasks, complete them, and see everything (tasks + events) on a personal calendar.
Permissions follow your spreadsheet + the spec (Leads assign within their group,
NMT Leaders assign to newbies, VP/P assign club-wide, etc.).

Tasks and events live in a **Supabase** database so they're shared across everyone.

---

## 1. Install the database client

In the project folder, run once:

```
npm install @supabase/supabase-js
```

(If you downloaded the code as a ZIP, this also gets installed automatically the
next time you run `npm install`.)

## 2. Create a free Supabase project

1. Go to https://supabase.com → sign up (free) → **New project**.
2. Give it a name (e.g. "project-rishi") and a database password (save it).
3. Wait ~1 minute for it to finish setting up.

## 3. Create the tables

1. In your Supabase project, open the **SQL Editor** (left sidebar).
2. Open the file `supabase-schema.sql` from this project, copy ALL of it.
3. Paste it into the SQL Editor and click **Run**. You should see "Success".

## 4. Get your keys

In Supabase: **Project Settings → API**. Copy two things:

- **Project URL** (looks like `https://abcdxyz.supabase.co`)
- **service_role** secret key (under "Project API keys" — the `service_role` one,
  **not** the `anon` key). This is secret — treat it like a password.

## 5. Add the keys to `.env.local`

Open `.env.local` in the project root (the same file with your Google login keys)
and add these two lines:

```
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
```

Then stop the server (Ctrl + C) and run `npm run dev` again.

> **Important:** the service role key must stay on the server. It has no
> `NEXT_PUBLIC_` prefix on purpose, so it's never sent to the browser. Don't
> share it or commit it to GitHub (it lives in `.env.local`, which is already
> git-ignored).

## 6. Deploying (Vercel)

When you deploy, add the same two variables (`SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`) in your Vercel project under
**Settings → Environment Variables**, then redeploy.

---

## Adding members & roles

Roles come from `lib/members.ts`. Each member has a project group and role flags:

```ts
{
  email: "someone@berkeley.edu",
  firstName: "First",
  lastName: "Last",
  group: "E",                 // E=Education, R=Water & Sanitation, W=Women's, H=Health
  roles: roles({ lead: true }) // any of: nmtLeader, newbie, lead, internal, vpp, exec
}
```

Only emails in this file can log in, and their roles decide what they can do.

## Before the database is set up

The dashboard still loads without Supabase — it shows **sample data** so you can
see the layout. That sample data is per-device and resets on restart. Once the
two env vars above are set, it switches to the real shared database automatically.

## What's intentionally not built yet

Per your note, **file uploads are not implemented**. Tasks have a "require a file
upload" checkbox that is saved for later, but for now tasks are completed just by
marking them done. When you're ready, file uploads can be wired to Google Drive.
