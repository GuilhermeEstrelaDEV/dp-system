import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { sanitizeAuditMetadata, sanitizeAuditState } from './audit-metadata-sanitizer';

type AuditClient = Prisma.TransactionClient | PrismaService;

export interface AuditEvent {
  principal: Pick<
    AuthenticatedPrincipal,
    'actorId' | 'activeCompanyId' | 'traceId' | 'sessionId' | 'ipAddress' | 'userAgent'
  >;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: Prisma.InputJsonValue;
  nextState?: Prisma.InputJsonValue;
  reason?: string;
  metadata?: Prisma.InputJsonObject;
}

@Injectable()
export class AuditWriterService {
  constructor(private readonly prisma: PrismaService) {}

  async append(event: AuditEvent, client: AuditClient = this.prisma): Promise<void> {
    await client.auditLog.create({
      data: {
        actorUserId: event.principal.actorId,
        companyId: event.principal.activeCompanyId,
        sessionId: event.principal.sessionId,
        traceId: event.principal.traceId,
        ipAddress: event.principal.ipAddress,
        userAgent: event.principal.userAgent,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        previousState: sanitizeAuditState(event.previousState),
        nextState: sanitizeAuditState(event.nextState),
        reason: event.reason,
        metadata: sanitizeAuditMetadata(event.metadata),
      },
    });
  }

  transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }
}
