'use server';

import type { InventoryPolicy } from '@vintner/contracts';
import type { SaveResult } from './InventoryPolicyForm';
import { putInventoryPolicy } from './inventoryPolicyApi';

export async function saveInventoryPolicy(
  policy: InventoryPolicy,
): Promise<SaveResult> {
  return putInventoryPolicy(policy);
}
