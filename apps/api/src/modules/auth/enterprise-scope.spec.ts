import { createActiveCompanyContext } from './active-company-context';
import { EnterpriseScope, EnterpriseScopeFactory } from './enterprise-scope';
import type { AuthenticatedPrincipal } from './identity-context';

describe('EnterpriseScope', () => {
  const principal: AuthenticatedPrincipal = {
    actorId: 'actor-a',
    activeCompanyId: 'company-a',
    sessionId: 'session-a',
    traceId: 'trace-a',
    permissions: [],
    ipAddress: '127.0.0.1',
    userAgent: 'test',
    accessGrants: [],
  };
  const context = createActiveCompanyContext({
    userId: principal.actorId,
    companyId: principal.activeCompanyId!,
    assignmentIds: ['assignment-a'],
    selectionSource: 'SESSION_TOKEN',
    resolvedAt: '2026-08-03T00:00:00.000Z',
  });

  it('creates an immutable scope only from matching canonical application context', () => {
    const scope = new EnterpriseScopeFactory().create(context, principal);
    expect(scope).toEqual({
      companyId: 'company-a',
      actorId: 'actor-a',
      sessionId: 'session-a',
      traceId: 'trace-a',
      assignmentIds: ['assignment-a'],
    });
    expect(Object.isFrozen(scope)).toBe(true);
    expect(Object.isFrozen(scope.assignmentIds)).toBe(true);
  });

  it('rejects a structurally compatible object that was not resolved by the canonical service', () => {
    expect(() => EnterpriseScope.fromApplicationContext({ ...context }, principal)).toThrow(
      'canonical active company context',
    );
  });

  it('rejects company or actor conflicts', () => {
    expect(() =>
      EnterpriseScope.fromApplicationContext(context, {
        ...principal,
        activeCompanyId: 'company-b',
      }),
    ).toThrow('does not match');
    expect(() =>
      EnterpriseScope.fromApplicationContext(context, { ...principal, actorId: 'actor-b' }),
    ).toThrow('does not match');
  });
});
