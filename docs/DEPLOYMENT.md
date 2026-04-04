# Database & deployment (Supabase + Vercel)

## How the database works

### Storage model

- **Database:** PostgreSQL hosted on **Supabase**.
- **Where data lives:** In Supabase’s cloud (their Postgres instance). Nothing is stored on the app server or in repo.
- **How the app talks to it:** Prisma 7 uses the **Pg adapter** (`@prisma/adapter-pg`). At runtime, `lib/db.ts` creates a `PrismaPg` adapter with `DATABASE_URL` and passes it into `new PrismaClient({ adapter })`. All Prisma calls (auth, saved charts) go over the network to Supabase.

### Two URLs (Supabase + serverless)

Supabase exposes:

1. **Transaction pooler (port 6543)** — for serverless / many short-lived connections. Use this as **`DATABASE_URL`** in the app. The URL must include **`?pgbouncer=true`** so Prisma works with the pooler.
2. **Direct / session (port 5432)** — for migrations and long-lived connections. Use this as **`DIRECT_URL`**. Prisma CLI uses it via `prisma.config.ts` when you run `prisma migrate deploy` (or `migrate dev`).

So:

- **Runtime:** App uses `DATABASE_URL` (pooler, port 6543, `?pgbouncer=true`).
- **Migrations:** `prisma.config.ts` uses `DIRECT_URL ?? DATABASE_URL`, so `prisma migrate` runs against the direct/session URL (port 5432) when `DIRECT_URL` is set.

### Flow

1. **Env:** Set `DATABASE_URL` and (for migrations) `DIRECT_URL` from Supabase Dashboard → Project Settings → Database. Set `AUTH_SECRET` for NextAuth.
2. **Runtime:** `lib/db.ts` builds `PrismaPg` with `DATABASE_URL` and instantiates `PrismaClient`. All API routes that use `prisma` hit Supabase Postgres.
3. **Migrations:** Run `npx prisma migrate deploy` (or `migrate dev`). The CLI reads `prisma.config.ts` and uses `DIRECT_URL` (or `DATABASE_URL`) to apply migrations. Tables: `User`, `SavedChart`.
4. **Persistence:** Data lives in Supabase. It’s persistent and shared across all app instances (e.g. every Vercel serverless invocation).

---

## Supabase setup

1. **Create a project** at [supabase.com](https://supabase.com). Note the project ref and region.

2. **Get connection strings** (Dashboard → Project Settings → Database):
   - **Transaction mode** (Supavisor, port **6543**): use for `DATABASE_URL`. Append **`?pgbouncer=true`**.
   - **Session mode or Direct** (port **5432**): use for `DIRECT_URL` (migrations).

   Example pattern:

   ```bash
   DATABASE_URL="postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   ```

   Replace `[PROJECT-REF]`, `[PASSWORD]`, and `[REGION]` with your project’s values. (Optional: create a dedicated DB user for Prisma and use that in the URLs; see [Supabase Prisma guide](https://supabase.com/docs/guides/database/prisma).)

3. **Run migrations** (after setting `.env`):

   ```bash
   npx prisma migrate deploy
   ```

4. **App:** Ensure `AUTH_SECRET` is set. Run the app; it will use `DATABASE_URL` to talk to Supabase.

---

## Deploying on Vercel

1. **Build:** The app builds without a live DB. No change needed to the build command.

2. **Environment variables** (Vercel → Project → Settings → Environment Variables):
   - `DATABASE_URL` — Supabase **transaction** pooler URL with `?pgbouncer=true`.
   - `DIRECT_URL` — Supabase **direct/session** URL (for running migrations; optional on Vercel if you run migrations from CI/local).
   - `AUTH_SECRET` — same as local (e.g. from `npx auth secret`).
   - (Optional) `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — astro coin Checkout; see **[STRIPE.md](STRIPE.md)**.

3. **Migrations:** Run them **before** or **after** deploy:
   - **Option A:** In a GitHub Action (or similar): run `npx prisma migrate deploy` with `DIRECT_URL` (and `DATABASE_URL`) set.
   - **Option B:** From your machine after deploy: `DIRECT_URL=... DATABASE_URL=... npx prisma migrate deploy`.
   - **Option C:** Add a post-deploy script that runs `prisma migrate deploy` (Vercel doesn’t run arbitrary scripts by default, so CI or a one-off job is usually clearer).

4. **Where data lives:** In **Supabase** only. Vercel only runs the app and stores env vars; all persistence is in Supabase Postgres.

---

## Summary

| Item              | Detail                                                                 |
|-------------------|------------------------------------------------------------------------|
| **Database**      | Supabase (PostgreSQL)                                                  |
| **App connection**| `DATABASE_URL` = transaction pooler (6543) + `?pgbouncer=true`         |
| **Migrations**    | `DIRECT_URL` (or `DATABASE_URL`) in `prisma.config.ts` → port 5432      |
| **Persistence**   | All data in Supabase cloud; works the same locally and on Vercel       |

To “make sure it works with Vercel”: use **Supabase** as above, set `DATABASE_URL` and `AUTH_SECRET` (and `DIRECT_URL` for migrations) in Vercel, and run `prisma migrate deploy` so the Supabase DB has the right tables.
