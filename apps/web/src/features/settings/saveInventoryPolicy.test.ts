import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveInventoryPolicy } from './saveInventoryPolicy';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv('API_URL', 'http://api.test');
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('saveInventoryPolicy', () => {
  it('returns the saved policy and its change time', async () => {
    const updatedAt = '2026-11-04T09:00:00.000Z';
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ policy: 'strict', updatedAt })),
    );

    await expect(saveInventoryPolicy('strict')).resolves.toEqual({
      policy: 'strict',
      changedAt: updatedAt,
    });
  });

  it('throws when the API fails so the form shows its error', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 500 }));
    await expect(saveInventoryPolicy('strict')).rejects.toThrow();
  });
});
