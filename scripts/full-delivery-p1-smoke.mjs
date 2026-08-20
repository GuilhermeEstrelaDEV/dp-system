import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { URL } from 'node:url';

/* global AbortSignal, console, fetch */

const requireFromApi = createRequire(new URL('../apps/api/package.json', import.meta.url));
const { PrismaClient } = requireFromApi('@prisma/client');

const fixture = {
  horizon: '10000000-0000-4000-8000-000000000001',
  atlas: '10000000-0000-4000-8000-000000000002',
  horizonEmployee: '70000000-0000-4000-8000-000000000001',
  horizonPosition: '50000000-0000-4000-8000-000000000001',
  rubricCategory: 'f0000000-0000-4000-8000-000000000001',
  rubric: 'f0000000-0000-4000-8000-000000000010',
  parameter: 'f0000000-0000-4000-8000-000000000030',
};

const expectedHandlers = Object.freeze({
  Company: 6,
  Employee: 12,
  Contract: 7,
  'Payroll Parameters': 4,
  'Payroll Rubrics': 4,
});

function environmentFile(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/u)
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

const env = { ...environmentFile('.env.demo.example'), ...environmentFile('.env.demo.local') };
if (env.DEMO_ENV !== 'local-demo' || env.DEMO_MODE !== 'true') {
  throw new Error('Smoke P1 recusado: ambiente local-demo não confirmado');
}

const api = `http://localhost:${env.API_PORT}/api/v1`;
const web = `http://localhost:${env.WEB_PORT}`;
const observedStatuses = [];
const completed = new Map(Object.keys(expectedHandlers).map((family) => [family, 0]));
const unique = Date.now().toString().slice(-7);
const tracePrefix = `p1-smoke-${unique}-`;
const databaseUrl = `postgresql://${encodeURIComponent(env.POSTGRES_USER)}:${encodeURIComponent(env.POSTGRES_PASSWORD)}@localhost:${env.POSTGRES_PORT}/${env.POSTGRES_DB}?schema=public`;
const prisma = new PrismaClient({ datasourceUrl: databaseUrl });

async function call(path, options = {}) {
  const response = await fetch(path.startsWith('http') ? path : `${api}${path}`, {
    signal: AbortSignal.timeout(15_000),
    ...options,
  });
  observedStatuses.push(response.status);
  const payload = await response.json().catch(() => undefined);
  return { status: response.status, data: payload?.data, error: payload?.error };
}

function headers(token, traceId) {
  return {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    'x-correlation-id': traceId,
  };
}

function expectStatus(response, accepted, label) {
  if (!accepted.includes(response.status)) {
    const detail = response.error?.message ?? response.error?.code ?? 'sem detalhe seguro';
    throw new Error(`${label}: HTTP ${response.status}; esperado ${accepted.join('/')}; ${detail}`);
  }
}

async function login(email, password, traceId) {
  const response = await call('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-correlation-id': traceId },
    body: JSON.stringify({ email, password }),
  });
  expectStatus(response, [200, 201], 'login');
  if (typeof response.data?.accessToken !== 'string') throw new Error('login sem accessToken');
  return response.data.accessToken;
}

async function selectCompany(token, companyId, traceId) {
  const response = await call('/auth/context', {
    method: 'POST',
    headers: headers(token, traceId),
    body: JSON.stringify({ companyId }),
  });
  expectStatus(response, [200, 201], 'seleção de empresa');
  if (typeof response.data?.accessToken !== 'string') throw new Error('contexto sem accessToken');
  return response.data.accessToken;
}

async function handler(family, label, path, token, options = {}, validate) {
  const index = (completed.get(family) ?? 0) + 1;
  const response = await call(path, {
    ...options,
    headers: {
      ...headers(token, `${tracePrefix}${family.toLowerCase().replaceAll(' ', '-')}-${index}`),
      ...(options.headers ?? {}),
    },
  });
  expectStatus(response, options.accepted ?? [200], label);
  if (validate) validate(response.data);
  completed.set(family, index);
  console.log(`[PASS] ${family} ${index}/${expectedHandlers[family]} — ${label}`);
  return response.data;
}

let adminToken;
let hrToken;
try {
  const [health, frontend] = await Promise.all([
    call('/health/ready'),
    fetch(web, { signal: AbortSignal.timeout(15_000) }),
  ]);
  expectStatus(health, [200], 'health');
  if (frontend.status !== 200) throw new Error(`frontend: HTTP ${frontend.status}`);

  const unauthenticated = await call('/companies');
  expectStatus(unauthenticated, [401], 'autenticação obrigatória');

  adminToken = await login(env.DEMO_ADMIN_EMAIL, env.DEMO_ADMIN_PASSWORD, 'p1-smoke-admin-login');
  adminToken = await selectCompany(adminToken, fixture.horizon, 'p1-smoke-admin-context');

  const companies = await handler('Company', 'list', '/companies', adminToken, {}, (data) => {
    if (!Array.isArray(data?.items) || data.items.length < 2)
      throw new Error('lista de empresas incompleta');
  });
  void companies;
  await handler('Company', 'detail', `/companies/${fixture.horizon}`, adminToken, {}, (data) => {
    if (data?.tradeName !== 'Horizonte Demo') throw new Error('empresa principal divergente');
  });
  const createdCompany = await handler('Company', 'create', '/companies', adminToken, {
    method: 'POST',
    accepted: [201],
    body: JSON.stringify({
      legalName: `Empresa P1 Fictícia ${unique} Ltda.`,
      tradeName: `P1 Demo ${unique}`,
      taxId: `P1-DEMO-${unique}`,
    }),
  });
  await handler('Company', 'update', `/companies/${createdCompany.id}`, adminToken, {
    method: 'PATCH',
    body: JSON.stringify({ tradeName: `P1 Atualizada ${unique}` }),
  });
  await handler('Company', 'inactivate', `/companies/${createdCompany.id}/inactivate`, adminToken, {
    method: 'PATCH',
    body: '{}',
  });
  await handler('Company', 'activate', `/companies/${createdCompany.id}/activate`, adminToken, {
    method: 'PATCH',
    body: '{}',
  });

  await handler('Employee', 'list', '/employees', adminToken, {}, (data) => {
    if (!Array.isArray(data?.items) || data.items.length < 18)
      throw new Error('lista Horizonte deve preservar ao menos os 18 colaboradores do seed');
    if (data.items.some((item) => 'contacts' in item || 'employmentContracts' in item)) {
      throw new Error('projeção de lista de colaboradores ampliada');
    }
  });
  const employee = await handler('Employee', 'create', '/employees', adminToken, {
    method: 'POST',
    accepted: [201],
    body: JSON.stringify({
      legalName: `Colaborador P1 Fictício ${unique}`,
      preferredName: 'P1 Demo',
    }),
  });

  const contract = await handler('Contract', 'create', '/employment-contracts', adminToken, {
    method: 'POST',
    accepted: [201],
    body: JSON.stringify({
      employeeId: employee.id,
      companyId: fixture.horizon,
      positionId: fixture.horizonPosition,
      registrationNumber: `P1-${unique}`,
      contractType: 'EMPLOYMENT',
      employmentRegime: 'DEMONSTRATIVE',
      startDate: '2026-08-01',
      weeklyHours: 40,
      reason: 'Contrato fictício criado pelo smoke P1',
    }),
  });

  await handler('Employee', 'detail', `/employees/${employee.id}`, adminToken, {}, (data) => {
    if (data?.employmentContracts?.length !== 1)
      throw new Error('detalhe sem contrato empresarial');
  });
  await handler('Employee', 'update', `/employees/${employee.id}`, adminToken, {
    method: 'PATCH',
    body: JSON.stringify({ preferredName: 'P1 Atualizado' }),
  });
  await handler('Employee', 'contracts', `/employees/${employee.id}/contracts`, adminToken);
  await handler('Employee', 'contacts', `/employees/${employee.id}/contacts`, adminToken);
  const contact = await handler(
    'Employee',
    'create contact',
    `/employees/${employee.id}/contacts`,
    adminToken,
    {
      method: 'POST',
      accepted: [201],
      body: JSON.stringify({
        type: 'EMAIL',
        value: `p1.${unique}@dp-system.local`,
        isPrimary: true,
      }),
    },
  );
  await handler(
    'Employee',
    'update contact',
    `/employees/${employee.id}/contacts/${contact.id}`,
    adminToken,
    {
      method: 'PATCH',
      body: JSON.stringify({ value: `p1.updated.${unique}@dp-system.local` }),
    },
  );
  await handler(
    'Employee',
    'inactivate contact',
    `/employees/${employee.id}/contacts/${contact.id}/inactivate`,
    adminToken,
    {
      method: 'PATCH',
      body: '{}',
    },
  );
  await handler(
    'Employee',
    'activate contact',
    `/employees/${employee.id}/contacts/${contact.id}/activate`,
    adminToken,
    {
      method: 'PATCH',
      body: '{}',
    },
  );

  await handler('Contract', 'list', '/employment-contracts', adminToken);
  await handler('Contract', 'detail', `/employment-contracts/${contract.id}`, adminToken);
  await handler('Contract', 'history', `/employment-contracts/${contract.id}/history`, adminToken);
  await handler('Contract', 'update', `/employment-contracts/${contract.id}`, adminToken, {
    method: 'PATCH',
    body: JSON.stringify({ weeklyHours: 36, reason: 'Alteração fictícia do smoke P1' }),
  });
  await handler(
    'Contract',
    'inactivate',
    `/employment-contracts/${contract.id}/inactivate`,
    adminToken,
    {
      method: 'PATCH',
      body: JSON.stringify({ reason: 'Inativação fictícia do smoke P1' }),
    },
  );
  await handler('Employee', 'inactivate', `/employees/${employee.id}/inactivate`, adminToken, {
    method: 'PATCH',
    body: '{}',
  });
  await handler('Employee', 'activate', `/employees/${employee.id}/activate`, adminToken, {
    method: 'PATCH',
    body: '{}',
  });
  await handler(
    'Contract',
    'activate',
    `/employment-contracts/${contract.id}/activate`,
    adminToken,
    {
      method: 'PATCH',
      body: JSON.stringify({ reason: 'Reativação fictícia do smoke P1' }),
    },
  );

  await handler('Payroll Parameters', 'list', '/payroll-parameters', adminToken);
  await handler(
    'Payroll Parameters',
    'detail',
    `/payroll-parameters/${fixture.parameter}`,
    adminToken,
  );
  const parameter = await handler(
    'Payroll Parameters',
    'create',
    '/payroll-parameters',
    adminToken,
    {
      method: 'POST',
      accepted: [201],
      body: JSON.stringify({
        code: `P1-PARAM-${unique}`,
        name: 'Parâmetro P1 fictício',
        category: 'DEMONSTRATIVE',
        version: 'smoke-v1',
        validFrom: '2026-08-01',
        definition: { mode: 'DEMONSTRATIVE_ONLY' },
      }),
    },
  );
  await handler('Payroll Parameters', 'update', `/payroll-parameters/${parameter.id}`, adminToken, {
    method: 'PATCH',
    body: JSON.stringify({ name: 'Parâmetro P1 atualizado' }),
  });

  await handler(
    'Payroll Rubrics',
    'list',
    `/payroll-rubrics?companyId=${fixture.horizon}`,
    adminToken,
  );
  await handler('Payroll Rubrics', 'detail', `/payroll-rubrics/${fixture.rubric}`, adminToken);
  const rubric = await handler('Payroll Rubrics', 'create', '/payroll-rubrics', adminToken, {
    method: 'POST',
    accepted: [201],
    body: JSON.stringify({
      companyId: fixture.horizon,
      payrollRubricCategoryId: fixture.rubricCategory,
      code: `P1-RUB-${unique}`,
      name: 'Rubrica P1 fictícia',
      version: 'smoke-v1',
      validFrom: '2026-08-01',
      incidenceConfiguration: { mode: 'DEMONSTRATIVE_ONLY' },
    }),
  });
  await handler('Payroll Rubrics', 'update', `/payroll-rubrics/${rubric.id}`, adminToken, {
    method: 'PATCH',
    body: JSON.stringify({ name: 'Rubrica P1 atualizada' }),
  });

  adminToken = await selectCompany(adminToken, fixture.atlas, 'p1-smoke-atlas-context');
  const foreign = await call(`/employees/${fixture.horizonEmployee}`, {
    headers: headers(adminToken, 'p1-smoke-cross-company'),
  });
  expectStatus(foreign, [404], 'isolamento empresarial');

  hrToken = await login(env.DEMO_HR_EMAIL, env.DEMO_HR_PASSWORD, 'p1-smoke-hr-login');
  hrToken = await selectCompany(hrToken, fixture.horizon, 'p1-smoke-hr-context');
  const denied = await call('/employees', { headers: headers(hrToken, 'p1-smoke-hr-denied') });
  expectStatus(denied, [403], 'deny-by-default');

  for (const [family, expected] of Object.entries(expectedHandlers)) {
    const actual = completed.get(family);
    if (actual !== expected) throw new Error(`${family}: ${actual}/${expected} handlers`);
  }
  if (observedStatuses.some((status) => status >= 500)) throw new Error('resposta 5xx inesperada');

  const p1Actions = [
    'COMPANY_CREATED',
    'COMPANY_UPDATED',
    'COMPANY_ACTIVATED',
    'COMPANY_INACTIVATED',
    'EMPLOYEE_CREATED',
    'EMPLOYEE_UPDATED',
    'EMPLOYEE_STATUS_CHANGED',
    'CONTRACT_CREATED',
    'CONTRACT_UPDATED',
    'CONTRACT_STATUS_CHANGED',
    'PAYROLL_PARAMETER_CREATED',
    'PAYROLL_PARAMETER_UPDATED',
    'PAYROLL_RUBRIC_CREATED',
    'PAYROLL_RUBRIC_UPDATED',
  ];
  const auditCount = await prisma.auditLog.count({
    where: { traceId: { startsWith: tracePrefix }, action: { in: p1Actions } },
  });
  if (auditCount !== 20) throw new Error(`auditoria P1 incompleta: ${auditCount}/20 writes`);

  console.log('\nFULL DELIVERY P1 SMOKE: 33/33 HANDLERS PASS');
  console.log('AUTHORIZATION: 401/403 PASS');
  console.log('COMPANY ISOLATION: 404 PASS');
  console.log('AUDIT: 20/20 WRITES PASS');
  console.log('UNEXPECTED 5XX: 0');
} finally {
  await Promise.allSettled(
    [adminToken, hrToken]
      .filter((token) => typeof token === 'string')
      .map((token) =>
        call('/auth/logout', { method: 'POST', headers: headers(token, 'p1-smoke-cleanup') }),
      ),
  );
  await prisma.$disconnect();
}
