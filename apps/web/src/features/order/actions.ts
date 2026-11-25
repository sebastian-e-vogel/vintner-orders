'use server';

import { idempotencyKeySchema, orderRequestSchema } from '@vintner/contracts';
import { postOrderRequest } from './api';
import type { SaveResult } from './saveResult';

// A Server Action is a public POST endpoint, so its input is validated here.
export async function saveOrderRequest(
  input: unknown,
  idempotencyKey: unknown,
): Promise<SaveResult> {
  const key = idempotencyKeySchema.safeParse(idempotencyKey);
  const request = orderRequestSchema.safeParse(input);
  if (!key.success || !request.success) {
    const fieldErrors: Record<string, string> = {};
    if (!key.success)
      fieldErrors.idempotencyKey = 'The request key is invalid.';
    if (!request.success) {
      for (const { path, message } of request.error.issues) {
        fieldErrors[path.join('.')] ??= message;
      }
    }
    return { status: 'invalid', fieldErrors };
  }
  return postOrderRequest(request.data, key.data);
}
