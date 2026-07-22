import type { PrismaService } from '../../prisma/prisma.service';
import { AuditWriterService } from './audit-writer.service';

describe('AuditWriterService', () => {
  const create = jest.fn();
  const transaction = jest.fn();
  const prisma = { auditLog: { create }, $transaction: transaction } as unknown as PrismaService;
  const writer = new AuditWriterService(prisma);
  const principal = {
    actorId: 'actor',
    activeCompanyId: 'company',
    traceId: 'trace',
    sessionId: 'session',
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  };

  beforeEach(() => jest.clearAllMocks());

  it('writes the complete audit context through the supplied transaction client', async () => {
    const txCreate = jest.fn().mockResolvedValue({ id: 'audit' });
    const tx = { auditLog: { create: txCreate } };
    await writer.append(
      {
        principal,
        action: 'UPDATED',
        entityType: 'Entity',
        entityId: 'entity',
        previousState: { status: 'OLD' },
        nextState: { status: 'NEW' },
        reason: 'reason',
      },
      tx as never,
    );
    expect(txCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: 'actor',
        companyId: 'company',
        traceId: 'trace',
        sessionId: 'session',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      }),
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('delegates domain and audit work to one Prisma transaction and propagates rollback', async () => {
    transaction.mockImplementation(async (work: (client: object) => Promise<unknown>) =>
      work({ marker: 'same-client' }),
    );
    const failure = new Error('audit failed');
    await expect(
      writer.transaction(async (client) => {
        expect(client).toEqual({ marker: 'same-client' });
        throw failure;
      }),
    ).rejects.toBe(failure);
  });
});
