import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AccessGrantsController } from './access-grants.controller';
import { AccessGrantsService } from './access-grants.service';
import { ApplicationContextService } from './application-context.service';
import { AuthService } from './auth.service';
import { AuditWriterService } from './audit-writer.service';
import { AuthorizationService } from './authorization.service';
import { CapabilitiesGuard } from './capabilities.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { IdentitySessionService } from './identity-session.service';
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
          algorithm: 'HS256',
          expiresIn: configService.getOrThrow<string>('jwt.expiresIn') as JwtExpiresIn,
        },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [AuthController, AccessGrantsController],
  providers: [
    ApplicationContextService,
    AccessGrantsService,
    AuthService,
    AuditWriterService,
    AuthorizationService,
    CapabilitiesGuard,
    JwtAuthGuard,
    JwtStrategy,
    IdentitySessionService,
    PasswordHasherService,
  ],
  exports: [
    JwtModule,
    ApplicationContextService,
    AuditWriterService,
    AuthorizationService,
    CapabilitiesGuard,
    JwtAuthGuard,
    JwtStrategy,
    IdentitySessionService,
  ],
})
export class AuthModule {}
