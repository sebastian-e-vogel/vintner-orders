import { pingSchema, type Ping } from '@vintner/contracts';

describe('@vintner/contracts', () => {
  it('is importable from the API', () => {
    const ping: Ping = pingSchema.parse({ message: 'hi' });
    expect(ping.message).toBe('hi');
  });
});
