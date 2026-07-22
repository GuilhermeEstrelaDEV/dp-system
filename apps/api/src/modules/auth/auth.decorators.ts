import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedPrincipal, RequestWithContext } from '../../common/http/request-context';

export const REQUIRED_CAPABILITIES = 'required-capabilities';
export const RequireCapabilities = (...capabilities: string[]) =>
  SetMetadata(REQUIRED_CAPABILITIES, capabilities);

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPrincipal => {
    const principal = context.switchToHttp().getRequest<RequestWithContext>().principal;
    if (!principal) throw new Error('Authenticated principal is unavailable');
    return principal;
  },
);
