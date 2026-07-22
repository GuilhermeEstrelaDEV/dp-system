import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { AuthorizationService } from './authorization.service';
import { CapabilitiesGuard } from './capabilities.guard';

describe('CapabilitiesGuard', () => {
  const principal: AuthenticatedPrincipal = {
    actorId: 'actor',
    activeCompanyId: 'company-a',
    permissions: ['payroll.view'],
    traceId: 'trace',
    sessionId: 'session',
  };

  function context(): ExecutionContext {
    return {
      getHandler: () => function handler() {},
      getClass: () => class Controller {},
      switchToHttp: () => ({ getRequest: () => ({ principal }) }),
    } as unknown as ExecutionContext;
  }

  it('denies by default when capability metadata is absent', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) };
    const guard = new CapabilitiesGuard(
      reflector as unknown as Reflector,
      new AuthorizationService(),
    );
    expect(guard.canActivate(context())).toBe(false);
  });

  it('allows a declared effective capability', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(['payroll.view']) };
    const guard = new CapabilitiesGuard(
      reflector as unknown as Reflector,
      new AuthorizationService(),
    );
    expect(guard.canActivate(context())).toBe(true);
  });
});
