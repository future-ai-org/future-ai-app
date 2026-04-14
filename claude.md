# Future AI — Project context for Claude

## Overview

**Future AI** is a Next.js 16 app for generating **natal charts** (Western astrology, whole sign houses, tropical zodiac). Users enter birth date, time, and location; the app calculates planetary positions and house cusps and renders a chart wheel plus a table of placements.

## Tech stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **clsx** + **tailwind-merge** for class names

## Structure

- `app/` — App Router pages: home (`page.tsx`), chart (`chart/page.tsx`)
- `components/` — UI: `home/` (HeroSection), `chart/` (BirthDataForm, ChartResults, ChartWheel, PlanetTable, AscendantCard, CitySearch), `ui/` (Card, Button)
- `hooks/` — `useChartCalculation`, `useGeocoding`
- `lib/` — Astro math: `astro/` (calculate, houses, planets, draw, format, types, constants, math), `geocoding.ts`, `utils.ts`

## Conventions

- Use `@/` for imports (e.g. `@/components/...`, `@/lib/...`).
- Chart math lives in `lib/astro/`; keep calculations pure and typed.
- Geocoding is used for place → lat/lon (CitySearch + useGeocoding).

## Commands

- `make dev` or `npm run dev` — development server
- `make build` / `make start` — production build and run
- `make generate` — `prisma generate` (client from schema)
- `make migrate` — `prisma migrate deploy` (apply migrations; needs `DIRECT_URL` / `DATABASE_URL`)
- `make migrate-dev` — `prisma migrate dev` (local schema changes)
- `make lint` — ESLint
- `make typecheck` — TypeScript check
- `make test` — run tests (Vitest)
- `make install` — install dependencies
- `make clean` — remove `.next` and `node_modules`

**Astro coins / Stripe:** balance and ledger live in Postgres (`User.astroCoins`, `AstroCoinLedger`); setup is in **docs/STRIPE.md**.

## Pre-commit

Husky runs `lint-staged` on commit; staged `.ts`/`.tsx`/`.js`/`.jsx`/`.mjs` files are linted with ESLint (with fix).
