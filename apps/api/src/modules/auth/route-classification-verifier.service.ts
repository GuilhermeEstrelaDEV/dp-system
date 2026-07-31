import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Injectable } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import {
  isRouteAccessPolicy,
  ROUTE_ACCESS_POLICY,
  type RouteAccessClassification,
  type RouteAccessPolicy,
} from './route-access-policy';
import {
  LEGACY_DEFERRED_HANDLER_ALLOWLIST,
  PUBLIC_ROUTE_HANDLER_ALLOWLIST,
  routeHandlerId,
} from './route-compatibility.manifest';

export interface RouteClassificationRecord {
  readonly module: string;
  readonly controller: string;
  readonly handler: string;
  readonly method: string;
  readonly route: string;
  readonly classification: RouteAccessClassification | 'LEGACY_DEFERRED' | 'BLOCKED_UNCLASSIFIED';
  readonly requireActiveCompany: boolean;
  readonly requiredCapabilities: readonly string[];
  readonly failure: string | null;
}

@Injectable()
export class RouteClassificationVerifierService {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  inventory(): RouteClassificationRecord[] {
    const records: RouteClassificationRecord[] = [];
    for (const wrapper of this.discovery.getControllers()) {
      const instance = wrapper.instance as object | null;
      const controller = wrapper.metatype;
      if (!instance || !controller) continue;
      const controllerPath = this.metadataPath(controller);
      const prototype = Object.getPrototypeOf(instance) as object | null;
      if (!prototype) continue;
      for (const methodName of this.scanner.getAllMethodNames(prototype)) {
        const handler = Reflect.get(prototype, methodName) as unknown;
        if (typeof handler !== 'function') continue;
        const requestMethod = Reflect.getMetadata(METHOD_METADATA, handler) as unknown;
        if (typeof requestMethod !== 'number') continue;
        const id = routeHandlerId(controller, handler);
        const rawPolicy = this.reflector.getAllAndOverride<unknown>(ROUTE_ACCESS_POLICY, [
          handler,
          controller,
        ]);
        const policy = isRouteAccessPolicy(rawPolicy) ? rawPolicy : null;
        const classification = policy
          ? policy.classification
          : LEGACY_DEFERRED_HANDLER_ALLOWLIST.has(id)
            ? 'LEGACY_DEFERRED'
            : 'BLOCKED_UNCLASSIFIED';
        const failure = this.failureFor(id, rawPolicy, policy, classification);
        records.push({
          module: wrapper.host?.name ?? 'unknown',
          controller: controller.name,
          handler: methodName,
          method: RequestMethod[requestMethod] ?? String(requestMethod),
          route: this.joinRoute(controllerPath, this.metadataPath(handler)),
          classification,
          requireActiveCompany: policy?.requireActiveCompany ?? false,
          requiredCapabilities: policy?.requiredCapabilities ?? [],
          failure,
        });
      }
    }
    return records.sort(
      (left, right) =>
        left.route.localeCompare(right.route) || left.method.localeCompare(right.method),
    );
  }

  assertComplete(): RouteClassificationRecord[] {
    const inventory = this.inventory();
    const failures = inventory.filter((record) => record.failure !== null);
    const discovered = new Set(inventory.map((record) => `${record.controller}#${record.handler}`));
    for (const id of LEGACY_DEFERRED_HANDLER_ALLOWLIST) {
      if (!discovered.has(id)) {
        failures.push(this.staleManifestRecord(id));
      }
    }
    if (failures.length > 0) {
      const details = failures
        .map(
          ({ module, controller, handler, method, route, failure }) =>
            `${module} | ${controller}#${handler} | ${method} ${route} | ${failure}`,
        )
        .join('\n');
      throw new Error(`Route classification verification failed:\n${details}`);
    }
    return inventory;
  }

  private failureFor(
    id: string,
    rawPolicy: unknown,
    policy: RouteAccessPolicy | null,
    classification: RouteClassificationRecord['classification'],
  ): string | null {
    if (rawPolicy !== undefined && !policy) return 'invalid metadata; use a canonical decorator';
    if (classification === 'BLOCKED_UNCLASSIFIED') {
      return 'missing classification; add canonical metadata or an approved legacy manifest entry';
    }
    if (classification === 'PUBLIC_EXPLICIT' && !PUBLIC_ROUTE_HANDLER_ALLOWLIST.has(id)) {
      return 'public route is absent from the explicit allowlist';
    }
    if (
      policy?.classification === 'CAPABILITY_PROTECTED' &&
      (!policy.requireActiveCompany || policy.requiredCapabilities.length === 0)
    ) {
      return 'capability route must require active company and at least one capability';
    }
    return null;
  }

  private metadataPath(target: object): string {
    const value = Reflect.getMetadata(PATH_METADATA, target) as unknown;
    if (Array.isArray(value)) return value.map(String).join('|');
    return typeof value === 'string' ? value : '';
  }

  private joinRoute(controllerPath: string, handlerPath: string): string {
    const joined = [controllerPath, handlerPath]
      .filter(Boolean)
      .join('/')
      .replace(/\/{2,}/g, '/');
    return `/${joined}`.replace(/\/$/, '') || '/';
  }

  private staleManifestRecord(id: string): RouteClassificationRecord {
    const [controller = 'unknown', handler = 'unknown'] = id.split('#');
    return {
      module: 'manifest',
      controller,
      handler,
      method: 'UNKNOWN',
      route: 'unknown',
      classification: 'LEGACY_DEFERRED',
      requireActiveCompany: false,
      requiredCapabilities: [],
      failure: 'stale legacy manifest entry; reconcile inventory with the controller',
    };
  }
}
