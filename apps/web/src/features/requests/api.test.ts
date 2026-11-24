import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSavedRequestCount, getSavedRequests } from './api';

const fetchMock = vi.fn();

const item = (over: Record<string, unknown> = {}) => ({
  id: '8f14e45f-ceea-467a-9575-1d3c1f1e6a11',
  createdAt: '2026-11-10T09:00:00.000Z',
  policy: 'flexible',
  contactName: 'Tom Berg',
  phone: '555-0101',
  notes: 'Deliver before Friday',
  salesRepName: 'Rosa Vega',
  customer: { name: 'Bistro Nord', contactName: 'Ana Lopez' },
  lines: [
    {
      wine: {
        id: '0b8a3f0e-6a53-4b7e-9a62-7d1f1a1f2c01',
        name: 'Rouge',
        producer: 'Domaine X',
        vintage: 2019,
        region: 'Rhone',
        sizeMl: 750,
        sku: 'DX-1',
      },
      quantity: 10,
      availableAtSave: 4,
      shortBy: 6,
    },
  ],
  ...over,
});

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

describe('getSavedRequests', () => {
  it('maps every field to the UI type', async () => {
    respond([item()]);

    await expect(getSavedRequests()).resolves.toEqual([
      {
        id: '8f14e45f-ceea-467a-9575-1d3c1f1e6a11',
        savedAt: '2026-11-10T09:00:00.000Z',
        customer: 'Bistro Nord',
        usualContact: 'Ana Lopez',
        contactName: 'Tom Berg',
        phone: '555-0101',
        salesRepName: 'Rosa Vega',
        policy: 'flexible',
        note: 'Deliver before Friday',
        lines: [
          {
            id: '0b8a3f0e-6a53-4b7e-9a62-7d1f1a1f2c01',
            producer: 'Domaine X',
            wine: 'Rouge',
            region: 'Rhone',
            vintage: 2019,
            size: '750 ml',
            requested: 10,
            availableAtSave: 4,
            shortBy: 6,
          },
        ],
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/order-requests',
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('formats the bottle size from sizeMl', async () => {
    const [line] = item().lines;
    respond([
      item({
        lines: [
          { ...line, wine: { ...line.wine, sizeMl: 1500 } },
          { ...line, wine: { ...line.wine, sizeMl: 375 } },
        ],
      }),
    ]);

    const [request] = await getSavedRequests();
    expect(request.lines.map((l) => l.size)).toEqual(['1.5 L', '375 ml']);
  });

  it('keeps a null vintage and drops empty notes', async () => {
    const base = item();
    const [line] = base.lines;
    respond([
      item({
        notes: '',
        lines: [{ ...line, wine: { ...line.wine, vintage: null } }],
      }),
    ]);

    const [request] = await getSavedRequests();
    expect(request.note).toBeUndefined();
    expect(request.lines[0].vintage).toBeNull();
  });

  it('keeps the API order', async () => {
    const older = item({ id: '8f14e45f-ceea-467a-9575-1d3c1f1e6a12' });
    const newer = item({
      id: '8f14e45f-ceea-467a-9575-1d3c1f1e6a13',
      createdAt: '2026-12-01T09:00:00.000Z',
    });
    respond([older, newer]);

    const result = await getSavedRequests();
    expect(result.map((r) => r.id)).toEqual([older.id, newer.id]);
  });

  it('returns an empty list', async () => {
    respond([]);
    await expect(getSavedRequests()).resolves.toEqual([]);
  });

  it.each([
    ['bad id', [item({ id: 'nope' })]],
    ['missing customer', [item({ customer: undefined })]],
    ['not an array', { items: [] }],
  ])('rejects a malformed response: %s', async (_name, body) => {
    respond(body);
    await expect(getSavedRequests()).rejects.toThrow();
  });

  it('rejects a non-2xx response', async () => {
    respond({ message: 'down' }, 500);
    await expect(getSavedRequests()).rejects.toThrow('500');
  });
});

describe('getSavedRequestCount', () => {
  it('returns the count', async () => {
    respond({ count: 7 });

    await expect(getSavedRequestCount()).resolves.toBe(7);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/order-requests/count',
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it.each([{ count: -1 }, { count: 'x' }, {}])(
    'rejects a malformed count %j',
    async (body) => {
      respond(body);
      await expect(getSavedRequestCount()).rejects.toThrow();
    },
  );

  it('rejects a non-2xx response', async () => {
    respond({}, 503);
    await expect(getSavedRequestCount()).rejects.toThrow('503');
  });
});
