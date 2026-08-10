export type AuthenticatedUser = {
  actorId: string;
  permissions: string[];
  activeCompanyId: string | null;
  displayName: string;
  email: string;
};

export type AvailableCompany = {
  id: string;
  legalName: string;
  tradeName: string | null;
};

export type StoredSession = {
  token: string;
  user: AuthenticatedUser;
  companies: AvailableCompany[];
};

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function string(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function sanitizeStoredSession(value: unknown): StoredSession | null {
  const source = record(value);
  const user = record(source?.user);
  const companies = Array.isArray(source?.companies) ? source.companies : null;
  const token = string(source?.token);
  const actorId = string(user?.actorId);
  const email = string(user?.email);
  const displayName = string(user?.displayName);
  const activeCompanyIdValue = user?.activeCompanyId;
  const activeCompanyId = activeCompanyIdValue === null ? null : string(activeCompanyIdValue);
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.filter((permission): permission is string => typeof permission === 'string')
    : null;
  if (
    !token ||
    !actorId ||
    !email ||
    !displayName ||
    (activeCompanyId === null && activeCompanyIdValue !== null) ||
    !permissions ||
    !companies
  ) {
    return null;
  }

  const safeCompanies = companies.map((company) => {
    const item = record(company);
    const id = string(item?.id);
    const legalName = string(item?.legalName);
    const tradeNameValue = item?.tradeName;
    const tradeName = tradeNameValue === null ? null : string(tradeNameValue);
    return id && legalName && (tradeName !== null || tradeNameValue === null)
      ? { id, legalName, tradeName }
      : null;
  });

  if (safeCompanies.some((company) => company === null)) return null;

  return {
    token,
    user: { actorId, activeCompanyId, permissions, email, displayName },
    companies: safeCompanies.filter((company): company is AvailableCompany => company !== null),
  };
}
