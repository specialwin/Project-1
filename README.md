# Lineup

The daily fifteen minutes. A small web app for running a service-culture huddle
in a clinic, restaurant, or salon.

## Stack

- Next.js 14 (App Router) with TypeScript
- Tailwind, with hand-rolled shadcn-style primitives (`src/components/ui/*`)
- Prisma + SQLite (local-first; switch the datasource for Postgres in
  production)
- NextAuth (credentials)
- Nodemailer for SMTP, LINE Notify HTTP API for end-of-lineup delivery

## Running locally

```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Default login from the seed:

```
owner@example.com / lineup
```

## Concepts

### Standards

Each organization gets 25 standards. They rotate on a 25-day cycle. The seed
ships placeholder standards in the Schulze register (quiet, professional) in
both English and Thai — replace `bodyEn` / `bodyTh` in `prisma/seed.ts` with
your own copy. Numbering 1–25 is stable; editing title or body does not move
the rotation pointer.

### Today

The Today screen pre-builds a `LineupSession` for the current calendar day. It
shows:

- Today's standard (large heading + full body)
- The Munger Inversion prompt
- An attendance row per active team member (one tap to toggle)
- An "add a story" form
- A consensus answer field
- A "finish lineup" action

"Finish lineup" composes a one-line summary, stores it on the session, and
attempts to email and/or LINE-notify the owner. Delivery is best-effort: a
missing SMTP or LINE token does not fail the action.

### Streak

Streak = consecutive calendar days ending today (or yesterday if today is not
yet finished) on which a lineup was finished. Displayed on the Today screen as
`N lineups in a row`.

### Rotation and skipping

Each finished, non-skipped session advances the rotation pointer by one. A
skipped session does not advance it, so tomorrow returns to the same standard.

### History and coverage

The History view lists past sessions in reverse-chronological order. Below it,
a `Standards coverage` table shows when each standard was last discussed.
Anything untouched for 30 days or more is flagged.

### Localization

`Organization.language` is `"en"` or `"th"`. The Standard model carries both
title and body for both languages; UI copy lives in `src/lib/i18n.ts`. Toggle
the field in the database to switch the organization's language.

## Billing / tier model (data only)

`Organization.tier` and `Organization.memberCap` exist in the schema, and
`User.isCoach` exists for cross-org read access by the framework's author.
There is no billing UI yet — these fields are deliberately reserved for the
paid-tier work.

- `free` — single org, up to 5 active team members.
- `team` — single org, unlimited members.
- `owner_multi` — single owner running multiple organizations.
- `coach` — adds a designated coach user with read access across all orgs.

Member-cap enforcement is intended to live in application code at the
`TeamMember`-create boundary; the cap is stored, not enforced.

## File map

```
prisma/
  schema.prisma         data model
  seed.ts               25 default standards + demo org + owner login
src/
  app/
    api/auth/[...nextauth]/route.ts
    signin/page.tsx
    (app)/
      layout.tsx        authenticated shell
      page.tsx          Today
      history/page.tsx  History + coverage
      actions.ts        server actions
  components/
    ui/                 button, card, input, textarea, label
    today/              attendance row, story form, consensus, skip, finish
    page-header.tsx
    sign-out-button.tsx
    streak.tsx
  lib/
    auth.ts             NextAuth options
    coverage.ts         standards coverage + 30-day stale flag
    i18n.ts             en/th dictionary
    prisma.ts           prisma singleton
    rotation.ts         standard selection across 25-day cycle
    session-today.ts    get-or-create today's LineupSession
    session.ts          server-side auth helpers
    streak.ts           streak computation
    summary.ts          compose + deliver end-of-lineup summary
    utils.ts            cn, date helpers
```

## Installing on iPhone

Lineup is a Progressive Web App. Once installed, it launches full-screen with
no Safari chrome, has its own home-screen icon, and respects the iPhone's
notch and home indicator.

Three steps:

1. Run the dev server bound to your LAN:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
2. Set `NEXTAUTH_URL` in `.env` to your laptop's LAN URL (e.g.
   `http://192.168.1.42:3000`) and add the same origin to
   `experimental.serverActions.allowedOrigins` in `next.config.mjs`.
3. On your iPhone, open the URL in Safari. Tap the Share button, then
   "Add to Home Screen." Tap the new Lineup icon on your home screen.

For production install on a real device over the public internet, deploy to
Vercel or any HTTPS host — iOS will only treat the app as installable from a
secure origin.

### What "native" means here

The PWA path stays on the existing Next.js code and adds:

- `src/app/manifest.ts` — web app manifest (paper/ink theme, standalone display)
- `src/app/icon.tsx` and `src/app/apple-icon.tsx` — icons generated at build
  time via `ImageResponse` (no PNG assets to manage)
- `apple-mobile-web-app-*` and `viewport-fit=cover` meta in the root layout
- `env(safe-area-inset-*)` padding so the header sits below the notch and the
  footer clears the home indicator
- Sticky header with translucent backdrop-blur (iOS-style)
- `src/lib/haptics.ts` — tap feedback wired into attendance toggle, finish,
  skip, and story save (no-op on iOS Safari, which lacks the Vibration API,
  but kept thin so we can swap in Capacitor Haptics later)
- An iOS-only "Add to Home Screen" hint that disappears once installed

This will not appear in the App Store. If you later want TestFlight / App
Store distribution, wrap this codebase with Capacitor — most of the iOS polish
above will transfer directly.

## Voice

Quiet, professional, slightly serious. No emojis. No motivational quotes.
Hotel stationery, not productivity app.
