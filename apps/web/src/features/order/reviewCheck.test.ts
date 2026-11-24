import { describe, expect, it } from 'vitest';
import { checkDraft } from './reviewCheck';
import { buildRequestLines } from './requestLines';
import type { Wine } from './wine';

const wine = (id: string, available: number): Wine => ({
  id,
  sku: id,
  producer: 'Aubert',
  wineName: 'Pinot',
  region: 'Burgundy',
  vintage: 2021,
  sizeMl: 750,
  available,
});
const catalog = [wine('a', 10), wine('b', 0)];

const valid = {
  customerId: 'cus_a',
  name: 'Ana',
  phone: '1234567',
  notes: '',
};
const check = (
  changes: Partial<typeof valid> = {},
  lines: Record<string, string> = { a: '2' },
  policy: 'strict' | 'flexible' = 'strict',
) =>
  checkDraft({
    ...valid,
    ...changes,
    lines: buildRequestLines(catalog, lines, policy),
  });

describe('checkDraft', () => {
  it('finds nothing wrong with a complete draft', () => {
    expect(check()).toEqual([]);
  });

  it('lists the caller problems with the contract messages, in page order', () => {
    expect(check({ customerId: '', name: ' ', phone: '12' })).toEqual([
      { target: 'customer', message: 'Choose a customer.' },
      { target: 'name', message: "Enter the caller's name." },
      { target: 'phone', message: 'Phone needs at least 7 digits.' },
    ]);
  });

  it('points an empty draft at the producer filter', () => {
    expect(check({}, {})).toEqual([
      { target: 'producer', message: 'Add at least one wine.' },
    ]);
  });

  it('points blocking lines at their wine and ignores short flexible ones', () => {
    const issues = check({}, { a: '', b: '1' });
    expect(issues.map(({ target }) => target)).toEqual([
      { wineId: 'a' },
      { wineId: 'b' },
    ]);
    expect(issues[0].message).toContain('Enter a quantity');
    expect(check({}, { a: '50' }, 'flexible')).toEqual([]);
    expect(check({}, { a: '50' })).toHaveLength(1);
  });

  it('allows a note of 500 characters and rejects 501, after trimming', () => {
    expect(check({ notes: ` ${'a'.repeat(500)} ` })).toEqual([]);
    expect(check({ notes: 'a'.repeat(501) })).toEqual([
      { target: 'notes', message: 'Notes can be at most 500 characters.' },
    ]);
  });

  it('reports every problem at once', () => {
    expect(check({ customerId: '', notes: 'a'.repeat(501) }, {})).toHaveLength(
      3,
    );
  });
});
