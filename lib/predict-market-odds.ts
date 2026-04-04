/**
 * Market odds from pooled astro-coin bets (binary questions only).
 *
 * Each coin contributes weight `coins * WEIGHT_PER_COIN` (default 0.1), so **1 coin ⇔ 0.1**
 * weight units before normalization. Yes/no shares are converted to **permille** (0–1000)
 * so they always sum to 1000; the UI shows **percent** as permille / 10 (e.g. 375 → 37.5%).
 */

export const PREDICT_MARKET_PERMILLE_TOTAL = 1000;

/** Weight units per coin (1 coin = 0.1 weight). */
export const PREDICT_COIN_WEIGHT = 0.1;

export function marketPermilleFromSideCoins(
  yesCoins: number,
  noCoins: number,
): { yesPermille: number; noPermille: number } {
  const y = Math.max(0, Math.floor(yesCoins));
  const n = Math.max(0, Math.floor(noCoins));
  const yesW = y * PREDICT_COIN_WEIGHT;
  const noW = n * PREDICT_COIN_WEIGHT;
  const totalW = yesW + noW;

  if (totalW <= 0) {
    return {
      yesPermille: PREDICT_MARKET_PERMILLE_TOTAL / 2,
      noPermille: PREDICT_MARKET_PERMILLE_TOTAL / 2,
    };
  }

  const yesPermille = Math.round(
    (PREDICT_MARKET_PERMILLE_TOTAL * yesW) / totalW,
  );
  const clampedYes = Math.min(
    PREDICT_MARKET_PERMILLE_TOTAL,
    Math.max(0, yesPermille),
  );
  const noPermille = PREDICT_MARKET_PERMILLE_TOTAL - clampedYes;

  return { yesPermille: clampedYes, noPermille };
}

/** Display string for a side (permille / 10 = percent, up to one decimal). */
export function formatPermilleAsPercent(permille: number): string {
  const p = permille / 10;
  const rounded = Math.round(p * 10) / 10;
  if (Number.isInteger(rounded)) return `${rounded}%`;
  return `${rounded.toFixed(1)}%`;
}
