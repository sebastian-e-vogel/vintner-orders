export type Wine = {
  id: string;
  sku: string;
  producer: string;
  wineName: string;
  region: string;
  // null means non-vintage.
  vintage: number | null;
  sizeMl: number;
  available: number;
};

export function formatBottleSize(sizeMl: number): string {
  return sizeMl >= 1000 ? `${sizeMl / 1000} L` : `${sizeMl} ml`;
}

export const formatVintage = (vintage: number | null) =>
  vintage === null ? 'NV' : String(vintage);

export const describeVintage = (vintage: number | null) =>
  vintage === null ? 'Non-vintage' : String(vintage);

export const describeWine = (wine: Wine) =>
  `${wine.producer} ${wine.wineName} ${describeVintage(wine.vintage)}, ${formatBottleSize(wine.sizeMl)}`;
