import { describe, expect, it } from 'vitest';
import { winesFixture } from '@/fixtures/wines';
import {
  addAllLabel,
  addedMessage,
  itemState,
  latestForCustomer,
  summarizeAddAll,
  type PastOrder,
  type PendingRequest,
} from './lastTime';

const order = (id: string, customerId: string, date: string): PastOrder => ({
  id,
  customerId,
  repId: 'rep-1',
  date,
  items: [],
});
const request = (
  id: string,
  customerId: string,
  date: string,
): PendingRequest => ({ id, customerId, contactName: 'X', date, items: [] });

describe('latestForCustomer', () => {
  it('returns undefined without history', () => {
    expect(latestForCustomer('c1', [], [])).toBeUndefined();
    expect(
      latestForCustomer(
        'c1',
        [order('o', 'c2', '2026-11-01T00:00:00Z')],
        [request('r', 'c2', '2026-11-02T00:00:00Z')],
      ),
    ).toBeUndefined();
  });

  it('picks the newest order of the customer', () => {
    const newest = order('o2', 'c1', '2026-11-05T00:00:00Z');
    expect(
      latestForCustomer(
        'c1',
        [order('o1', 'c1', '2026-11-01T00:00:00Z'), newest],
        [],
      ),
    ).toEqual({ kind: 'order', order: newest });
  });

  it('prefers a newer pending request over an older order', () => {
    const pending = request('r1', 'c1', '2026-11-09T00:00:00Z');
    expect(
      latestForCustomer(
        'c1',
        [order('o1', 'c1', '2026-11-01T00:00:00Z')],
        [pending],
      ),
    ).toEqual({ kind: 'request', request: pending });
  });

  it('prefers a newer order over an older pending request', () => {
    const newest = order('o1', 'c1', '2026-11-09T00:00:00Z');
    expect(
      latestForCustomer(
        'c1',
        [newest],
        [request('r1', 'c1', '2026-11-01T00:00:00Z')],
      ),
    ).toEqual({ kind: 'order', order: newest });
  });

  it('lets the pending request win a tie', () => {
    const date = '2026-11-09T00:00:00Z';
    expect(
      latestForCustomer(
        'c1',
        [order('o1', 'c1', date)],
        [request('r1', 'c1', date)],
      )?.kind,
    ).toBe('request');
  });
});

// wine_03: 120 in stock, wine_06: out of stock, wine_07: 9 in stock.
const items = [
  { wineId: 'wine_03', quantity: 6 },
  { wineId: 'wine_06', quantity: 2 },
  { wineId: 'wine_07', quantity: 4 },
  { wineId: 'gone', quantity: 1 },
];

describe('itemState', () => {
  const wine = (id: string) => winesFixture.find((w) => w.id === id);

  it('classifies an item by catalog, request and policy', () => {
    expect(itemState(wine('wine_03'), {}, 'strict')).toBe('addable');
    expect(itemState(wine('wine_03'), { wine_03: '' }, 'strict')).toBe(
      'in-request',
    );
    expect(itemState(wine('wine_06'), {}, 'strict')).toBe('blocked');
    expect(itemState(wine('wine_06'), {}, 'flexible')).toBe('addable');
    expect(itemState(undefined, {}, 'flexible')).toBe('missing');
  });
});

describe('summarizeAddAll', () => {
  it('counts addable, in request and blocked, strict', () => {
    expect(
      summarizeAddAll(items, winesFixture, { wine_07: '5' }, 'strict'),
    ).toEqual({
      total: 4,
      addableIds: ['wine_03'],
      inRequest: 1,
      blocked: 2,
    });
  });

  it('treats out-of-stock wines as addable under flexible', () => {
    expect(
      summarizeAddAll(items, winesFixture, {}, 'flexible').addableIds,
    ).toEqual(['wine_03', 'wine_06', 'wine_07']);
  });
});

describe('addAllLabel', () => {
  const summary = (addable: number, inRequest: number, blocked: number) => ({
    total: addable + inRequest + blocked,
    addableIds: Array.from({ length: addable }, (_, i) => `w${i}`),
    inRequest,
    blocked,
  });

  it.each([
    [summary(3, 0, 0), 'Add all 3 wines'],
    [summary(2, 0, 0), 'Add all 2 wines'],
    [summary(1, 0, 0), 'Add 1 wine'],
    [summary(2, 1, 0), 'Add 2 wines'],
    [summary(1, 0, 2), 'Add 1 wine'],
    [summary(0, 3, 0), 'All in this request'],
    [summary(0, 1, 0), 'All in this request'],
    [summary(0, 2, 1), 'Nothing more to add'],
    [summary(0, 0, 2), 'Nothing more to add'],
  ])('labels %j as %s', (input, label) => {
    expect(addAllLabel(input)).toBe(label);
  });
});

describe('addedMessage', () => {
  const [one, two] = winesFixture.filter(({ id }) =>
    ['wine_03', 'wine_07'].includes(id),
  );

  it('names a single wine', () => {
    expect(addedMessage([one])).toBe(
      'Added Domaine Aubert Pinot Noir Reserve 2022, 750 ml. Type the quantity.',
    );
  });

  it('counts several wines, with and without a source', () => {
    expect(addedMessage([one, two])).toBe(
      'Added 2 wines. Type the quantities.',
    );
    expect(addedMessage([one, two], 'from last time')).toBe(
      'Added 2 wines from last time. Type the quantities.',
    );
  });

  it('mentions skipped wines, singular when only one is added', () => {
    expect(
      addedMessage([one], 'from last time', { inRequest: 1, blocked: 2 }),
    ).toBe(
      "Added 1 wine from last time. Type the quantity. 1 already in the request, 2 can't be added.",
    );
    expect(
      addedMessage([one, two], 'from last time', { inRequest: 0, blocked: 1 }),
    ).toBe(
      "Added 2 wines from last time. Type the quantities. 1 can't be added.",
    );
  });
});
