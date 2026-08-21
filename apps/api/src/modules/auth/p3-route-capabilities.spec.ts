import { BenefitsController } from '../benefits/benefits.controller';
import { TimeManagementController } from '../time-management/time-management.controller';
import { VacationsLeavesController } from '../vacations-leaves/vacations-leaves.controller';
import { ROUTE_ACCESS_POLICY, type RouteAccessPolicy } from './route-access-policy';

type ControllerClass = { readonly name: string; readonly prototype: object };

const P3_POLICIES = [
  [TimeManagementController, ['schedules', 'entries', 'balance'], 'time.read'],
  [
    TimeManagementController,
    ['createSchedule', 'assign', 'holiday', 'entry', 'close'],
    'time.manage',
  ],
  [BenefitsController, ['list', 'listEnrollments'], 'benefit.read'],
  [BenefitsController, ['create', 'plan', 'enroll', 'changeEnrollmentStatus'], 'benefit.manage'],
  [VacationsLeavesController, ['listPeriods', 'listRequests'], 'vacation.read'],
  [
    VacationsLeavesController,
    ['createPeriod', 'createRequest', 'approve', 'cancel', 'createCollective'],
    'vacation.manage',
  ],
] as const satisfies readonly [ControllerClass, readonly string[], string][];

describe('Full Delivery P3 route capabilities', () => {
  it('protects all 21 handlers with an explicit active-company capability policy', () => {
    const policies = P3_POLICIES.flatMap(([controller, methods, capability]) =>
      methods.map((method) => {
        const handler = Reflect.get(controller.prototype, method) as object;
        const policy = Reflect.getMetadata(ROUTE_ACCESS_POLICY, handler) as
          RouteAccessPolicy | undefined;
        expect(policy).toEqual({
          classification: 'CAPABILITY_PROTECTED',
          requireActiveCompany: true,
          requiredCapabilities: [capability],
          capabilitySemantics: 'ALL',
        });
        return `${controller.name}#${method}`;
      }),
    );

    expect(policies).toHaveLength(21);
    expect(new Set(policies).size).toBe(21);
  });
});
