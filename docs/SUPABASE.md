# Supabase Notes

> Last verified against the live project: 2026-10-14.

## Projects

| Project | Ref | Region | Status |
|---|---|---|---|
| **The Family Pot** (current) | `xddlhansbkjhvbztecyq` | eu-west-1, Postgres 17 | Active — API URL `https://xddlhansbkjhvbztecyq.supabase.co` |
| Family Pot (original, 2025-05-08) | `aoyjlyduqnljltfwnfmu` | eu-west-2 | **Paused >400 days, cannot be restored via API.** Treat as dead. |

The original project's schema was never exported, so it is unrecoverable from here; the current schema was rebuilt from what the app's code needs. (If you ever download a backup of the old project from the dashboard, compare it against this schema for anything missed — e.g. extra columns.)

## Phase 0.5 migration status (groups, roles, currency) — complete

| Migration file | Live status | What it does |
|---|---|---|
| `20261014_initial_schema_profiles_tournaments.sql` | Applied | profiles, tournaments, RLS, signup trigger, `addUserLogin` |
| `20261014b_groups_part1_tables.sql` | Applied (as `groups_and_currency_part1_tables`) | `groups`, `group_members`, `tournaments.group_id` / `currency`; backfilled a personal group per user and moved their tournament into it |
| `20261014c_groups_part2_ownership_rls.sql` | **Applied 2026-10-15** (run by the owner in the SQL Editor, so it is not in the connector's migration history table) | Tournaments owned by groups; `user_id` -> `created_by`; `money.buyIn` -> `money.buyInMinor`; role-based RLS via `private.has_group_role()`; personal group provisioned on signup / login |

Verified live after applying: `tournaments` has `created_by, group_id, currency`; 12 policies in place (groups 3, group_members 3, profiles 2, tournaments 4); `private.has_group_role` and `private.ensure_personal_group` exist; the existing tournament is `GBP` with `buyInMinor = 1000` inside "Vincent's Family Pot" (owner); advisors show no new findings. Tenant isolation, roles and provisioning were also tested beforehand on a local Postgres 16 with a mocked Supabase auth schema.

**Tooling note:** the Supabase connector in this session hangs on any SQL containing a top-level `DROP` (it appears to wait for a destructive-statement confirmation). Non-destructive DDL works normally. Destructive migrations: run them in the SQL Editor (or approve the prompt if your app shows one).

**Advisor notes (2026-10-15):** `rls_auto_enable()` and `addUserLogin` are callable by signed-in users (expected for `addUserLogin`; `rls_auto_enable` is Supabase-provided); "leaked password protection disabled" only matters once email/password sign-in is offered; two INFO items — unindexed `created_by` foreign keys on `groups` / `tournaments` (cheap to add later).

## Connecting the app (manual step — secrets stay out of the repo)

Put these in the git-ignored `.env`:

```
SUPABASE_URL=https://xddlhansbkjhvbztecyq.supabase.co
SUPABASE_KEY=<publishable key: Dashboard -> Settings -> API Keys, "sb_publishable_…" or the legacy anon key>
GOOGLE_CLIENT_ID=<unchanged>
```

Never put a service-role / secret key in `SUPABASE_KEY`.

**Still to do in the Supabase dashboard (cannot be done from the connector):**
1. Authentication -> Providers -> **Google**: enable, paste the Google OAuth client ID (same one as `GOOGLE_CLIENT_ID`) and client secret. For `signInWithIdToken` the client ID must match the web client used by the sign-in button.
2. Authentication -> URL Configuration: set Site URL to your dev/prod origin and add `http://localhost:3000/confirm` (and your prod URL) to the redirect allow-list.
3. In Google Cloud Console, ensure the authorised JavaScript origins include your dev/prod origins.

## Schema (applied as migration `initial_schema_profiles_tournaments`)

SQL is in `supabase/migrations/20261014_initial_schema_profiles_tournaments.sql`. The project's migration history currently contains only this one migration.

### `public.profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK -> `auth.users(id)` on delete cascade | |
| `first_name`, `surname`, `picture` | text | From Google profile |
| `created_at`, `updated_at` | timestamptz | `updated_at` maintained by trigger |

### `public.groups` and `public.group_members`

| `groups` column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text (1–100) | default for a new user: "<First name>'s Family Pot" |
| `currency` | text, `^[A-Z]{3}$` | default `GBP` (ISO 4217) |
| `timezone` | text | default `Europe/London` |
| `created_by` | uuid -> `auth.users` (set null) | |
| `created_at`, `updated_at` | timestamptz | |

`group_members (group_id, user_id, role, created_at)` — PK `(group_id, user_id)`; `role` is `owner`, `director` or `viewer`.

### `public.tournaments`

| Column | Type | Default / notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` — the API addresses rows by id |
| `group_id` | uuid NOT NULL -> `groups` (cascade) | ownership; many tournaments per group are allowed |
| `created_by` | uuid -> `auth.users` (set null) | was `user_id` |
| `title`, `description` | text | `'My Tournament'`, `''` |
| `starting_stack` | integer | `10000` |
| `currency` | text, `^[A-Z]{3}$` | `GBP` |
| `chipset` | jsonb array | 4 chips: 25 / 100 / 500 / 1000 |
| `blinds` | jsonb array | 8 levels, 100/200 -> 2000/4000, 20 min, **0-based `level` equal to array index** |
| `money` | jsonb object | `{"buyInMinor":1000,"placesPaid":3,"split":[50,30,20]}` — **buy-in in minor units (pence)** |
| `seating` | jsonb object | `{"enabled":false,"seats":9}` |
| `created_at`, `updated_at` | timestamptz | trigger-maintained |

### Functions & triggers

| Object | Purpose |
|---|---|
| trigger `on_auth_user_created` -> `handle_new_user()` | On signup: inserts the profile from Google metadata and calls `private.ensure_personal_group`. `SECURITY DEFINER`, execute revoked from API roles. |
| `private.ensure_personal_group(user, first_name)` | Idempotent: returns the user's oldest group, creating group + owner membership if none, and a default tournament if the group has none. Not callable through the API. |
| `private.has_group_role(group_id, roles[])` | RLS helper (`SECURITY DEFINER`, in the non-exposed `private` schema): is the current user a member of the group with one of these roles? |
| `"addUserLogin"(auserid, afirstname, asurname, picture)` | Called by `/api/login` through `rpc`. Identity from `auth.uid()` (raises on mismatch / unauthenticated); upserts the profile without erasing stored values with nulls; ensures the personal group. `authenticated` only. |
| `set_updated_at()` + triggers | Maintains `updated_at` on profiles, groups, tournaments. |

### Row level security

Enabled on every table. Roles: **owner** (everything in the group), **director** (edit tournaments), **viewer** (read only).

- `groups`: select for members; update / delete for owners. No insert policy (groups are created by the provisioning function).
- `group_members`: select for members of the same group; update for owners; delete for owners or yourself (leave). No insert policy yet (invites will add it).
- `tournaments`: select for members; insert / update / delete for owners and directors.
- `profiles`: select / update own row.
- All policies are `to authenticated` and use `(select auth.uid())` via the helper for plan caching. `anon` sees nothing.

### Verified behaviour (tested in a rolled-back transaction)

- Inserting an `auth.users` row creates exactly one profile, one personal group (owner membership) and one default tournament.
- `addUserLogin` as that user updates the profile; calling it with a different user id is rejected with `user id mismatch`.

## Advisors (security / performance)

Performance: no findings. Security: two expected warnings —

- `public."addUserLogin"` is callable by `authenticated`: intentional (it validates `auth.uid()` internally).
- `public.rls_auto_enable()` is callable by `anon` and `authenticated`: this is a **Supabase-provided helper that existed on the new project**, not part of our schema. Review it in the dashboard and revoke execute if you don't use it (`revoke execute on function public.rls_auto_enable() from anon, authenticated;`). It was left untouched.

## App-side security (done 2026-10-14)

- `/api/login` no longer trusts the request body: identity and profile data come from the verified Supabase session (`server/utils/auth.ts` -> `requireUser`), and the RPC re-checks `auth.uid()`.
- `/api/tournament` and `/api/savetournament` return 401 without a session, whitelist and validate fields (a client cannot write `group_id`/`created_by`/`id`), and surface database errors instead of reporting success.
- `NUXT_SESSION_PASSWORD` is no longer needed.

## Working with the schema going forward

- Make every change as a new file in `supabase/migrations/` and apply it (Supabase connector or CLI) so the repo stays the source of truth.
- Regenerate TypeScript types after schema changes (CLI: `npx supabase gen types typescript --project-id xddlhansbkjhvbztecyq > app/types/database.types.ts`).
- Re-run the Supabase security advisors after any DDL change.
- Planned relational model (see ROADMAP): `tournament_runs`, `players`, `entries`, `eliminations`, `tables`/`seats`, `leagues`/`seasons`, with RLS on each and Realtime on `tournament_runs`.
