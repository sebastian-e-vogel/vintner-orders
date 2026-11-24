import 'server-only';

import {
  inventoryPolicyResponseSchema,
  type InventoryPolicy,
  type UpdateInventoryPolicyRequest,
} from '@vintner/contracts';
import { apiFetch } from '@/lib/api';
import type { SaveResult } from './InventoryPolicyForm';

const policyPath = '/settings/inventory-policy';

async function requestPolicy(init?: RequestInit): Promise<SaveResult> {
  const { policy, updatedAt } = await apiFetch(
    policyPath,
    inventoryPolicyResponseSchema,
    init,
  );
  return { policy, changedAt: updatedAt };
}

export function getInventoryPolicy() {
  return requestPolicy();
}

export function putInventoryPolicy(policy: InventoryPolicy) {
  const body: UpdateInventoryPolicyRequest = { policy };
  return requestPolicy({
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
