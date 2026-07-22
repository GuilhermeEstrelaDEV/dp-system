import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { AuthorizationService } from './authorization.service';

describe('AuthorizationService', () => {
  const service = new AuthorizationService();
  const principal: AuthenticatedPrincipal = {
    actorId: 'actor',
    activeCompanyId: 'company-a',
    permissions: ['payroll.view'],
    traceId: 'trace',
    sessionId: 'session',
    ipAddress: '127.0.0.1',
    userAgent: 'test',
    accessGrants: [],
  };

  it('authorizes an effective capability', () => {
    expect(() => service.requireCapability(principal, 'payroll.view')).not.toThrow();
  });

  it('denies absent capabilities by default', () => {
    expect(() => service.requireCapability(principal, 'payroll.approve')).toThrow(
      ForbiddenException,
    );
  });

  it('returns not found for resources from another company', () => {
    expect(() => service.assertCompanyScope(principal, 'company-b')).toThrow(NotFoundException);
  });
});
