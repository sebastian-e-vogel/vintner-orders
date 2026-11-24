import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import { isStrictBlocked } from './availability';
import type { LastTime, Wine } from '@vintner/contracts';
import { describeWine } from './wine';

export type LastTimeItem = LastTime['items'][number];

export type ItemState = 'addable' | 'in-request' | 'blocked';

export function itemState(
  { wine }: LastTimeItem,
  lines: Record<string, string>,
  policy: InventoryPolicy,
): ItemState {
  if (lines[wine.id] !== undefined) return 'in-request';
  return isStrictBlocked(wine.available, policy) ? 'blocked' : 'addable';
}

export type AddAllSummary = {
  total: number;
  addableIds: string[];
  inRequest: number;
  // Strict-blocked wines.
  blocked: number;
};

export function summarizeAddAll(
  items: LastTimeItem[],
  lines: Record<string, string>,
  policy: InventoryPolicy,
): AddAllSummary {
  const summary: AddAllSummary = {
    total: items.length,
    addableIds: [],
    inRequest: 0,
    blocked: 0,
  };
  for (const item of items) {
    const state = itemState(item, lines, policy);
    if (state === 'addable') summary.addableIds.push(item.wine.id);
    else if (state === 'in-request') summary.inRequest += 1;
    else summary.blocked += 1;
  }
  return summary;
}

const wineCount = (count: number) =>
  `${count} ${count === 1 ? 'wine' : 'wines'}`;

export function addAllLabel({
  total,
  addableIds,
  inRequest,
}: AddAllSummary): string {
  const addable = addableIds.length;
  if (addable === 0) {
    return total > 0 && inRequest === total
      ? 'All in this request'
      : 'Nothing more to add';
  }
  return addable === total && addable > 1
    ? `Add all ${wineCount(addable)}`
    : `Add ${wineCount(addable)}`;
}

export type SkippedCounts = { inRequest: number; blocked: number };

// The catalog status message after wines were added without a quantity.
// `source` and `skipped` describe a bulk add such as "Add all" from last time.
export function addedMessage(
  added: Wine[],
  source?: string,
  skipped?: SkippedCounts,
): string {
  if (added.length === 1 && !source) {
    return `Added ${describeWine(added[0])}. Type the quantity.`;
  }
  const notes = [
    skipped?.inRequest && `${skipped.inRequest} already in the request`,
    skipped?.blocked && `${skipped.blocked} can't be added`,
  ].filter(Boolean);
  return `Added ${wineCount(added.length)}${source ? ` ${source}` : ''}. Type ${
    added.length === 1 ? 'the quantity' : 'the quantities'
  }.${notes.length > 0 ? ` ${notes.join(', ')}.` : ''}`;
}
