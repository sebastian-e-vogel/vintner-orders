// TEMPORARY: only the order screen policy (until its wiring ticket) and savedRequestCount (until #36) still read this.
import type { InventoryPolicy } from '@/lib/inventoryPolicy';

export const inventoryPolicyFixture: {
  currentPolicy: InventoryPolicy;
  changedAt: string;
  savedRequestCount: number;
} = {
  currentPolicy: 'strict',
  changedAt: '2026-11-02T14:30:00.000Z',
  savedRequestCount: 12,
};
