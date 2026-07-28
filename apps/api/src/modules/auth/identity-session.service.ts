import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { IdentityAuthenticationException } from './identity-authentication.errors';

@Injectable()
export class IdentitySessionService {
  constructor(private readonly prisma: PrismaService) {}

  async register(userId: string, sessionId: string, expiresAt: Date): Promise<void> {
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: this.hash(sessionId), expiresAt },
    });
  }

  async assertActive(userId: string, sessionId: string, now = new Date()): Promise<void> {
    const session = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(sessionId) },
      select: { userId: true, status: true, expiresAt: true, revokedAt: true },
    });
    if (!session || session.userId !== userId) {
      throw new IdentityAuthenticationException('SESSION_NOT_FOUND');
    }
    if (session.expiresAt <= now || session.status === 'EXPIRED') {
      throw new IdentityAuthenticationException('SESSION_EXPIRED');
    }
    if (session.status !== 'ACTIVE' || session.revokedAt !== null) {
      throw new IdentityAuthenticationException('SESSION_REVOKED');
    }
  }

  async revoke(sessionId: string, revokedAt = new Date()): Promise<boolean> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(sessionId), status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt },
    });
    return result.count > 0;
  }

  private hash(sessionId: string): string {
    return createHash('sha256').update(sessionId, 'utf8').digest('hex');
  }
}
