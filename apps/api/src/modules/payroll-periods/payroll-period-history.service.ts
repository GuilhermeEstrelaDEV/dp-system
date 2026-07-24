import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthorizationService } from '../auth/authorization.service';

const HISTORY_CAPABILITY = 'payroll.period.close.history';

const versionInclude = {
  creator: { select: { id: true, displayName: true } },
  selectedPayrollRun: { select: { id: true, sequence: true, status: true } },
  linkedReviewCycle: { select: { id: true, reviewRound: true, status: true } },
  previousClosureVersion: { select: { id: true, version: true } },
  nextClosureVersions: { select: { id: true, version: true }, orderBy: { version: 'asc' } },
  manifests: {
    select: {
      id: true,
      manifestVersion: true,
      payloadHash: true,
      hashAlgorithmVersion: true,
      createdAt: true,
    },
    orderBy: { manifestVersion: 'desc' },
    take: 1,
  },
  warningAcknowledgements: {
    select: {
      warningCode: true,
      acknowledgementPayload: true,
      acknowledgedAt: true,
      actor: { select: { id: true, displayName: true } },
    },
    orderBy: { acknowledgedAt: 'asc' },
  },
  events: {
    select: {
      id: true,
      eventType: true,
      createdAt: true,
      traceId: true,
      actor: { select: { id: true, displayName: true } },
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.PayrollPeriodClosureVersionInclude;

type VersionRecord = Prisma.PayrollPeriodClosureVersionGetPayload<{
  include: typeof versionInclude;
}>;

@Injectable()
export class PayrollPeriodHistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: AuthorizationService,
  ) {}

  async list(payrollPeriodId: string, principal: AuthenticatedPrincipal) {
    await this.period(payrollPeriodId, principal);
    const versions = await this.prisma.payrollPeriodClosureVersion.findMany({
      where: { payrollPeriodId, companyId: principal.activeCompanyId! },
      include: versionInclude,
      orderBy: { version: 'asc' },
    });
    return { payrollPeriodId, versions: versions.map((version) => this.summary(version)) };
  }

  async find(payrollPeriodId: string, closureVersion: number, principal: AuthenticatedPrincipal) {
    await this.period(payrollPeriodId, principal);
    const version = await this.version(payrollPeriodId, closureVersion, principal);
    return {
      ...this.summary(version),
      warningAcknowledgements: version.warningAcknowledgements.map((item) => ({
        warningCode: item.warningCode,
        acknowledgedAt: item.acknowledgedAt.toISOString(),
        actor: item.actor,
        acknowledgement: this.safeAcknowledgement(item.acknowledgementPayload),
      })),
    };
  }

  async events(payrollPeriodId: string, closureVersion: number, principal: AuthenticatedPrincipal) {
    await this.period(payrollPeriodId, principal);
    const version = await this.version(payrollPeriodId, closureVersion, principal);
    return {
      payrollPeriodId,
      closureVersion,
      events: version.events.map((event) => ({
        id: event.id,
        type: event.eventType,
        occurredAt: event.createdAt.toISOString(),
        actor: event.actor,
        traceId: event.traceId,
      })),
    };
  }

  async manifest(
    payrollPeriodId: string,
    closureVersion: number,
    principal: AuthenticatedPrincipal,
  ) {
    await this.period(payrollPeriodId, principal);
    const closure = await this.prisma.payrollPeriodClosureVersion.findFirst({
      where: { payrollPeriodId, companyId: principal.activeCompanyId!, version: closureVersion },
      include: {
        manifests: { orderBy: { manifestVersion: 'desc' }, take: 1 },
        warningAcknowledgements: {
          select: { warningCode: true, acknowledgedAt: true },
          orderBy: { acknowledgedAt: 'asc' },
        },
      },
    });
    const manifest = closure?.manifests[0];
    if (!closure || !manifest)
      throw new NotFoundException('Manifesto de fechamento não encontrado');
    const payload = this.object(manifest.payload);
    return {
      payrollPeriodId,
      closureVersion,
      manifestId: manifest.id,
      manifestVersion: manifest.manifestVersion,
      hash: manifest.payloadHash,
      algorithm: manifest.hashAlgorithmVersion,
      createdAt: manifest.createdAt.toISOString(),
      schemaVersion: this.string(payload.schemaVersion),
      summary: {
        previousStatus: this.string(payload.previousStatus),
        intendedStatus: this.string(payload.intendedStatus),
        generatedAt: this.string(payload.generatedAt),
        payrollRunSequence: this.number(payload.payrollRunSequence),
        reviewRound: this.number(payload.reviewRound),
      },
      warnings: this.strings(payload.variablePayWarnings),
      acknowledgements: closure.warningAcknowledgements.map((item) => ({
        warningCode: item.warningCode,
        acknowledgedAt: item.acknowledgedAt.toISOString(),
      })),
      totals: this.stringRecord(payload.consolidatedTotals),
      references: {
        payrollRunId: this.string(payload.payrollRunId),
        reviewCycleId: this.string(payload.reviewCycleId),
        decisions: this.strings(payload.validDecisionReferences),
        findings: this.strings(payload.relevantFindingReferences),
        employees: this.strings(payload.safeEmployeeReferences),
      },
    };
  }

  private async period(id: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, HISTORY_CAPABILITY);
    const period = await this.prisma.payrollPeriod.findFirst({
      where: { id, companyId: principal.activeCompanyId! },
      select: { id: true },
    });
    if (!period) throw new NotFoundException('Competência não encontrada');
    return period;
  }

  private async version(
    payrollPeriodId: string,
    version: number,
    principal: AuthenticatedPrincipal,
  ) {
    const record = await this.prisma.payrollPeriodClosureVersion.findFirst({
      where: {
        payrollPeriodId,
        companyId: principal.activeCompanyId!,
        version,
      },
      include: versionInclude,
    });
    if (!record) throw new NotFoundException('Versão de fechamento não encontrada');
    return record;
  }

  private summary(version: VersionRecord) {
    const manifest = version.manifests[0];
    return {
      id: version.id,
      version: version.version,
      status: version.status,
      isActive: version.supersededAt === null,
      openedAt: version.createdAt.toISOString(),
      closedAt: version.closedAt?.toISOString() ?? null,
      reopenedAt: version.reopenedAt?.toISOString() ?? null,
      supersededAt: version.supersededAt?.toISOString() ?? null,
      actor: version.creator,
      payrollRun: version.selectedPayrollRun,
      review: version.linkedReviewCycle,
      predecessor: version.previousClosureVersion,
      successor: version.nextClosureVersions[0] ?? null,
      manifest: manifest
        ? {
            id: manifest.id,
            version: manifest.manifestVersion,
            hash: manifest.payloadHash,
            algorithm: manifest.hashAlgorithmVersion,
            createdAt: manifest.createdAt.toISOString(),
          }
        : null,
      events: version.events.map((event) => ({
        id: event.id,
        type: event.eventType,
        occurredAt: event.createdAt.toISOString(),
        actor: event.actor,
      })),
    };
  }

  private safeAcknowledgement(value: Prisma.JsonValue) {
    const object = this.object(value);
    return { acknowledged: object.acknowledged === true, reason: this.string(object.reason) };
  }
  private object(value: Prisma.JsonValue): Prisma.JsonObject {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  private string(value: Prisma.JsonValue | undefined) {
    return typeof value === 'string' ? value : null;
  }
  private number(value: Prisma.JsonValue | undefined) {
    return typeof value === 'number' ? value : null;
  }
  private strings(value: Prisma.JsonValue | undefined) {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }
  private stringRecord(value: Prisma.JsonValue | undefined) {
    const object = this.object(value ?? null);
    return Object.fromEntries(
      Object.entries(object).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
  }
}
