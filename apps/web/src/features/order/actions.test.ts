import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveOrderRequest } from './actions';

const fetchMock = vi.fn();

const key = '11111111-1111-4111-8111-111111111111';
const wineId = '7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const input = {
  customerId: '3f6f0f6e-1c2b-4d6e-9a53-0c1d2e3f4a5b',
  contactName: 'Marco Rossi',
  phone: '+44 20 7946 0101',
  notes: '',
  lines: [{ wineId, quantity: 6 }],
};

beforeEach(() => {
  vi.stubEnv('API_URL', 'http://api.test');
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('saveOrderRequest', () => {
  it('returns invalid with the field messages, without calling the API', async () => {
    const result = await saveOrderRequest(
      { ...input, contactName: ' ', lines: [] },
      key,
    );

    expect(result).toEqual({
      status: 'invalid',
      fieldErrors: {
        contactName: "Enter the caller's name.",
        lines: 'Add at least one wine.',
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns invalid for a key that is not a uuid', async () => {
    const result = await saveOrderRequest(input, 'nope');

    expect(result).toMatchObject({
      status: 'invalid',
      fieldErrors: { idempotencyKey: expect.any(String) },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([undefined, null, 'text'])(
    'returns invalid for input %j',
    async (bad) => {
      expect((await saveOrderRequest(bad, key)).status).toBe('invalid');
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('sends valid input to the API with the key', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 500 }));

    await expect(saveOrderRequest(input, key)).resolves.toEqual({
      status: 'error',
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/order-requests');
    expect(init.headers['Idempotency-Key']).toBe(key);
  });
});
