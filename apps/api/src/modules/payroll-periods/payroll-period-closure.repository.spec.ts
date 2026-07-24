import { ConflictException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PayrollPeriodClosureRepository } from './payroll-period-closure.repository';

describe('PayrollPeriodClosureRepository', () => {
  const repository = new PayrollPeriodClosureRepository();

  const client = () => ({
    $queryRaw: jest.fn(),
    payrollPeriodClosureVersion: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    payrollPeriodClosureManifest: { create: jest.fn() },
    payrollPeriodClosureEvent: { create: jest.fn() },
    payrollPeriodClosureWarningAcknowledgement: { create: jest.fn() },
    payrollPeriodClosureIdempotency: { create: jest.fn(), updateMany: jest.fn() },
  });

  const versionInput = {
    id: 'closure-1',
    companyId: 'company-1',
    payrollPeriodId: 'period-1',
    selectedPayrollRunId: 'run-1',
    linkedReviewCycleId: 'review-1',
    linkedReviewRound: 1,
    consistencyToken: 'token-1',
    createdBy: 'actor-1',
  };

  it('uses a parameterized transaction advisory lock scoped by company and period', async () => {
    const tx = client();
    await repository.lockPeriod(tx as unknown as Prisma.TransactionClient, 'company-1', 'period-1');
    expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
    const query = tx.$queryRaw.mock.calls[1]?.[0] as TemplateStringsArray;
    expect(query.join('?')).toContain('pg_advisory_xact_lock(hashtextextended(?, 0))::text');
    expect(tx.$queryRaw.mock.calls[1]?.[1]).toBe('company-1:period-1');
  });

  it('creates the next unique operational version', async () => {
    const tx = client();
    tx.payrollPeriodClosureVersion.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ version: 2 });
    tx.payrollPeriodClosureVersion.create.mockResolvedValue({ id: 'closure-1', version: 3 });

    await expect(
      repository.createVersion(tx as unknown as Prisma.TransactionClient, versionInput),
    ).resolves.toEqual({ id: 'closure-1', version: 3 });
    expect(tx.payrollPeriodClosureVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ version: 3, optimisticVersion: 1, status: 'OPEN' }),
    });
  });

  it('rejects a second active operational version', async () => {
    const tx = client();
    tx.payrollPeriodClosureVersion.findFirst.mockResolvedValue({ id: 'active-1' });
    await expect(
      repository.createVersion(tx as unknown as Prisma.TransactionClient, versionInput),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.payrollPeriodClosureVersion.create).not.toHaveBeenCalled();
  });

  it('performs optimistic updates with the expected version and increments atomically', async () => {
    const tx = client();
    tx.payrollPeriodClosureVersion.updateMany.mockResolvedValue({ count: 1 });
    await repository.updateOptimistically(
      tx as unknown as Prisma.TransactionClient,
      'closure-1',
      'company-1',
      4,
      { status: 'CLOSING' },
    );
    expect(tx.payrollPeriodClosureVersion.updateMany).toHaveBeenCalledWith({
      where: { id: 'closure-1', companyId: 'company-1', optimisticVersion: 4 },
      data: { status: 'CLOSING', optimisticVersion: { increment: 1 } },
    });
  });

  it('only completes or fails idempotency records still in progress', async () => {
    const tx = client();
    tx.payrollPeriodClosureIdempotency.updateMany.mockResolvedValue({ count: 1 });
    const at = new Date('2026-07-22T12:00:00.000Z');
    await repository.completeIdempotency(
      tx as unknown as Prisma.TransactionClient,
      'idem-1',
      'closure-1',
      at,
    );
    await repository.failIdempotency(
      tx as unknown as Prisma.TransactionClient,
      'idem-2',
      'READINESS_FAILED',
      at,
    );
    expect(tx.payrollPeriodClosureIdempotency.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: 'idem-1', status: 'IN_PROGRESS' },
      data: { status: 'COMPLETED', responseReference: 'closure-1', completedAt: at },
    });
    expect(tx.payrollPeriodClosureIdempotency.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: 'idem-2', status: 'IN_PROGRESS' },
      data: { status: 'FAILED', failureCode: 'READINESS_FAILED', completedAt: at },
    });
  });
});
