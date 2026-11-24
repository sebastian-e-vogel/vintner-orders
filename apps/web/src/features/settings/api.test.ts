import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getInventoryPolicy, putInventoryPolicy } from './api';

const fetchMock = vi.fn();
const url = 'http://api.test/settings/inventory-policy';
const stored = { policy: 'flexible', updatedAt: '2026-11-03T10:00:00.000Z' };

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

describe('getInventoryPolicy', () => {
  it('maps updatedAt to changedAt and never caches', async () => {
    respond(stored);

    await expect(getInventoryPolicy()).resolves.toEqual({
      policy: 'flexible',
      changedAt: stored.updatedAt,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      url,
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it.each([404, 500])('rejects a %i response', async (status) => {
    respond({ message: 'nope' }, status);
    await expect(getInventoryPolicy()).rejects.toThrow(String(status));
  });

  it.each([
    ['unknown policy', { policy: 'loose', updatedAt: stored.updatedAt }],
    ['missing updatedAt', { policy: 'strict' }],
    ['non-ISO date', { policy: 'strict', updatedAt: 'yesterday' }],
  ])('rejects a malformed response: %s', async (_name, body) => {
    respond(body);
    await expect(getInventoryPolicy()).rejects.toThrow();
  });
});

describe('putInventoryPolicy', () => {
  it('sends the policy as JSON and maps the response', async () => {
    respond(stored);

    await expect(putInventoryPolicy('flexible')).resolves.toEqual({
      policy: 'flexible',
      changedAt: stored.updatedAt,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy: 'flexible' }),
      }),
    );
  });

  it('rejects a non-2xx response', async () => {
    respond({ message: 'bad' }, 400);
    await expect(putInventoryPolicy('strict')).rejects.toThrow('400');
  });
});
