import { pingSchema, type Ping } from '@vintner/contracts';
import { expect, it } from 'vitest';

it('imports @vintner/contracts', () => {
  const ping: Ping = pingSchema.parse({ message: 'hi' });
  expect(ping.message).toBe('hi');
});
