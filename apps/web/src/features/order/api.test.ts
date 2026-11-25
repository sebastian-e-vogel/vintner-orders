import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCustomers,
  getLastTime,
  getRecentWines,
  getWines,
  postOrderRequest,
} from './api';

const fetchMock = vi.fn();

const customer = {
  id: '3f6f0f6e-1c2b-4d6e-9a53-0c1d2e3f4a5b',
  name: 'Bellavista Trattoria',
  contactName: 'Marco Rossi',
  email: 'marco@bellavista.example',
  phone: '+44 20 7946 0101',
};
const wine = {
  id: '7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
  name: 'Pinot Noir Reserve',
  producer: 'Domaine Aubert',
  vintage: null,
  region: 'Burgundy',
  sizeMl: 750,
  sku: 'AUB-PN-21-750',
  available: 48,
};

function respond(body: unknown, status = 200) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

beforeEach(() => {
  vi.stubEnv('API_URL', 'http://api.test');
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe.each([
  [
    'getCustomers',
    getCustomers,
    '/customers',
    customer,
    { ...customer, id: 'x' },
  ],
  ['getWines', getWines, '/wines', wine, { ...wine, sizeMl: 0 }],
  [
    'getRecentWines',
    getRecentWines,
    '/recent-wines',
    wine,
    { ...wine, name: 1 },
  ],
])('%s', (_name, read, path, valid, invalid) => {
  it('returns the parsed list and never caches', async () => {
    respond([valid]);
    await expect(read()).resolves.toEqual([valid]);
    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test${path}`,
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('returns an empty list', async () => {
    respond([]);
    await expect(read()).resolves.toEqual([]);
  });

  it.each([404, 500])('rejects a %i response', async (status) => {
    respond({ message: 'nope' }, status);
    await expect(read()).rejects.toThrow(String(status));
  });

  it.each([
    ['not a list', valid],
    ['an invalid item', [invalid]],
  ])('rejects a malformed response: %s', async (_case, body) => {
    respond(body);
    await expect(read()).rejects.toThrow();
  });
});

describe('getLastTime', () => {
  const customerId = customer.id;
  const items = [{ quantity: 6, wine }];
  const order = {
    kind: 'order',
    at: '2026-11-10T14:40:00.000Z',
    salesRepName: 'Tom Bennett',
    items,
  };
  const request = {
    kind: 'request',
    at: '2026-11-17T11:20:00.000Z',
    contactName: 'Priya Nair',
    items,
  };

  it.each([
    ['null', null],
    ['an order', order],
    ['a request', request],
  ])('returns %s and never caches', async (_name, body) => {
    respond(body);
    await expect(getLastTime(customerId)).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test/customers/${customerId}/last-time`,
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('rejects a malformed response', async () => {
    respond({ ...order, salesRepName: undefined });
    await expect(getLastTime(customerId)).rejects.toThrow();
  });

  it.each([404, 500])('rejects a %i response', async (status) => {
    respond({}, status);
    await expect(getLastTime(customerId)).rejects.toThrow(String(status));
  });
});

describe('postOrderRequest', () => {
  const input = {
    customerId: customer.id,
    contactName: 'Marco Rossi',
    phone: '+44 20 7946 0101',
    notes: '',
    lines: [{ wineId: wine.id, quantity: 6 }],
  };
  const key = '11111111-1111-4111-8111-111111111111';
  const savedLine = { wineId: wine.id, quantity: 6, available: 48, shortBy: 0 };
  const savedBody = {
    id: '22222222-2222-4222-8222-222222222222',
    createdAt: '2026-11-24T15:30:00.000Z',
    policy: 'strict',
    lines: [savedLine],
    duplicate: false,
  };

  it('posts the body with the Idempotency-Key header', async () => {
    respond(savedBody, 201);
    await postOrderRequest(input, key);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/order-requests');
    expect(init.method).toBe('POST');
    expect(init.headers['Idempotency-Key']).toBe(key);
    expect(JSON.parse(init.body)).toEqual(input);
  });

  it('201: saved', async () => {
    respond(savedBody, 201);
    await expect(postOrderRequest(input, key)).resolves.toEqual({
      status: 'saved',
      request: savedBody,
    });
  });

  it('200: saved as a duplicate', async () => {
    respond({ ...savedBody, duplicate: true }, 200);
    await expect(postOrderRequest(input, key)).resolves.toMatchObject({
      status: 'saved',
      request: { duplicate: true },
    });
  });

  it('400: invalid with the field errors', async () => {
    const fieldErrors = { 'lines.0.quantity': 'Too many.' };
    respond({ reason: 'invalid_request', fieldErrors }, 400);
    await expect(postOrderRequest(input, key)).resolves.toEqual({
      status: 'invalid',
      fieldErrors,
    });
  });

  it.each([
    { reason: 'idempotency_key_reused' },
    { reason: 'unknown_customer' },
    { reason: 'unknown_wines', wineIds: [wine.id] },
    { reason: 'over_stock', policy: 'strict', lines: [savedLine] },
  ])('422 $reason: rejected', async (rejection) => {
    respond(rejection, 422);
    await expect(postOrderRequest(input, key)).resolves.toEqual({
      status: 'rejected',
      rejection,
    });
  });

  it('500: error', async () => {
    respond({ message: 'boom' }, 500);
    await expect(postOrderRequest(input, key)).resolves.toEqual({
      status: 'error',
    });
  });

  it('a network failure: error', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    await expect(postOrderRequest(input, key)).resolves.toEqual({
      status: 'error',
    });
  });

  it.each([
    [201, { nope: 1 }],
    [400, { nope: 1 }],
    [422, { reason: 'something_else' }],
  ])('a malformed %i body: error', async (status, body) => {
    respond(body, status);
    await expect(postOrderRequest(input, key)).resolves.toEqual({
      status: 'error',
    });
  });

  it('a body that is not JSON: error', async () => {
    fetchMock.mockResolvedValue(new Response('<html>', { status: 201 }));
    await expect(postOrderRequest(input, key)).resolves.toEqual({
      status: 'error',
    });
  });
});
