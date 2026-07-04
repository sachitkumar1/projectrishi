# Project RISHI — UC Berkeley

This is the website and member dashboard for Project RISHI at UC Berkeley, the
student-run nonprofit chapter that has worked with the village of Bharog Baneri
in Himachal Pradesh, India since 2012. The public pages explain who we are and
what our four project teams are working on. Behind a member login there's an
internal tool the club uses to assign work, keep a shared calendar, message each
other, send club email, and look up chapter history.

Live at **ucbprojectrishi.org**.

## The public site

The front of the site is for prospective members, partners, and anyone curious
about the work.

**Home** opens on the chapter name over a full-bleed photo, then moves into our
mission and a few numbers (founding year, village population, active teams). The
hero has a second image slot beside the title on desktop.

**About** covers the things people actually ask about: our mission and values,
the five-step methodology we use on every project (Understand, Research,
Finance, Implement, Evaluate), the chapter's history, and where Bharog Baneri
is and what it's like. There's a photo gallery from past India trips, a team
picture, and a list of the other Project RISHI chapters with links.

**Projects** is split into an index page with an embedded trip video and four
team pages, one each for Education, Water & Sanitation, Women's Empowerment, and
Health. Every team page follows the same shape: a short overview, a quote, the
current term's highlights with photos, and a record of past projects. All of
that text and the photo paths come out of a single content file, so updating a
team page each semester doesn't mean touching any code.

**Apply** lays out the recruitment timeline and points to the interest form,
coffee-chat signup, and application. **Contact** and **Donate** are
straightforward. There are also **Privacy Policy** and **Terms of Service**
pages, linked from the footer; the privacy page in particular is required for
Google's OAuth review.

A newsletter signup sits in the footer on every page. The whole site is built
mobile-first — the nav collapses to a menu on small screens, sections stack into
a single column, and all the scroll animations turn themselves off if your
device is set to reduce motion.

## The member dashboard

Members sign in with Google. Only people on the club roster can get in; the list
of members, their roles, and their project teams lives in the codebase, and the
login checks against it.

**Tasks & Events.** This is where the club runs its work. You can assign tasks
and create events, and everything assigned to you shows up on a personal month
calendar alongside events for your project group and the whole club. Who can
assign what depends on your role: the VP and President can assign to specific
people, to an entire project group, or to the whole club, and team leads can
assign across their own group. Co-leads (and co-NMT leaders) share control of
each other's items, so anything a lead assigns can be managed by their peers too.
The member picker has a search box and sorts alphabetically, which matters once
you're scrolling through fifty-odd names. When you assign the same task to
several people it collapses into one card, and you can open it to see each
person's status, edit it, add or remove assignees, or archive or delete it —
per person or for everyone at once.

Each task has a small lifecycle: the person it's assigned to can submit a note
and/or a link (optionally required) and mark it done, which puts it into a
pending state for the assigner to approve or send back, and either side can
add comments. Every card — task or event, active or archived — opens into a
detail view with its full history. Finished or no-longer-relevant items can be
archived, which moves them into a Past list and pulls them off the calendar.

**Full Club Overview.** The VP and President get a toggle that turns the
calendar into a club-wide view, color-coded by project team, NMT, and other, and
lists every task and event in the club (present and archived) grouped by those
same lanes. It's read-only unless they created the item themselves, and it never
touches anyone's Google Calendar.

**Notifications & email.** Every task and event action — assigned, submitted,
approved, sent back, unmarked, archived, deleted, and event created/cancelled —
writes an in-dashboard notification (the bell) and sends a matching email. The
club sends from connected Google accounts using send-only access, and the two
sending accounts are deliberately separate: announcements and newsletters go out
from the main club address, while automated task/event/reminder notifications go
from a dedicated notifications address. Officers can also send announcements and
newsletters to the club, with optional mail-merge fields, and members can
connect their own account to send messages they author.

**Reminders.** Tasks send reminder emails as their due date approaches (several
days out down to the last hour, plus a daily nudge once overdue), suppressed once
the task is done. These are triggered by an external scheduler hitting a
secret-protected endpoint on a fixed interval.

**Background notifications.** Members can opt into browser/OS push, so
dashboard notifications (and new chat messages) reach them even with the tab
closed. This uses a service worker and Web Push; it's off until you allow
notifications.

**Chat.** A floating chat widget lets any member start a direct message or a
group chat with other members, with emoji and tapback reactions, a panel that
resizes up to fullscreen, and conversations saved so they persist. New messages
also fire a background push to the other people in the thread.

**Google Calendar sync.** Members can optionally push their RISHI tasks and
events into their own Google Calendar. It's off by default and entirely opt-in —
you click Connect, approve calendar access, and from then on your items sync
automatically whenever they change, with a manual "Sync now" if you want it.
Disconnecting removes everything the app added. We kept this separate from the
login on purpose, so signing in stays a clean, single permission and nobody
grants calendar access they didn't ask for. Refresh tokens are stored
server-side and never touch the browser.

**Settings & profile.** Members can set a profile photo and manage their email
and calendar connections. Officers additionally manage the club's two shared
sending accounts here.

**RISHI Lineage.** A page of the chapter's big/little family trees, drawn as
actual branching diagrams, with the logged-in member's own spot badged. It's
mostly for fun and for new members figuring out where they sit in the chapter's
history.

## Built with

It's a [Next.js](https://nextjs.org) 14 app written in TypeScript, using the App
Router, styled with Tailwind, and animated with Framer Motion. The two typefaces
(Fraunces for headings, Inter for body) are self-hosted through `next/font`, so
nothing is fetched from a font CDN at runtime.

The member side uses **NextAuth** for Google sign-in and **Supabase** (Postgres)
to store tasks, events, submissions, comments, notifications, chat, push
subscriptions, profiles, announcements/newsletters, and the calendar and Gmail
tokens. Every table has row-level security on and is only reachable with the
server-side service role, so the public key has no access to them at all.
Calendar sync talks to the **Google Calendar API**; club email is sent through
the **Gmail API** with send-only scope; background alerts use **Web Push**
(`web-push` + VAPID). The site runs on Vercel, with Web Analytics and Speed
Insights turned on.

A couple of design choices worth noting. The palette — deep pine green and warm
marigold on a paper background — comes from the terraced foothills around the
village. The faint topographic contour lines you'll see behind headers and hero
sections are a recurring motif meant to echo that hilly terrain. Images
throughout the site go through a single `Media` component that shows a labelled
placeholder box until a real photo is dropped in, which makes it obvious what's
missing at a glance.

## Working on the site

Most content changes happen in one file, `lib/content.ts`: page text,
recruitment dates, the chapter list, every external link, and which image each
slot uses. Photos go in `public/images/` (there are `projects/` and `gallery/`
subfolders already), and you reference them by path without the `public` prefix.
The club roster, roles, and teams live in `lib/members.ts`.

```
app/                 routes — one folder per page
  dashboard/         the member side (login-gated): board, settings, lineage
  projects/          the four team pages
  privacy/ terms/    legal pages
  api/lms/           dashboard endpoints: tasks, events, calendar sync,
                     gmail connect/callback/status, notifications, push,
                     chat, announcements, newsletters, reminders (cron)
components/          shared UI (Navbar, Footer, Media, the LMS board,
                     NotificationBell, ChatWidget, PushManager, …)
lib/
  content.ts         site text, links, image paths
  members.ts         the club roster and roles
  lms/               tasks, events, permissions, calendar, gmail, notify,
                     notifications, push, chat logic
  lineage.ts         the big/little trees
public/
  images/            photos
  sw.js              push service worker
supabase-schema.sql  the full database schema (run in the Supabase SQL editor)
```

To run it locally:

```bash
npm install
npm run dev      # http://localhost:3000
```

The public pages run without any configuration. The dashboard needs a set of
environment variables:

| Variable | What it's for |
| --- | --- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth (sign-in, Calendar, Gmail send) |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | NextAuth session config |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Database (server-side only) |
| `CRON_SECRET` | Protects the reminders endpoint |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push (background notifications) |
| `LMS_PREVIEW_EMAIL` | Optional: preview the dashboard as a given member in dev |

Without Supabase configured, the dashboard falls back to an in-memory store with
seeded demo data, which is handy for local development.

### Database

Run `supabase-schema.sql` in the Supabase SQL editor to create every table the
dashboard uses (it's safe to re-run — everything is `if not exists`). Each table
enables row-level security and grants only the `service_role`.

### Reminders (external scheduler)

The reminder emails are driven by an external cron service (e.g. cron-job.org)
that sends a `POST` to `/api/lms/cron/reminders` every few minutes with an
`Authorization: Bearer <CRON_SECRET>` header. The endpoint is idempotent, so a
tight interval is fine. GitHub Actions' scheduler is intentionally not relied on
for this — it throttles short-interval cron jobs heavily.

### Background push

Generate a VAPID key pair with `npx web-push generate-vapid-keys`, set the three
`VAPID_*` variables, and members who allow notifications will be subscribed
automatically. Without the keys, push simply no-ops and in-app notifications
still work.

### Sending email

Club email sends through connected Gmail accounts (send-only). An officer
connects them from the dashboard's Settings page — one for announcements and
newsletters, one for automated notifications and reminders. If your Google OAuth
consent screen is in "Testing" mode, add the sending accounts as test users;
publishing the app to production avoids the 7-day refresh-token expiry Google
applies to test mode.
