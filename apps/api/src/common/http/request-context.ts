import type { Request } from 'express';
import type { AuthenticatedPrincipal } from '../../modules/auth/identity-context';

export type { AuthenticatedPrincipal } from '../../modules/auth/identity-context';

export type RequestWithContext = Request & {
  correlationId?: string;
  principal?: AuthenticatedPrincipal;
};

export function requestPath(request: Request): string {
  return `${request.baseUrl}${request.path}`;
}
