import { describe, expect, it } from 'vitest';
import { validateCaller } from './callerValidation';

const valid = { customerId: 'cus_a', name: 'Ana', phone: '+44 20 7946 0101' };
const errorsFor = (changes: Partial<typeof valid>) =>
  validateCaller({ ...valid, ...changes });

describe('validateCaller', () => {
  it('returns no errors for valid values', () => {
    expect(validateCaller(valid)).toEqual({});
  });

  it('requires a customer', () => {
    expect(errorsFor({ customerId: '' }).customer).toBe('Choose a customer.');
  });

  describe('name', () => {
    it('rejects an empty name and one with only spaces', () => {
      expect(errorsFor({ name: '' }).name).toMatch(/Enter the caller's name/);
      expect(errorsFor({ name: '   ' }).name).toMatch(
        /Enter the caller's name/,
      );
    });

    it('accepts 100 characters and rejects 101, after trimming', () => {
      expect(errorsFor({ name: ` ${'a'.repeat(100)} ` }).name).toBeUndefined();
      expect(errorsFor({ name: 'a'.repeat(101) }).name).toMatch(/at most 100/);
    });
  });

  describe('phone', () => {
    it('asks for a phone when empty or only spaces', () => {
      expect(errorsFor({ phone: '' }).phone).toMatch(
        /Enter the caller's phone/,
      );
      expect(errorsFor({ phone: '    ' }).phone).toMatch(/Enter the caller's/);
    });

    it('needs 7 digits: 6 fail, 7 pass', () => {
      expect(errorsFor({ phone: '123456' }).phone).toMatch(/at least 7 digits/);
      expect(errorsFor({ phone: '12 34-56' }).phone).toMatch(/at least 7/);
      expect(errorsFor({ phone: '1234567' }).phone).toBeUndefined();
      expect(errorsFor({ phone: '123 45-67' }).phone).toBeUndefined();
    });

    it('allows a + only at the start', () => {
      expect(errorsFor({ phone: '+1234567' }).phone).toBeUndefined();
      expect(errorsFor({ phone: '12+34567' }).phone).toMatch(/Use only/);
      expect(errorsFor({ phone: '++1234567' }).phone).toMatch(/Use only/);
      expect(errorsFor({ phone: '1234567+' }).phone).toMatch(/Use only/);
    });

    it('rejects tabs and newlines, only spaces are allowed', () => {
      expect(errorsFor({ phone: '123\t4567' }).phone).toMatch(/Use only/);
      expect(errorsFor({ phone: '123\n4567' }).phone).toMatch(/Use only/);
    });

    it('rejects letters and other symbols', () => {
      expect(errorsFor({ phone: '12345ab67' }).phone).toMatch(/Use only/);
      expect(errorsFor({ phone: '(123) 4567' }).phone).toMatch(/Use only/);
    });

    it('accepts 30 characters and rejects 31, after trimming', () => {
      expect(errorsFor({ phone: ` ${'1'.repeat(30)} ` }).phone).toBeUndefined();
      expect(errorsFor({ phone: '1'.repeat(31) }).phone).toMatch(/at most 30/);
    });
  });

  it('reports every failing field at once', () => {
    expect(
      Object.keys(validateCaller({ customerId: '', name: '', phone: '' })),
    ).toEqual(['customer', 'name', 'phone']);
  });
});
