## GitHub OAuth — step-by-step setup

Follow these steps to enable **“Sign in / sign up with GitHub”** in Future AI.

### 1. Create a GitHub OAuth app

1. Go to **GitHub → Settings → Developer settings → OAuth Apps** (`https://github.com/settings/developers`).
2. Click **“New OAuth App”**.
3. Fill in:
   - **Application name**: `future` (or anything you like)
   - **Homepage URL**:
     - Local dev: `http://localhost:8066`
     - Production: your site URL, e.g. `https://your-domain.com`
   - **Authorization callback URL**:
     - Local dev: `http://localhost:8066/api/auth/callback/github`
     - Production: `https://your-domain.com/api/auth/callback/github`
4. Click **“Register application”**.

You will now see:

- **Client ID**
- A button to **“Generate a new client secret”**

Click **“Generate a new client secret”** and copy the value.

### 2. Add env vars to `.env`

In your project root, edit `.env` (create it from `.env.example` if needed) and set:

```bash
AUTH_GITHUB_ID="<GitHub Client ID>"
AUTH_GITHUB_SECRET="<GitHub Client Secret>"
```

Make sure you already have:

```bash
AUTH_SECRET="<output of npx auth secret>"
AUTH_URL="http://localhost:8066"        # for local dev
# or your production URL, e.g.
# AUTH_URL="https://your-domain.com"
```

> The `AUTH_URL` must match the domain you put into GitHub’s **Homepage URL** / **Authorization callback URL** (same origin).

### 3. Restart the app

After changing `.env`, **restart** your dev server so Next.js and NextAuth see the new values:

```bash
npm run dev
# or
make dev
```

Then visit `http://localhost:8066/login` or `/register`:

- If `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` are set, you will see
  **“sign in with GitHub”** / **“sign up with GitHub”** buttons.
- If they are missing or invalid, the UI will show a configuration message instead.

### 4. How it works in this repo

- The main NextAuth config is in `auth.ts`. It conditionally adds the GitHub provider:
  - When `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` are set, GitHub is enabled.
  - Otherwise, it is skipped.
- The login/register pages call `/api/auth/providers` to detect which OAuth providers are available and only show buttons for the ones that are configured.

As long as your env vars match the GitHub app settings and `AUTH_SECRET` / `AUTH_URL` are correct, GitHub OAuth should “just work”.

