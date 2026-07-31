import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
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
import { ActiveCompanyResolverService } from './active-company-resolver.service';
import { CompanySelectionService } from './company-selection.service';
import { AssignmentGovernanceService } from './assignment-governance.service';
import { CapabilityCatalogService } from './capability-catalog.service';
import { ActiveCompanyGuard } from './active-company.guard';
import { RouteClassificationVerifierService } from './route-classification-verifier.service';

type JwtExpiresIn = NonNullable<JwtModuleOptions['signOptions']>['expiresIn'];

@Module({
  imports: [
    DiscoveryModule,
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
    ActiveCompanyResolverService,
    CompanySelectionService,
    AssignmentGovernanceService,
    CapabilityCatalogService,
    ActiveCompanyGuard,
    RouteClassificationVerifierService,
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
    ActiveCompanyResolverService,
    CompanySelectionService,
    AssignmentGovernanceService,
    CapabilityCatalogService,
    ActiveCompanyGuard,
    RouteClassificationVerifierService,
  ],
})
export class AuthModule {}
