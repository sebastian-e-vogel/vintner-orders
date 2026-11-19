import type { InventoryPolicy } from '@/lib/inventoryPolicy';
import { isStrictBlocked } from './availability';
import { describeWine, type Wine } from './wine';

export type LastTimeItem = { wineId: string; quantity: number };

export type PastOrder = {
  id: string;
  customerId: string;
  repId: string;
  date: string;
  items: LastTimeItem[];
};

// A saved request that is still waiting for review.
export type PendingRequest = {
  id: string;
  customerId: string;
  contactName: string;
  date: string;
  items: LastTimeItem[];
};

export type Rep = { id: string; name: string };

export type LastTimeHistory = {
  orders: PastOrder[];
  requests: PendingRequest[];
  reps: Rep[];
};

export type LastTime =
  | { kind: 'order'; order: PastOrder }
  | { kind: 'request'; request: PendingRequest };

// The newest of the customer's orders and pending requests. On a tie the request wins,
// because it is the one that needs the "is this a repeat?" warning.
export function latestForCustomer(
  customerId: string,
  orders: PastOrder[],
  requests: PendingRequest[],
): LastTime | undefined {
  const candidates: LastTime[] = [
    ...orders
      .filter((order) => order.customerId === customerId)
      .map((order) => ({ kind: 'order' as const, order })),
    ...requests
      .filter((request) => request.customerId === customerId)
      .map((request) => ({ kind: 'request' as const, request })),
  ];
  const dateOf = (entry: LastTime) =>
    Date.parse(entry.kind === 'order' ? entry.order.date : entry.request.date);
  return candidates.reduce<LastTime | undefined>(
    (latest, entry) =>
      latest === undefined || dateOf(entry) >= dateOf(latest) ? entry : latest,
    undefined,
  );
}

export type ItemState = 'addable' | 'in-request' | 'blocked' | 'missing';

export function itemState(
  wine: Wine | undefined,
  lines: Record<string, string>,
  policy: InventoryPolicy,
): ItemState {
  if (wine === undefined) return 'missing';
  if (lines[wine.id] !== undefined) return 'in-request';
  return isStrictBlocked(wine.available, policy) ? 'blocked' : 'addable';
}

export type AddAllSummary = {
  total: number;
  addableIds: string[];
  inRequest: number;
  // Strict-blocked wines and wines that are no longer in the catalog.
  blocked: number;
};

export function summarizeAddAll(
  items: LastTimeItem[],
  wines: Wine[],
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
    const wine = wines.find(({ id }) => id === item.wineId);
    const state = itemState(wine, lines, policy);
    if (state === 'addable') summary.addableIds.push(item.wineId);
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
