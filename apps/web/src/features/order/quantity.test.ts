import { describe, expect, it } from 'vitest';
import { parseQuantity, sanitizeQuantity } from './quantity';

describe('sanitizeQuantity', () => {
  it.each([
    ['12', '12'],
    ['a1b2', '12'],
    ['-5', '5'],
    ['1.5', '15'],
    ['007', '7'],
    ['0', ''],
    ['000', ''],
    ['10', '10'],
    ['', ''],
    ['abc', ''],
  ])('turns %j into %j', (input, expected) => {
    expect(sanitizeQuantity(input)).toBe(expected);
  });
});

describe('parseQuantity', () => {
  it.each([
    ['1', 1],
    ['999', 999],
    ['42', 42],
  ])('accepts %j', (text, expected) => {
    expect(parseQuantity(text)).toBe(expected);
  });

  it.each(['', '0', '1000', '-1', '1.5', 'x', ' 5'])('rejects %j', (text) => {
    expect(parseQuantity(text)).toBeNull();
  });
});
