import 'server-only';

import {
  customerListSchema,
  lastTimeResponseSchema,
  saveOrderRequestInvalidSchema,
  saveOrderRequestRejectedSchema,
  saveOrderRequestResponseSchema,
  wineListSchema,
  type OrderRequestInput,
} from '@vintner/contracts';
import { apiFetch, apiRequest } from '@/lib/api';
import type { SaveResult } from './saveResult';

export function getCustomers() {
  return apiFetch('/customers', customerListSchema);
}

export function getWines() {
  return apiFetch('/wines', wineListSchema);
}

// Most recent first.
export function getRecentWines() {
  return apiFetch('/recent-wines', wineListSchema);
}

export function getLastTime(customerId: string) {
  return apiFetch(`/customers/${customerId}/last-time`, lastTimeResponseSchema);
}

// Every outcome becomes a SaveResult: anything unexpected is `error`, so the
// caller keeps the idempotency key and can retry safely.
export async function postOrderRequest(
  input: OrderRequestInput,
  idempotencyKey: string,
): Promise<SaveResult> {
  try {
    const response = await apiRequest('/order-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(input),
    });
    const body: unknown = await response.json();
    if (response.status === 200 || response.status === 201) {
      return {
        status: 'saved',
        request: saveOrderRequestResponseSchema.parse(body),
      };
    }
    if (response.status === 400) {
      const { fieldErrors } = saveOrderRequestInvalidSchema.parse(body);
      return { status: 'invalid', fieldErrors };
    }
    if (response.status === 422) {
      return {
        status: 'rejected',
        rejection: saveOrderRequestRejectedSchema.parse(body),
      };
    }
    return { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}
