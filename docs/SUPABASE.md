# Step-by-step: Set up Supabase for this app

This guide gets you from zero to a working PostgreSQL database and connection strings for **Future AI**.

---

## 1. Create a Supabase account and project

1. Go to **[supabase.com](https://supabase.com)** and sign in (or create an account).
2. Click **New project**.
3. Choose your **organization** (or create one).
4. Fill in:
   - **Name** — e.g. `future-ai` (any name you like).
   - **Database password** — choose a strong password and **save it somewhere safe**. You’ll use it in `.env`.  
     If it contains `@`, `#`, `%`, `/`, `:`, `?`, or `&`, you’ll need to [URL-encode](#password-with-special-characters) it later.
   - **Region** — pick one close to you or your users.
5. Click **Create new project** and wait until the project is ready (usually 1–2 minutes).

---

## 2. Get the connection strings

You need **two** URLs: one for the app at runtime (port **6543**, transaction mode) and one for migrations (port **5432**, session or direct).

### Option A: Use the Connect button (easiest)

1. In the Supabase dashboard, open your **project** (not org settings).
2. On the project overview page, click the **Connect** button (top right, or near the project name).
3. In the connection dialog/modal you’ll see connection methods. Look for:
   - **Transaction** or **Connection pooling → Transaction mode** — this uses **port 6543**. Copy that URI. Add **`?pgbouncer=true`** at the end → this is your **`DATABASE_URL`**.
   - **Session** or **Connection pooling → Session mode** (or **Direct**) — this uses **port 5432**. Copy that URI as-is → this is your **`DIRECT_URL`**.
4. If you don’t see “Transaction”, choose **URI** and check the dropdown or tabs for “Transaction mode” / “Session mode”. The port in the host URL is the key: **6543** = transaction (app runtime), **5432** = session/direct (migrations).

### Option B: From Project Settings

1. In the Supabase dashboard, open your project.
2. Go to **Project Settings** (gear icon in the left sidebar) → **Database**.
3. Scroll to **Connection string** (or **Connection info**).
4. Select the **URI** tab. You may see a dropdown to switch between:
   - **Transaction** (port **6543**) → use for **`DATABASE_URL`** and add **`?pgbouncer=true`** at the end.
   - **Session** (port **5432**) → use for **`DIRECT_URL`** as-is.
5. If the dropdown only shows one mode, copy that one. Then change the **port** in the URL manually:
   - For **`DATABASE_URL`**: use port **6543** and add **`?pgbouncer=true`** at the end.
   - For **`DIRECT_URL`**: use port **5432** and no extra query string.

### Build the 6543 (transaction) URL if you only have 5432

If the dashboard only gives you a URL with port **5432**, you can build the **6543** one for the app:

1. Copy the Session/Direct URI (port 5432). It will look like one of:
   - `postgres://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`
   - `postgresql://postgres.[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
2. For **`DATABASE_URL`** (app runtime), change the port from **5432** to **6543** and add **`?pgbouncer=true`** at the end:
   - Pooler style: `postgres://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
   - Direct-style host: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true`
3. Use the **same** project ref, password, and region (or host) in both URLs. Only the **port** and `?pgbouncer=true` differ.

**Replace `[YOUR-PASSWORD]`** in both URLs with the database password you set in step 1. If the password has special characters, see [Password with special characters](#password-with-special-characters) below.

---

## 3. Put the URLs in `.env`

1. In your **Future AI** project root (same folder as `package.json`), open `.env` (create it from `.env.example` if needed).
2. Set:

   ```bash
   DATABASE_URL="postgres://postgres.[PROJECT-REF]:YOUR_PASSWORD_HERE@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgres://postgres.[PROJECT-REF]:YOUR_PASSWORD_HERE@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   ```

   Use your real project ref, region, and password. Both URLs must use the **same** password.

3. Save the file.

---

## 4. Run Prisma migrations

From the project root:

```bash
npx prisma migrate deploy
```

- If you see **P1013** or “invalid domain character”, your password contains special characters. URL-encode it in both URLs (see below).
- If it succeeds, the `User` and `SavedChart` tables now exist in Supabase.

---

## 5. Confirm it works

1. Start the app: `npm run dev`.
2. Open the app (e.g. [http://localhost:8066](http://localhost:8066)).
3. Create an account or sign in with Google (if configured). If sign-in and saving charts work, Supabase is set up correctly.

---

## Password with special characters

If your database password contains any of these: `@` `#` `%` `/` `:` `?` `&`

you must **URL-encode** only the password part in both `DATABASE_URL` and `DIRECT_URL`:

| Character | Use in URL |
|-----------|------------|
| `@`       | `%40`      |
| `#`       | `%23`      |
| `%`       | `%25`      |
| `/`       | `%2F`      |
| `:`       | `%3A`      |
| `?`       | `%3F`      |
| `&`       | `%26`      |

Example: password `my@pass#1` → in the URL use `my%40pass%231`.

---

## Quick reference

| What              | Where in Supabase                    |
|-------------------|--------------------------------------|
| Connection strings| Project Settings → Database → Connection string (URI) |
| Transaction (6543)| Use for `DATABASE_URL` + `?pgbouncer=true` |
| Session/Direct (5432) | Use for `DIRECT_URL`            |
| Reset DB password | Project Settings → Database → Reset database password |

For app env vars and auth, see **[SETUP.md](SETUP.md)**.
