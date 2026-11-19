import type { Wine } from './wine';

export type WineNameGroup = { wineName: string; wines: Wine[] };

export type ProducerGroup = {
  producer: string;
  wineNames: WineNameGroup[];
};

export const allProducers = '';

const byText = (a: string, b: string) => a.localeCompare(b);

// Dated vintages newest first, non-vintage last, then smallest bottle first.
const byVintageThenSize = (a: Wine, b: Wine) =>
  (a.vintage === null ? 1 : 0) - (b.vintage === null ? 1 : 0) ||
  (b.vintage ?? 0) - (a.vintage ?? 0) ||
  a.sizeMl - b.sizeMl;

export function producerOptions(wines: Wine[]): string[] {
  return [...new Set(wines.map(({ producer }) => producer))].sort(byText);
}

// Wine names are grouped by exact string equality.
export function groupByProducer(
  wines: Wine[],
  producerFilter: string = allProducers,
): ProducerGroup[] {
  return producerOptions(wines)
    .filter(
      (producer) =>
        producerFilter === allProducers || producer === producerFilter,
    )
    .map((producer) => {
      const ofProducer = wines.filter((wine) => wine.producer === producer);
      const names = [...new Set(ofProducer.map(({ wineName }) => wineName))];
      return {
        producer,
        wineNames: names.sort(byText).map((wineName) => ({
          wineName,
          wines: ofProducer
            .filter((wine) => wine.wineName === wineName)
            .sort(byVintageThenSize),
        })),
      };
    });
}
