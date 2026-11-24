import type { Wine } from '@vintner/contracts';
import { formatBottleSize } from '@/lib/formatBottleSize';

// Moved to lib/ for saved requests; re-exported so order imports stay as they are.
export { formatBottleSize };

export const formatVintage = (vintage: number | null) =>
  vintage === null ? 'NV' : String(vintage);

export const describeVintage = (vintage: number | null) =>
  vintage === null ? 'Non-vintage' : String(vintage);

export const describeWine = (
  wine: Pick<Wine, 'producer' | 'name' | 'vintage' | 'sizeMl'>,
) =>
  `${wine.producer} ${wine.name} ${describeVintage(wine.vintage)}, ${formatBottleSize(wine.sizeMl)}`;
