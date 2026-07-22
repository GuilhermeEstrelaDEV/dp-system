import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { CorrelationIdMiddleware } from './common/http/correlation-id.middleware';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { AppLoggerService } from './common/logger/app-logger.service';

export async function createApplication(
  factory: () => Promise<INestApplication> = () =>
    NestFactory.create(AppModule, { bufferLogs: true, bodyParser: false }),
) {
  const app = await factory();
  const config = app.get(ConfigService);
  const logger = app.get(AppLoggerService);
  if (config.getOrThrow<boolean>('app.trustProxy'))
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.useLogger(logger);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(json({ limit: config.getOrThrow<string>('app.bodyLimit') }));
  app.use(urlencoded({ extended: true, limit: config.getOrThrow<string>('app.bodyLimit') }));
  const correlationIdMiddleware = new CorrelationIdMiddleware();
  app.use(correlationIdMiddleware.use.bind(correlationIdMiddleware));
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => callback(null, !origin || config.getOrThrow<string[]>('app.corsOrigins').includes(origin)),
  });
  app.setGlobalPrefix(config.getOrThrow<string>('app.apiPrefix'));
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: config.getOrThrow<string>('app.apiVersion'),
  });
  app.enableShutdownHooks(['SIGINT', 'SIGTERM']);
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter(logger));
  app.useGlobalInterceptors(
    new RequestLoggingInterceptor(logger),
    new ResponseEnvelopeInterceptor(),
  );
  if (config.getOrThrow<boolean>('app.swaggerEnabled')) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('DP System API')
        .setDescription('Technical platform API documentation')
        .setVersion('1.0.0')
        .addBearerAuth()
        .addServer('/api/v1')
        .build(),
    );
    SwaggerModule.setup(config.getOrThrow<string>('app.swaggerPath'), app, document, {
      jsonDocumentUrl: 'api/docs-json',
    });
  }
  return app;
}
