import {
  ForbiddenException,
  InternalServerErrorException,
  type ExecutionContext,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { AuthorizationService } from './authorization.service';
import { CapabilitiesGuard } from './capabilities.guard';
import type { CapabilityCatalogService } from './capability-catalog.service';
import type { RouteAccessPolicy } from './route-access-policy';

describe('CapabilitiesGuard', () => {
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

  function context(): ExecutionContext {
    return {
      getHandler: () => function handler() {},
      getClass: () => class Controller {},
      switchToHttp: () => ({ getRequest: () => ({ principal }) }),
    } as unknown as ExecutionContext;
  }

  const capabilityPolicy: RouteAccessPolicy = {
    classification: 'CAPABILITY_PROTECTED',
    requireActiveCompany: true,
    requiredCapabilities: ['payroll.view'],
    capabilitySemantics: 'ALL',
  };

  function guardWith(
    policy: RouteAccessPolicy | undefined,
    catalogResult: object | Error = { scope: 'COMPANY' },
    requestPrincipal: AuthenticatedPrincipal = principal,
  ) {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(policy) };
    const requireActive =
      catalogResult instanceof Error
        ? jest.fn().mockRejectedValue(catalogResult)
        : jest.fn().mockResolvedValue(catalogResult);
    const guard = new CapabilitiesGuard(
      reflector as unknown as Reflector,
      new AuthorizationService(),
      { append: jest.fn() } as never,
      { requireActive } as unknown as CapabilityCatalogService,
    );
    const execution = {
      getHandler: () => function handler() {},
      getClass: () => class Controller {},
      switchToHttp: () => ({ getRequest: () => ({ principal: requestPrincipal }) }),
    } as unknown as ExecutionContext;
    return { guard, execution, requireActive };
  }

  it('denies by default when capability metadata is absent', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) };
    const guard = new CapabilitiesGuard(
      reflector as unknown as Reflector,
      new AuthorizationService(),
      { append: jest.fn() } as never,
      { requireActive: jest.fn() } as unknown as CapabilityCatalogService,
    );
    await expect(guard.canActivate(context())).resolves.toBe(false);
  });

  it('allows a declared effective capability', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(capabilityPolicy) };
    const guard = new CapabilitiesGuard(
      reflector as unknown as Reflector,
      new AuthorizationService(),
      { append: jest.fn() } as never,
      {
        requireActive: jest.fn().mockResolvedValue({ scope: 'COMPANY' }),
      } as unknown as CapabilityCatalogService,
    );
    await expect(guard.canActivate(context())).resolves.toBe(true);
  });

  it('denies a principal without the declared capability', async () => {
    const { guard, execution } = guardWith(
      capabilityPolicy,
      { scope: 'COMPANY' },
      {
        ...principal,
        permissions: [],
      },
    );
    await expect(guard.canActivate(execution)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('fails safely when the declared capability is absent from the active catalog', async () => {
    const { guard, execution } = guardWith(capabilityPolicy, new Error('not found'));
    await expect(guard.canActivate(execution)).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('rejects a platform capability in an enterprise policy', async () => {
    const { guard, execution } = guardWith(capabilityPolicy, { scope: 'PLATFORM' });
    await expect(guard.canActivate(execution)).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('requires every declared capability with ALL semantics', async () => {
    const { guard, execution } = guardWith({
      ...capabilityPolicy,
      requiredCapabilities: ['payroll.view', 'payroll.approve'],
    });
    await expect(guard.canActivate(execution)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
