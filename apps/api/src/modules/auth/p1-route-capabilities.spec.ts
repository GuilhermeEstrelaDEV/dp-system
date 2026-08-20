import { CompaniesController } from '../companies/companies.controller';
import { EmployeesController } from '../employees/employees.controller';
import { EmploymentContractsController } from '../employment-contracts/employment-contracts.controller';
import { PayrollParametersController } from '../payroll-parameters/payroll-parameters.controller';
import { PayrollRubricsController } from '../payroll-rubrics/payroll-rubrics.controller';
import { ROUTE_ACCESS_POLICY, type RouteAccessPolicy } from './route-access-policy';

type ControllerClass = { readonly name: string; readonly prototype: object };

const P1_POLICIES = [
  [CompaniesController, ['list', 'find'], 'company.read'],
  [CompaniesController, ['create', 'update', 'activate', 'inactivate'], 'company.manage'],
  [EmployeesController, ['list', 'find', 'listContracts', 'listContacts'], 'employee.read'],
  [
    EmployeesController,
    [
      'create',
      'update',
      'activate',
      'inactivate',
      'createContact',
      'updateContact',
      'activateContact',
      'inactivateContact',
    ],
    'employee.manage',
  ],
  [EmploymentContractsController, ['list', 'find', 'history'], 'contract.read'],
  [
    EmploymentContractsController,
    ['create', 'update', 'activate', 'inactivate'],
    'contract.manage',
  ],
  [PayrollParametersController, ['list', 'find'], 'payroll.parameter.read'],
  [PayrollParametersController, ['create', 'update'], 'payroll.parameter.manage'],
  [PayrollRubricsController, ['list', 'find'], 'payroll.rubric.read'],
  [PayrollRubricsController, ['create', 'update'], 'payroll.rubric.manage'],
] as const satisfies readonly [ControllerClass, readonly string[], string][];

describe('Full Delivery P1 route capabilities', () => {
  it('protects all 33 handlers with an explicit active-company capability policy', () => {
    const policies = P1_POLICIES.flatMap(([controller, methods, capability]) =>
      methods.map((method) => {
        const handler = Reflect.get(controller.prototype, method) as object;
        const policy = Reflect.getMetadata(ROUTE_ACCESS_POLICY, handler as object) as
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

    expect(policies).toHaveLength(33);
    expect(new Set(policies).size).toBe(33);
  });
});
