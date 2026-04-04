import { describe, expect, it } from 'vitest';
import { adjustBetAmountInput, parseBetAmountInput } from '@/lib/predict-bet-amount-step';

describe('parseBetAmountInput', () => {
  it('returns 1 for empty or invalid', () => {
    expect(parseBetAmountInput('', 100)).toBe(1);
    expect(parseBetAmountInput('0', 100)).toBe(1);
  });

  it('caps at balance', () => {
    expect(parseBetAmountInput('999', 10)).toBe(10);
  });
});

describe('adjustBetAmountInput', () => {
  it('steps down to floor 1', () => {
    expect(adjustBetAmountInput('5', -1, 10)).toBe('4');
    expect(adjustBetAmountInput('1', -1, 10)).toBe('1');
  });

  it('steps up to balance cap', () => {
    expect(adjustBetAmountInput('9', 1, 10)).toBe('10');
    expect(adjustBetAmountInput('10', 1, 10)).toBe('10');
  });
});
