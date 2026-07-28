export interface TokenIdentity {
  actorId: string;
  activeCompanyId: string | null;
  sessionId: string;
}

export interface AuthenticatedPrincipal extends TokenIdentity {
  permissions: readonly string[];
  traceId: string;
  ipAddress: string;
  userAgent: string | null;
  accessGrants: readonly {
    id: string;
    type: 'SUBSTITUTION' | 'EMERGENCY';
    capabilities: readonly string[];
  }[];
}
