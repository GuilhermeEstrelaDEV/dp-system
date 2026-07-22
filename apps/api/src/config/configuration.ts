export default () => ({
  app: {
    environment: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.API_PORT ?? 3000),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    apiVersion: process.env.API_VERSION ?? '1',
    swaggerEnabled: process.env.SWAGGER_ENABLED !== 'false',
    swaggerPath: process.env.SWAGGER_PATH ?? 'api/docs',
    corsOrigins: (process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN ?? 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    bodyLimit: process.env.HTTP_BODY_LIMIT ?? '1mb',
    rateLimitTtlMs: Number(process.env.RATE_LIMIT_TTL_MS ?? 60000),
    rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100),
    logLevel: process.env.LOG_LEVEL ?? 'log',
    trustProxy: process.env.TRUST_PROXY === 'true',
    emergencyAccessMaxHours: Number(process.env.EMERGENCY_ACCESS_MAX_HOURS ?? 8),
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  },
});
