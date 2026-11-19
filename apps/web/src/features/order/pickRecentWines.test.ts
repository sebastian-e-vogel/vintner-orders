import { describe, expect, it } from 'vitest';
import { winesFixture } from '@/fixtures/wines';
import { pickRecentWines, type RepActivityEvent } from './pickRecentWines';

const event = (
  wineId: string,
  timestamp: string,
  repId = 'rep_a',
): RepActivityEvent => ({ repId, wineId, customerId: 'cus_x', timestamp });

const ids = (events: RepActivityEvent[], repId = 'rep_a', limit?: number) =>
  pickRecentWines(events, repId, winesFixture, limit).map(({ id }) => id);

describe('pickRecentWines', () => {
  it('returns nothing without events', () => {
    expect(ids([])).toEqual([]);
  });

  it('orders newest first, whatever the input order', () => {
    expect(
      ids([
        event('wine_02', '2026-11-02T10:00:00Z'),
        event('wine_03', '2026-11-03T10:00:00Z'),
        event('wine_01', '2026-11-01T10:00:00Z'),
      ]),
    ).toEqual(['wine_03', 'wine_02', 'wine_01']);
  });

  it('keeps each wine once, at its most recent position', () => {
    expect(
      ids([
        event('wine_01', '2026-11-05T10:00:00Z'),
        event('wine_02', '2026-11-04T10:00:00Z'),
        event('wine_01', '2026-11-03T10:00:00Z'),
        event('wine_03', '2026-11-02T10:00:00Z'),
      ]),
    ).toEqual(['wine_01', 'wine_02', 'wine_03']);
  });

  it('ignores other reps', () => {
    expect(
      ids([
        event('wine_01', '2026-11-05T10:00:00Z', 'rep_b'),
        event('wine_02', '2026-11-04T10:00:00Z'),
      ]),
    ).toEqual(['wine_02']);
  });

  it('skips wines that are not in the catalog', () => {
    expect(
      ids([
        event('wine_gone', '2026-11-05T10:00:00Z'),
        event('wine_02', '2026-11-04T10:00:00Z'),
      ]),
    ).toEqual(['wine_02']);
  });

  it('stops at 10 distinct wines, counting only wines that exist', () => {
    const events = winesFixture.map(({ id }, index) =>
      event(id, `2026-11-${String(20 - index).padStart(2, '0')}T10:00:00Z`),
    );
    const result = ids([event('wine_gone', '2026-11-21T10:00:00Z'), ...events]);
    expect(result).toHaveLength(10);
    expect(result[0]).toBe('wine_01');
  });
});
