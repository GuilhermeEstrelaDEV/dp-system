import { ForbiddenException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from './identity-context';
import { resolveEffectiveAuthorizationContext } from './effective-authorization-context';

describe('resolveEffectiveAuthorizationContext', () => {
  const principal: AuthenticatedPrincipal = {
    actorId: 'actor',
    activeCompanyId: 'company',
    permissions: ['payroll.review.approve'],
    traceId: 'trace',
    sessionId: 'session',
    ipAddress: '127.0.0.1',
    userAgent: null,
    accessGrants: [
      {
        id: 'grant-b',
        type: 'SUBSTITUTION',
        capabilities: ['payroll.review.approve'],
      },
      {
        id: 'grant-a',
        type: 'EMERGENCY',
        capabilities: ['payroll.review.approve'],
      },
    ],
  };

  it('captures the effective grants without querying persistence and freezes the result', () => {
    const result = resolveEffectiveAuthorizationContext(principal, ['payroll.review.approve']);
    expect(result.effectiveGrantIds).toEqual(['grant-a', 'grant-b']);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.effectiveGrantIds)).toBe(true);
  });

  it('fails closed without company or capability', () => {
    expect(() =>
      resolveEffectiveAuthorizationContext({ ...principal, activeCompanyId: null }, []),
    ).toThrow(ForbiddenException);
    expect(() =>
      resolveEffectiveAuthorizationContext(principal, ['payroll.review.reject']),
    ).toThrow(ForbiddenException);
  });
});
