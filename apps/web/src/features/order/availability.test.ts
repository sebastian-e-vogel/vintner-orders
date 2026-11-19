import { describe, expect, it } from 'vitest';
import { describeAvailability } from './availability';

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
