import { DEMO_ACCESS_CAPABILITIES, type DemoAccessProfile } from './demo-access-tool';
import {
  assertExternalDemoEnvironment,
  requireExternalReviewerCredentials,
  type ExternalDemoEnvironment,
} from './external-demo-environment';

export const EXTERNAL_DEMO_ACCESS_SOURCE_ID = 'EXTERNAL-DEMO-REVIEWER-ACCESS';

export function externalDemoAccessProfile(environment: ExternalDemoEnvironment): DemoAccessProfile {
  const { email } = requireExternalReviewerCredentials(environment);
  return {
    roleCode: 'ADMINISTRATOR',
    sourceId: EXTERNAL_DEMO_ACCESS_SOURCE_ID,
    approvalReference: 'EXTERNAL-DEMO-REVIEW-ACCESS',
    grantReason: 'Acesso manual temporário à demonstração externa com dados fictícios',
    revokeReason: 'Revogação do acesso manual temporário à demonstração externa',
    actorEmail: email,
    expectedCapabilityCatalogSize: 48,
    capabilities: DEMO_ACCESS_CAPABILITIES,
    sessionPrefix: 'external-demo',
    ipAddress: '0.0.0.0',
    userAgent: 'dp-system-external-demo-access-tool',
    assertEnvironment: assertExternalDemoEnvironment,
  };
}
