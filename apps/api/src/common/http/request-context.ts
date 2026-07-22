import type { Request } from 'express';

export interface AuthenticatedPrincipal {
  actorId: string;
  activeCompanyId: string | null;
  permissions: readonly string[];
  traceId: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string | null;
  accessGrants: readonly {
    id: string;
    type: 'SUBSTITUTION' | 'EMERGENCY';
    capabilities: readonly string[];
  }[];
}

export type RequestWithContext = Request & {
  correlationId?: string;
  principal?: AuthenticatedPrincipal;
};

export function requestPath(request: Request): string {
  return `${request.baseUrl}${request.path}`;
}
