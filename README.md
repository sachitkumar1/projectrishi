# Project RISHI — UC Berkeley

A modern, animated rebuild of the Project RISHI Berkeley website, built with
**Next.js (App Router) + TypeScript + Tailwind CSS + Framer Motion**, ready to
deploy on **Vercel**.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Build for production:

```bash
npm run build
npm run start
```

---

## Where everything lives

```
app/                       Pages (each folder = a route)
  page.tsx                 Home
  about/                   About
  projects/                Projects index + the 4 teams
  apply/  contact/  donate/
components/                Reusable UI (Navbar, Footer, Media, Reveal, ...)
lib/content.ts             ← ALL text, links, and image references
public/images/             ← drop your photos here
```

### 1. Editing text and links — `lib/content.ts`

Almost everything you'll want to change is in **one file**: `lib/content.ts`.
Text, recruitment dates, chapter list, and every external link (forms, socials,
donate) live there. Anything marked `// TODO` is a placeholder URL to confirm or
replace.

### 2. Adding your own photos

Every image on the site is a `<Media>` slot. Until you give it a real file, it
shows a labelled dashed box telling you what belongs there.

To add a photo:

1. Put the file in `public/images/` (subfolders `projects/` and `gallery/`
   already exist), e.g. `public/images/hero-village.jpg`.
2. In `lib/content.ts`, set the matching field to its path (no `public`):

   ```ts
   heroImage: "/images/hero-village.jpg",
   ```

That's it — the placeholder is replaced by your photo, cropped to fit.

### 3. The newsletter form

`components/Newsletter.tsx` confirms locally by default. To actually collect
emails, set `LINKS.newsletterAction` in `lib/content.ts` to a Google Form /
Mailchimp / your own endpoint, and post the email there (see the `// TODO`).

---

## Deploying to Vercel

1. Push this folder to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Framework preset auto-detects **Next.js**. No env vars needed for the base
   site. Click **Deploy**.
4. Add your custom domain (e.g. `ucbprojectrishi.org`) in **Settings → Domains**.

Every push to your main branch redeploys automatically.

---

## Design notes

- **Palette** — deep pine green + warm marigold on warm paper, drawn from the
  terraced Himalayan foothills around Bharog Baneri.
- **Type** — Fraunces (display) + Inter (body), via `next/font`.
- **Signature motif** — topographic contour lines (`components/Contours.tsx`)
  echoing the village's hilly terrain, reused as ambient texture.
- **Motion** — Framer Motion scroll reveals + hero load sequence, and it all
  respects `prefers-reduced-motion`.

---

## What's next (from the project vision)

This is the fast, polished public site. The larger vision — a member dashboard
with logins, tasks, calendar, and an alumni database — is a natural next phase.
A good stack for that: this Next.js app + **Supabase** (auth + Postgres) for the
dashboard data, deployed on the same Vercel project.


