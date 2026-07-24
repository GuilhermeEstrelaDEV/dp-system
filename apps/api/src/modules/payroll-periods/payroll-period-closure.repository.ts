import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, type PayrollPeriodClosureOperationType } from '@prisma/client';

export interface CreateClosureVersionRecord {
  readonly id: string;
  readonly companyId: string;
  readonly payrollPeriodId: string;
  readonly selectedPayrollRunId: string;
  readonly linkedReviewCycleId: string;
  readonly linkedReviewRound: number;
  readonly consistencyToken: string;
  readonly createdBy: string;
  readonly previousClosureVersionId?: string;
}

export interface ReserveIdempotencyRecord {
  readonly companyId: string;
  readonly payrollPeriodId: string;
  readonly operationType: PayrollPeriodClosureOperationType;
  readonly idempotencyKeyHash: string;
  readonly requestFingerprint: string;
}

@Injectable()
export class PayrollPeriodClosureRepository {
  async createVersion(client: Prisma.TransactionClient, input: CreateClosureVersionRecord) {
    const active = await client.payrollPeriodClosureVersion.findFirst({
      where: {
        companyId: input.companyId,
        payrollPeriodId: input.payrollPeriodId,
        supersededAt: null,
      },
      select: { id: true },
    });
    if (active) throw new ConflictException('Já existe versão operacional ativa');

    const latest = await client.payrollPeriodClosureVersion.findFirst({
      where: { companyId: input.companyId, payrollPeriodId: input.payrollPeriodId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return client.payrollPeriodClosureVersion.create({
      data: {
        ...input,
        version: (latest?.version ?? 0) + 1,
        status: 'OPEN',
        optimisticVersion: 1,
      },
    });
  }

  getActive(companyId: string, payrollPeriodId: string, client: Prisma.TransactionClient) {
    return client.payrollPeriodClosureVersion.findFirst({
      where: { companyId, payrollPeriodId, supersededAt: null },
    });
  }

  getHistory(companyId: string, payrollPeriodId: string, client: Prisma.TransactionClient) {
    return client.payrollPeriodClosureVersion.findMany({
      where: { companyId, payrollPeriodId },
      orderBy: { version: 'asc' },
    });
  }

  appendManifest(
    client: Prisma.TransactionClient,
    data: Prisma.PayrollPeriodClosureManifestUncheckedCreateInput,
  ) {
    return client.payrollPeriodClosureManifest.create({ data });
  }

  appendEvent(
    client: Prisma.TransactionClient,
    data: Prisma.PayrollPeriodClosureEventUncheckedCreateInput,
  ) {
    return client.payrollPeriodClosureEvent.create({ data });
  }

  appendWarningAcknowledgement(
    client: Prisma.TransactionClient,
    data: Prisma.PayrollPeriodClosureWarningAcknowledgementUncheckedCreateInput,
  ) {
    return client.payrollPeriodClosureWarningAcknowledgement.create({ data });
  }

  reserveIdempotency(client: Prisma.TransactionClient, input: ReserveIdempotencyRecord) {
    return client.payrollPeriodClosureIdempotency.create({ data: input });
  }

  completeIdempotency(
    client: Prisma.TransactionClient,
    id: string,
    responseReference: string,
    completedAt: Date,
  ) {
    return client.payrollPeriodClosureIdempotency.updateMany({
      where: { id, status: 'IN_PROGRESS' },
      data: { status: 'COMPLETED', responseReference, completedAt },
    });
  }

  failIdempotency(
    client: Prisma.TransactionClient,
    id: string,
    failureCode: string,
    completedAt: Date,
  ) {
    return client.payrollPeriodClosureIdempotency.updateMany({
      where: { id, status: 'IN_PROGRESS' },
      data: { status: 'FAILED', failureCode, completedAt },
    });
  }

  updateOptimistically(
    client: Prisma.TransactionClient,
    id: string,
    companyId: string,
    expectedVersion: number,
    data: Prisma.PayrollPeriodClosureVersionUncheckedUpdateManyInput,
  ) {
    return client.payrollPeriodClosureVersion.updateMany({
      where: { id, companyId, optimisticVersion: expectedVersion },
      data: { ...data, optimisticVersion: { increment: 1 } },
    });
  }
}
