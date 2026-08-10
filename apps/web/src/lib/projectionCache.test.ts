import { describe, expect, it } from 'vitest';
import {
  MINIMAL_PROJECTION_PROFILE,
  minimalProjectionKey,
  minimalProjectionScopeKey,
} from './projectionCache';

describe('approved minimal projection cache keys', () => {
  it('segments memory cache by company, actor, resource and MINIMAL profile', () => {
    const key = minimalProjectionKey('company-a', 'actor-a', 'dashboard-summary');

    expect(key).toEqual([
      'approved-projection',
      'company-a',
      'actor-a',
      'dashboard-summary',
      MINIMAL_PROJECTION_PROFILE,
    ]);
    expect(key).not.toEqual(minimalProjectionKey('company-b', 'actor-a', 'dashboard-summary'));
    expect(key).not.toEqual(minimalProjectionKey('company-a', 'actor-b', 'dashboard-summary'));
    expect(key).not.toEqual(minimalProjectionKey('company-a', 'actor-a', 'payroll-review'));
  });

  it('includes resource identities such as period and version without weakening the scope', () => {
    expect(
      minimalProjectionKey('company-a', 'actor-a', 'payroll-period-history', 'period', 2),
    ).toEqual([
      'approved-projection',
      'company-a',
      'actor-a',
      'payroll-period-history',
      'MINIMAL',
      'period',
      2,
    ]);
    expect(minimalProjectionScopeKey('company-a', 'actor-a')).toEqual([
      'approved-projection',
      'company-a',
      'actor-a',
    ]);
  });

  it('fails closed into distinct unauthenticated scope markers', () => {
    expect(minimalProjectionScopeKey(null, undefined)).toEqual([
      'approved-projection',
      'NO_ACTIVE_COMPANY',
      'NO_ACTOR',
    ]);
  });
});
