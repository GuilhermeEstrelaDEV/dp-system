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
    permissions: ['delegation.manage'],
    accessGrants: [],
  };

  beforeEach(() => jest.clearAllMocks());

  it('writes the complete audit context through the supplied transaction client', async () => {
    const txCreate = jest.fn().mockResolvedValue({ id: 'audit' });
    const tx = { auditLog: { create: txCreate } };
    await writer.append(
      {
        principal,
        action: 'SUBSTITUTION_REVOKED',
        entityType: 'TemporarySubstitution',
        entityId: 'entity',
        previousState: { status: 'OLD' },
        nextState: { status: 'NEW' },
        reason: 'reason',
        reasonCode: 'GRANT_REVOKED',
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
        action: 'SUBSTITUTION_REVOKED',
        metadata: expect.objectContaining({
          eventVersion: 1,
          requiredCapabilities: ['delegation.manage'],
          satisfiedCapabilities: ['delegation.manage'],
          effectiveGrantIds: [],
        }),
      }),
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('fails closed when a critical event has no transaction client', async () => {
    await expect(
      writer.append({
        principal,
        action: 'SUBSTITUTION_REVOKED',
        entityType: 'TemporarySubstitution',
        entityId: 'entity',
      }),
    ).rejects.toThrow('requires an explicit transaction client');
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects event metadata outside the event-specific allowlist', async () => {
    await expect(
      writer.append(
        {
          principal,
          action: 'SUBSTITUTION_REVOKED',
          entityType: 'TemporarySubstitution',
          entityId: 'entity',
          metadata: { source: 'not-allowed' },
        },
        { auditLog: { create: jest.fn() } } as never,
      ),
    ).rejects.toThrow('Audit metadata is not allowed');
  });

  it('prevents event metadata from overriding canonical envelope fields', async () => {
    await expect(
      writer.append(
        {
          principal,
          action: 'SUBSTITUTION_REVOKED',
          entityType: 'TemporarySubstitution',
          entityId: 'entity',
          metadata: { outcome: 'FORGED' },
        },
        { auditLog: { create: jest.fn() } } as never,
      ),
    ).rejects.toThrow('Audit metadata is not allowed: outcome');
  });

  it.each([
    ['actor', { actorId: '' }, 'requires an actor'],
    ['session', { sessionId: '' }, 'requires a session reference'],
    ['correlation', { traceId: '' }, 'requires a correlation ID'],
  ])('rejects an empty %s in the canonical context', async (_field, override, message) => {
    await expect(
      writer.append(
        {
          principal: { ...principal, ...override },
          action: 'AUTH_LOGOUT_SUCCEEDED',
          entityType: 'Session',
          entityId: 'entity',
        },
        { auditLog: { create: jest.fn() } } as never,
      ),
    ).rejects.toThrow(message);
  });

  it('rejects an absent company for an enterprise event', async () => {
    await expect(
      writer.append(
        {
          principal: { ...principal, activeCompanyId: null },
          action: 'AUTH_COMPANY_SELECTED',
          entityType: 'Company',
          entityId: 'entity',
        },
        { auditLog: { create: jest.fn() } } as never,
      ),
    ).rejects.toThrow('requires company context');
  });

  it('rejects a scope that diverges from the authenticated company', async () => {
    await expect(
      writer.append(
        {
          principal,
          scope: {
            companyId: 'foreign-company',
            actorId: principal.actorId,
            sessionId: principal.sessionId,
            traceId: principal.traceId,
          },
          action: 'USER_COMPANY_ROLE_REVOKED',
          entityType: 'UserCompanyRole',
          entityId: 'entity',
        },
        { auditLog: { create: jest.fn() } } as never,
      ),
    ).rejects.toThrow('Audit enterprise scope does not match the principal');
  });

  it('rejects an empty resource reference', async () => {
    await expect(
      writer.append(
        {
          principal,
          action: 'AUTH_LOGOUT_SUCCEEDED',
          entityType: 'Session',
          entityId: '',
        },
        { auditLog: { create: jest.fn() } } as never,
      ),
    ).rejects.toThrow('requires a resource reference');
  });

  it('rejects a capability decision that diverges from the principal', async () => {
    await expect(
      writer.append(
        {
          principal,
          action: 'SUBSTITUTION_REVOKED',
          entityType: 'TemporarySubstitution',
          entityId: 'entity',
          authorization: {
            companyId: 'company',
            outcome: 'ALLOWED',
            requiredCapabilities: ['delegation.manage'],
            satisfiedCapabilities: [],
            effectiveGrantIds: [],
            reasonCode: 'CAPABILITIES_SATISFIED',
          },
        },
        { auditLog: { create: jest.fn() } } as never,
      ),
    ).rejects.toThrow('Audit authorization context does not match the event');
  });

  it('rejects a grant reference that diverges from the effective principal grants', async () => {
    await expect(
      writer.append(
        {
          principal,
          action: 'SUBSTITUTION_REVOKED',
          entityType: 'TemporarySubstitution',
          entityId: 'entity',
          authorization: {
            companyId: 'company',
            outcome: 'ALLOWED',
            requiredCapabilities: ['delegation.manage'],
            satisfiedCapabilities: ['delegation.manage'],
            effectiveGrantIds: ['forged-grant'],
            reasonCode: 'CAPABILITIES_SATISFIED',
          },
        },
        { auditLog: { create: jest.fn() } } as never,
      ),
    ).rejects.toThrow('Audit authorization context does not match the event');
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
