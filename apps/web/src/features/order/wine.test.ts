import { describe, expect, it } from 'vitest';
import { describeVintage, formatBottleSize, formatVintage } from './wine';

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

describe('vintage wording', () => {
  it('shows the year, or NV for non-vintage', () => {
    expect(formatVintage(2021)).toBe('2021');
    expect(formatVintage(null)).toBe('NV');
  });

  it('spells out non-vintage for screen readers and labels', () => {
    expect(describeVintage(2021)).toBe('2021');
    expect(describeVintage(null)).toBe('Non-vintage');
  });
});
