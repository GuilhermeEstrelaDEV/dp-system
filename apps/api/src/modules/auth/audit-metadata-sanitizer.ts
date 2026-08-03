import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

const prohibitedKeyPattern =
  /(password|token|secret|cookie|authorization|api.?key|connection|email|phone|address|cpf|cnpj|document|bank|account|salary|request|response|stack|query)/i;

export const AUDIT_JSON_LIMITS = Object.freeze({
  maxDepth: 4,
  maxProperties: 32,
  maxArrayItems: 32,
  maxStringLength: 512,
  maxSerializedBytes: 8_192,
});

interface JsonInspection {
  properties: number;
}

function rejectUnsafeJson(
  value: Prisma.InputJsonValue,
  path: string,
  depth: number,
  inspection: JsonInspection,
): void {
  if (depth > AUDIT_JSON_LIMITS.maxDepth) {
    throw new BadRequestException(`Audit JSON exceeds maximum depth at ${path}`);
  }
  if (typeof value === 'string' && value.length > AUDIT_JSON_LIMITS.maxStringLength) {
    throw new BadRequestException(`Audit string exceeds maximum length at ${path}`);
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new BadRequestException(`Audit number must be finite at ${path}`);
  }
  if (Array.isArray(value)) {
    if (value.length > AUDIT_JSON_LIMITS.maxArrayItems) {
      throw new BadRequestException(`Audit array exceeds maximum items at ${path}`);
    }
    value.forEach((item, index) =>
      rejectUnsafeJson(item, `${path}[${index}]`, depth + 1, inspection),
    );
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      inspection.properties += 1;
      if (inspection.properties > AUDIT_JSON_LIMITS.maxProperties) {
        throw new BadRequestException('Audit JSON exceeds maximum properties');
      }
      if (prohibitedKeyPattern.test(key)) {
        throw new BadRequestException(`Sensitive audit field is forbidden: ${path}.${key}`);
      }
      rejectUnsafeJson(child, `${path}.${key}`, depth + 1, inspection);
    }
  }
}

function validateJson(value: Prisma.InputJsonValue, path: string): void {
  rejectUnsafeJson(value, path, 0, { properties: 0 });
  if (Buffer.byteLength(JSON.stringify(value), 'utf8') > AUDIT_JSON_LIMITS.maxSerializedBytes) {
    throw new BadRequestException(`Audit JSON exceeds maximum size at ${path}`);
  }
}

export function sanitizeAuditState(
  value?: Prisma.InputJsonValue,
): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  validateJson(value, 'state');
  return value;
}

export function sanitizeAuditMetadata(
  value: Prisma.InputJsonObject,
  allowedKeys: readonly string[],
): Prisma.InputJsonObject {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new BadRequestException(`Audit metadata is not allowed: ${key}`);
    }
  }
  validateJson(value, 'metadata');
  return value;
}
