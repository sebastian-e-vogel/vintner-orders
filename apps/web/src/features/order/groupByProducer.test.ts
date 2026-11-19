import { describe, expect, it } from 'vitest';
import { winesFixture } from '@/fixtures/wines';
import { groupByProducer, producerOptions } from './groupByProducer';

const find = (producer: string) =>
  groupByProducer(winesFixture).find((g) => g.producer === producer)!;

describe('groupByProducer', () => {
  it('makes one group per producer, sorted alphabetically', () => {
    const producers = groupByProducer(winesFixture).map((g) => g.producer);
    expect(producers).toEqual(
      [...producers].sort((a, b) => a.localeCompare(b)),
    );
    expect(new Set(producers).size).toBe(producers.length);
  });

  it('groups rows with the same wine name together, across vintages and sizes', () => {
    const pinot = find('Domaine Aubert').wineNames.find(
      (n) => n.wineName === 'Pinot Noir Reserve',
    )!;
    expect(pinot.wines.map((w) => w.id)).toEqual([
      'wine_03',
      'wine_01',
      'wine_02',
    ]);
  });

  it('keeps different wine names of one producer apart, sorted', () => {
    const names = find('Domaine Aubert').wineNames.map((n) => n.wineName);
    expect(names).toEqual(['Chardonnay', 'Pinot Noir Reserve']);
  });

  it('keeps the same wine name under two producers apart', () => {
    for (const producer of ['Domaine Aubert', 'Domaine Aubrey']) {
      const ids = find(producer).wineNames.flatMap((n) =>
        n.wines.map((w) => w.producer),
      );
      expect(new Set(ids)).toEqual(new Set([producer]));
    }
  });

  it('groups only by exact name equality', () => {
    const wine = winesFixture[0];
    const groups = groupByProducer([
      wine,
      { ...wine, id: 'x', wineName: 'Pinot Noir reserve' },
    ]);
    expect(groups[0].wineNames).toHaveLength(2);
  });

  it('orders rows newest vintage first, then smallest size first', () => {
    const rows = find('Riverstone').wineNames[0].wines;
    expect(rows.map((w) => [w.vintage, w.sizeMl])).toEqual([
      [2019, 750],
      [2018, 750],
      [2018, 1500],
    ]);
  });

  it('puts non-vintage rows after the years, ordered by size', () => {
    const rosato = find('Bellerive').wineNames.find(
      (n) => n.wineName === 'Rosato',
    )!;
    expect(rosato.wines.map((w) => [w.vintage, w.sizeMl])).toEqual([
      [2023, 750],
      [null, 750],
      [null, 1500],
    ]);
  });

  it('filters to one producer', () => {
    const groups = groupByProducer(winesFixture, 'Casa Marolo');
    expect(groups.map((g) => g.producer)).toEqual(['Casa Marolo']);
  });

  it('returns nothing for an empty catalog or an unknown producer', () => {
    expect(groupByProducer([])).toEqual([]);
    expect(groupByProducer(winesFixture, 'Nobody')).toEqual([]);
  });
});

describe('producerOptions', () => {
  it('lists each producer once, alphabetically', () => {
    const options = producerOptions(winesFixture);
    expect(options[0]).toBe('Bellerive');
    expect(options).toContain('Casa Maroli');
    expect(new Set(options).size).toBe(options.length);
  });
});
