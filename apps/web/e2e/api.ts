import { randomUUID } from 'node:crypto';
import type { APIRequestContext } from '@playwright/test';

export const API_URL = 'http://localhost:3101';

// Fixed ids from the deterministic seed.
export const customerId = 'c1000000-0000-4000-8000-000000000001';
export const wineIds = {
  inStock: 'b1000000-0000-4000-8000-000000000001',
  outOfStock: 'b1000000-0000-4000-8000-000000000006',
};

export async function setPolicy(
  request: APIRequestContext,
  policy: 'strict' | 'flexible',
) {
  const response = await request.put(`${API_URL}/settings/inventory-policy`, {
    data: { policy },
  });
  if (!response.ok()) throw new Error(`Could not set policy ${policy}`);
}

export async function saveRequest(
  request: APIRequestContext,
  wineId: string,
  quantity: number,
) {
  const response = await request.post(`${API_URL}/order-requests`, {
    headers: { 'Idempotency-Key': randomUUID() },
    data: {
      customerId,
      contactName: 'Giulia Ferrante',
      phone: '+39 055 555 0101',
      lines: [{ wineId, quantity }],
    },
  });
  if (!response.ok()) throw new Error('Could not save the request');
}
