export const MINIMAL_PROJECTION_PROFILE = 'MINIMAL' as const;

export function minimalProjectionScopeKey(companyId: string | null, actorId: string | undefined) {
  return ['approved-projection', companyId ?? 'NO_ACTIVE_COMPANY', actorId ?? 'NO_ACTOR'] as const;
}

export function minimalProjectionKey(
  companyId: string | null,
  actorId: string | undefined,
  resource: string,
  ...identity: readonly (string | number)[]
) {
  return [
    ...minimalProjectionScopeKey(companyId, actorId),
    resource,
    MINIMAL_PROJECTION_PROFILE,
    ...identity,
  ] as const;
}
