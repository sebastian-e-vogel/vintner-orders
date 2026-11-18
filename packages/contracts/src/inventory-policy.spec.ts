import { describe, expect, it } from 'vitest';
import {
  inventoryPolicyResponseSchema,
  inventoryPolicySchema,
  updateInventoryPolicyRequestSchema,
} from './index.js';

describe('inventory policy schemas', () => {
  it.each(['strict', 'flexible'])('accepts %s', (policy) => {
    expect(inventoryPolicySchema.parse(policy)).toBe(policy);
  });

  it.each(['Strict', '', 'lenient', 1, null, undefined])(
    'rejects %j',
    (policy) => {
      expect(inventoryPolicySchema.safeParse(policy).success).toBe(false);
    },
  );

  it('requires a policy in the update request', () => {
    expect(updateInventoryPolicyRequestSchema.safeParse({}).success).toBe(
      false,
    );
    expect(
      updateInventoryPolicyRequestSchema.parse({ policy: 'flexible' }),
    ).toEqual({ policy: 'flexible' });
  });

  it('requires an ISO updatedAt in the response', () => {
    const ok = {
      policy: 'strict',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    expect(inventoryPolicyResponseSchema.parse(ok)).toEqual(ok);
    expect(
      inventoryPolicyResponseSchema.safeParse({ ...ok, updatedAt: 'x' })
        .success,
    ).toBe(false);
  });
});
