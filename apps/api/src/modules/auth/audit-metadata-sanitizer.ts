import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

const prohibitedKeyPattern =
  /(password|hash|token|secret|cookie|authorization|bank|account|routing|pix)/i;
const allowedMetadataKeys = new Set([
  'capabilities',
  'status',
  'startsAt',
  'expiresAt',
  'grantType',
  'outcome',
  'source',
]);

function rejectSensitive(value: Prisma.InputJsonValue, path: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectSensitive(item, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => {
      if (prohibitedKeyPattern.test(key)) {
        throw new BadRequestException(`Campo sensível não pode ser auditado: ${path}.${key}`);
      }
      rejectSensitive(child, `${path}.${key}`);
    });
  }
}

export function sanitizeAuditState(
  value?: Prisma.InputJsonValue,
): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  rejectSensitive(value, 'state');
  return value;
}

export function sanitizeAuditMetadata(
  value?: Prisma.InputJsonObject,
): Prisma.InputJsonObject | undefined {
  if (!value) return undefined;
  Object.keys(value).forEach((key) => {
    if (!allowedMetadataKeys.has(key)) {
      throw new BadRequestException(`Metadata de auditoria não permitida: ${key}`);
    }
  });
  rejectSensitive(value, 'metadata');
  return value;
}
