import { AdmissionChecklistsController } from '../admission-checklists/admission-checklists.controller';
import { AdmissionDocumentsController } from '../admission-documents/admission-documents.controller';
import { AdmissionProcessesController } from '../admission-processes/admission-processes.controller';
import { BranchesController } from '../branches/branches.controller';
import { ChecklistTemplatesController } from '../checklist-templates/checklist-templates.controller';
import { CostCentersController } from '../cost-centers/cost-centers.controller';
import { DepartmentsController } from '../departments/departments.controller';
import { PositionsController } from '../positions/positions.controller';
import { VacationsLeavesController } from '../vacations-leaves/vacations-leaves.controller';
import { VariableCompensationController } from '../variable-compensation/variable-compensation.controller';
import { ROUTE_ACCESS_POLICY, type RouteAccessPolicy } from './route-access-policy';

type ControllerClass = { readonly name: string; readonly prototype: object };

const RESOURCE_METHODS = ['list', 'find'] as const;
const RESOURCE_WRITES = ['create', 'update', 'activate', 'inactivate'] as const;

const P2_POLICIES = [
  [BranchesController, RESOURCE_METHODS, 'organization.read'],
  [BranchesController, RESOURCE_WRITES, 'organization.manage'],
  [DepartmentsController, RESOURCE_METHODS, 'organization.read'],
  [DepartmentsController, RESOURCE_WRITES, 'organization.manage'],
  [PositionsController, RESOURCE_METHODS, 'organization.read'],
  [PositionsController, RESOURCE_WRITES, 'organization.manage'],
  [CostCentersController, RESOURCE_METHODS, 'organization.read'],
  [CostCentersController, RESOURCE_WRITES, 'organization.manage'],
  [AdmissionProcessesController, ['list', 'find'], 'admission.read'],
  [AdmissionProcessesController, ['create', 'update', 'complete', 'cancel'], 'admission.manage'],
  [AdmissionChecklistsController, ['get'], 'admission.read'],
  [AdmissionChecklistsController, ['fromTemplate', 'set'], 'admission.manage'],
  [AdmissionDocumentsController, ['list'], 'admission.read'],
  [AdmissionDocumentsController, ['create', 'update', 'received', 'reviewed'], 'admission.manage'],
  [ChecklistTemplatesController, ['list', 'find'], 'admission.read'],
  [ChecklistTemplatesController, ['create', 'activate', 'inactivate'], 'admission.manage'],
  [VacationsLeavesController, ['listTypes', 'listCases'], 'leave.read'],
  [VacationsLeavesController, ['createType', 'createCase', 'returnFromLeave'], 'leave.manage'],
  [
    VariableCompensationController,
    ['listEvents', 'listAdvances', 'listOffCycle', 'listReconciliations'],
    'variable_compensation.read',
  ],
  [
    VariableCompensationController,
    ['createEvent', 'createAdvance', 'createOffCycle', 'createReconciliation'],
    'variable_compensation.manage',
  ],
] as const satisfies readonly [ControllerClass, readonly string[], string][];

describe('Full Delivery P2 route capabilities', () => {
  it('protects all 56 handlers with an explicit active-company capability policy', () => {
    const policies = P2_POLICIES.flatMap(([controller, methods, capability]) =>
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

    expect(policies).toHaveLength(56);
    expect(new Set(policies).size).toBe(56);
  });
});
