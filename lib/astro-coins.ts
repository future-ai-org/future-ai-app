/** Matches product copy: 10 astro coins per $1 USD charged. */
export const COINS_PER_USD = 10;

/** Derive coin credit from Stripe Checkout `amount_total` (cents). */
export function coinsFromAmountTotalCents(amountTotalCents: number): number {
  if (!Number.isFinite(amountTotalCents) || amountTotalCents <= 0) return 0;
  const usd = amountTotalCents / 100;
  return Math.floor(usd * COINS_PER_USD);
}
