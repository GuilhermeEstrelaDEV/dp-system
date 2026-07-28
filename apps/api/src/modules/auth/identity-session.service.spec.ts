import type { PrismaService } from '../../prisma/prisma.service';
import { IdentitySessionService } from './identity-session.service';

describe('IdentitySessionService', () => {
  const create = jest.fn();
  const findUnique = jest.fn();
  const updateMany = jest.fn();
  const service = new IdentitySessionService({
    refreshToken: { create, findUnique, updateMany },
  } as unknown as PrismaService);

  beforeEach(() => jest.clearAllMocks());

  it('registers only a hash of the logical session identifier', async () => {
    create.mockResolvedValue({});
    await service.register('user', 'session-secret', new Date('2030-01-01T00:00:00Z'));
    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user',
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        expiresAt: new Date('2030-01-01T00:00:00Z'),
      },
    });
    expect(create.mock.calls[0]?.[0].data.tokenHash).not.toBe('session-secret');
  });

  it('accepts an active matching session', async () => {
    findUnique.mockResolvedValue({
      userId: 'user',
      status: 'ACTIVE',
      expiresAt: new Date('2030-01-01T00:00:00Z'),
      revokedAt: null,
    });
    await expect(
      service.assertActive('user', 'session', new Date('2029-01-01T00:00:00Z')),
    ).resolves.toBeUndefined();
  });

  it.each([
    ['missing', null],
    [
      'revoked',
      {
        userId: 'user',
        status: 'REVOKED',
        expiresAt: new Date('2030-01-01T00:00:00Z'),
        revokedAt: new Date(),
      },
    ],
    [
      'expired',
      {
        userId: 'user',
        status: 'ACTIVE',
        expiresAt: new Date('2028-01-01T00:00:00Z'),
        revokedAt: null,
      },
    ],
  ])('rejects a %s session', async (_case, session) => {
    findUnique.mockResolvedValue(session);
    await expect(
      service.assertActive('user', 'session', new Date('2029-01-01T00:00:00Z')),
    ).rejects.toMatchObject({ response: { code: 'SESSION_REVOKED' } });
  });

  it('revokes an active session logically', async () => {
    updateMany.mockResolvedValue({ count: 1 });
    await expect(service.revoke('session', new Date('2029-01-01T00:00:00Z'))).resolves.toBe(true);
    expect(updateMany).toHaveBeenCalledWith({
      where: { tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/), status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: new Date('2029-01-01T00:00:00Z') },
    });
  });
});
