import { describe, expect, it } from 'vitest';
import {
  countShortLines,
  newestFirst,
  pluralize,
  shortBy,
  totalBottles,
  type SavedRequest,
  type SavedRequestLine,
} from './savedRequest';

const line = (
  requested: number,
  availableAtSave: number,
): SavedRequestLine => ({
  id: `${requested}-${availableAtSave}`,
  producer: 'P',
  wine: 'W',
  region: 'R',
  vintage: 2020,
  size: '750 ml',
  requested,
  availableAtSave,
});

const request = (
  savedAt: string,
  lines: SavedRequestLine[] = [],
): SavedRequest => ({
  reference: savedAt,
  savedAt,
  customer: 'C',
  usualContact: 'U',
  contactName: 'U',
  phone: '1',
  repId: 'rep-1',
  policy: 'flexible',
  lines,
});

describe('savedRequest rules', () => {
  it('computes the shortage, treating equal as not short', () => {
    expect(shortBy(line(10, 4))).toBe(6);
    expect(shortBy(line(4, 4))).toBe(0);
    expect(shortBy(line(2, 9))).toBe(0);
  });

  it('counts short lines and total bottles', () => {
    const r = request('2026-01-01T00:00:00Z', [line(10, 4), line(2, 2)]);
    expect(countShortLines(r)).toBe(1);
    expect(totalBottles(r)).toBe(12);
  });

  it('orders newest first without mutating the input', () => {
    const input = [
      request('2026-01-01T00:00:00Z'),
      request('2026-03-01T00:00:00Z'),
      request('2026-02-01T00:00:00Z'),
    ];
    expect(newestFirst(input).map((r) => r.savedAt)).toEqual([
      '2026-03-01T00:00:00Z',
      '2026-02-01T00:00:00Z',
      '2026-01-01T00:00:00Z',
    ]);
    expect(input[0].savedAt).toBe('2026-01-01T00:00:00Z');
  });

  it('pluralizes', () => {
    expect(pluralize(1, 'request', 'requests')).toBe('1 request');
    expect(pluralize(0, 'request', 'requests')).toBe('0 requests');
  });
});
