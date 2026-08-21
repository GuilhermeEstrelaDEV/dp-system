export const PUBLIC_ROUTE_HANDLER_ALLOWLIST = new Set<string>([
  'AuthController#login',
  'HealthController#check',
  'HealthController#liveness',
  'HealthController#readiness',
]);

export const LEGACY_DEFERRED_HANDLER_ALLOWLIST = new Set<string>([
  'BenefitsController#changeEnrollmentStatus',
  'BenefitsController#create',
  'BenefitsController#enroll',
  'BenefitsController#list',
  'BenefitsController#listEnrollments',
  'BenefitsController#plan',
  'PayrollInputsController#create',
  'PayrollInputsController#find',
  'PayrollInputsController#list',
  'PayrollInputsController#update',
  'PayrollPeriodsController#create',
  'PayrollPeriodsController#find',
  'PayrollPeriodsController#list',
  'PayrollPeriodsController#open',
  'PayrollPeriodsController#update',
  'PayrollPeriodsController#validate',
  'PayrollRunsController#addMessage',
  'PayrollRunsController#find',
  'PayrollRunsController#list',
  'PayrollRunsController#messages',
  'PayrollRunsController#start',
  'TimeManagementController#assign',
  'TimeManagementController#balance',
  'TimeManagementController#close',
  'TimeManagementController#createSchedule',
  'TimeManagementController#entries',
  'TimeManagementController#entry',
  'TimeManagementController#holiday',
  'TimeManagementController#schedules',
  'VacationsLeavesController#approve',
  'VacationsLeavesController#cancel',
  'VacationsLeavesController#createCollective',
  'VacationsLeavesController#createPeriod',
  'VacationsLeavesController#createRequest',
  'VacationsLeavesController#listPeriods',
  'VacationsLeavesController#listRequests',
]);

export function routeHandlerId(
  controller: { readonly name: string },
  handler: { readonly name: string },
): string {
  return `${controller.name}#${handler.name}`;
}
