import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedPrincipal, RequestWithContext } from '../../common/http/request-context';
import type { EnterpriseScope } from './enterprise-scope';
export { RequireCapabilities } from './route-access-policy';

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPrincipal => {
    const principal = context.switchToHttp().getRequest<RequestWithContext>().principal;
    if (!principal) throw new Error('Authenticated principal is unavailable');
    return principal;
  },
);

export const CurrentEnterpriseScope = createParamDecorator(
  (_data: unknown, context: ExecutionContext): EnterpriseScope => {
    const scope = context.switchToHttp().getRequest<RequestWithContext>().enterpriseScope;
    if (!scope) throw new Error('Enterprise scope is unavailable');
    return scope;
  },
);
