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

export function createAuthenticatedPrincipal(
  principal: AuthenticatedPrincipal,
): AuthenticatedPrincipal {
  const accessGrants = principal.accessGrants.map((grant) =>
    Object.freeze({ ...grant, capabilities: Object.freeze([...grant.capabilities]) }),
  );
  return Object.freeze({
    ...principal,
    permissions: Object.freeze([...principal.permissions]),
    accessGrants: Object.freeze(accessGrants),
  });
}
