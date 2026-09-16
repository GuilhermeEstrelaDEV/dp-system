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

  it('accepts the provider-managed HTTP port', () => {
    expect(validateEnvironment({ ...valid, PORT: '10000' })).toMatchObject({ PORT: 10000 });
  });

  it('requires one exact HTTPS CORS origin and disabled Swagger for the external demo', () => {
    expect(
      validateEnvironment({
        ...valid,
        NODE_ENV: 'production',
        DEPLOYMENT_ENV: 'external-demo',
        CORS_ORIGINS: 'https://external-demo.example',
        SWAGGER_ENABLED: 'false',
      }),
    ).toMatchObject({
      CORS_ORIGINS: 'https://external-demo.example',
      SWAGGER_ENABLED: false,
    });
  });

  it.each([
    'http://external-demo.example',
    'https://external-demo.example/path',
    'https://external-demo.example,https://other.example',
    'https://localhost:55173',
  ])('rejects an unsafe external demo CORS origin', (corsOrigins) => {
    expect(() =>
      validateEnvironment({
        ...valid,
        NODE_ENV: 'production',
        DEPLOYMENT_ENV: 'external-demo',
        CORS_ORIGINS: corsOrigins,
        SWAGGER_ENABLED: 'false',
      }),
    ).toThrow('Invalid external demo configuration');
  });
});
