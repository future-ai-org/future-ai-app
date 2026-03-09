# Future AI App — Natal Chart

A Next.js app that generates **natal charts** using Western astrology (Placidus houses, tropical zodiac). Enter birth date, time, and place to see planetary positions, house cusps, and a chart wheel.

## Tech stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

## Getting started

```bash
# Install dependencies
npm install
# or
make install

# Run development server
npm run dev
# or
make dev
```

Open [http://localhost:8066](http://localhost:8066). Use the home page to go to the chart tool, enter birth data, and view the chart.

## Scripts

| Command       | Description              |
|---------------|--------------------------|
| `npm run dev` | Start dev server         |
| `npm run build` | Production build       |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint              |

Or use the Makefile: `make dev`, `make build`, `make start`, `make lint`, `make install`, `make clean`.

## Project structure

- **`app/`** — Pages (home, chart)
- **`components/`** — React components (home, chart, ui)
- **`hooks/`** — `useChartCalculation`, `useGeocoding`
- **`lib/`** — Astro calculations, geocoding, utilities

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Deploy on Vercel](https://nextjs.org/docs/app/building-your-application/deploying)
