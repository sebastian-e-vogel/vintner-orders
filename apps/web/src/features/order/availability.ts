import type { InventoryPolicy } from '@/lib/inventoryPolicy';

export type AvailabilityLevel = 'calm' | 'low' | 'out';

export const lowStockBelow = 10;

export function describeAvailability(available: number): {
  text: string;
  level: AvailabilityLevel;
} {
  if (available <= 0) return { text: 'Out of stock', level: 'out' };
  return {
    text: `${available} available`,
    level: available < lowStockBelow ? 'low' : 'calm',
  };
}

// Strict policy does not let a wine with no stock into the request.
export const isStrictBlocked = (available: number, policy: InventoryPolicy) =>
  policy === 'strict' && available === 0;
