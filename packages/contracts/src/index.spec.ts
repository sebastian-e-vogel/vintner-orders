import { describe, expect, it } from 'vitest';
import { pingSchema } from './index.js';

describe('pingSchema', () => {
  it('accepts a message', () => {
    expect(pingSchema.parse({ message: 'hi' })).toEqual({ message: 'hi' });
  });

  it('rejects an empty message', () => {
    expect(pingSchema.safeParse({ message: '' }).success).toBe(false);
  });
});
