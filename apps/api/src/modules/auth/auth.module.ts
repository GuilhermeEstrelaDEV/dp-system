import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { ApplicationContextService } from './application-context.service';
import { AuthService } from './auth.service';
import { AuditWriterService } from './audit-writer.service';
import { AuthorizationService } from './authorization.service';
import { CapabilitiesGuard } from './capabilities.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { PasswordHasherService } from './password-hasher.service';

type JwtExpiresIn = NonNullable<JwtModuleOptions['signOptions']>['expiresIn'];

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>('jwt.expiresIn') as JwtExpiresIn,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    ApplicationContextService,
    AuthService,
    AuditWriterService,
    AuthorizationService,
    CapabilitiesGuard,
    JwtAuthGuard,
    JwtStrategy,
    PasswordHasherService,
  ],
  exports: [
    JwtModule,
    ApplicationContextService,
    AuditWriterService,
    AuthorizationService,
    CapabilitiesGuard,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
