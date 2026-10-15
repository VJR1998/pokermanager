# Architecture

> Audit date: 2026-10-14. Based on a read-through of every source file in the repo (last commit: "Migrated API calls from pgsql client to supabase"). Updated after the 2026-10-14 bug-fix pass and Supabase rebuild; the database schema is now in `supabase/migrations/`.

## What it is

"Family Pot" (working title; `package.json` name is `pokermanager`) is a web app for running a home poker tournament: a blind-level countdown timer on a dashboard, plus a configuration page for the blind schedule, chip set, buy-in/payout split and seating. Each signed-in user owns one tournament configuration.

## Stack

| Layer | Tech |
|---|---|
| Framework | Nuxt 3 (`^3.16.2`) with `future.compatibilityVersion: 4` (so source lives in `app/`) |
| UI | PrimeVue 4 (Aura theme via `@primeuix/themes`), PrimeIcons |
| State | Pinia (`@pinia/nuxt`), one store |
| Auth | Google Sign-In (`nuxt-vue3-google-signin`) exchanged for a Supabase session via `signInWithIdToken` (Supabase is the only session; `nuxt-auth-utils` was removed from the config) |
| Backend | Supabase (Postgres) via `@nuxtjs/supabase`, accessed from Nitro server routes |
| Also installed | Tailwind 4 + `tailwindcss-primeui` (wiring unverified), plus leftovers (see Dependencies) |

## Directory map

```
app/
  app.vue                  Root: loading bar + <NuxtLayout/>
  layouts/
    default.vue            <AppHeader/> + .main-card wrapping <NuxtPage/>
    auth.vue               "Family Pot" title + <NuxtPage/> (login only)
  components/
    AppHeader.vue          PrimeVue Menubar: Dashboard, Settings > Configure Tournament / League, Logout, avatar
    PokerChip.vue          SVG chip, props: primaryColour, chipValue
  pages/
    index.vue              Dashboard: blind timer + level controls (Options API)
    setup.vue              Tournament configuration form with debounced auto-save (Options API)
    login.vue              Google sign-in button -> Supabase -> /api/login
    confirm.vue            Supabase redirect landing; forwards to saved path or "/"
  stores/tournamentData.ts Pinia store: fetchData() -> GET /api/tournament (holds ONE tournament object, not an array)
  composables/useBlindTimer.ts  Reactive timer: persistence, interval, beeps
  utils/blindTimer.ts      Pure timer logic (unit-tested), also formatTime
  assets/css/main.css      Global layout classes (.main-card, .main-form, .btn-rack)
server/api/
  login.post.ts            Verified session -> RPC addUserLogin (no request body used)
  tournament.get.ts        Returns the signed-in user's tournament object (creates a default if missing)
  savetournament.post.ts   Validates + whitelists fields, updates the user's row, 401/400/404/500 on failure
server/utils/auth.ts       requireUser(event): Supabase client + verified user, or 401
tests/blindTimer.test.ts   node:test unit tests (run with `npm test`)
supabase/migrations/       Database schema (source of truth)
nuxt.config.ts             Modules, PrimeVue/Aura, Google client id
```

## Request flows

**Login**
1. `/login` renders `GoogleSignInButton`.
2. On success the Google ID token is passed to `supabase.auth.signInWithIdToken({provider:'google'})` in the browser.
3. The token is also decoded client-side (no signature check) and POSTed with the Supabase user id to `/api/login`.
4. `/api/login` (no body) verifies the session, reads name/picture from the user's metadata and calls RPC `addUserLogin`, which upserts the profile and ensures a tournament row (see `SUPABASE.md`).
5. Client navigates to `/confirm`, which waits for `useSupabaseUser()` and redirects to `/`.
6. Route protection comes from `@nuxtjs/supabase` default redirect behaviour (unauthenticated -> `/login`); no custom middleware exists.

**Load tournament**: page `mounted()` -> `useTournamentDataStore().fetchData()` -> `GET /api/tournament` -> returns the user's single tournament row. Pages use `store.data` directly.

**Save tournament** (setup page): a deep `watch` on the tournament object, debounced 1 s -> `POST /api/savetournament` with a cleaned copy of the object -> server validates, then `update(...)` on the caller's row; the page shows the save state.

**Timer** (dashboard): client-side. State is `{levelIndex, remaining, running, endsAt}`; while running, the display is derived from the absolute `endsAt` timestamp (250 ms refresh), so it cannot drift. Rolling over levels, stopping at the last level and restoring after a reload are pure functions in `utils/blindTimer.ts`. State is saved per tournament in `localStorage` (`pokermanager.timer.v2:<id>`). Nothing about a running tournament is stored in Supabase yet.

## Tournament data shape (as used by the UI)

A row in `tournaments` (full definition in `SUPABASE.md`):

```jsonc
{
  "user_id": "uuid",
  "title": "string",
  "description": "string",
  "starting_stack": 10000,                 // edited via a text input, so can become a string
  "chipset": [ { "id": 0, "value": 100, "primarycolour": "#ff6633",
                 "secondarycolour": "#fff", "style": "round", "visible": true } ],
  "blinds": [ { "level": 0, "blinds": [100, 200], "level_length": 20 } ],   // level is 0-based, level_length in minutes
  "money":  { "buyIn": 10, "placesPaid": 3, "split": [50, 30, 20] },        // split in percent
  "seating": { "enabled": false, "seats": 9 }
}
```

`chipset`, `blinds`, `money` and `seating` are `jsonb` columns (confirmed — see `SUPABASE.md`). `level` is always rewritten to equal the array index on save.

## Dependencies worth knowing about

- **Used**: nuxt, vue, @nuxtjs/supabase, @pinia/nuxt, primevue, @primevue/nuxt-module, @primeuix/themes, primeicons, nuxt-vue3-google-signin.
- **Leftover / unused** (still in `package.json`, removal command in `BUGS.md`): `nuxt-auth-utils`, `vuetify`, `vuetify-nuxt-module`, `vite-plugin-vuetify`, `@mdi/font` (project switched to PrimeVue), `pg` and `postgres` (switched to Supabase client), `@primevue/forms`, `postcss-import`, `sass-embedded`, `runtimeConfig.DATABASE_URL`.
- **Fragile**: `vue: "latest"`; `login.vue` imports from `vue3-google-signin`, which is only a transitive dependency of `nuxt-vue3-google-signin`.
- **Not present**: ESLint (the `lint` scripts reference it but it is not installed or configured), CI, `.env.example`. Tests: only the timer unit tests (`npm test`).

## Environment variables

Names referenced by code or required by modules (values were deliberately not read): `GOOGLE_CLIENT_ID`, `SUPABASE_URL`, `SUPABASE_KEY` (required by `@nuxtjs/supabase`). `NUXT_SESSION_PASSWORD` and `DATABASE_URL` are no longer used. `.env` is git-ignored.
