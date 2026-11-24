// TEMPORARY: only the order screen policy still reads this, until its wiring ticket.
import type { InventoryPolicy } from '@/lib/inventoryPolicy';

export const inventoryPolicyFixture: {
  currentPolicy: InventoryPolicy;
  changedAt: string;
} = {
  currentPolicy: 'strict',
  changedAt: '2026-11-02T14:30:00.000Z',
};
