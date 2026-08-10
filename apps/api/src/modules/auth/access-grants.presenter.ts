export interface MinimalSubstitutionRecord {
  readonly id: string;
  readonly holderUserId: string;
  readonly substituteUserId: string;
  readonly capabilities: readonly string[];
  readonly startsAt: Date;
  readonly expiresAt: Date;
  readonly status: string;
  readonly revokedAt: Date | null;
}

export interface MinimalEmergencyAccessRecord {
  readonly id: string;
  readonly beneficiaryUserId: string;
  readonly capabilities: readonly string[];
  readonly startsAt: Date;
  readonly expiresAt: Date;
  readonly status: string;
  readonly revokedAt: Date | null;
}

export interface MinimalSubstitutionResponse {
  readonly id: string;
  readonly holderUserId: string;
  readonly substituteUserId: string;
  readonly capabilities: readonly string[];
  readonly startsAt: string;
  readonly expiresAt: string;
  readonly status: string;
  readonly revokedAt: string | null;
}

export interface MinimalEmergencyAccessResponse {
  readonly id: string;
  readonly beneficiaryUserId: string;
  readonly capabilities: readonly string[];
  readonly startsAt: string;
  readonly expiresAt: string;
  readonly status: string;
  readonly revokedAt: string | null;
}

export function presentSubstitution(
  record: MinimalSubstitutionRecord,
): MinimalSubstitutionResponse {
  return {
    id: record.id,
    holderUserId: record.holderUserId,
    substituteUserId: record.substituteUserId,
    capabilities: [...record.capabilities],
    startsAt: record.startsAt.toISOString(),
    expiresAt: record.expiresAt.toISOString(),
    status: record.status,
    revokedAt: record.revokedAt?.toISOString() ?? null,
  };
}

export function presentEmergencyAccess(
  record: MinimalEmergencyAccessRecord,
): MinimalEmergencyAccessResponse {
  return {
    id: record.id,
    beneficiaryUserId: record.beneficiaryUserId,
    capabilities: [...record.capabilities],
    startsAt: record.startsAt.toISOString(),
    expiresAt: record.expiresAt.toISOString(),
    status: record.status,
    revokedAt: record.revokedAt?.toISOString() ?? null,
  };
}
