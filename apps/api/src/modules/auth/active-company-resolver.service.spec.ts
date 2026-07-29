import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { ActiveCompanyResolverService } from './active-company-resolver.service';
import { CompanySelectionService } from './company-selection.service';

describe('ActiveCompanyResolverService', () => {
  const findMany = jest.fn();
  const service = new ActiveCompanyResolverService(
    { userCompanyRole: { findMany } } as unknown as PrismaService,
    new CompanySelectionService(),
  );
  const companyId = '11111111-1111-4111-8111-111111111111';
  const now = new Date('2026-07-29T12:00:00.000Z');
  beforeEach(() => jest.clearAllMocks());

  it('resolves a minimal immutable context from all valid assignments', async () => {
    findMany.mockResolvedValue([{ id: 'assignment-a' }, { id: 'assignment-b' }]);
    const result = await service.resolve(
      { actorId: 'user-a' },
      [{ source: 'SESSION_TOKEN', value: companyId }],
      now,
    );
    expect(result).toEqual({
      userId: 'user-a',
      companyId,
      assignmentIds: ['assignment-a', 'assignment-b'],
      selectionSource: 'SESSION_TOKEN',
      resolvedAt: now.toISOString(),
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.assignmentIds)).toBe(true);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-a',
          companyId,
          status: 'ACTIVE',
          company: { status: 'ACTIVE' },
        }),
      }),
    );
  });

  it('requires an authenticated identity', async () => {
    await expect(
      service.resolve(undefined, [{ source: 'SESSION_TOKEN', value: companyId }]),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it.each(['unlinked', 'expired', 'inactive company'])(
    'denies %s without revealing resource existence',
    async () => {
      findMany.mockResolvedValue([]);
      await expect(
        service.resolve(
          { actorId: 'user-a' },
          [{ source: 'SESSION_TOKEN', value: companyId }],
          now,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );

  it('does not leak contexts across concurrent resolutions', async () => {
    findMany.mockImplementation(({ where }: { where: { userId: string } }) =>
      Promise.resolve([{ id: `assignment-${where.userId}` }]),
    );
    const [a, b] = await Promise.all([
      service.resolve({ actorId: 'a' }, [{ source: 'SESSION_TOKEN', value: companyId }], now),
      service.resolve({ actorId: 'b' }, [{ source: 'SESSION_TOKEN', value: companyId }], now),
    ]);
    expect(a.userId).toBe('a');
    expect(b.userId).toBe('b');
    expect(a).not.toBe(b);
  });
});
