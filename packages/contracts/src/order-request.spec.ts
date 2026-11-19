import { describe, expect, it } from 'vitest';
import {
  checkStock,
  combineLines,
  orderRequestSchema,
  type OrderRequestInput,
} from './order-request.js';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';

const valid: OrderRequestInput = {
  customerId: '33333333-3333-4333-8333-333333333333',
  contactName: 'Ana',
  phone: '+41 555-1234',
  lines: [{ wineId: A, quantity: 2 }],
};

const parse = (overrides: Partial<OrderRequestInput>) =>
  orderRequestSchema.safeParse({ ...valid, ...overrides });

const messages = (result: ReturnType<typeof parse>) =>
  result.success ? [] : result.error.issues.map((i) => i.message);

describe('combineLines', () => {
  it('returns an empty list for no lines', () => {
    expect(combineLines([])).toEqual([]);
  });

  it('sums duplicates and keeps first-appearance order', () => {
    expect(
      combineLines([
        { wineId: B, quantity: 1 },
        { wineId: A, quantity: 2 },
        { wineId: B, quantity: 4 },
      ]),
    ).toEqual([
      { wineId: B, quantity: 5 },
      { wineId: A, quantity: 2 },
    ]);
  });
});

describe('orderRequestSchema phone', () => {
  it.each([
    ['1234567', true],
    ['123456', false],
    ['+41 12-34-567', true],
    ['+12 3-4 56', false],
    ['  1234567  ', true],
  ])('digit count for %j -> %s', (phone, ok) => {
    expect(parse({ phone }).success).toBe(ok);
  });

  it('trims the phone', () => {
    const result = parse({ phone: '  1234567 ' });
    expect(result.success && result.data.phone).toBe('1234567');
  });

  it.each(['12345a7', '123+4567', '123 (456) 78', '++1234567'])(
    'rejects disallowed characters in %j',
    (phone) => {
      expect(messages(parse({ phone }))).toEqual([
        'Use only digits, spaces, hyphens and a leading +.',
      ]);
    },
  );

  it('rejects a whitespace-only phone with the required message', () => {
    expect(messages(parse({ phone: '   ' }))).toEqual([
      "Enter the caller's phone number.",
    ]);
  });
});

describe('orderRequestSchema lines', () => {
  it('combines duplicate wines in the parsed output', () => {
    const result = parse({
      lines: [
        { wineId: B, quantity: 1 },
        { wineId: A, quantity: 2 },
        { wineId: B, quantity: 3 },
      ],
    });
    expect(result.success && result.data.lines).toEqual([
      { wineId: B, quantity: 4 },
      { wineId: A, quantity: 2 },
    ]);
  });

  it('accepts duplicates that sum to exactly 999', () => {
    expect(
      parse({
        lines: [
          { wineId: A, quantity: 500 },
          { wineId: A, quantity: 499 },
        ],
      }).success,
    ).toBe(true);
  });

  it('treats the same wine id in another letter case as one wine', () => {
    const result = parse({
      lines: [
        { wineId: A.toUpperCase(), quantity: 1 },
        { wineId: A, quantity: 2 },
      ],
    });
    expect(result.success && result.data.lines).toEqual([
      { wineId: A, quantity: 3 },
    ]);
  });

  it('rejects duplicates that sum over 999', () => {
    const result = parse({
      lines: [
        { wineId: A, quantity: 500 },
        { wineId: A, quantity: 500 },
      ],
    });
    expect(messages(result)).toEqual([
      'The total for one wine can be at most 999. Lower the quantity.',
    ]);
  });
});

describe('orderRequestSchema text fields', () => {
  it('trims the contact name and rejects a whitespace-only one', () => {
    const ok = parse({ contactName: '  Ana  ' });
    expect(ok.success && ok.data.contactName).toBe('Ana');
    expect(messages(parse({ contactName: '   ' }))).toEqual([
      "Enter the caller's name.",
    ]);
  });

  it('defaults notes to empty and trims them', () => {
    const none = parse({});
    expect(none.success && none.data.notes).toBe('');
    const trimmed = parse({ notes: '  call back  ' });
    expect(trimmed.success && trimmed.data.notes).toBe('call back');
  });
});

describe('checkStock', () => {
  const lines = [{ wineId: A, quantity: 5 }];

  it('combines duplicate lines before comparing with stock', () => {
    const result = checkStock(
      [
        { wineId: A, quantity: 3 },
        { wineId: A, quantity: 3 },
      ],
      { [A]: 5 },
      'strict',
    );
    expect(result.lines).toEqual([
      { wineId: A, quantity: 6, available: 5, shortBy: 1 },
    ]);
    expect(result.canSave).toBe(false);
  });

  it('allows exact stock under strict', () => {
    const result = checkStock(lines, { [A]: 5 }, 'strict');
    expect(result.lines[0]?.shortBy).toBe(0);
    expect(result.canSave).toBe(true);
  });

  it('blocks strict when short by 1', () => {
    const result = checkStock(lines, { [A]: 4 }, 'strict');
    expect(result.lines[0]?.shortBy).toBe(1);
    expect(result.canSave).toBe(false);
  });

  it('always allows saving under flexible, still reporting shortBy', () => {
    const result = checkStock(lines, { [A]: 0 }, 'flexible');
    expect(result.lines[0]?.shortBy).toBe(5);
    expect(result.canSave).toBe(true);
  });

  it('counts a wine missing from the map as 0 available', () => {
    const strict = checkStock(lines, {}, 'strict');
    expect(strict.lines).toEqual([
      { wineId: A, quantity: 5, available: 0, shortBy: 5 },
    ]);
    expect(strict.canSave).toBe(false);
    expect(checkStock(lines, {}, 'flexible').canSave).toBe(true);
  });

  it('blocks strict when only one of several lines is short', () => {
    const result = checkStock(
      [
        { wineId: A, quantity: 1 },
        { wineId: B, quantity: 2 },
      ],
      { [A]: 10, [B]: 1 },
      'strict',
    );
    expect(result.lines.map((l) => l.shortBy)).toEqual([0, 1]);
    expect(result.canSave).toBe(false);
  });

  it('can save an empty list', () => {
    expect(checkStock([], {}, 'strict')).toEqual({ lines: [], canSave: true });
  });
});
