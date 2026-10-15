# Roadmap

> A proposal to review and reorder together. Phases are sequential; the first two are what turn this from a config screen into a usable tournament manager.

## Phase 0 — Stabilise (do before adding features)

- [x] New Supabase project created; schema, RLS, signup trigger and `addUserLogin` applied and in `supabase/migrations/`.
- [x] `.env` updated, Google auth enabled, login -> dashboard -> setup -> save smoke-tested by the owner (2026-10-14: "all working well").
- [x] Fix BUGS.md items 1–15 and 17 (done 2026-10-14; see statuses in `BUGS.md`).
- [x] Schema in `supabase/migrations/`, RLS reviewed, default tournament created server-side (DB trigger).
- [ ] Generate TS types from the schema (`SUPABASE.md`).
- [ ] Remove unused dependencies (command in `BUGS.md`); pin `vue`. (`nuxt-auth-utils` is already out of the code.)
- [ ] Decide on Tailwind: either wire it up properly or remove it.
- [x] Unit tests for the timer / level logic (`npm test`).
- [ ] Add `.env.example`, ESLint, CI and a real README.
- [x] Dashboard and setup pages moved to `<script setup lang="ts">`; `useBlindTimer` composable extracted. (`useTournament` composable still to do.)

## Phase 0.5 — Commercial foundations (multi-tenant data model)

Do this before Phase 1 so runs, players and results are born tenant-scoped instead of migrated later.

- [x] `groups` (name, currency default, timezone) and `group_members` (role: owner / director / viewer) — part 1 applied live. `invites` still to do.
- [x] Move `tournaments` to `group_id` ownership (dropped `user_id unique`, `user_id` -> `created_by`) — applied 2026-10-15. Tournaments become reusable **templates**, runs are the live events (Phase 1).
- [x] RLS: membership-based policies via `private.has_group_role()` — applied and verified.
- [x] Money as integer minor units + currency code, `money.ts` helper (Intl-based), currency selector and locale-aware buy-in input — in the app and tested (28 tests). Group-level default-currency settings UI still to do.
- [x] Personal group by default (decided): signup trigger + `addUserLogin` provision it.
- [ ] TV display: pairing code + link (decided) — Phase 1.
- [ ] Extra sign-in methods; account deletion and data export (GDPR), terms/privacy pages.
- [ ] Host-agnostic deploy config and a staging Supabase project.

## Phase 1 — A real tournament engine (server-backed)

Goal: the clock and state live in Supabase, so any device can run it or watch it.

- [ ] `tournament_runs` table: tournament id, status (`pending/running/paused/finished`), current level, `level_ends_at` / `paused_remaining`, started_at.
- [x] Timestamp-based timer (no drift), auto-advance on expiry, alarm tone (client-side).
- [ ] Breaks as schedule entries; move the timestamp state into `tournament_runs`.
- [ ] Antes and optional "big blind ante"; level types (blind / break).
- [ ] Supabase Realtime on `tournament_runs` so a TV / second phone can show a read-only clock view (`/tv/[runId]` with large, responsive typography; per the owner: the phone is the controller and the clock can be cast to a TV).
- [ ] Controls: pause, +/- 1 min, skip level, reset — with confirm and audit log.

## Phase 2 — Players, entries & money

- [ ] Player roster (per user, reusable between events).
- [ ] Registration for a run: buy-in, re-buys, add-ons, late registration cut-off.
- [ ] Knock-outs: pick the eliminated player (and optional eliminator for bounties); finish positions recorded automatically.
- [ ] Prize pool and payout calculator driven by `money.split`, with validation (sums to 100%, places ≤ entrants), rounding rules, and a chop/deal helper.
- [ ] Live stats: players remaining, average stack, total chips, next break, time to next level.
- [ ] Results page and CSV export.

## Phase 3 — Seating

- [ ] Random seat draw into tables of `seating.seats`.
- [ ] Table balancing and table-break suggestions as players are eliminated.
- [ ] Printable seating chart / seat cards.

## Phase 4 — Leagues & history

- [ ] Wire up the existing "League" menu: seasons, points systems, leaderboard.
- [ ] Event history, per-player stats (cashes, wins, ROI).
- [ ] Multiple tournament templates per user; duplicate / archive.
- [ ] Share links and invite flow for friends (multi-user ownership, roles).

## Phase 5 — Polish

- [ ] Installable PWA; offline-tolerant clock.
- [ ] Mobile-first layouts, keyboard / screen-reader accessibility.
- [ ] Theming, sounds, chip-denomination helper (suggest a chipset from stack & blind structure), blind-structure generator.
- [ ] Error reporting and basic analytics.

## Suggested next sprint

1. Phase 0.5: groups, membership, RLS, currency (small but foundational).
2. Phase 1: `tournament_runs` + timestamp timer in the database, mobile-first director view.
3. TV display view driven by Supabase Realtime, with the chosen pairing method.

## Product decisions (owner answers, 2026-10-14)

| Question | Decision | Consequence |
|---|---|---|
| Home games only, or shared with other groups? | **Shared with other groups — this will be a commercial app.** | Multi-tenant from the data model up: groups/organisations with members and roles, RLS keyed on membership (not just `user_id`), invites, plan/billing hooks, privacy policy / terms, abuse limits, support tooling. Single-user-per-tournament (`user_id unique`) has to go. |
| Currency / locale | **Configurable, £ (GBP) by default.** | Store a currency code (ISO 4217) per group (overridable per tournament); format with `Intl.NumberFormat`; money stored as integer minor units (pence), not floats; remove the hardcoded `£` and `.00` in the buy-in input. |
| Hosting | **Undecided; probably a third-party host.** | Keep the app host-agnostic (Nitro presets). Avoid Node-only APIs in server routes; Supabase stays the stateful backend. Decide before launch; Vercel/Netlify/Cloudflare all work with Nuxt. |
| Name | **Keep "Family Pot".** | Use consistently in UI, PWA manifest, emails. (Trademark check before commercial launch.) |
| Phone control + TV | **Dashboard is mobile-first; the clock can be cast to a TV.** | A phone-friendly director (controller) view, and a separate full-screen read-only display view driven by Supabase Realtime. Needs the server-backed run (Phase 1). How "cast" works is an open product decision — see below. |

### Open decisions that follow from these

- **How the TV connects**: pairing code / link (works on any TV browser, Fire Stick, laptop) vs. native Google Cast / AirPlay support (needs registered receiver apps) vs. plain screen mirroring.
- **Group model**: personal workspace per user plus optional shared groups, or everything lives in a group from the start.
- **Sign-in methods**: Google only is thin for a commercial product (email/password or magic link, Apple sign-in for iOS users).
- **Pricing/plan shape**: free tier limits (players, tournaments, TV displays) — affects what we meter in the schema.
