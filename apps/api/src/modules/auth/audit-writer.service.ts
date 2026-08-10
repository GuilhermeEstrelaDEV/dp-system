import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { auditEventDescriptor, type AuditEventCode } from './audit-event.catalog';
import { sanitizeAuditMetadata, sanitizeAuditState } from './audit-metadata-sanitizer';
import type { EffectiveAuthorizationContext } from './effective-authorization-context';
import { resolveEffectiveAuthorizationContext } from './effective-authorization-context';
import type { EnterpriseScope } from './enterprise-scope';

type AuditClient = Prisma.TransactionClient | PrismaService;

export type AuditReasonCode =
  | 'AUTHENTICATION_SUCCEEDED'
  | 'COMPANY_CONTEXT_SELECTED'
  | 'SESSION_TERMINATED'
  | 'ASSIGNMENT_CREATED'
  | 'ASSIGNMENT_REVOKED'
  | 'GRANT_CREATED'
  | 'GRANT_REVOKED'
  | 'GRANT_EXPIRED'
  | 'SENSITIVE_READ_COMPLETED'
  | 'BUSINESS_OPERATION_COMPLETED';

export interface AuditEventEnvelope {
  readonly principal: Pick<
    AuthenticatedPrincipal,
    'actorId' | 'activeCompanyId' | 'traceId' | 'sessionId' | 'ipAddress' | 'userAgent'
  > &
    Partial<Pick<AuthenticatedPrincipal, 'permissions' | 'accessGrants'>>;
  readonly scope?: Pick<EnterpriseScope, 'companyId' | 'actorId' | 'sessionId' | 'traceId'>;
  readonly authorization?: EffectiveAuthorizationContext;
  readonly action: AuditEventCode;
  readonly entityType: string;
  readonly entityId: string;
  readonly occurredAt?: Date;
  readonly previousState?: Prisma.InputJsonValue;
  readonly nextState?: Prisma.InputJsonValue;
  readonly reason?: string;
  readonly reasonCode?: AuditReasonCode;
  readonly metadata?: Prisma.InputJsonObject;
}

@Injectable()
export class AuditWriterService {
  constructor(private readonly prisma: PrismaService) {}

  async append(event: AuditEventEnvelope, client?: AuditClient): Promise<void> {
    const descriptor = auditEventDescriptor(event.action);
    this.assertEnvelope(event);
    if (descriptor.atomicity === 'REQUIRED' && !client) {
      throw new InternalServerErrorException(
        `Atomic audit event ${event.action} requires an explicit transaction client`,
      );
    }
    const companyId = event.scope?.companyId ?? event.principal.activeCompanyId;
    if (descriptor.companyContext === 'REQUIRED' && !companyId) {
      throw new InternalServerErrorException(
        `Audit event ${event.action} requires company context`,
      );
    }
    this.assertScopeConsistency(event, companyId);
    const authorization = this.resolveAuthorization(
      event,
      descriptor.requiredCapabilities,
      descriptor.allowedAuthorizationCapabilities,
    );
    const reasonCode = event.reasonCode ?? 'BUSINESS_OPERATION_COMPLETED';
    if (event.reason && event.reason.length > 1_000) {
      throw new BadRequestException('Audit reason exceeds maximum length');
    }
    const eventMetadata = sanitizeAuditMetadata(event.metadata ?? {}, descriptor.allowedMetadata);
    const metadata: Prisma.InputJsonObject = {
      ...eventMetadata,
      eventVersion: descriptor.version,
      category: descriptor.category,
      outcome: authorization?.outcome ?? 'RECORDED',
      requiredCapabilities: authorization?.requiredCapabilities ?? [],
      satisfiedCapabilities: authorization?.satisfiedCapabilities ?? [],
      effectiveGrantIds: authorization?.effectiveGrantIds ?? [],
      reasonCode,
    };
    const allowedMetadata = [
      'eventVersion',
      'category',
      'outcome',
      'requiredCapabilities',
      'satisfiedCapabilities',
      'effectiveGrantIds',
      'reasonCode',
      ...descriptor.allowedMetadata,
    ];
    const target = client ?? this.prisma;
    await target.auditLog.create({
      data: {
        actorUserId: event.principal.actorId,
        companyId,
        sessionId: event.principal.sessionId,
        traceId: event.principal.traceId,
        ipAddress: event.principal.ipAddress,
        userAgent: event.principal.userAgent,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        occurredAt: event.occurredAt,
        previousState: sanitizeAuditState(event.previousState),
        nextState: sanitizeAuditState(event.nextState),
        reason: event.reason,
        metadata: sanitizeAuditMetadata(metadata, allowedMetadata),
      },
    });
  }

  transaction<T>(
    work: (client: Prisma.TransactionClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T> {
    return this.prisma.$transaction(work, options);
  }

  private resolveAuthorization(
    event: AuditEventEnvelope,
    requiredCapabilities: readonly string[],
    allowedAuthorizationCapabilities: readonly string[],
  ): EffectiveAuthorizationContext | undefined {
    const dynamicCapabilities = event.authorization?.requiredCapabilities ?? [];
    if (
      requiredCapabilities.length === 0 &&
      allowedAuthorizationCapabilities.length > 0 &&
      dynamicCapabilities.length === 0
    ) {
      throw new InternalServerErrorException(
        'Audit authorization capability is not approved for the event',
      );
    }
    const effectiveRequired =
      requiredCapabilities.length > 0 ? requiredCapabilities : dynamicCapabilities;
    if (effectiveRequired.length === 0) return undefined;
    if (
      requiredCapabilities.length === 0 &&
      (effectiveRequired.length !== 1 ||
        effectiveRequired.some(
          (capability) => !allowedAuthorizationCapabilities.includes(capability),
        ))
    ) {
      throw new InternalServerErrorException(
        'Audit authorization capability is not approved for the event',
      );
    }
    const principal = {
      ...event.principal,
      permissions: event.principal.permissions ?? [],
      accessGrants: event.principal.accessGrants ?? [],
    };
    const expected = resolveEffectiveAuthorizationContext(principal, effectiveRequired);
    const decision = event.authorization ?? expected;
    if (
      decision.companyId !== expected.companyId ||
      decision.outcome !== expected.outcome ||
      !this.sameValues(decision.requiredCapabilities, expected.requiredCapabilities) ||
      !this.sameValues(decision.satisfiedCapabilities, expected.satisfiedCapabilities) ||
      !this.sameValues(decision.effectiveGrantIds, expected.effectiveGrantIds)
    ) {
      throw new InternalServerErrorException(
        'Audit authorization context does not match the event',
      );
    }
    return decision;
  }

  private assertScopeConsistency(event: AuditEventEnvelope, companyId: string | null): void {
    if (!event.scope) return;
    if (
      event.scope.companyId !== companyId ||
      event.scope.companyId !== event.principal.activeCompanyId ||
      event.scope.actorId !== event.principal.actorId ||
      event.scope.sessionId !== event.principal.sessionId ||
      event.scope.traceId !== event.principal.traceId
    ) {
      throw new InternalServerErrorException('Audit enterprise scope does not match the principal');
    }
  }

  private assertEnvelope(event: AuditEventEnvelope): void {
    if (!event.principal.actorId.trim()) {
      throw new InternalServerErrorException('Audit event requires an actor');
    }
    if (!event.principal.sessionId.trim()) {
      throw new InternalServerErrorException('Audit event requires a session reference');
    }
    if (!event.principal.traceId.trim()) {
      throw new InternalServerErrorException('Audit event requires a correlation ID');
    }
    if (!event.entityType.trim() || !event.entityId.trim()) {
      throw new InternalServerErrorException('Audit event requires a resource reference');
    }
  }

  private sameValues(left: readonly string[], right: readonly string[]): boolean {
    return left.length === right.length && left.every((value, index) => value === right[index]);
  }
}
