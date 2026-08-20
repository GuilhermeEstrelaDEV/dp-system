import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { AppLoggerService } from '../../common/logger/app-logger.service';
import type { ActiveCompanyGuard } from './active-company.guard';
import { AuthorizationRouteGuard } from './authorization-route.guard';
import type { CapabilitiesGuard } from './capabilities.guard';
import type { JwtAuthGuard } from './jwt-auth.guard';
import type { RouteAccessPolicy } from './route-access-policy';

describe('AuthorizationRouteGuard', () => {
  const logger = { warn: jest.fn(), error: jest.fn() };
  const identity = { canActivate: jest.fn().mockResolvedValue(true) };
  const activeCompany = { canActivate: jest.fn().mockResolvedValue(true) };
  const capabilities = { canActivate: jest.fn().mockResolvedValue(true) };

  function createGuard(policy: unknown) {
    return new AuthorizationRouteGuard(
      { getAllAndOverride: jest.fn().mockReturnValue(policy) } as unknown as Reflector,
      identity as unknown as JwtAuthGuard,
      activeCompany as unknown as ActiveCompanyGuard,
      capabilities as unknown as CapabilitiesGuard,
      logger as unknown as AppLoggerService,
    );
  }

  function context(controllerName: string, handlerName: string): ExecutionContext {
    const controller = { [controllerName]: class {} }[controllerName]!;
    const handler = { [handlerName]: function () {} }[handlerName]!;
    Object.defineProperty(handler, 'name', { value: handlerName });
    return {
      getClass: () => controller,
      getHandler: () => handler,
    } as unknown as ExecutionContext;
  }

  beforeEach(() => jest.clearAllMocks());

  it('allows only an explicitly allowlisted public handler', async () => {
    const policy: RouteAccessPolicy = {
      classification: 'PUBLIC_EXPLICIT',
      requireActiveCompany: false,
      requiredCapabilities: [],
      capabilitySemantics: 'ALL',
    };
    await expect(createGuard(policy).canActivate(context('AuthController', 'login'))).resolves.toBe(
      true,
    );
    await expect(
      createGuard(policy).canActivate(context('UnknownController', 'publicHandler')),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(identity.canActivate).not.toHaveBeenCalled();
  });

  it('preserves only a nominally inventoried legacy handler', async () => {
    await expect(
      createGuard(undefined).canActivate(context('BenefitsController', 'list')),
    ).resolves.toBe(true);
  });

  it('blocks an unclassified new handler before invoking downstream guards', async () => {
    await expect(
      createGuard(undefined).canActivate(context('NewController', 'newHandler')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(identity.canActivate).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Unclassified route denied',
      'AuthorizationRouteGuard',
      expect.objectContaining({ classification: 'BLOCKED_UNCLASSIFIED' }),
    );
    expect(logger.warn.mock.calls[0]?.[2]).toEqual({
      handler: 'NewController#newHandler',
      classification: 'BLOCKED_UNCLASSIFIED',
    });
  });

  it('runs identity and active-company resolution for an enterprise route', async () => {
    const policy: RouteAccessPolicy = {
      classification: 'AUTHENTICATED',
      requireActiveCompany: true,
      requiredCapabilities: [],
      capabilitySemantics: 'ALL',
    };
    const execution = context('DashboardController', 'summary');
    await expect(createGuard(policy).canActivate(execution)).resolves.toBe(true);
    expect(identity.canActivate).toHaveBeenCalledWith(execution);
    expect(activeCompany.canActivate).toHaveBeenCalledWith(execution);
    expect(capabilities.canActivate).not.toHaveBeenCalled();
  });

  it('runs all canonical guards for a capability-protected route', async () => {
    const policy: RouteAccessPolicy = {
      classification: 'CAPABILITY_PROTECTED',
      requireActiveCompany: true,
      requiredCapabilities: ['payroll.review.view'],
      capabilitySemantics: 'ALL',
    };
    const execution = context('PayrollReviewsController', 'findCycle');
    await expect(createGuard(policy).canActivate(execution)).resolves.toBe(true);
    expect(identity.canActivate).toHaveBeenCalledWith(execution);
    expect(activeCompany.canActivate).toHaveBeenCalledWith(execution);
    expect(capabilities.canActivate).toHaveBeenCalledWith(execution);
  });

  it('fails safely for malformed or conflicting metadata', async () => {
    await expect(
      createGuard({ classification: 'PUBLIC_EXPLICIT' }).canActivate(
        context('AuthController', 'login'),
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    const conflict: RouteAccessPolicy = {
      classification: 'AUTHENTICATED',
      requireActiveCompany: false,
      requiredCapabilities: ['payroll.review.view'],
      capabilitySemantics: 'ALL',
    };
    await expect(
      createGuard(conflict).canActivate(context('AuthController', 'me')),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
