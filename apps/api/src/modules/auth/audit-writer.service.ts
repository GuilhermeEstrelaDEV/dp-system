import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';

interface AuditEvent {
  principal: Pick<AuthenticatedPrincipal, 'actorId' | 'activeCompanyId' | 'traceId'>;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditWriterService {
  constructor(private readonly prisma: PrismaService) {}

  async append(event: AuditEvent): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: event.principal.actorId,
        companyId: event.principal.activeCompanyId,
        traceId: event.principal.traceId,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        metadata: event.metadata,
      },
    });
  }
}
