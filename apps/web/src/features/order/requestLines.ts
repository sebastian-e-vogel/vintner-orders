import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import { getLineStatus, type LineStatus } from './lineStatus';
import { parseQuantity } from './quantity';
import type { Wine } from '@vintner/contracts';
import { formatBottleSize } from './wine';

export type RequestLine = {
  wine: Wine;
  quantityText: string;
  status: LineStatus;
  // A blocking line must be fixed before the request can be saved.
  isBlocking: boolean;
  // Set when the draft holds this wine in another bottle size too.
  sizeWarning?: string;
};

// A draft line keeps its own copy of the wine, so it does not depend on which wines are on screen.
export type DraftLine = { wine: Wine; quantityText: string };

export type RequestSummary = {
  wineCount: number;
  bottleCount: number;
  toFixCount: number;
  shortCount: number;
};

// Empty and invalid quantities show as 'input' and 'error'; strict over-stock is 'error' too.
export const isBlockingStatus = ({ tone }: LineStatus) =>
  tone === 'input' || tone === 'error';

function describeSizeWarning(others: Wine[]): string | undefined {
  if (others.length === 0) return undefined;
  const sizes = others.map(({ sizeMl }) => formatBottleSize(sizeMl));
  const list =
    sizes.length === 1
      ? sizes[0]
      : `${sizes.slice(0, -1).join(', ')} and ${sizes.at(-1)}`;
  return `Also ordering the ${list} of this wine — confirm ${
    sizes.length === 1 ? 'both sizes' : 'all sizes'
  }.`;
}

const isSameWine = (a: Wine, b: Wine) =>
  a.id !== b.id &&
  a.producer === b.producer &&
  a.name === b.name &&
  a.vintage === b.vintage;

// Follows the order the wines were added.
export function buildRequestLines(
  lines: Record<string, DraftLine>,
  policy: InventoryPolicy,
): RequestLine[] {
  const inDraft = Object.values(lines);
  return inDraft.map(({ wine, quantityText }) => {
    const status = getLineStatus({
      quantityText,
      available: wine.available,
      policy,
    });
    return {
      wine,
      quantityText,
      status,
      isBlocking: isBlockingStatus(status),
      sizeWarning: describeSizeWarning(
        inDraft
          .filter((other) => isSameWine(wine, other.wine))
          .map((other) => other.wine),
      ),
    };
  });
}

export function summarizeRequest(lines: RequestLine[]): RequestSummary {
  return {
    wineCount: lines.length,
    bottleCount: lines.reduce(
      (total, { quantityText }) => total + (parseQuantity(quantityText) ?? 0),
      0,
    ),
    toFixCount: lines.filter(({ isBlocking }) => isBlocking).length,
    shortCount: lines.filter(({ status }) => status.tone === 'warning').length,
  };
}
