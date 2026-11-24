import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './api';

const fetchMock = vi.fn();
const schema = {
  parse(data: unknown) {
    if (typeof data !== 'object' || data === null || !('ok' in data)) {
      throw new Error('bad shape');
    }
    return data as { ok: boolean };
  },
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

describe('apiFetch', () => {
  it('calls API_URL + path without caching and returns the parsed body', async () => {
    respond({ ok: true });

    await expect(apiFetch('/thing', schema)).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/thing',
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('passes the init through but keeps no-store', async () => {
    respond({ ok: true });

    await apiFetch('/thing', schema, { method: 'PUT', cache: 'force-cache' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/thing',
      expect.objectContaining({ method: 'PUT', cache: 'no-store' }),
    );
  });

  it.each([404, 500])('rejects a %i response', async (status) => {
    respond({ message: 'nope' }, status);
    await expect(apiFetch('/thing', schema)).rejects.toThrow(String(status));
  });

  it('rejects a malformed response', async () => {
    respond({ nope: 1 });
    await expect(apiFetch('/thing', schema)).rejects.toThrow('bad shape');
  });

  it('rejects a body that is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>', { status: 200 }));
    await expect(apiFetch('/thing', schema)).rejects.toThrow();
  });

  it('propagates a network failure', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    await expect(apiFetch('/thing', schema)).rejects.toThrow('fetch failed');
  });

  it.each(['', undefined])(
    'fails clearly without calling fetch when API_URL is %j',
    async (value) => {
      vi.stubEnv('API_URL', value);

      await expect(apiFetch('/thing', schema)).rejects.toThrow(
        'API_URL is not set',
      );
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});
