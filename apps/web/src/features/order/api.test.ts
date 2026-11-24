import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCustomers, getRecentWines, getWines } from './api';

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
