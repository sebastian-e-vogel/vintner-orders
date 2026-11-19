import { describe, expect, it } from 'vitest';
import { getLineStatus } from './lineStatus';

describe('getLineStatus', () => {
  it('asks for a quantity when empty, under either policy', () => {
    for (const policy of ['strict', 'flexible'] as const) {
      expect(getLineStatus({ quantityText: '', available: 5, policy })).toEqual(
        { tone: 'quiet', text: 'Enter a quantity' },
      );
    }
  });

  it.each(['0', '1000', 'abc', '1.5'])(
    'rejects %j as invalid',
    (quantityText) => {
      expect(
        getLineStatus({ quantityText, available: 5, policy: 'flexible' }),
      ).toEqual({
        tone: 'error',
        text: 'Quantity must be a whole number from 1 to 999.',
      });
    },
  );

  it.each(['strict', 'flexible'] as const)(
    'is within stock up to and including the available amount (%s)',
    (policy) => {
      const ok = { tone: 'ok', text: 'Within stock' };
      expect(
        getLineStatus({ quantityText: '4', available: 5, policy }),
      ).toEqual(ok);
      expect(
        getLineStatus({ quantityText: '5', available: 5, policy }),
      ).toEqual(ok);
    },
  );

  it('flags a short line under flexible, including zero stock', () => {
    expect(
      getLineStatus({ quantityText: '8', available: 5, policy: 'flexible' }),
    ).toEqual({
      tone: 'warning',
      text: 'Short by 3 — kept, flagged for reviewer',
    });
    expect(
      getLineStatus({ quantityText: '2', available: 0, policy: 'flexible' })
        .text,
    ).toBe('Short by 2 — kept, flagged for reviewer');
  });

  it('errors on zero stock under strict, with no fix', () => {
    expect(
      getLineStatus({ quantityText: '2', available: 0, policy: 'strict' }),
    ).toEqual({
      tone: 'error',
      text: 'Out of stock — remove to save (strict)',
    });
  });

  it('errors above stock under strict and offers the available amount', () => {
    expect(
      getLineStatus({ quantityText: '8', available: 5, policy: 'strict' }),
    ).toEqual({
      tone: 'error',
      text: 'Over stock by 3 — max 5 (strict)',
      setTo: 5,
    });
  });
});
