import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import type { RequestWithContext } from '../../common/http/request-context';
import type { ActiveCompanyResolverService } from './active-company-resolver.service';
import { ActiveCompanyGuard } from './active-company.guard';
import { createActiveCompanyContext } from './active-company-context';
import { EnterpriseScopeFactory } from './enterprise-scope';

describe('ActiveCompanyGuard', () => {
  const companyContext = createActiveCompanyContext({
    userId: 'user-1',
    companyId: '11111111-1111-4111-8111-111111111111',
    assignmentIds: ['assignment-1'],
    selectionSource: 'SESSION_TOKEN' as const,
    resolvedAt: '2026-07-31T00:00:00.000Z',
  });

  function executionContext(request: RequestWithContext): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  it('denies an authenticated request without an active company', async () => {
    const guard = new ActiveCompanyGuard(
      { resolve: jest.fn() } as never,
      new EnterpriseScopeFactory(),
    );
    await expect(
      guard.canActivate(
        executionContext({ principal: { actorId: 'user-1', activeCompanyId: null } } as never),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('delegates to the canonical resolver and attaches its immutable context', async () => {
    const resolve = jest.fn().mockResolvedValue(companyContext);
    const guard = new ActiveCompanyGuard(
      { resolve } as unknown as ActiveCompanyResolverService,
      new EnterpriseScopeFactory(),
    );
    const request = {
      principal: {
        actorId: 'user-1',
        activeCompanyId: companyContext.companyId,
        sessionId: 'session-1',
        traceId: 'trace-1',
        permissions: [],
        ipAddress: '127.0.0.1',
        userAgent: 'test',
        accessGrants: [],
      },
    } as unknown as RequestWithContext;
    await expect(guard.canActivate(executionContext(request))).resolves.toBe(true);
    expect(resolve).toHaveBeenCalledWith(request.principal, [
      { source: 'SESSION_TOKEN', value: companyContext.companyId },
    ]);
    expect(request.activeCompanyContext).toBe(companyContext);
    expect(request.enterpriseScope).toMatchObject({
      actorId: 'user-1',
      companyId: companyContext.companyId,
      assignmentIds: ['assignment-1'],
    });
    expect(Object.isFrozen(request.enterpriseScope)).toBe(true);
  });
});
