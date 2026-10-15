# Family Pot

A poker tournament manager: blind-level clock, tournament setup (blinds, chips, buy-in, payouts, seating) and, soon, live runs with players, knock-outs and a TV display. Built for home games, designed to be shared across groups.

**Stack:** Nuxt 3 (source in `app/`), PrimeVue 4, Pinia, Supabase (Postgres + Auth, Google sign-in).

## Getting started

Requirements: Node 20+ and a Supabase project.

```bash
npm install
cp .env.example .env     # then fill in the values
npm run dev              # http://localhost:3000
```

### Supabase setup

1. Create a Supabase project and run the files in `supabase/migrations/` in order (SQL Editor or Supabase CLI).
2. In the dashboard enable the **Google** provider (Authentication -> Providers) with your OAuth client ID and secret, and add your site URL and `/confirm` to the redirect allow-list.
3. Put the project URL, **publishable** key and Google client ID in `.env`.

Full details: [`docs/SUPABASE.md`](docs/SUPABASE.md).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (exposed on the network, handy for testing on a phone) |
| `npm run build` / `npm run preview` | Production build / preview |
| `npm test` | Unit tests (Node's built-in runner) |
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run typecheck` | Type-check with `vue-tsc` |

## Project layout

```
app/        Pages, components, composables, Pinia store, pure utils (timer, money)
server/     Nitro API routes (auth-checked, validated) and helpers
supabase/   SQL migrations (source of truth for the schema)
tests/      Unit tests
docs/       Architecture, current state, bugs, Supabase notes, roadmap
```

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) – structure and request flows
- [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) – what works and what is stubbed
- [`docs/BUGS.md`](docs/BUGS.md) – known defects
- [`docs/SUPABASE.md`](docs/SUPABASE.md) – schema, RLS, setup checklist
- [`docs/ROADMAP.md`](docs/ROADMAP.md) – planned phases

## Notes

- Never commit `.env`. Use only the publishable Supabase key in the app; it must never be a service-role key.
- Money is stored as integer minor units (pence for GBP); currency is per tournament, GBP by default.
- Hosting is undecided; the app is kept host-agnostic (Nitro presets).
