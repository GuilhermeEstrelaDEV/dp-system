export const COMPANY_SELECTION_SOURCES = ['AUTH_CONTEXT_BODY', 'SESSION_TOKEN'] as const;
export type CompanySelectionSource = (typeof COMPANY_SELECTION_SOURCES)[number];
export interface RequestedCompanyCandidate {
  readonly source: CompanySelectionSource;
  readonly value: unknown;
}
export interface RequestedCompanySelection {
  readonly companyId: string;
  readonly selectionSource: CompanySelectionSource;
}
export interface ActiveCompanyContext {
  readonly userId: string;
  readonly companyId: string;
  readonly assignmentIds: readonly string[];
  readonly selectionSource: CompanySelectionSource;
  readonly resolvedAt: string;
}

const canonicalContexts = new WeakSet<object>();

export function createActiveCompanyContext(input: ActiveCompanyContext): ActiveCompanyContext {
  const context = Object.freeze({
    ...input,
    assignmentIds: Object.freeze([...input.assignmentIds]),
  });
  canonicalContexts.add(context);
  return context;
}

export function isCanonicalActiveCompanyContext(
  context: ActiveCompanyContext,
): context is ActiveCompanyContext {
  return canonicalContexts.has(context);
}
