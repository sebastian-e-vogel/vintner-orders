import { describe, expect, it } from 'vitest';
import { buildRequestLines, summarizeRequest } from './requestLines';
import type { Wine } from '@vintner/contracts';

const wine = (id: string, sizeMl: number, available: number): Wine => ({
  id,
  sku: id,
  producer: 'Aubert',
  name: 'Pinot',
  region: 'Burgundy',
  vintage: 2021,
  sizeMl,
  available,
});
const a = wine('a', 750, 10);
const b = wine('b', 1500, 2);
const other = { ...wine('c', 750, 5), name: 'Chardonnay' };
const catalog = [a, b, other];

describe('buildRequestLines blocking rule', () => {
  it.each([
    ['', 'strict', true],
    ['', 'flexible', true],
    ['0', 'flexible', true],
    ['abc', 'strict', true],
    ['11', 'strict', true],
    ['10', 'strict', false],
    ['11', 'flexible', false],
  ] as const)('quantity %j under %s blocks: %s', (text, policy, blocks) => {
    expect(buildRequestLines(catalog, { a: text }, policy)[0].isBlocking).toBe(
      blocks,
    );
  });

  it('blocks a zero-stock line under strict but not under flexible', () => {
    const empty = [wine('z', 750, 0)];
    expect(buildRequestLines(empty, { z: '1' }, 'strict')[0].isBlocking).toBe(
      true,
    );
    expect(buildRequestLines(empty, { z: '1' }, 'flexible')[0].isBlocking).toBe(
      false,
    );
  });

  it('keeps the order the wines were added and skips unknown wines', () => {
    const lines = buildRequestLines(
      catalog,
      { c: '1', gone: '2', a: '3' },
      'strict',
    );
    expect(lines.map(({ wine }) => wine.id)).toEqual(['c', 'a']);
  });
});

describe('summarizeRequest', () => {
  it('counts wines, bottles, lines to fix and shortages', () => {
    const lines = buildRequestLines(
      catalog,
      { a: '12', b: '', c: '2' },
      'flexible',
    );
    expect(summarizeRequest(lines)).toEqual({
      wineCount: 3,
      bottleCount: 14,
      toFixCount: 1,
      shortCount: 1,
    });
  });

  it('reports nothing short under strict and an empty draft as zeros', () => {
    expect(
      summarizeRequest(buildRequestLines(catalog, { a: '12' }, 'strict')),
    ).toEqual({ wineCount: 1, bottleCount: 12, toFixCount: 1, shortCount: 0 });
    expect(summarizeRequest([])).toEqual({
      wineCount: 0,
      bottleCount: 0,
      toFixCount: 0,
      shortCount: 0,
    });
  });
});

describe('two sizes warning', () => {
  it('warns on both lines when two sizes of the same wine are in the draft', () => {
    const [first, second, third] = buildRequestLines(
      catalog,
      { a: '1', b: '1', c: '1' },
      'flexible',
    );
    expect(first.sizeWarning).toBe(
      'Also ordering the 1.5 L of this wine — confirm both sizes.',
    );
    expect(second.sizeWarning).toBe(
      'Also ordering the 750 ml of this wine — confirm both sizes.',
    );
    expect(third.sizeWarning).toBeUndefined();
  });

  it('does not warn when only one size is in the draft', () => {
    expect(
      buildRequestLines(catalog, { a: '1' }, 'flexible')[0].sizeWarning,
    ).toBeUndefined();
  });

  it('lists every other size when there are more than two', () => {
    const magnum = wine('m', 3000, 1);
    const [first] = buildRequestLines(
      [a, b, magnum],
      { a: '1', b: '1', m: '1' },
      'flexible',
    );
    expect(first.sizeWarning).toBe(
      'Also ordering the 1.5 L and 3 L of this wine — confirm all sizes.',
    );
  });
});
