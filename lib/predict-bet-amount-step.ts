/** Parse amount field: invalid or &lt;1 → 1; cap at balance. */
export function parseBetAmountInput(amount: string, balance: number): number {
  const b = Math.max(0, Math.floor(balance));
  const n = Number.parseInt(amount.replace(/\D/g, ''), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, Math.max(1, b));
}

/** Step current amount by delta, clamped to [1, balance]. */
export function adjustBetAmountInput(amount: string, delta: number, balance: number): string {
  const b = Math.max(0, Math.floor(balance));
  if (b < 1) return '1';
  const cur = parseBetAmountInput(amount, b);
  const next = Math.min(Math.max(1, cur + delta), b);
  return String(next);
}
