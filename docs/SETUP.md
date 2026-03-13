# How to set up this app

Step-by-step instructions to run **Future AI** (natal chart app) locally or deploy it.

## Prerequisites

- **Node.js** 20+ and **npm**
- A **PostgreSQL** database (e.g. [Supabase](https://supabase.com)) — **[Step-by-step Supabase setup →](SUPABASE.md)**
- (Optional) **Google** and/or **GitHub** OAuth apps if you want “Sign in with Google” / “Sign in with GitHub”

---

## 1. Clone and install

```bash
git clone <your-repo-url>
cd future-ai-app

npm install
# or
make install
```

---

## 2. Environment variables

Copy the example env file and edit it:

```bash
cp .env.example .env
```

Edit `.env` and set the following.

### Required

| Variable       | Description |
|----------------|-------------|
| `DATABASE_URL` | PostgreSQL connection string for **runtime**. With Supabase: use the **Transaction** pooler (port **6543**) and append **`?pgbouncer=true`**. |
| `DIRECT_URL`   | PostgreSQL connection string for **migrations**. With Supabase: use **Session** or **Direct** (port **5432**). |
| `AUTH_SECRET`  | **Required.** Secret for NextAuth (sessions, cookies). If missing or empty, Google sign-in will show “server configuration” error. Run `npx auth secret` and paste the output as the value (no quotes). If you see 500 on `/api/auth/session`, open http://localhost:8066/api/auth/debug to confirm the server sees `AUTH_SECRET`; if it says MISSING, fix `.env` and restart. |
| `AUTH_URL`     | Full base URL of your app (required for OAuth). Local: `http://localhost:8066`. Production: `https://yourdomain.com` |

**Supabase:** For a full step-by-step, see **[docs/SUPABASE.md](SUPABASE.md)**. In short: Dashboard → Project Settings → Database. Use:

- **Transaction mode** (port 6543) → `DATABASE_URL` (add `?pgbouncer=true`)
- **Session/Direct** (port 5432) → `DIRECT_URL`

Example pattern:

```bash
DATABASE_URL="postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
AUTH_SECRET="<output of npx auth secret>"
```

**If you get “invalid domain character” (P1013):** Your database password contains characters that are special in URLs (`@`, `#`, `%`, `/`, `:`, etc.). **URL-encode the password** in both `DATABASE_URL` and `DIRECT_URL`:

| Character | Use instead |
|-----------|-------------|
| `@`       | `%40`       |
| `#`       | `%23`       |
| `%`       | `%25`       |
| `/`       | `%2F`       |
| `:`       | `%3A`       |
| `?`       | `%3F`       |
| `&`       | `%26`       |

Example: password `p@ss#word` → use `p%40ss%23word` in the URL.

### Optional (OAuth)

To enable “Sign in with Google” and “Sign in with GitHub” on the login/register pages, set:

| Variable              | Description |
|-----------------------|-------------|
| `AUTH_GOOGLE_ID`      | Google OAuth 2.0 Client ID |
| `AUTH_GOOGLE_SECRET`  | Google OAuth 2.0 Client secret |
| `AUTH_GITHUB_ID`      | GitHub OAuth App Client ID |
| `AUTH_GITHUB_SECRET`  | GitHub OAuth App Client secret |

**Google:** [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create OAuth 2.0 Client ID (Web application). Add authorized redirect URI:

- Local: `http://localhost:8066/api/auth/callback/google`
- Production: `https://<your-domain>/api/auth/callback/google`

**GitHub (step-by-step):** see **[GITHUB_OAUTH.md](GITHUB_OAUTH.md)** for a detailed walkthrough of creating the OAuth app and wiring the env vars.

If these are not set, the app still runs; auth buttons simply won’t appear.

---

## 3. Run database migrations

Apply the Prisma migrations so the database has the right tables (`User`, `SavedChart`):

```bash
npx prisma migrate deploy
```

(Requires `DIRECT_URL` or `DATABASE_URL` in `.env`; the CLI uses `prisma.config.ts`.)

---

## 4. Run the app

**Development:**

```bash
npm run dev
# or
make dev
```

Open [http://localhost:8066](http://localhost:8066). You can use the chart and “today’s chart” without an account. Use **Sign in** / **Create account** to save charts (requires the database and auth env vars above).

**Production build:**

```bash
npm run build
npm run start
# or
make build
make start
```

---

## 5. Summary checklist

- [ ] Dependencies installed (`npm install` or `make install`)
- [ ] `.env` created from `.env.example`
- [ ] `DATABASE_URL` and `DIRECT_URL` set (e.g. from Supabase)
- [ ] `AUTH_SECRET` set (`npx auth secret`)
- [ ] (Optional) `AUTH_GOOGLE_*` and/or `AUTH_GITHUB_*` set for OAuth
- [ ] Migrations applied (`npx prisma migrate deploy`)
- [ ] App running (`npm run dev` or `make dev`)

---

## Deployment

For deploying to **Vercel** and more detail on Supabase (pooler, direct URL, where data lives), see **[DEPLOYMENT.md](DEPLOYMENT.md)**.
