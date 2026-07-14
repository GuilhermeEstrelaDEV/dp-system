import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validateEnvironment } from './config/env.validation';
import { AppLoggerService } from './common/logger/app-logger.service';
import { GracefulShutdownService } from './common/lifecycle/graceful-shutdown.service';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.getOrThrow<number>('app.rateLimitTtlMs'),
          limit: configService.getOrThrow<number>('app.rateLimitMaxRequests'),
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
  ],
  providers: [
    AppLoggerService,
    GracefulShutdownService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
