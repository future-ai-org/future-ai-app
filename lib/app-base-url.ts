/**
 * Base URL for redirects (Stripe Checkout return URLs, etc.).
 * Prefer AUTH_URL; on Vercel fall back to VERCEL_URL.
 */
export function getAppBaseUrl(): string {
  const auth = process.env.AUTH_URL?.trim();
  if (auth) return auth.replace(/\/$/, '');

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/\/$/, '');
    return host.startsWith('http') ? host : `https://${host}`;
  }

  return 'http://localhost:8066';
}
