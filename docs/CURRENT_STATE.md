# Current State

> Audit 2026-10-14, bug-fix pass the same day. The app has **not been run in a browser** by me (the sandbox could not install npm packages), so "works" below means "code complete and statically checked". Timer logic and the save route's validation have automated checks (`npm test`).

## Summary

An early-stage prototype (about 20 source files, ~25 commits between 2025-04-25 and 2025-05-21). Authentication, loading and editing a single tournament configuration, and a basic blind timer are in place. Everything that makes it an actual tournament *manager* — players, knockouts, payouts, seating, persistence of a running tournament — is either a stub or missing.

## Backend: rebuilt on a new Supabase project (2026-10-14)

The original "Family Pot" project had been paused for over 400 days and could not be restored. A new project, **The Family Pot** (`xddlhansbkjhvbztecyq`), now has the schema (`profiles`, `tournaments`, RLS, signup trigger, `addUserLogin` RPC) applied and tested. Still needed before the app runs end to end: update `.env` (URL + publishable key) and enable the Google provider in the Supabase dashboard — checklist in `SUPABASE.md`. The first-run crash (BUGS #3) is fixed at the DB level, since every new user gets a default tournament automatically.

## In progress: multi-tenant foundations (Phase 0.5)

Decided with the owner: commercial multi-group product, personal group per user by default, configurable currency (GBP default), phone controller + TV display via pairing code. Database part 1 is live; **part 2 (ownership + RLS) is written, validated locally and waiting to be run** (see `SUPABASE.md`). The app code that uses it (group-aware API, currency selector, minor-unit buy-in) is written and unit-tested but intentionally **not yet in the project**, so the app you are running keeps working. Don't sign in with a brand-new Google account until part 2 is applied.

## Feature status

| Area | Status | Notes |
|---|---|---|
| Google sign-in -> Supabase session | Working (code complete) | Server derives identity from the session; real error messages on the login page |
| Route protection | Implicit | Relies on `@nuxtjs/supabase` default redirect; no explicit middleware |
| Logout | Working | Signs out of Supabase (the duplicate nuxt-auth-utils session was removed) |
| Load tournament config | Working | DB trigger + API safety net create the row; loading / error / empty states |
| Edit title / description / starting stack | Working | Starting stack is now a numeric input |
| Chip set editor | Working | Edited by position; colours normalised |
| Blind schedule editor | Working | Index-based, renumbered on add/remove, last level protected |
| Money & prizes | Partial (currency selector pending part 2) | Split follows places paid; total shown (warns if not 100%); no prize-pool calc yet |
| Seating config | Stub | Toggle + seats per table are stored; nothing uses them |
| Auto-save | Working | 1 s debounce; Saving / Saved / Failed (Retry) indicator; flushes on leave |
| Dashboard blind timer | Working | Timestamp-based (no drift), auto-advance + beep, stops at the last level, bounds-checked navigation |
| Timer persistence | Local only | `localStorage` per tournament; survives refresh while running; not shared across devices |
| Auto-advance level / alarm | Working | Short tone on level change, three on finish. Breaks as a level type: missing |
| Add player / knock out player | Stub | Icons are shown disabled with a "coming soon" tooltip |
| Player list, entries, re-buys, add-ons | Missing | |
| Payout calculation / results | Missing | |
| Table seating & balancing | Missing | |
| League / seasons | Missing | Menu item "League" exists with no route |
| Multiple tournaments per user | Missing | Data model and API assume one row per user |
| Spectator / TV display | Missing | |
| Tests | Partial | `npm test` runs 14 timer-logic tests (Node's built-in runner). No CI, no ESLint |
| Docs | Partial | `docs/` + `CLAUDE.md`; README is still the unmodified Nuxt template |

## Project health

- **Recent activity**: last commits (2025-05-21) migrated API routes from raw `pg` to Supabase. The repo has been idle since.
- **Schema is in the repo**: `supabase/migrations/` (applied to the live project). See `SUPABASE.md`.
- **Code style**: pages are `<script setup lang="ts">` with a Pinia store and a timer composable; layouts embed `<NuxtPage/>` rather than using a slot (unconventional but works).
- **Build artefacts** `.nuxt/` and `.output/` exist locally (git-ignored).

## Smoke test to run (not yet done by me)

1. `npm run dev`, sign in with Google -> lands on the dashboard (a new account gets the default 8-level tournament).
2. Dashboard: press play, watch it count; refresh the page (should keep running); press next/previous to the ends (buttons grey out, no errors); pause -> reset -> choose Reset Level / Reset Tournament.
3. Let a short level expire (set a level to 1 minute in setup): it should beep and move on; on the final level it stops at 00:00 in red.
4. Setup: edit title -> status goes Unsaved -> Saving -> All changes saved; reload and confirm it persisted. Remove a middle blind level and a middle chip, edit others, confirm nothing jumps. Change *Places paid* and confirm the split list resizes. Make the split not total 100 and confirm the warning.
5. Turn the network off (devtools) and edit -> expect "Save failed" with Retry.
6. Header: League shows disabled, Logout returns to `/login`.

## What to do first

1. Run the smoke test above and report anything odd.
2. Remove the unused dependencies (command in `BUGS.md` hygiene section).
3. Decide whether to wire up or drop Tailwind (BUGS #16).
4. Then start `ROADMAP.md` Phase 1 (server-backed tournament engine).
