import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LEGACY_DEFERRED_HANDLER_ALLOWLIST } from '../auth/route-compatibility.manifest';

const source = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('ETP-015.8 payroll closure P0 verifier', () => {
  it('keeps exactly four P0 handlers out of the legacy deferred allowlist', () => {
    const handlers = ['list', 'find', 'close', 'reopen'].map(
      (method) => `PayrollClosuresController#${method}`,
    );
    expect(handlers.filter((handler) => LEGACY_DEFERRED_HANDLER_ALLOWLIST.has(handler))).toEqual(
      [],
    );
  });

  it('forbids Prisma, fallback and parallel domain rules in the compatibility adapter', () => {
    const adapter = source('src/modules/payroll-closures/payroll-closures.service.ts');
    expect(adapter).toContain('PayrollPeriodHistoryService');
    expect(adapter).toContain('PayrollPeriodOperationalClosureService');
    expect(adapter).toContain('PayrollPeriodControlledReopeningService');
    expect(adapter).not.toMatch(/Prisma|\.payrollPeriod\.|\.payrollPeriodClosure\./);
    expect(adapter).not.toMatch(/catch\s*\(|fallback/i);
  });

  it('keeps the principal frontend consumer on the canonical payroll-period flow', () => {
    const page = source('../web/src/features/payroll/index.tsx');
    const canonicalPanel = source(
      '../web/src/features/payroll-period-history/PayrollPeriodHistoryPages.tsx',
    );
    expect(page).toContain('PayrollPeriodHistoryPanel');
    expect(page).not.toContain('payrollClosuresApi');
    expect(canonicalPanel).toContain('payrollPeriodHistoryApi.close');
    expect(canonicalPanel).toContain('payrollPeriodHistoryApi.reopen');
  });
});
