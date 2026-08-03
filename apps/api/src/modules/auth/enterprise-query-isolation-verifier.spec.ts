import {
  EnterpriseQueryIsolationVerifierService,
  ETP0155_NEGATIVE_COVERAGE,
} from './enterprise-query-isolation-verifier.service';

describe('EnterpriseQueryIsolationVerifierService', () => {
  const verifier = new EnterpriseQueryIsolationVerifierService();

  it('reconciles all migrated data-access sources without violations', () => {
    expect(verifier.verify()).toEqual([]);
  });

  it('reports file, line, module, method and reason for unsafe lookups and input scope', () => {
    const violations = verifier.inspect(
      {
        module: 'fixture',
        file: 'fixture.ts',
        required: [],
        forbidden: [
          { pattern: /\.findUnique\s*\(/g, reason: 'global ID lookup is forbidden' },
          { pattern: /companyId\s*:\s*input\./g, reason: 'input company is forbidden' },
        ],
      },
      `class Fixture {\n  detail() {\n    return prisma.item.findUnique({ where: { id, companyId: input.companyId } });\n  }\n}`,
    );
    expect(violations).toEqual([
      expect.objectContaining({
        module: 'fixture',
        method: 'detail',
        file: 'fixture.ts',
        line: 3,
        reason: 'global ID lookup is forbidden',
      }),
      expect.objectContaining({ line: 3, reason: 'input company is forbidden' }),
    ]);
  });

  it('keeps a named negative test for every migrated operation family', () => {
    expect(Object.keys(ETP0155_NEGATIVE_COVERAGE)).toEqual([
      'dashboardAggregates',
      'grantListAndDetail',
      'grantCreateRelations',
      'grantStateChange',
      'assignmentCreateAndRevoke',
      'companySwitch',
    ]);
    expect(Object.values(ETP0155_NEGATIVE_COVERAGE).every(Boolean)).toBe(true);
  });
});
