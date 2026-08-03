import { ForbiddenException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';

export interface EffectiveAuthorizationContext {
  readonly companyId: string;
  readonly outcome: 'ALLOWED';
  readonly requiredCapabilities: readonly string[];
  readonly satisfiedCapabilities: readonly string[];
  readonly effectiveGrantIds: readonly string[];
  readonly reasonCode: 'CAPABILITIES_SATISFIED';
}

export function resolveEffectiveAuthorizationContext(
  principal: AuthenticatedPrincipal,
  requiredCapabilities: readonly string[],
): EffectiveAuthorizationContext {
  if (!principal.activeCompanyId) throw new ForbiddenException('Acesso negado');
  const required = [...new Set(requiredCapabilities)].sort();
  const satisfied = required.filter((capability) => principal.permissions.includes(capability));
  if (satisfied.length !== required.length) throw new ForbiddenException('Acesso negado');
  const effectiveGrantIds = principal.accessGrants
    .filter((grant) => required.some((capability) => grant.capabilities.includes(capability)))
    .map((grant) => grant.id)
    .sort();
  return Object.freeze({
    companyId: principal.activeCompanyId,
    outcome: 'ALLOWED' as const,
    requiredCapabilities: Object.freeze(required),
    satisfiedCapabilities: Object.freeze(satisfied),
    effectiveGrantIds: Object.freeze(effectiveGrantIds),
    reasonCode: 'CAPABILITIES_SATISFIED' as const,
  });
}
