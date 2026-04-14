# Future AI

*Natal charts — Western astrology, whole sign houses, tropical zodiac.*

Next.js app: birth date, time, and place → planetary positions, houses, chart wheel, and placement tables.

## Quick start

```bash
make install
make dev
```

Open [http://localhost:8066](http://localhost:8066).

## Development vs production

| Command | What it does |
|--------|----------------|
| `make dev` | `next dev` — serves **current source** (hot reload). |
| `make build` | Production build into `.next` (runs `prisma generate` first). |
| `make server` | `next start` — serves the **last** production build only. |

`make server` does not compile your latest edits. Run `make build` before `make server` whenever you want production mode to match recent changes:

```bash
make build && make server
```

Both dev and production use **port 8066**; only one can listen at a time.

## Common commands

- `make dev` — development server
- `make build` — production build
- `make server` — run production server (after `make build`)
- `make lint` / `make typecheck` / `make test` — quality checks (`make check` runs all three)
- `make generate` — Prisma client from schema
- `make migrate` — apply migrations (needs `DATABASE_URL` / `DIRECT_URL` in `.env`)
- `make migrate-dev` — create/apply migrations in development
- `make clean` — remove `.next` and `node_modules`

Stripe and Astro Coins setup: [docs/STRIPE.md](docs/STRIPE.md).

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Prisma, Vitest.

<br>

---

## TODO

<br>

- training / fine-tuning the AI for astro
- infra, deplopyment, etc.

