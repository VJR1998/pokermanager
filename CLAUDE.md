# pokermanager — project guide for Claude

Poker tournament manager ("Family Pot"). Nuxt 3 (compat v4, source in `app/`) + PrimeVue 4 (Aura) + Pinia + Supabase (Google sign-in). Prototype stage.

## Product context
Commercial, multi-group app (not just a home game). Dashboard is mobile-first (phone = director/controller); the clock can be cast to a TV (read-only display view). Currency is configurable, GBP by default; store money as integer minor units. Keep the name "Family Pot". Hosting is undecided, so keep code host-agnostic. Decisions and consequences: `docs/ROADMAP.md`.

## Read first
- `docs/ARCHITECTURE.md` — structure, request flows, data shape
- `docs/CURRENT_STATE.md` — what works / what is stubbed
- `docs/BUGS.md` — known defects (numbered; reference them in commits)
- `docs/SUPABASE.md` — live schema, RLS, setup checklist (SQL in `supabase/migrations/`)
- `docs/ROADMAP.md` — planned phases

## Conventions
- Server routes in `server/api/*` start with `requireUser(event)` (`server/utils/auth.ts`; caller's JWT, so RLS applies), validate input, check `error` from Supabase and `throw createError(...)`.
- Timer rules live in `app/utils/blindTimer.ts` (pure, tested); `useBlindTimer` only wraps them.
- Use `<script setup lang="ts">` (all pages now do).
- Money is integer minor units (`money.buyInMinor`); convert/format only via `app/utils/money.ts`. Currency is per tournament (default GBP).
- Tournaments belong to groups (`group_id`); the API addresses them by `id` and RLS enforces roles. Never write `group_id`/`created_by` from the client.
- Never read or print `.env`; it holds secrets (git-ignored).
- Blind levels are 0-based in data and always equal their array index; display as `index + 1`.
- Keep docs in `docs/` updated when behaviour changes; tick items in ROADMAP.

## Commands
`npm run dev` (host-exposed dev server), `npm run build`, `npm run typecheck`, `npm test` (Node built-in runner; 28 tests: timer, money, save route). `lint` scripts exist but ESLint is not installed yet. Do not run npm from a Linux shell inside the project folder: `node_modules` was installed on Windows.
