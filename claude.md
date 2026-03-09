# Future AI App (Natal Chart)

## Project overview

Next.js 16 app for generating **natal charts** (Western astrology, Placidus houses, tropical zodiac). Users enter birth date, time, and location; the app calculates planetary positions and house cusps and renders a chart wheel plus a table of placements.

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
- `make lint` — ESLint
- `make install` — install dependencies
- `make clean` — remove `.next` and `node_modules`
