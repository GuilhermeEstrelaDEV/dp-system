export const PUBLIC_ROUTE_HANDLER_ALLOWLIST = new Set<string>([
  'AuthController#login',
  'HealthController#check',
  'HealthController#liveness',
  'HealthController#readiness',
]);

export const LEGACY_DEFERRED_HANDLER_ALLOWLIST = new Set<string>();

export function routeHandlerId(
  controller: { readonly name: string },
  handler: { readonly name: string },
): string {
  return `${controller.name}#${handler.name}`;
}
