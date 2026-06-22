# Project RISHI — UC Berkeley

This is the website and member dashboard for Project RISHI at UC Berkeley, the
student-run nonprofit chapter that has worked with the village of Bharog Baneri
in Himachal Pradesh, India since 2012. The public pages explain who we are and
what our four project teams are working on. Behind a member login there's a
small internal tool the club uses to assign work, keep a shared calendar, and
look up chapter history.

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
straightforward. There's also a **Privacy Policy** page, linked from the footer,
which we needed for Google's OAuth review.

A newsletter signup sits in the footer on every page. The whole site is built
mobile-first — the nav collapses to a menu on small screens, sections stack into
a single column, and all the scroll animations turn themselves off if your
device is set to reduce motion.

## The member dashboard

Members sign in with Google. Only people on the club roster can get in; the list
of members, their roles, and their project teams lives in the codebase, and the
login checks against it. The dashboard has two main parts.

**Tasks & Events.** This is where the club runs its work. You can assign tasks
and create events, and everything assigned to you shows up on a personal month
calendar alongside events for your project group and the whole club. Who can
assign what depends on your role: the VP and President can assign to specific
people, to an entire project group, or to the whole club, and team leads can
assign across their own group. The member picker has a search box and sorts
alphabetically, which matters once you're scrolling through fifty-odd names.
When you assign the same task to several people it collapses into one card under
"Assigned by me," and you can open it to see each person's status and mark any
of them done. Finished or no-longer-relevant tasks and events can be archived,
which moves them into a Past list and pulls them off the calendar.

**Google Calendar sync.** Members can optionally push their RISHI tasks and
events into their own Google Calendar. It's off by default and entirely opt-in —
you click Connect, approve calendar access, and from then on your items sync
automatically whenever they change, with a manual "Sync now" if you want it.
Disconnecting removes everything the app added. We kept this separate from the
login on purpose, so signing in stays a clean, single permission and nobody
grants calendar access they didn't ask for. Refresh tokens are stored
server-side and never touch the browser.

**RISHI Lineage.** A page of the chapter's big/little family trees, drawn as
actual branching diagrams. The logged-in member's tree is marked, with their own
name badged in the tree. It's mostly for fun and for new members trying to
figure out where they sit in the chapter's history.

## Built with

It's a [Next.js](https://nextjs.org) 14 app written in TypeScript, using the App
Router, styled with Tailwind, and animated with Framer Motion. The two typefaces
(Fraunces for headings, Inter for body) are self-hosted through `next/font`, so
nothing is fetched from a font CDN at runtime.

The member side uses **NextAuth** for Google sign-in and **Supabase** (Postgres)
to store tasks, events, and calendar tokens. Those tables have row-level
security on and are only reachable with the server-side service role, so the
public key has no access to them at all. Calendar sync talks to the **Google
Calendar API**. The site runs on Vercel, with Web Analytics and Speed Insights
turned on.

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

```
app/                 routes — one folder per page
  dashboard/         the member side (login-gated)
  projects/          the four team pages
  api/               auth + LMS + calendar endpoints
components/          shared UI (Navbar, Footer, Media, the LMS board, …)
lib/
  content.ts         site text, links, image paths
  members.ts         the club roster and roles
  lms/               tasks, events, permissions, calendar logic
  lineage.ts         the big/little trees
public/images/       photos
```

To run it locally:

```bash
npm install
npm run dev      # http://localhost:3000
```

The dashboard needs a few environment variables to work locally (Google OAuth,
NextAuth, and Supabase keys); see `.env.local.example` for the names. The public
pages run fine without them.
