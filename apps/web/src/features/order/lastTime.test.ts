import { describe, expect, it } from 'vitest';
import { winesFixture } from './testData';
import {
  addAllLabel,
  addedMessage,
  itemState,
  summarizeAddAll,
  type LastTimeItem,
} from './lastTime';

const item = (wineId: string, quantity: number): LastTimeItem => {
  const wine = winesFixture.find(({ id }) => id === wineId)!;
  return { wine, quantity };
};

// wine_03: 120 in stock, wine_06: out of stock, wine_07: 9 in stock.
const items = [item('wine_03', 6), item('wine_06', 2), item('wine_07', 4)];

describe('itemState', () => {
  it('classifies an item by request and policy', () => {
    expect(itemState(items[0], {}, 'strict')).toBe('addable');
    expect(itemState(items[0], { wine_03: '' }, 'strict')).toBe('in-request');
    expect(itemState(items[1], {}, 'strict')).toBe('blocked');
    expect(itemState(items[1], {}, 'flexible')).toBe('addable');
  });
});

describe('summarizeAddAll', () => {
  it('counts addable, in request and blocked, strict', () => {
    expect(summarizeAddAll(items, { wine_07: '5' }, 'strict')).toEqual({
      total: 3,
      addableIds: ['wine_03'],
      inRequest: 1,
      blocked: 1,
    });
  });

  it('treats out-of-stock wines as addable under flexible', () => {
    expect(summarizeAddAll(items, {}, 'flexible').addableIds).toEqual([
      'wine_03',
      'wine_06',
      'wine_07',
    ]);
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
