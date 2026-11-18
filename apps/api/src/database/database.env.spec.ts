import { validateEnv } from './database.env.js';

const valid = {
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: 'user',
  POSTGRES_PASSWORD: 'secret',
  POSTGRES_DB: 'db',
};

describe('validateEnv', () => {
  it('accepts valid input and converts the port to a number', () => {
    expect(validateEnv(valid)).toEqual({ ...valid, POSTGRES_PORT: 5432 });
  });

  it.each(Object.keys(valid))('names %s when it is missing', (name) => {
    const { [name]: _removed, ...rest } = valid as Record<string, string>;
    expect(() => validateEnv(rest)).toThrow(name);
  });

  it('rejects an empty value', () => {
    expect(() => validateEnv({ ...valid, POSTGRES_PASSWORD: '' })).toThrow(
      'POSTGRES_PASSWORD',
    );
  });

  it.each(['abc', '0', '70000', '5432.5'])(
    'rejects invalid port %s',
    (port) => {
      expect(() => validateEnv({ ...valid, POSTGRES_PORT: port })).toThrow(
        'POSTGRES_PORT',
      );
    },
  );
});
