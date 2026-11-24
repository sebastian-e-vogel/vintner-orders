'use server';

import { updateInventoryPolicyRequestSchema } from '@vintner/contracts';
import type { SaveResult } from './InventoryPolicyForm';
import { putInventoryPolicy } from './api';

// A Server Action is a public POST endpoint, so its input is validated here.
export async function saveInventoryPolicy(
  policy: unknown,
): Promise<SaveResult> {
  const request = updateInventoryPolicyRequestSchema.parse({ policy });
  return putInventoryPolicy(request.policy);
}
