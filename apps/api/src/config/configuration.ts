export default () => ({
  app: {
    environment: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.API_PORT ?? 3000),
    apiPrefix: 'api',
    apiVersion: '1',
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  },
});
