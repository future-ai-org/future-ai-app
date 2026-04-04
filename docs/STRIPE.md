# Stripe setup (astro coin purchases)

This app can sell **astro coins** on the **dashboard** (`/dashboard`) using **Stripe Checkout** (hosted payment page). After a successful payment, Stripe calls a **webhook**; the app verifies the event and credits the signed-in user’s balance in Postgres (`User.astroCoins`).

You need:

- A **Stripe** account ([dashboard.stripe.com](https://dashboard.stripe.com))
- **Database migrations applied** so tables include `User.astroCoins` and `StripePurchase` (see [SETUP.md](SETUP.md) → migrations)
- **`AUTH_URL`** set to your real app origin (same as for OAuth): local `http://localhost:8066`, production `https://your-domain.com`. Checkout **success** and **cancel** URLs are built from this.

---

## 1. Environment variables

Add to `.env` (see `.env.example`):

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Secret key from Stripe (**Developers → API keys**). Use **`sk_test_…`** for test mode, **`sk_live_…`** for live. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the webhook endpoint (different per endpoint; see below). |

**Do not** commit real keys. On Vercel (or any host), set the same variables in the project’s environment settings.

Restart the dev server after changing `.env`.

---

## 2. How it behaves in the app

- **`STRIPE_SECRET_KEY` set:** The dashboard wallet shows an amount field and **buy with card**. The client calls `POST /api/stripe/checkout` with `{ "amountUsd": <number> }`, then redirects to Stripe’s hosted Checkout URL.
- **`STRIPE_SECRET_KEY` unset:** The wallet still shows the **balance** only; the checkout UI is hidden (no error message to end users).

**Pricing (product rules in code):**

- **10** astro coins per **$1 USD** charged (derived from the paid `amount_total` in the webhook, not from client input alone).
- Checkout accepts **$10–$500** per purchase (see `app/api/stripe/checkout/route.ts`).

---

## 3. Webhooks (required for crediting coins)

Checkout can succeed in the browser, but **coins are added only when** Stripe delivers `checkout.session.completed` to **`POST /api/stripe/webhook`** and the signature is valid.

### Event to enable

Subscribe the endpoint to:

- **`checkout.session.completed`**

### Local development (Stripe CLI)

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Log in: `stripe login`
3. Forward events to your Next dev server (app default port **8066**):

   ```bash
   stripe listen --forward-to localhost:8066/api/stripe/webhook
   ```

4. The CLI prints a **webhook signing secret** (`whsec_…`). Put it in `.env` as **`STRIPE_WEBHOOK_SECRET`** and restart `npm run dev`.

5. Complete a test payment with a [test card](https://stripe.com/docs/testing) (e.g. `4242 4242 4242 4242`). Confirm the user’s balance updates on the dashboard after redirect.

### Production

1. In **Stripe Dashboard → Developers → Webhooks → Add endpoint**, set the URL to:

   `https://<your-domain>/api/stripe/webhook`

2. Select event **`checkout.session.completed`** (or listen to a wider set if you prefer; the handler only acts on that type).

3. Copy the endpoint’s **Signing secret** into **`STRIPE_WEBHOOK_SECRET`** on your host (e.g. Vercel).

**Test vs live:** Use **test mode** keys and a test webhook endpoint for staging; switch to **live** keys and a live webhook endpoint for production.

---

## 4. Redirect URLs (`AUTH_URL`)

Success and cancel URLs are built in `lib/app-base-url.ts` from:

1. **`AUTH_URL`** (preferred), or  
2. **`VERCEL_URL`** (HTTPS prefix added automatically on Vercel), or  
3. Fallback `http://localhost:8066`

If **`AUTH_URL`** is wrong in production, customers may return to the wrong host after Checkout or see broken redirects. Set it to the canonical public URL of the site (no trailing slash).

---

## 5. Troubleshooting

| Symptom | Things to check |
|---------|------------------|
| No checkout UI on dashboard | `STRIPE_SECRET_KEY` missing or server not restarted. |
| Checkout works but balance stays 0 | Webhook not configured: set `STRIPE_WEBHOOK_SECRET`, run `stripe listen` locally, or add the production endpoint in the Dashboard. Check server logs for `[stripe webhook]` messages. |
| Webhook returns 400 “Invalid signature” | `STRIPE_WEBHOOK_SECRET` must match the **same** endpoint that is sending events (CLI secret ≠ Dashboard secret unless you use one endpoint only). |
| Webhook returns 503 | `STRIPE_WEBHOOK_SECRET` or `STRIPE_SECRET_KEY` missing on the server. |
| Wrong site after paying | Fix **`AUTH_URL`** (and redeploy). |

---

## 6. Related code (for maintainers)

| Piece | Location |
|-------|----------|
| Checkout session creation | `app/api/stripe/checkout/route.ts` |
| Webhook handler | `app/api/stripe/webhook/route.ts` |
| Balance API | `app/api/astro-coins/route.ts` |
| Coins per dollar | `lib/astro-coins.ts` (`COINS_PER_USD`) |
| Stripe client | `lib/stripe-server.ts` |
| Dashboard UI | `components/dashboard/AstroCoinsPanel.tsx` |
| Schema | `prisma/schema.prisma` (`User.astroCoins`, `StripePurchase`) |
