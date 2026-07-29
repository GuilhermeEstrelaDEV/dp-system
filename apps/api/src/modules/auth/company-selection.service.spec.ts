import { BadRequestException } from '@nestjs/common';
import { CompanySelectionService } from './company-selection.service';

describe('CompanySelectionService', () => {
  const service = new CompanySelectionService();
  const first = '11111111-1111-4111-8111-111111111111';
  const second = '22222222-2222-4222-8222-222222222222';

  it('normalizes equal sources using explicit precedence', () => {
    expect(
      service.resolve([
        { source: 'SESSION_TOKEN', value: first },
        { source: 'AUTH_CONTEXT_BODY', value: first },
      ]),
    ).toEqual({ companyId: first, selectionSource: 'AUTH_CONTEXT_BODY' });
  });

  it('trims and canonicalizes equivalent UUID representations before comparison', () => {
    const upper = 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA';
    expect(
      service.resolve([
        { source: 'SESSION_TOKEN', value: ` ${upper} ` },
        { source: 'AUTH_CONTEXT_BODY', value: upper.toLowerCase() },
      ]),
    ).toEqual({ companyId: upper.toLowerCase(), selectionSource: 'AUTH_CONTEXT_BODY' });
  });

  it('rejects a missing company', () =>
    expect(() => service.resolve([])).toThrow(BadRequestException));
  it.each(['', 1, 'invalid'])('rejects malformed company %p', (value) => {
    expect(() => service.resolve([{ source: 'AUTH_CONTEXT_BODY', value }])).toThrow(
      BadRequestException,
    );
  });

  it('rejects conflicting sources', () => {
    expect(() =>
      service.resolve([
        { source: 'AUTH_CONTEXT_BODY', value: first },
        { source: 'SESSION_TOKEN', value: second },
      ]),
    ).toThrow(BadRequestException);
  });

  it('does not ignore an invalid source when another source is valid', () => {
    expect(() =>
      service.resolve([
        { source: 'AUTH_CONTEXT_BODY', value: first },
        { source: 'SESSION_TOKEN', value: 'invalid' },
      ]),
    ).toThrow(BadRequestException);
  });
});
