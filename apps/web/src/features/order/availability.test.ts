import { describe, expect, it } from 'vitest';
import { describeAvailability, isStrictBlocked } from './availability';

describe('describeAvailability', () => {
  it.each([
    [0, 'Out of stock', 'out'],
    [1, '1 available', 'low'],
    [9, '9 available', 'low'],
    [10, '10 available', 'calm'],
    [120, '120 available', 'calm'],
  ])('describes %i bottles', (available, text, level) => {
    expect(describeAvailability(available)).toEqual({ text, level });
  });
});

describe('isStrictBlocked', () => {
  it('blocks only zero stock, only under strict', () => {
    expect(isStrictBlocked(0, 'strict')).toBe(true);
    expect(isStrictBlocked(1, 'strict')).toBe(false);
    expect(isStrictBlocked(0, 'flexible')).toBe(false);
  });
});
