import { BadRequestException } from '@nestjs/common';
import { AUDIT_EVENT_CATALOG } from './audit-event.catalog';
import { sanitizeAuditMetadata, sanitizeAuditState } from './audit-metadata-sanitizer';

describe('audit metadata sanitizer', () => {
  it('accepts allowlisted metadata and ordinary state', () => {
    expect(
      sanitizeAuditMetadata({ capabilities: ['payroll.view'], status: 'ACTIVE' }, [
        'capabilities',
        'status',
      ]),
    ).toEqual({ capabilities: ['payroll.view'], status: 'ACTIVE' });
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
    expect(() => sanitizeAuditMetadata({ arbitrary: 'value' }, [])).toThrow(BadRequestException);
  });

  it('accepts only the approved PAYROLL_PERIOD_CLOSED metadata names', () => {
    const allowed = AUDIT_EVENT_CATALOG.PAYROLL_PERIOD_CLOSED.allowedMetadata;
    expect(
      sanitizeAuditMetadata(
        {
          closureId: 'closure',
          manifestId: 'manifest',
          manifestHash: 'hash',
          selectedPayrollRunId: 'run',
          linkedReviewCycleId: 'review',
          warnings: ['VARIABLE_PAY_PENDING'],
        },
        allowed,
      ),
    ).toEqual({
      closureId: 'closure',
      manifestId: 'manifest',
      manifestHash: 'hash',
      selectedPayrollRunId: 'run',
      linkedReviewCycleId: 'review',
      warnings: ['VARIABLE_PAY_PENDING'],
    });
  });

  it.each(['hashAlgorithmVersion', 'payrollRunId', 'reviewCycleId', 'warningAcknowledgements'])(
    'rejects legacy PAYROLL_PERIOD_CLOSED metadata key %s',
    (key) => {
      expect(() =>
        sanitizeAuditMetadata(
          { [key]: key === 'warningAcknowledgements' ? [] : 'legacy-value' },
          AUDIT_EVENT_CATALOG.PAYROLL_PERIOD_CLOSED.allowedMetadata,
        ),
      ).toThrow(`Audit metadata is not allowed: ${key}`);
    },
  );

  it('rejects oversized, deeply nested and excessive metadata instead of redacting it', () => {
    expect(() => sanitizeAuditMetadata({ source: 'x'.repeat(513) }, ['source'])).toThrow(
      BadRequestException,
    );
    expect(() => sanitizeAuditState({ a: { b: { c: { d: { e: true } } } } })).toThrow(
      BadRequestException,
    );
    expect(() => sanitizeAuditMetadata({ requestBody: 'secret' }, ['requestBody'])).toThrow(
      BadRequestException,
    );
    expect(() => sanitizeAuditState({ values: new Array(33).fill('safe') })).toThrow(
      BadRequestException,
    );
    expect(() => sanitizeAuditState({ invalid: Number.POSITIVE_INFINITY })).toThrow(
      BadRequestException,
    );
  });
});
