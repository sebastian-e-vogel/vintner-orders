import { describe, expect, it } from 'vitest';
import { formatBottleSize } from './formatBottleSize';

describe('formatBottleSize', () => {
  it.each([
    [750, '750 ml'],
    [375, '375 ml'],
    [1500, '1.5 L'],
    [3000, '3 L'],
  ])('formats %i ml as %s', (sizeMl, expected) => {
    expect(formatBottleSize(sizeMl)).toBe(expected);
  });
});
