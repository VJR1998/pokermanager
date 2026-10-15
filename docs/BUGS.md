# Bugs, Defects & Things That Don't Work

> **Fix pass 2026-10-14:** items 1–15 and 17 are fixed in code (status line under each heading). Verified by: 14 passing unit tests for the timer logic (`npm test`), a stubbed-handler test of the save route's validation, TypeScript syntax checks on every changed file, and template structure checks. **Not verified:** a real `nuxt build` / browser run — the npm registry was blocked in the sandbox, so please run the app and the smoke-test list in `CURRENT_STATE.md`.

> Audit date: 2026-10-14. Found by reading the code; **none have been reproduced in a running app yet**. Confidence is noted where it is less than certain. Severity: **Critical** = crash / data loss / security, **High** = feature broken in normal use, **Medium** = wrong behaviour in edge cases, **Low** = polish / hygiene.

## Critical

### 1. Level navigation crashes at the ends of the schedule
> **FIXED** — navigation is bounds-checked in `useBlindTimer`/`blindTimer.ts` (unit-tested); buttons grey out at both ends; stored state is validated on load.

`app/pages/index.vue` `nextLevel()` / `prevLevel()` set `currentLevel = blinds.find(b => b.level == current ± 1)`. On the last level (or level 0 going back) `find` returns `undefined`, then `initLevel()` reads `this.currentLevel.level_length` -> `TypeError`, and the stored `currentLevel` in localStorage becomes `"undefined"`, which breaks the next page load too (`JSON.parse` of a bad value).
**Fix**: bounds-check; disable the buttons at the ends; guard `JSON.parse`.

### 2. Save failures are silently reported as success
> **FIXED** — `savetournament` validates input, checks the Supabase error (500) and zero-row updates (404); setup page shows Saving / Saved / Save failed (with Retry) and warns before leaving with unsaved edits.

`server/api/savetournament.post.ts` destructures `{data, error}` from Supabase but never checks `error`; it always returns `"Tournament Updated"`. A failed update (RLS denial, bad payload, no matching row) looks like a success and the user loses edits on refresh. The setup page also has no save indicator or error handling (`saveTournament` just `console.log`s).
**Fix**: throw on `error`; show saving / saved / failed state in the UI.

### 3. First-run or fetch-failure crashes the dashboard and setup page
> **FIXED** — DB trigger creates the row; `GET /api/tournament` returns the row and creates one if missing; both pages show loading / error (retry) / empty states; 401 for no session.

Both pages do `tournamentStore.data[0]`. If the user has no `tournaments` row (nothing in the repo creates one — it depends on the unseen `addUserLogin` RPC) or the fetch fails (`data` stays `null`), this throws, and `initLevel()` then dereferences `this.tournament.blinds`. `tournament.get.ts` also reads `user.id` for a null user inside a `try`, which turns an auth problem into a generic 500.
**Status (2026-10-14)**: the "no row" half is fixed in the new database — a signup trigger and the `addUserLogin` RPC create a default tournament. Existing-user edge cases and the fetch-failure half (`data` is `null`) are still open: handle loading / empty / error states in the pages and return 401 for no user.

### 4. `login.post.ts` trusts the browser and builds an empty session
> **FIXED** — `/api/login` ignores the body, reads identity from the verified session, passes real metadata to the RPC, no PII logging, and the dead `nuxt-auth-utils` session was removed. Login page shows real error messages instead of `alert`.

- It takes `userid` and the decoded Google profile from the request body and passes them to the RPC; nothing verifies they belong to the caller (see `SUPABASE.md` items 2–3).
- `setUserSession` is called with `body.name`, `body.email`, `body.picture`, but the client only sends `userid` and `credentials`, so the stored session user is `{ name: undefined, email: undefined, picture: undefined }`.
- `console.log("SERVER", body)` writes the user's profile (PII) to server logs.
**Fix**: use `serverSupabaseUser(event)`; drop the body fields; remove the log.

## High

### 5. Level numbers disagree between screens
> **FIXED** — both screens now show index + 1.

Levels are 0-based in the data. The dashboard shows `"Level " + currentLevel.level` (starts at **Level 0**) while the setup page shows `level.level + 1`.

### 6. Timer problems (`index.vue`)
> **FIXED** (except cross-device sync) — timer uses an absolute end timestamp (no drift), auto-advances with a beep, stops at the end of the schedule, restores correctly (numbers, not strings; clamps if blinds changed), clears its interval on unmount, and stores only the level index. State is still per browser; server-backed runs are Roadmap Phase 1.

- A timer restored from localStorage is a **string**; `this.timer === 0` never matches a string `"0"`, so a stored `"0"` counts down into negative numbers.
- When it reaches 0 the interval is cleared and nothing happens: no alarm, no auto-advance, and pressing play does nothing. Next level must be clicked manually, which also re-creates the interval.
- `setInterval` decrementing once per tick drifts and is throttled in background tabs (a phone on the table will lose time). It should compare against a stored end timestamp.
- The interval is never cleared when the component unmounts (no `beforeUnmount`), so navigating Dashboard -> Setup -> Dashboard leaves old intervals running.
- `currentLevel` is stored as a full snapshot in localStorage, so changing blinds on the setup page does not affect a level that is already cached.
- All running state is per browser; a refresh pauses the clock and a second device sees nothing.

### 7. Blind schedule indexing breaks after removing a level (`setup.vue`)
> **FIXED** — rows bind by array index, levels are renumbered on add/remove (and server-side on save), the last level cannot be removed.

`addBlind` assigns `level: blinds.length`, rows bind to `tournament.blinds[level.level]`, and `saveBlindOptions` writes to `blinds[selected.level]`, but `removeBlind` splices without renumbering. After removing any level other than the last, `blinds[level.level]` is `undefined` or the wrong row (blank inputs, edits landing on the wrong level), duplicate level numbers appear on the next add, and the dashboard's `find(level + 1)` skips levels.
**Fix**: renumber on every change and bind by array index.

### 8. Chip editing indexes by `id` rather than position
> **FIXED** — chips are edited by position; new ids are max+1; duplicate ids from old data are repaired on load.

`addChip` uses `id = chipset.length`; `removeChip` splices by array index, so ids collide after a removal; `saveChipOptions` writes to `chipset[selectedChip.id]`, which can overwrite or create a hole at the wrong slot.

### 9. Secondary colour grows an extra `#` each save
> **FIXED** — colours go through one `hex()` normaliser; old `##fff` values are repaired on load and the server rejects malformed colours.

`saveChipOptions` unconditionally does `secondarycolour = '#' + secondarycolour`, turning the default `"#fff"` into `"##fff"`, then `"###fff"`, etc. (It is not rendered today, which is why nobody noticed.)

### 10. Places-paid / split logic is fragile
> **FIXED** — split length follows *Places paid* via a watcher, rows are keyed by index, the total is shown and turns red when it isn't 100%. (Not enforced, so autosave never blocks mid-edit.)

- The `addSplit` / `removeSplit` handlers hang off the *icon span* inside the input's buttons, not the buttons. Clicking the button's padding, or typing a number in the field, changes `placesPaid` without resizing `split`.
- `:key="tournament.money.split"` gives every row the same key (the array object), which causes Vue key warnings and re-render glitches.
- Nothing validates that the split totals 100%, and there is no prize-pool calculation anywhere.

## Medium

### 11. Auth plumbing is duplicated and incomplete
> **MOSTLY FIXED** — session plumbing removed from the code and `nuxt.config.ts`. Still to do by hand: `npm uninstall nuxt-auth-utils` (see Hygiene below).

Both `nuxt-auth-utils` (`setUserSession`) and `@nuxtjs/supabase` are installed. Only Supabase auth is actually used for access control. `default.vue` calls `useUserSession()` and uses nothing from it; logout (`AppHeader.vue`) only signs out of Supabase, leaving the nuxt-auth-utils cookie behind. The login failure path shows `alert('Bad credentials')` for every kind of failure, and the `.catch` also swallows navigation errors.

### 12. `definePageMeta` does nothing in `index.vue` and `setup.vue`
> **FIXED** — both pages use `<script setup>` with a real `definePageMeta`.

It is written as a property of the Options-API export instead of being called in a `<script setup>`, so titles/layout are not applied (the default layout happens to be right anyway).

### 13. Setup auto-save watcher is registered outside component setup
> **FIXED** — watchers live in setup scope (auto-stopped), the debounce is cleared on unmount, and edits are made on a local copy, not the shared store.

`watch(...)` is called inside `mounted()` so it is never stopped on unmount; the pending debounce timer is not cleared either. Also `reactive(tournamentStore.data[0])` makes edits mutate the shared Pinia state directly, which hides whether a save succeeded.

### 14. `starting_stack` is bound to a text input
> **FIXED** — numeric input; the API coerces/validates it as an integer.

`<InputText v-model="tournament.starting_stack">` stores a string; the JSON column ends up with mixed number/string values.

### 15. Header issues (`AppHeader.vue`)
> **FIXED** — header uses `useSupabaseUser()`, only renders when signed in, items without a route render as plain links, League is shown disabled, Settings has a cog icon.

- `user` is initialised to an object, so `v-if="user"` is always true and the bar renders before the user loads; `mounted()` does `user.user_metadata` which throws if the session is gone.
- Menu items without `to` (Settings, Logout, League) are rendered through `<NuxtLink :to="undefined">`, which is likely to emit warnings; "League" has no route; the Settings menu uses a search icon.
- It re-fetches the user itself instead of using `useSupabaseUser()`.

### 16. Tailwind appears not to be wired up (confidence: medium)
> **OPEN / UNVERIFIED** — needs a look in the browser; not changed.

Tailwind 4 and `tailwindcss-primeui` are installed and the templates use utility classes (`flex items-center`, `ml-auto`, `justify-end gap-2`), but there is no postcss/Vite Tailwind plugin config in the project root and `main.css` has no `@import "tailwindcss"`. If confirmed, those classes do nothing. Check visually in the browser.

### 17. Dialog close paths
> **FIXED** — dialog bodies are guarded with `v-if` and the selection is no longer nulled while the dialog animates out.

In `setup.vue`, Cancel sets `selectedBlindLevel` / `selectedChip` to `null` while the PrimeVue dialog is still animating out, whose template reads `selectedBlindLevel.blinds[...]` / `selectedChip.value`. Likely a transient console `TypeError` (confidence: medium).

## Low / hygiene

> Status 2026-10-14 — **fixed:** `PokerChip` prop default; routes now `throw createError`; dashboard stub icons are disabled with a "coming soon" tooltip; debug `console.log`s removed from every file touched. **Still open:** unused dependencies (command below), `vue: "latest"`, no `.env.example`, no ESLint, no CI, accessibility of the icon controls (clickable `<div>`s), fixed px font sizes, single-tournament assumption, README.
>
> Dependency clean-up (run on your machine, not done by me because your `node_modules` is Windows-built): `npm uninstall nuxt-auth-utils vuetify vuetify-nuxt-module vite-plugin-vuetify @mdi/font pg postgres @primevue/forms` then pin `vue` to the installed version.

- **Stubs presented in the UI**: Add Player / Knock Out Player icons on the dashboard do nothing useful; seating settings are saved but unused; `<Toast/>` is mounted but never used.
- **Dead dependencies and config**: vuetify, pg, postgres, `DATABASE_URL` runtime config, etc. (list in `ARCHITECTURE.md`).
- **`vue: "latest"`** is unpinned; the Nuxt 3 / `compatibilityVersion: 4` combination should be re-checked on upgrade.
- **`PokerChip.vue`**: `secondaryColour` prop uses `value:` instead of `default:` and is unused.
- **No `.env.example`, no lint config** (the `lint` scripts reference ESLint, which is not installed), **no tests, no CI**.
- **Accessibility / mobile**: control icons are clickable `<div>`s (not buttons, no keyboard or aria support); timer font sizes are fixed px, so the dashboard will not scale for a TV or a phone.
- **Debug output**: several `console.log` calls (`SERVER` body, tournament object, auto-save payload, login result).
- **README** is the Nuxt template.
- **`tournament.get`/`savetournament` return `createError(...)`** instead of throwing it. h3 normally handles a returned Error, but throwing is the clearer, conventional form.
- **Single-tournament assumption**: `update(...).eq('user_id', …)` has no row id, so any future second tournament per user would be updated together.
