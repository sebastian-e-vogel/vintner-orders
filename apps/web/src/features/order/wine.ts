import { formatBottleSize } from '@/lib/formatBottleSize';

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

// Moved to lib/ for saved requests; re-exported so order imports stay as they are.
export { formatBottleSize };

export const formatVintage = (vintage: number | null) =>
  vintage === null ? 'NV' : String(vintage);

export const describeVintage = (vintage: number | null) =>
  vintage === null ? 'Non-vintage' : String(vintage);

export const describeWine = (
  wine: Pick<Wine, 'producer' | 'wineName' | 'vintage' | 'sizeMl'>,
) =>
  `${wine.producer} ${wine.wineName} ${describeVintage(wine.vintage)}, ${formatBottleSize(wine.sizeMl)}`;
