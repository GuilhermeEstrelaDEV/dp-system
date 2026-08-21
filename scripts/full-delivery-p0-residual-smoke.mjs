import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { URL } from 'node:url';

/* global AbortSignal, console, fetch */

const requireFromApi = createRequire(new URL('../apps/api/package.json', import.meta.url));
const { PrismaClient } = requireFromApi('@prisma/client');
const expectedHandlers = Object.freeze({ PayrollPeriod: 6, PayrollInput: 4, PayrollRun: 5 });

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
  throw new Error('Smoke P0 residual recusado: ambiente local-demo não confirmado');
}
const api = `http://localhost:${env.API_PORT}/api/v1`;
const unique = Date.now().toString().slice(-8);
const tracePrefix = `p0-residual-${unique}-`;
const observedStatuses = [];
const completed = new Map(Object.keys(expectedHandlers).map((family) => [family, 0]));
const databaseUrl = `postgresql://${encodeURIComponent(env.POSTGRES_USER)}:${encodeURIComponent(env.POSTGRES_PASSWORD)}@localhost:${env.POSTGRES_PORT}/${env.POSTGRES_DB}?schema=public`;
const prisma = new PrismaClient({ datasourceUrl: databaseUrl });

async function call(path, options = {}) {
  const response = await fetch(`${api}${path}`, {
    signal: AbortSignal.timeout(30_000),
    ...options,
  });
  observedStatuses.push(response.status);
  const payload = await response.json().catch(() => undefined);
  return { status: response.status, data: payload?.data, error: payload?.error };
}

function headers(token, traceId = randomUUID()) {
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
  return response.data.accessToken;
}

async function selectCompany(token, companyId, traceId) {
  const response = await call('/auth/context', {
    method: 'POST',
    headers: headers(token, traceId),
    body: JSON.stringify({ companyId }),
  });
  expectStatus(response, [200, 201], 'seleção de empresa');
  return response.data.accessToken;
}

async function handler(family, label, path, token, options = {}, validate) {
  const index = (completed.get(family) ?? 0) + 1;
  const response = await call(path, {
    ...options,
    headers: {
      ...headers(token, `${tracePrefix}${family.toLowerCase()}-${index}`),
      ...(options.headers ?? {}),
    },
  });
  expectStatus(response, options.accepted ?? [200, 201], label);
  if (validate) validate(response.data);
  completed.set(family, index);
  console.log(`[PASS] ${family} ${index}/${expectedHandlers[family]} — ${label}`);
  return response.data;
}

function assertNoInternalFields(value, forbidden, label) {
  const serialized = JSON.stringify(value);
  for (const field of forbidden) {
    if (serialized.includes(`"${field}"`)) throw new Error(`${label}: campo interno ${field}`);
  }
}

try {
  expectStatus(
    await call('/payroll-periods?companyId=00000000-0000-4000-8000-000000000000'),
    [401],
    'sem autenticação 401',
  );
  const horizon = await prisma.company.findUniqueOrThrow({
    where: { taxId: '00.000.000/0001-00' },
  });
  const atlas = await prisma.company.findUniqueOrThrow({ where: { taxId: '11.111.111/0001-11' } });
  const calendar = await prisma.payrollCalendar.findFirstOrThrow({
    where: { companyId: horizon.id },
  });
  const horizonContract = await prisma.employmentContract.findFirstOrThrow({
    where: { companyId: horizon.id, status: 'ACTIVE' },
    include: { employee: true },
  });
  const atlasContract = await prisma.employmentContract.findFirstOrThrow({
    where: { companyId: atlas.id },
  });
  const rubric = await prisma.payrollRubric.findFirstOrThrow({
    where: { companyId: horizon.id, status: 'ACTIVE' },
  });
  const atlasPeriod = await prisma.payrollPeriod.findFirstOrThrow({
    where: { companyId: atlas.id },
  });
  const atlasInput = await prisma.payrollInput.findFirstOrThrow({
    where: { payrollPeriod: { companyId: atlas.id } },
  });
  const atlasRun = await prisma.payrollRun.findFirstOrThrow({
    where: { payrollPeriod: { companyId: atlas.id } },
  });

  let adminToken = await login(
    env.DEMO_ADMIN_EMAIL,
    env.DEMO_ADMIN_PASSWORD,
    `${tracePrefix}admin-login`,
  );
  adminToken = await selectCompany(adminToken, horizon.id, `${tracePrefix}admin-context`);

  await handler(
    'PayrollPeriod',
    'listar competências',
    `/payroll-periods?companyId=${horizon.id}&page=1&pageSize=20`,
    adminToken,
    {},
    (data) => {
      if (data.items.some((item) => item.companyId !== horizon.id))
        throw new Error('isolamento de competências inválido');
      assertNoInternalFields(data, ['closureHistory'], 'projeção de competência');
    },
  );
  const existingPeriod = await prisma.payrollPeriod.findFirstOrThrow({
    where: { companyId: horizon.id },
  });
  await handler(
    'PayrollPeriod',
    'detalhar competência',
    `/payroll-periods/${existingPeriod.id}`,
    adminToken,
  );
  const createdPeriod = await handler(
    'PayrollPeriod',
    'criar competência',
    '/payroll-periods',
    adminToken,
    {
      method: 'POST',
      body: JSON.stringify({
        companyId: horizon.id,
        payrollCalendarId: calendar.id,
        referenceDate: '2029-01-01',
        type: `DEMO_${unique}`,
      }),
    },
  );
  await handler(
    'PayrollPeriod',
    'atualizar competência',
    `/payroll-periods/${createdPeriod.id}`,
    adminToken,
    {
      method: 'PATCH',
      body: JSON.stringify({ type: `DEMO_UPDATED_${unique}` }),
    },
  );
  await handler(
    'PayrollPeriod',
    'abrir competência',
    `/payroll-periods/${createdPeriod.id}/open`,
    adminToken,
    { method: 'POST' },
  );
  await handler(
    'PayrollPeriod',
    'validar competência',
    `/payroll-periods/${createdPeriod.id}/validate`,
    adminToken,
    { method: 'POST' },
    (data) => {
      if (data.periodId !== createdPeriod.id || data.valid !== true)
        throw new Error('validação de competência inválida');
    },
  );

  await handler(
    'PayrollInput',
    'listar lançamentos',
    `/payroll-inputs?payrollPeriodId=${createdPeriod.id}`,
    adminToken,
    {},
    (data) => {
      if (!Array.isArray(data.items)) throw new Error('lista de lançamentos inválida');
    },
  );
  const createdInput = await handler(
    'PayrollInput',
    'criar lançamento',
    '/payroll-inputs',
    adminToken,
    {
      method: 'POST',
      body: JSON.stringify({
        payrollPeriodId: createdPeriod.id,
        employeeId: horizonContract.employeeId,
        employmentContractId: horizonContract.id,
        payrollRubricId: rubric.id,
        amount: '10.50',
        quantity: '1.0000',
        sourceType: 'DEMO',
        sourceKey: `P0-${unique}`,
      }),
    },
  );
  assertNoInternalFields(createdInput, ['metadata', 'technicalNotes'], 'projeção de lançamento');
  await handler(
    'PayrollInput',
    'detalhar lançamento',
    `/payroll-inputs/${createdInput.id}`,
    adminToken,
  );
  await handler(
    'PayrollInput',
    'atualizar lançamento',
    `/payroll-inputs/${createdInput.id}`,
    adminToken,
    {
      method: 'PATCH',
      body: JSON.stringify({ amount: '11.00' }),
    },
  );

  await handler(
    'PayrollRun',
    'listar execuções',
    `/payroll-runs?payrollPeriodId=${createdPeriod.id}`,
    adminToken,
    {},
    (data) => {
      assertNoInternalFields(
        data,
        ['parameterSnapshot', 'calculationMemory'],
        'projeção de execução',
      );
    },
  );
  const createdRun = await handler('PayrollRun', 'iniciar execução', '/payroll-runs', adminToken, {
    method: 'POST',
    body: JSON.stringify({ payrollPeriodId: createdPeriod.id, engineVersion: 'foundation-v1' }),
  });
  await handler(
    'PayrollRun',
    'detalhar execução',
    `/payroll-runs/${createdRun.id}`,
    adminToken,
    {},
    (data) => {
      assertNoInternalFields(
        data,
        ['parameterSnapshot', 'calculationMemory'],
        'detalhe de execução',
      );
    },
  );
  await handler(
    'PayrollRun',
    'listar mensagens',
    `/payroll-runs/${createdRun.id}/messages`,
    adminToken,
  );
  await handler(
    'PayrollRun',
    'adicionar mensagem',
    `/payroll-runs/${createdRun.id}/messages`,
    adminToken,
    {
      method: 'POST',
      body: JSON.stringify({
        severity: 'WARNING',
        code: 'P0_DEMO_NOTE',
        message: 'Nota operacional fictícia.',
      }),
    },
  );

  const invalidRelation = await call('/payroll-inputs', {
    method: 'POST',
    headers: headers(adminToken, `${tracePrefix}invalid-relation`),
    body: JSON.stringify({
      payrollPeriodId: createdPeriod.id,
      employeeId: horizonContract.employeeId,
      employmentContractId: atlasContract.id,
      payrollRubricId: rubric.id,
      amount: '1.00',
    }),
  });
  expectStatus(invalidRelation, [404], 'relação cross-company 404');

  for (const path of [
    `/payroll-periods/${atlasPeriod.id}`,
    `/payroll-inputs/${atlasInput.id}`,
    `/payroll-runs/${atlasRun.id}`,
  ]) {
    expectStatus(
      await call(path, { headers: headers(adminToken, `${tracePrefix}cross-company`) }),
      [404],
      `cross-company 404 ${path}`,
    );
  }

  let hrToken = await login(env.DEMO_HR_EMAIL, env.DEMO_HR_PASSWORD, `${tracePrefix}hr-login`);
  hrToken = await selectCompany(hrToken, horizon.id, `${tracePrefix}hr-context`);
  for (const path of [
    `/payroll-periods?companyId=${horizon.id}`,
    '/payroll-inputs',
    '/payroll-runs',
  ]) {
    expectStatus(
      await call(path, { headers: headers(hrToken, `${tracePrefix}hr-denied`) }),
      [403],
      `HR 403 ${path}`,
    );
  }

  for (const [family, expected] of Object.entries(expectedHandlers)) {
    if (completed.get(family) !== expected)
      throw new Error(`${family}: ${completed.get(family)}/${expected}`);
  }
  const auditCount = await prisma.auditLog.count({
    where: { traceId: { startsWith: tracePrefix } },
  });
  if (auditCount < 6) throw new Error(`auditoria P0 residual incompleta: ${auditCount}/6`);
  if (observedStatuses.some((status) => status >= 500))
    throw new Error('smoke P0 residual observou resposta 5xx');
  console.log('FULL DELIVERY P0-RESIDUAL SMOKE — 15/15 PASS');
  console.log(`Auditoria transacional: ${auditCount}; HR 403; cross-company 404; zero 5xx.`);
} finally {
  await prisma.$disconnect();
}
