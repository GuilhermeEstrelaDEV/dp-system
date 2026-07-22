import { BadRequestException } from '@nestjs/common';
import { sanitizeAuditMetadata, sanitizeAuditState } from './audit-metadata-sanitizer';

describe('audit metadata sanitizer', () => {
  it('accepts allowlisted metadata and ordinary state', () => {
    expect(sanitizeAuditMetadata({ capabilities: ['payroll.view'], status: 'ACTIVE' })).toEqual({
      capabilities: ['payroll.view'],
      status: 'ACTIVE',
    });
    expect(sanitizeAuditState({ name: 'safe' })).toEqual({ name: 'safe' });
  });

  it.each(['password', 'passwordHash', 'accessToken', 'clientSecret', 'cookie', 'authorization'])(
    'rejects sensitive field %s recursively',
    (field) => {
      expect(() => sanitizeAuditState({ nested: { [field]: 'value' } })).toThrow(
        BadRequestException,
      );
    },
  );

  it('rejects metadata outside the explicit allowlist', () => {
    expect(() => sanitizeAuditMetadata({ arbitrary: 'value' })).toThrow(BadRequestException);
  });
});
