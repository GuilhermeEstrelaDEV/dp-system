import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedPrincipal, RequestWithContext } from '../../common/http/request-context';
export { RequireCapabilities } from './route-access-policy';

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPrincipal => {
    const principal = context.switchToHttp().getRequest<RequestWithContext>().principal;
    if (!principal) throw new Error('Authenticated principal is unavailable');
    return principal;
  },
);
