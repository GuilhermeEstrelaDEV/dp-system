import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface EnterpriseIsolationViolation {
  readonly module: string;
  readonly method: string;
  readonly file: string;
  readonly line: number;
  readonly reason: string;
}

interface SourceRule {
  readonly module: string;
  readonly file: string;
  readonly required: readonly { snippet: string; reason: string }[];
  readonly forbidden: readonly { pattern: RegExp; reason: string }[];
}

const RULES: readonly SourceRule[] = [
  {
    module: 'auth/grants',
    file: 'src/modules/auth/access-grants.repository.ts',
    required: [
      {
        snippet: 'scope: EnterpriseScope',
        reason: 'repository methods must receive EnterpriseScope',
      },
      {
        snippet: 'companyId: scope.companyId',
        reason: 'enterprise predicates must derive companyId from EnterpriseScope',
      },
      { snippet: '.updateMany({', reason: 'enterprise writes must retain the company predicate' },
    ],
    forbidden: [
      { pattern: /\.findUnique(?:OrThrow)?\s*\(/g, reason: 'global ID lookup is forbidden' },
      { pattern: /\.update\s*\(/g, reason: 'ID-only enterprise update is forbidden' },
      {
        pattern: /companyId\s*:\s*(?:dto|input)\./g,
        reason: 'client/input company is not authority',
      },
    ],
  },
  {
    module: 'dashboard',
    file: 'src/modules/dashboard/dashboard.repository.ts',
    required: [
      {
        snippet: 'scope: EnterpriseScope',
        reason: 'dashboard queries must receive EnterpriseScope',
      },
      {
        snippet: 'companyId: scope.companyId',
        reason: 'dashboard aggregates must be scoped before execution',
      },
    ],
    forbidden: [
      { pattern: /\.findUnique(?:OrThrow)?\s*\(/g, reason: 'global ID lookup is forbidden' },
      {
        pattern: /companyId\s*:\s*(?:dto|input)\./g,
        reason: 'client/input company is not authority',
      },
    ],
  },
  {
    module: 'auth/assignments',
    file: 'src/modules/auth/assignment-governance.service.ts',
    required: [
      {
        snippet: 'scope: EnterpriseScope',
        reason: 'enterprise assignment operations require scope',
      },
      {
        snippet: 'companyId: scope.companyId',
        reason: 'assignment company must derive from EnterpriseScope',
      },
      {
        snippet: 'userCompanyRole.updateMany({',
        reason: 'assignment revocation must remain scoped',
      },
    ],
    forbidden: [
      { pattern: /companyId\s*:\s*input\./g, reason: 'assignment input company is forbidden' },
    ],
  },
  {
    module: 'auth/context',
    file: 'src/modules/auth/active-company.guard.ts',
    required: [
      {
        snippet: 'request.enterpriseScope = this.scopes.create',
        reason: 'the request scope must come from the resolved application context',
      },
    ],
    forbidden: [],
  },
] as const;

export class EnterpriseQueryIsolationVerifierService {
  verify(root = process.cwd()): EnterpriseIsolationViolation[] {
    return RULES.flatMap((rule) => {
      const source = readFileSync(resolve(root, rule.file), 'utf8');
      return this.inspect(rule, source);
    });
  }

  inspect(rule: SourceRule, source: string): EnterpriseIsolationViolation[] {
    const violations: EnterpriseIsolationViolation[] = [];
    for (const required of rule.required) {
      if (!source.includes(required.snippet)) {
        violations.push({
          module: rule.module,
          method: 'module-contract',
          file: rule.file,
          line: 1,
          reason: required.reason,
        });
      }
    }
    for (const forbidden of rule.forbidden) {
      forbidden.pattern.lastIndex = 0;
      for (const match of source.matchAll(forbidden.pattern)) {
        const index = match.index ?? 0;
        violations.push({
          module: rule.module,
          method: this.methodAt(source, index),
          file: rule.file,
          line: source.slice(0, index).split(/\r?\n/u).length,
          reason: forbidden.reason,
        });
      }
    }
    return violations;
  }

  private methodAt(source: string, index: number): string {
    const lines = source.slice(0, index).split(/\r?\n/u).reverse();
    for (const line of lines) {
      const match = /^\s*(?:async\s+)?([a-zA-Z][a-zA-Z0-9]*)\s*\(/u.exec(line);
      if (match?.[1] && !['if', 'for', 'while', 'switch'].includes(match[1])) return match[1];
    }
    return 'module-scope';
  }
}

export const ETP0155_NEGATIVE_COVERAGE = Object.freeze({
  dashboardAggregates:
    'dashboard.repository.spec.ts + enterprise-query-isolation.postgres.e2e-spec.ts',
  grantListAndDetail:
    'access-grants.repository.spec.ts + enterprise-query-isolation.postgres.e2e-spec.ts',
  grantCreateRelations:
    'access-grants.service.spec.ts + enterprise-query-isolation.postgres.e2e-spec.ts',
  grantStateChange:
    'access-grants.repository.spec.ts + enterprise-query-isolation.postgres.e2e-spec.ts',
  assignmentCreateAndRevoke: 'assignment-governance.service.spec.ts',
  companySwitch: 'enterprise-scope.spec.ts + active-company-resolver.service.spec.ts',
});
