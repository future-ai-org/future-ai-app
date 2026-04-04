import { describe, expect, it } from 'vitest';
import {
  formatPermilleAsPercent,
  marketPermilleFromSideCoins,
  PREDICT_MARKET_PERMILLE_TOTAL,
} from '@/lib/predict-market-odds';

describe('marketPermilleFromSideCoins', () => {
  it('splits 50/50 when there is no volume', () => {
    expect(marketPermilleFromSideCoins(0, 0)).toEqual({
      yesPermille: 500,
      noPermille: 500,
    });
  });

  it('1 coin on yes only → 1000 yes permille', () => {
    expect(marketPermilleFromSideCoins(1, 0)).toEqual({
      yesPermille: 1000,
      noPermille: 0,
    });
  });

  it('equal coins → equal permille', () => {
    expect(marketPermilleFromSideCoins(5, 5)).toEqual({
      yesPermille: 500,
      noPermille: 500,
    });
  });

  it('3:7 coin ratio → 300 / 700 permille', () => {
    expect(marketPermilleFromSideCoins(3, 7)).toEqual({
      yesPermille: 300,
      noPermille: 700,
    });
  });

  it('permille parts sum to total', () => {
    for (const [y, n] of [
      [0, 0],
      [1, 99],
      [100, 1],
      [7, 13],
    ] as const) {
      const { yesPermille, noPermille } = marketPermilleFromSideCoins(y, n);
      expect(yesPermille + noPermille).toBe(PREDICT_MARKET_PERMILLE_TOTAL);
    }
  });
});

describe('formatPermilleAsPercent', () => {
  it('formats integer percents', () => {
    expect(formatPermilleAsPercent(500)).toBe('50%');
    expect(formatPermilleAsPercent(1000)).toBe('100%');
    expect(formatPermilleAsPercent(0)).toBe('0%');
  });

  it('formats one decimal when needed', () => {
    expect(formatPermilleAsPercent(333)).toBe('33.3%');
    expect(formatPermilleAsPercent(667)).toBe('66.7%');
  });
});
