import Joi from 'joi';

export function validateEnvironment(config: Record<string, unknown>) {
  const schema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
    API_PORT: Joi.number().port().default(3000),
    DATABASE_URL: Joi.string()
      .uri({ scheme: ['postgres', 'postgresql'] })
      .required(),
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_EXPIRES_IN: Joi.string().default('15m'),
    CORS_ORIGIN: Joi.string().uri().required(),
  });

  const { error, value } = schema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    throw new Error(`Invalid environment configuration: ${error.message}`);
  }

  return value;
}
