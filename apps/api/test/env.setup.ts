Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/dp_system_test',
  JWT_SECRET: 'test-only-placeholder-secret-without-production-value',
  CORS_ORIGIN: 'http://allowed.test',
  RATE_LIMIT_MAX_REQUESTS: '10',
  SWAGGER_ENABLED: 'true',
});
