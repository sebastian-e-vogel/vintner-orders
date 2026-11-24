import { describe, expect, it } from 'vitest';
import { isAnswered } from './saveResult';

describe('isAnswered', () => {
  it('treats only a network or server failure as unanswered', () => {
    expect(isAnswered({ status: 'error' })).toBe(false);
    expect(
      isAnswered({ status: 'invalid', fieldErrors: { phone: 'Bad' } }),
    ).toBe(true);
    expect(
      isAnswered({
        status: 'rejected',
        rejection: { reason: 'unknown_customer' },
      }),
    ).toBe(true);
  });
});
