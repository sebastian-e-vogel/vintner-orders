import 'server-only';

import {
  inventoryPolicyResponseSchema,
  type InventoryPolicy,
  type UpdateInventoryPolicyRequest,
} from '@vintner/contracts';
import type { SaveResult } from './InventoryPolicyForm';

// Server-only (see ADR 0005): the only place that reads API_URL.
function getPolicyUrl() {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error(
      'API_URL is not set. Copy apps/web/.env.example to apps/web/.env.local.',
    );
  }
  return `${apiUrl}/settings/inventory-policy`;
}

async function requestPolicy(init?: RequestInit): Promise<SaveResult> {
  const response = await fetch(getPolicyUrl(), {
    ...init,
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Inventory policy request failed: ${response.status}`);
  }
  const { policy, updatedAt } = inventoryPolicyResponseSchema.parse(
    await response.json(),
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
