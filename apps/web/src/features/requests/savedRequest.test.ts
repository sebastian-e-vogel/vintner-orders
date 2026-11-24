import { describe, expect, it } from 'vitest';
import {
  countShortLines,
  pluralize,
  totalBottles,
  type SavedRequest,
  type SavedRequestLine,
} from './savedRequest';

const line = (requested: number, shortBy: number): SavedRequestLine => ({
  id: `${requested}-${shortBy}`,
  producer: 'P',
  wine: 'W',
  region: 'R',
  vintage: 2020,
  size: '750 ml',
  requested,
  availableAtSave: requested - shortBy,
  shortBy,
});

const request = (lines: SavedRequestLine[]): SavedRequest => ({
  id: 'r',
  savedAt: '2026-01-01T00:00:00.000Z',
  customer: 'C',
  usualContact: 'U',
  contactName: 'U',
  phone: '1',
  salesRepName: 'Rep',
  policy: 'flexible',
  lines,
});

describe('savedRequest display helpers', () => {
  it('counts lines the API marks short', () => {
    expect(countShortLines(request([line(10, 6), line(2, 0)]))).toBe(1);
    expect(countShortLines(request([]))).toBe(0);
  });

  it('totals the requested bottles', () => {
    expect(totalBottles(request([line(10, 6), line(2, 0)]))).toBe(12);
    expect(totalBottles(request([]))).toBe(0);
  });

  it('pluralizes', () => {
    expect(pluralize(1, 'request', 'requests')).toBe('1 request');
    expect(pluralize(0, 'request', 'requests')).toBe('0 requests');
  });
});
