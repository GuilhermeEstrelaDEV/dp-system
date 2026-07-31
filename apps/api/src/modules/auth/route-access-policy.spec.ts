import { ROUTE_ACCESS_POLICY } from './route-access-policy';
import {
  AuthenticatedRoute,
  PublicRoute,
  RequireActiveCompany,
  RequireCapabilities,
  type RouteAccessPolicy,
} from './route-access-policy';

describe('canonical route access decorators', () => {
  it('creates immutable public metadata', () => {
    class Controller {
      @PublicRoute()
      handler() {}
    }
    const policy = Reflect.getMetadata(
      ROUTE_ACCESS_POLICY,
      Controller.prototype.handler,
    ) as RouteAccessPolicy;
    expect(policy).toEqual({
      classification: 'PUBLIC_EXPLICIT',
      requireActiveCompany: false,
      requiredCapabilities: [],
      capabilitySemantics: 'ALL',
    });
    expect(Object.isFrozen(policy)).toBe(true);
    expect(Object.isFrozen(policy.requiredCapabilities)).toBe(true);
  });

  it('distinguishes authenticated and active-company routes', () => {
    @AuthenticatedRoute()
    class AuthenticatedController {}
    @RequireActiveCompany()
    class CompanyController {}
    expect(
      (Reflect.getMetadata(ROUTE_ACCESS_POLICY, AuthenticatedController) as RouteAccessPolicy)
        .requireActiveCompany,
    ).toBe(false);
    expect(
      (Reflect.getMetadata(ROUTE_ACCESS_POLICY, CompanyController) as RouteAccessPolicy)
        .requireActiveCompany,
    ).toBe(true);
  });

  it('normalizes multiple capabilities with explicit ALL semantics', () => {
    class Controller {
      @RequireCapabilities('payroll.review.view', 'payroll.review.view', 'payroll.review.approve')
      handler() {}
    }
    const policy = Reflect.getMetadata(
      ROUTE_ACCESS_POLICY,
      Controller.prototype.handler,
    ) as RouteAccessPolicy;
    expect(policy).toMatchObject({
      classification: 'CAPABILITY_PROTECTED',
      requireActiveCompany: true,
      requiredCapabilities: ['payroll.review.approve', 'payroll.review.view'],
      capabilitySemantics: 'ALL',
    });
  });

  it('rejects empty capability metadata at definition time', () => {
    expect(() => RequireCapabilities()).toThrow(
      'RequireCapabilities requires at least one non-empty capability',
    );
  });
});
