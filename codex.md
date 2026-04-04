# Future AI — Codebase overview (Codex)

High-level map of the repo for AI and human readers.

## Repo layout

```
future-ai-app/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Home
│   ├── chart/              # Chart generation page
│   ├── news/               # News (markdown-driven)
│   ├── predict/            # Predictions
│   └── ...                 # Auth, API routes, etc.
├── components/
│   ├── home/               # HeroSection, etc.
│   ├── chart/              # BirthDataForm, ChartWheel, PlanetTable, CitySearch, etc.
│   └── ui/                 # Card, Button, shared UI
├── hooks/                  # useChartCalculation, useGeocoding
├── lib/
│   ├── astro/              # Core astrology logic (pure, typed)
│   │   ├── calculate.ts    # Chart calculation entry
│   │   ├── houses.ts       # Whole sign houses
│   │   ├── planets.ts      # Planetary positions
│   │   ├── points.ts       # Ascendant, MC, etc.
│   │   ├── draw.ts         # Chart wheel drawing
│   │   ├── format.ts       # Display formatting
│   │   ├── validate.ts     # Date/year validation
│   │   ├── types.ts        # Shared types
│   │   └── ...
│   ├── geocoding.ts        # Place → lat/lon
│   ├── copy.ts             # Copy / content
│   └── utils.ts            # cn(), etc.
├── prisma/                 # Schema, migrations
├── .github/workflows/      # CI (lint, typecheck, test, build)
├── vitest.config.ts        # Vitest
├── eslint.config.mjs      # ESLint (Next.js)
├── CLAUDE.md               # Cursor project rules
├── claude.md               # Project context for Claude
└── codex.md                # This file
```

## Key entry points

- **Chart flow**: `app/chart/page.tsx` → `BirthDataForm` + `useChartCalculation` → `lib/astro/calculate.ts` → `ChartWheel` / `PlanetTable`.
- **Geocoding**: `CitySearch` uses `useGeocoding` → `lib/geocoding.ts`.
- **Auth**: NextAuth in `app/` (e.g. API routes, session).

## Testing

- **Runner**: Vitest (`vitest.config.ts`); path alias `@/` via `vite-tsconfig-paths`.
- **Where**: `**/*.{test,spec}.{ts,tsx}` (e.g. `lib/astro/validate.test.ts`).
- **CI**: `.github/workflows/ci.yml` runs lint, typecheck, `vitest run`, and build.

## Quality and automation

- **Lint**: ESLint (Next.js config); `npm run lint` / `npm run lint:fix`.
- **Typecheck**: `npm run typecheck` (`tsc --noEmit`).
- **Database**: `make migrate` (`prisma migrate deploy`), `make migrate-dev`, `make generate`; see **docs/SETUP.md** / **docs/DEPLOYMENT.md**. Astro coins + Stripe: **docs/STRIPE.md**.
- **Pre-commit**: Husky + lint-staged; ESLint --fix on staged TS/JS files.

## Docs

- **CLAUDE.md** — Cursor/conventions and commands.
- **claude.md** — Project context for Claude (overview, stack, commands).
- **codex.md** — This codebase map.
