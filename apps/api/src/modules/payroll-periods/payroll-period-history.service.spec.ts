import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { AuthorizationService } from '../auth/authorization.service';
import { PayrollPeriodHistoryService } from './payroll-period-history.service';

const principal: AuthenticatedPrincipal = {
  actorId: 'actor',
  activeCompanyId: 'company',
  permissions: ['payroll.period.close.history'],
  traceId: 'trace',
  sessionId: 'session',
  ipAddress: '127.0.0.1',
  userAgent: 'jest',
  accessGrants: [],
};
const record = {
  id: 'closure',
  version: 1,
  status: 'CLOSED',
  supersededAt: null,
  createdAt: new Date('2026-01-01'),
  closedAt: new Date('2026-01-02'),
  reopenedAt: null,
  creator: { id: 'actor', displayName: 'Pessoa DP' },
  selectedPayrollRun: { id: 'run', sequence: 2, status: 'COMPLETED' },
  linkedReviewCycle: { id: 'review', reviewRound: 1, status: 'CLOSED' },
  previousClosureVersion: null,
  nextClosureVersions: [],
  manifests: [
    {
      id: 'manifest',
      manifestVersion: 1,
      payloadHash: 'a'.repeat(64),
      hashAlgorithmVersion: 'sha256-canonical-json-v1',
      createdAt: new Date('2026-01-02'),
    },
  ],
  warningAcknowledgements: [],
  events: [
    {
      id: 'event',
      eventType: 'PERIOD_CLOSED',
      createdAt: new Date('2026-01-02'),
      traceId: 'trace',
      actor: { id: 'actor', displayName: 'Pessoa DP' },
    },
  ],
};

describe('PayrollPeriodHistoryService', () => {
  const prisma = {
    payrollPeriod: { findFirst: jest.fn() },
    payrollPeriodClosureVersion: { findMany: jest.fn(), findFirst: jest.fn() },
  };
  const service = new PayrollPeriodHistoryService(prisma as never, new AuthorizationService());
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.payrollPeriod.findFirst.mockResolvedValue({ id: 'period' });
    prisma.payrollPeriodClosureVersion.findMany.mockResolvedValue([record]);
    prisma.payrollPeriodClosureVersion.findFirst.mockResolvedValue(record);
  });

  it('returns ordered safe version summaries with predecessor, successor and evidence', async () => {
    const result = await service.list('period', principal);
    expect(result.versions[0]).toMatchObject({
      version: 1,
      status: 'CLOSED',
      isActive: true,
      actor: { displayName: 'Pessoa DP' },
      payrollRun: { sequence: 2 },
      manifest: { hash: 'a'.repeat(64) },
    });
    expect(prisma.payrollPeriodClosureVersion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { payrollPeriodId: 'period', companyId: 'company' },
        orderBy: { version: 'asc' },
      }),
    );
  });
  it('returns chronological events and 404 for absent versions', async () => {
    const events = await service.events('period', 1, principal);
    expect(events.events[0]).toMatchObject({ type: 'PERIOD_CLOSED', traceId: 'trace' });
    prisma.payrollPeriodClosureVersion.findFirst.mockResolvedValue(null);
    await expect(service.find('period', 9, principal)).rejects.toBeInstanceOf(NotFoundException);
  });
  it('projects only safe manifest fields and handles missing manifests', async () => {
    prisma.payrollPeriodClosureVersion.findFirst.mockResolvedValue({
      manifests: [
        {
          id: 'manifest',
          manifestVersion: 1,
          payloadHash: 'a'.repeat(64),
          hashAlgorithmVersion: 'sha256-canonical-json-v1',
          createdAt: new Date(),
          payload: {
            schemaVersion: '1.0',
            consolidatedTotals: { net: '900.00' },
            actorContext: { actorId: 'secret' },
            traceId: 'not-public',
            sessionId: 'not-public',
            validDecisionReferences: ['decision'],
          },
        },
      ],
      warningAcknowledgements: [],
    });
    const result = await service.manifest('period', 1, principal);
    expect(result).toMatchObject({
      schemaVersion: '1.0',
      totals: { net: '900.00' },
      references: { decisions: ['decision'] },
    });
    expect(result).not.toHaveProperty('actorContext');
    expect(result).not.toHaveProperty('traceId');
    expect(result).not.toHaveProperty('sessionId');
    prisma.payrollPeriodClosureVersion.findFirst.mockResolvedValue({
      manifests: [],
      warningAcknowledgements: [],
    });
    await expect(service.manifest('period', 1, principal)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it('uses deny-by-default and 404 across companies', async () => {
    await expect(service.list('period', { ...principal, permissions: [] })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    prisma.payrollPeriod.findFirst.mockResolvedValue(null);
    await expect(service.list('period', principal)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.payrollPeriod.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'period', companyId: 'company' } }),
    );
  });
});
