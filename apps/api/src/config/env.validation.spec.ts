import { validateEnvironment } from './env.validation';

const valid = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/database',
  JWT_SECRET: 'a'.repeat(32),
};

describe('validateEnvironment', () => {
  it('applies safe technical defaults', () => {
    expect(validateEnvironment(valid)).toMatchObject({
      API_PREFIX: 'api',
      API_VERSION: '1',
      SWAGGER_ENABLED: true,
      RATE_LIMIT_MAX_REQUESTS: 100,
    });
  });

  it('does not expose secret values in validation errors', () => {
    expect(() => validateEnvironment({ ...valid, JWT_SECRET: 'short' })).toThrow('JWT_SECRET');
    expect(() => validateEnvironment({ ...valid, JWT_SECRET: 'short' })).not.toThrow('short');
  });
});
