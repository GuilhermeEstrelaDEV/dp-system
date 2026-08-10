import { presentEmergencyAccess, presentSubstitution } from './access-grants.presenter';

describe('access grants approved minimal presenters', () => {
  const startsAt = new Date('2026-08-08T10:00:00.000Z');
  const expiresAt = new Date('2026-08-08T18:00:00.000Z');

  it('projects a substitution without company, authorship, reasons or timestamps', () => {
    const source = {
      id: 'grant',
      companyId: 'company',
      holderUserId: 'holder',
      substituteUserId: 'substitute',
      grantedByUserId: 'grantor',
      capabilities: ['payroll.review.view'],
      startsAt,
      expiresAt,
      reason: 'blocked',
      status: 'ACTIVE',
      revokedAt: null,
      revokedByUserId: null,
      revocationReason: null,
      createdAt: startsAt,
      updatedAt: startsAt,
    };
    expect(presentSubstitution(source)).toEqual({
      id: 'grant',
      holderUserId: 'holder',
      substituteUserId: 'substitute',
      capabilities: ['payroll.review.view'],
      startsAt: startsAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'ACTIVE',
      revokedAt: null,
    });
  });

  it('projects emergency access without company, grantor or free text', () => {
    const source = {
      id: 'emergency',
      companyId: 'company',
      beneficiaryUserId: 'beneficiary',
      grantedByUserId: 'grantor',
      capabilities: ['payroll.review.view'],
      startsAt,
      expiresAt,
      reason: 'blocked',
      status: 'ACTIVE',
      revokedAt: null,
    };
    const result = presentEmergencyAccess(source);
    expect(result).not.toHaveProperty('companyId');
    expect(result).not.toHaveProperty('grantedByUserId');
    expect(result).not.toHaveProperty('reason');
  });
});
