export const PUBLIC_ROUTE_HANDLER_ALLOWLIST = new Set<string>([
  'AuthController#login',
  'HealthController#check',
  'HealthController#liveness',
  'HealthController#readiness',
]);

export const LEGACY_DEFERRED_HANDLER_ALLOWLIST = new Set<string>([
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
]);

export function routeHandlerId(
  controller: { readonly name: string },
  handler: { readonly name: string },
): string {
  return `${controller.name}#${handler.name}`;
}
