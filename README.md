# Future AI

A Next.js app from **Future AI** that generates **natal charts** using Western astrology (whole sign houses, tropical zodiac). Enter birth date, time, and place to see planetary positions, house cusps, and a chart wheel. Create an account to save charts with labels and manage them from a dashboard.

## Tech stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- NextAuth (credentials)
- Prisma + Supabase (PostgreSQL)

## Getting started

For full setup (env vars, database, OAuth), see **[docs/SETUP.md](docs/SETUP.md)**.

```bash
# Install dependencies
npm install
# or
make install

# Set up environment: copy .env.example to .env and add your Supabase URLs + AUTH_SECRET
cp .env.example .env
# Fill in DATABASE_URL and DIRECT_URL from Supabase Dashboard → Project Settings → Database
# Generate AUTH_SECRET: npx auth secret

# Apply migrations to Supabase (requires DIRECT_URL or DATABASE_URL in .env)
npx prisma migrate deploy

# Run development server
npm run dev
# or
make dev
```

Open [http://localhost:8066](http://localhost:8066). You can use the chart tool without an account. **Sign up** to save charts with labels (e.g. “My chart”, “Partner’s chart”) and view them on your **Dashboard**.

## Scripts

| Command       | Description              |
|---------------|--------------------------|
| `npm run dev` | Start dev server         |
| `npm run build` | Production build       |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint              |

Or use the Makefile: `make dev`, `make build`, `make start`, `make lint`, `make install`, `make clean`.

## Project structure

- **`app/`** — Pages (home, chart, chart/[id], dashboard, login, register)
- **`app/api/`** — Auth (register, NextAuth), charts (list, create, get, delete)
- **`components/`** — React components (home, chart, ui, layout, providers)
- **`hooks/`** — `useChartCalculation`, `useGeocoding`
- **`lib/`** — Astro calculations, geocoding, db (Prisma), utilities
- **`prisma/`** — Schema (User, SavedChart), migrations

## Deployment & database

The app uses **Supabase** (PostgreSQL) for persistence. Prisma connects via the **Supavisor pooler** (`DATABASE_URL`, transaction mode with `?pgbouncer=true`) at runtime, and uses **direct/session** connection (`DIRECT_URL`) for migrations. Works locally and on **Vercel** — set `DATABASE_URL`, `DIRECT_URL`, and `AUTH_SECRET` in your environment. See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for Supabase setup and Vercel deployment.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Deploy on Vercel](https://nextjs.org/docs/app/building-your-application/deploying)
