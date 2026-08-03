import type { Request } from 'express';
import type { AuthenticatedPrincipal } from '../../modules/auth/identity-context';
import type { ActiveCompanyContext } from '../../modules/auth/active-company-context';
import type { EnterpriseScope } from '../../modules/auth/enterprise-scope';
import type { EffectiveAuthorizationContext } from '../../modules/auth/effective-authorization-context';

export type { AuthenticatedPrincipal } from '../../modules/auth/identity-context';

export type RequestWithContext = Request & {
  correlationId?: string;
  principal?: AuthenticatedPrincipal;
  activeCompanyContext?: ActiveCompanyContext;
  enterpriseScope?: EnterpriseScope;
  authorizationDecision?: EffectiveAuthorizationContext;
};

export function requestPath(request: Request): string {
  return `${request.baseUrl}${request.path}`;
}
