import { AuthorizationAuditVerifierService } from './authorization-audit-verifier.service';

describe('AuthorizationAuditVerifierService', () => {
  it('keeps every canonical producer cataloged, atomic and behind AuditWriterService', () => {
    const verifier = new AuthorizationAuditVerifierService();
    expect(() => verifier.assertComplete()).not.toThrow();
    expect(verifier.verify()).toEqual([]);
  });
});
