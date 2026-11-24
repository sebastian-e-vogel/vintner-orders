import { describe, expect, it } from 'vitest';
import { describeVintage, describeWine, formatVintage } from './wine';

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

describe('describeWine', () => {
  const wine = {
    id: 'w',
    sku: 'S',
    producer: 'Bellerive',
    name: 'Rosato',
    region: 'Tuscany',
    vintage: null,
    sizeMl: 1500,
    available: 1,
  };

  it('names producer, wine, vintage and size', () => {
    expect(describeWine(wine)).toBe('Bellerive Rosato Non-vintage, 1.5 L');
    expect(describeWine({ ...wine, vintage: 2023, sizeMl: 750 })).toBe(
      'Bellerive Rosato 2023, 750 ml',
    );
  });
});
