import Joi from 'joi';

export function validateEnvironment(config: Record<string, unknown>) {
  const schema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
    API_PORT: Joi.number().port().default(3000),
    API_PREFIX: Joi.string()
      .pattern(/^[a-z0-9-]+$/)
      .default('api'),
    API_VERSION: Joi.string().pattern(/^\d+$/).default('1'),
    SWAGGER_ENABLED: Joi.boolean().default(true),
    SWAGGER_PATH: Joi.string()
      .pattern(/^[a-z0-9/-]+$/)
      .default('api/docs'),
    DATABASE_URL: Joi.string()
      .uri({ scheme: ['postgres', 'postgresql'] })
      .required(),
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_EXPIRES_IN: Joi.string().default('15m'),
    CORS_ORIGIN: Joi.string().uri().default('http://localhost:5173'),
    CORS_ORIGINS: Joi.string().optional(),
    HTTP_BODY_LIMIT: Joi.string()
      .pattern(/^\d+(b|kb|mb)$/i)
      .default('1mb'),
    RATE_LIMIT_TTL_MS: Joi.number().integer().min(1000).default(60000),
    RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().min(10).default(100),
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'log', 'debug', 'verbose').default('log'),
  });

  const { error, value } = schema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    throw new Error(
      `Invalid environment configuration: ${error.details.map((detail) => detail.path.join('.')).join(', ')}`,
    );
  }

  return value;
}
