import { applyDecorators, SetMetadata } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtension,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const ROUTE_ACCESS_POLICY = 'dp-system:route-access-policy';

export const ROUTE_ACCESS_CLASSIFICATIONS = [
  'PUBLIC_EXPLICIT',
  'AUTHENTICATED',
  'CAPABILITY_PROTECTED',
  'INTERNAL_TECHNICAL',
] as const;

export type RouteAccessClassification = (typeof ROUTE_ACCESS_CLASSIFICATIONS)[number];

export interface RouteAccessPolicy {
  readonly classification: RouteAccessClassification;
  readonly requireActiveCompany: boolean;
  readonly requiredCapabilities: readonly string[];
  readonly capabilitySemantics: 'ALL';
}

function freezePolicy(policy: RouteAccessPolicy): RouteAccessPolicy {
  return Object.freeze({
    ...policy,
    requiredCapabilities: Object.freeze([...policy.requiredCapabilities]),
  });
}

const PUBLIC_POLICY = freezePolicy({
  classification: 'PUBLIC_EXPLICIT',
  requireActiveCompany: false,
  requiredCapabilities: [],
  capabilitySemantics: 'ALL',
});

export function PublicRoute(): ClassDecorator & MethodDecorator {
  return applyDecorators(
    SetMetadata(ROUTE_ACCESS_POLICY, PUBLIC_POLICY),
    ApiExtension('x-access-classification', PUBLIC_POLICY.classification),
  );
}

export function AuthenticatedRoute(options: { readonly requireActiveCompany?: boolean } = {}) {
  const policy = freezePolicy({
    classification: 'AUTHENTICATED',
    requireActiveCompany: options.requireActiveCompany ?? false,
    requiredCapabilities: [],
    capabilitySemantics: 'ALL',
  });
  return applyDecorators(
    SetMetadata(ROUTE_ACCESS_POLICY, policy),
    ApiBearerAuth(),
    ApiExtension('x-access-classification', policy.classification),
    ApiExtension('x-active-company-required', policy.requireActiveCompany),
    ApiUnauthorizedResponse({ description: 'Authenticated identity is required.' }),
    ...(policy.requireActiveCompany
      ? [ApiForbiddenResponse({ description: 'Active company context is not allowed.' })]
      : []),
  );
}

export function RequireCapabilities(...capabilities: readonly string[]) {
  const normalized = [...new Set(capabilities.map((capability) => capability.trim()))].sort();
  if (normalized.length === 0 || normalized.some((capability) => capability.length === 0)) {
    throw new Error('RequireCapabilities requires at least one non-empty capability');
  }
  const policy = freezePolicy({
    classification: 'CAPABILITY_PROTECTED',
    requireActiveCompany: true,
    requiredCapabilities: normalized,
    capabilitySemantics: 'ALL',
  });
  return applyDecorators(
    SetMetadata(ROUTE_ACCESS_POLICY, policy),
    ApiBearerAuth(),
    ApiExtension('x-access-classification', policy.classification),
    ApiExtension('x-active-company-required', true),
    ApiExtension('x-required-capabilities', normalized.join(',')),
    ApiExtension('x-capability-semantics', 'ALL'),
    ApiUnauthorizedResponse({ description: 'Authenticated identity is required.' }),
    ApiForbiddenResponse({ description: 'Required capability or active company is unavailable.' }),
  );
}

export function RequireActiveCompany(): ClassDecorator & MethodDecorator {
  return AuthenticatedRoute({ requireActiveCompany: true }) as ClassDecorator & MethodDecorator;
}

export function isRouteAccessPolicy(value: unknown): value is RouteAccessPolicy {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<RouteAccessPolicy>;
  return (
    typeof candidate.classification === 'string' &&
    ROUTE_ACCESS_CLASSIFICATIONS.includes(candidate.classification as RouteAccessClassification) &&
    typeof candidate.requireActiveCompany === 'boolean' &&
    Array.isArray(candidate.requiredCapabilities) &&
    candidate.requiredCapabilities.every((item) => typeof item === 'string') &&
    candidate.capabilitySemantics === 'ALL'
  );
}
