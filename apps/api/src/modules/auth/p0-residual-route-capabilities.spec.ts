import { PayrollInputsController } from '../payroll-inputs/payroll-inputs.controller';
import { PayrollPeriodsController } from '../payroll-periods/payroll-periods.controller';
import { PayrollRunsController } from '../payroll-runs/payroll-runs.controller';
import { ROUTE_ACCESS_POLICY, type RouteAccessPolicy } from './route-access-policy';

type ControllerClass = { readonly name: string; readonly prototype: object };

const P0_RESIDUAL_POLICIES = [
  [PayrollPeriodsController, ['list', 'find', 'validate'], 'payroll.period.close.view'],
  [PayrollPeriodsController, ['create', 'update', 'open'], 'payroll.period.manage'],
  [PayrollInputsController, ['list', 'find'], 'payroll.input.read'],
  [PayrollInputsController, ['create', 'update'], 'payroll.input.manage'],
  [PayrollRunsController, ['list', 'find', 'messages'], 'payroll.run.read'],
  [PayrollRunsController, ['start', 'addMessage'], 'payroll.run.manage'],
] as const satisfies readonly [ControllerClass, readonly string[], string][];

describe('Full Delivery P0 residual route capabilities', () => {
  it('protects all 15 handlers with an explicit active-company capability policy', () => {
    const policies = P0_RESIDUAL_POLICIES.flatMap(([controller, methods, capability]) =>
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

    expect(policies).toHaveLength(15);
    expect(new Set(policies).size).toBe(15);
  });
});
