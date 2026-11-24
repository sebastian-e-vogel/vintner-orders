import 'server-only';

import {
  savedRequestCountSchema,
  savedRequestListSchema,
  type SavedRequestListItem,
} from '@vintner/contracts';
import { apiFetch } from '@/lib/api';
import { formatBottleSize } from '@/lib/formatBottleSize';
import type { SavedRequest } from './savedRequest';

function toSavedRequest(item: SavedRequestListItem): SavedRequest {
  return {
    id: item.id,
    savedAt: item.createdAt,
    customer: item.customer.name,
    usualContact: item.customer.contactName,
    contactName: item.contactName,
    phone: item.phone,
    salesRepName: item.salesRepName,
    policy: item.policy,
    note: item.notes === '' ? undefined : item.notes,
    lines: item.lines.map((line) => ({
      id: line.wine.id,
      producer: line.wine.producer,
      wine: line.wine.name,
      region: line.wine.region,
      vintage: line.wine.vintage,
      size: formatBottleSize(line.wine.sizeMl),
      requested: line.quantity,
      availableAtSave: line.availableAtSave,
      shortBy: line.shortBy,
    })),
  };
}

export async function getSavedRequests(): Promise<SavedRequest[]> {
  const items = await apiFetch('/order-requests', savedRequestListSchema);
  return items.map(toSavedRequest);
}

export async function getSavedRequestCount(): Promise<number> {
  const { count } = await apiFetch(
    '/order-requests/count',
    savedRequestCountSchema,
  );
  return count;
}
