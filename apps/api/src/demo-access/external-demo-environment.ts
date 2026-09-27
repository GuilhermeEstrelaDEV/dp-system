import type { DemoAccessEnvironment } from './demo-access-tool';

export const EXTERNAL_DEMO_DATABASE_NAME = 'dp_system_external_demo';

export interface ExternalDemoEnvironment extends DemoAccessEnvironment {
  readonly EXTERNAL_DEMO_REVIEWER_EMAIL?: string;
  readonly EXTERNAL_DEMO_REVIEWER_PASSWORD?: string;
}

export function assertExternalDemoEnvironment(environment: ExternalDemoEnvironment): void {
  if (
    environment.DEPLOYMENT_ENV !== 'external-demo' ||
    environment.EXTERNAL_DEMO_MODE !== 'true' ||
    environment.DEMO_ENV !== 'external-demo' ||
    environment.DEMO_MODE !== 'true' ||
    environment.DEMO_SEED_ENABLED !== 'true' ||
    environment.EXTERNAL_DEMO_CONFIRM_DATABASE !== EXTERNAL_DEMO_DATABASE_NAME
  ) {
    throw new Error('Demo externa recusada: gates exclusivos não confirmados');
  }
  if (!environment.DATABASE_URL) {
    throw new Error('Demo externa recusada: DATABASE_URL ausente');
  }
  let database: URL;
  try {
    database = new URL(environment.DATABASE_URL);
  } catch {
    throw new Error('Demo externa recusada: DATABASE_URL inválida');
  }
  if (!['postgres:', 'postgresql:'].includes(database.protocol)) {
    throw new Error('Demo externa recusada: banco não é PostgreSQL');
  }
  if (
    ['localhost', '127.0.0.1', '::1'].includes(database.hostname) ||
    database.pathname !== `/${EXTERNAL_DEMO_DATABASE_NAME}`
  ) {
    throw new Error('Demo externa recusada: banco exclusivo não confirmado');
  }
}

export function requireExternalReviewerCredentials(environment: ExternalDemoEnvironment): {
  readonly email: string;
  readonly password: string;
} {
  assertExternalDemoEnvironment(environment);
  const email = environment.EXTERNAL_DEMO_REVIEWER_EMAIL?.trim().toLowerCase();
  const password = environment.EXTERNAL_DEMO_REVIEWER_PASSWORD;
  if (!email || !email.endsWith('@dp-system.local')) {
    throw new Error('Reviewer recusado: e-mail fictício @dp-system.local é obrigatório');
  }
  if (['admin.demo@dp-system.local', 'rh.demo@dp-system.local'].includes(email)) {
    throw new Error('Reviewer recusado: conta local conhecida não pode ser reutilizada');
  }
  if (!password || password.length < 16) {
    throw new Error('Reviewer recusado: secret de senha com ao menos 16 caracteres é obrigatório');
  }
  if (/^Demo(Admin|Rh)#/u.test(password)) {
    throw new Error('Reviewer recusado: senha local conhecida não pode ser reutilizada');
  }
  return { email, password };
}
