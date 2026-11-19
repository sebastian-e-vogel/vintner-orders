'use server';

import type { SaveResult } from '@/features/settings/InventoryPolicyForm';
import type { InventoryPolicy } from '@/lib/inventoryPolicy';

// TEMPORARY fake save: waits briefly, fails when FAKE_SAVE_FAIL=1 is set. Deleted in the wiring ticket.
export async function fakeSavePolicy(
  policy: InventoryPolicy,
): Promise<SaveResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  if (process.env.FAKE_SAVE_FAIL === '1') {
    throw new Error('Fake save failed');
  }
  return { policy, changedAt: new Date().toISOString() };
}
