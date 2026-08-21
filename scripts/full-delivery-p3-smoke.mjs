import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { URL } from 'node:url';

/* global AbortSignal, console, fetch */

const requireFromApi = createRequire(new URL('../apps/api/package.json', import.meta.url));
const { PrismaClient } = requireFromApi('@prisma/client');
const expectedHandlers = Object.freeze({ Time: 8, Benefit: 6, Vacation: 7 });

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
  throw new Error('Smoke P3 recusado: ambiente local-demo não confirmado');
}
const api = `http://localhost:${env.API_PORT}/api/v1`;
const unique = Date.now().toString().slice(-7);
const tracePrefix = `p3-smoke-${unique}-`;
const observedStatuses = [];
const completed = new Map(Object.keys(expectedHandlers).map((family) => [family, 0]));
const databaseUrl = `postgresql://${encodeURIComponent(env.POSTGRES_USER)}:${encodeURIComponent(env.POSTGRES_PASSWORD)}@localhost:${env.POSTGRES_PORT}/${env.POSTGRES_DB}?schema=public`;
const prisma = new PrismaClient({ datasourceUrl: databaseUrl });

async function call(path, options = {}) {
  const response = await fetch(`${api}${path}`, {
    signal: AbortSignal.timeout(15_000),
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

async function exerciseTime(token, fixtures) {
  await handler('Time', 'listar jornadas', '/work-schedules', token, {}, (data) => {
    if (!Array.isArray(data) || data.some((item) => item.companyId !== fixtures.horizon.id)) {
      throw new Error('projeção/isolamento de jornadas inválido');
    }
  });
  const schedule = await handler('Time', 'criar jornada', '/work-schedules', token, {
    method: 'POST',
    body: JSON.stringify({
      code: `P3-${unique}`,
      name: 'Jornada fictícia P3',
      weeklyMinutes: 2400,
      periods: [{ weekday: 2, startMinute: 480, endMinute: 1020, breakMinutes: 60 }],
    }),
  });
  await handler(
    'Time',
    'atribuir jornada',
    `/employment-contracts/${fixtures.horizonContract.id}/work-schedules`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ workScheduleId: schedule.id, validFrom: '2027-01-01' }),
    },
  );
  await handler('Time', 'criar feriado', '/holidays', token, {
    method: 'POST',
    body: JSON.stringify({
      holidayDate: '2027-02-01',
      name: `Feriado fictício ${unique}`,
      scope: 'COMPANY',
    }),
  });
  await handler('Time', 'listar ocorrências', '/time-entries', token, {}, (data) => {
    if (!Array.isArray(data) || data.some((item) => 'reason' in item)) {
      throw new Error('projeção de ocorrências inválida');
    }
  });
  await handler('Time', 'criar ocorrência', '/time-entries', token, {
    method: 'POST',
    body: JSON.stringify({
      employmentContractId: fixtures.horizonContract.id,
      occurredOn: '2027-02-02',
      type: 'WORKED',
      minutes: 480,
    }),
  });
  await handler(
    'Time',
    'consultar saldo',
    `/employment-contracts/${fixtures.horizonContract.id}/time-balance`,
    token,
  );
  await handler('Time', 'fechar saldo', '/time-balance-closings', token, {
    method: 'POST',
    body: JSON.stringify({ referenceMonth: '2028-01-01', reason: 'Fechamento fictício P3' }),
  });
}

async function exerciseBenefit(token, fixtures) {
  await handler('Benefit', 'listar benefícios', '/benefits', token, {}, (data) => {
    if (!Array.isArray(data) || data.some((item) => item.companyId !== fixtures.horizon.id)) {
      throw new Error('projeção/isolamento de benefícios inválido');
    }
  });
  await handler(
    'Benefit',
    'listar adesões',
    `/benefits/enrollments/${fixtures.horizonContract.id}`,
    token,
  );
  const benefit = await handler('Benefit', 'criar benefício', '/benefits', token, {
    method: 'POST',
    body: JSON.stringify({ code: `P3-${unique}`, name: 'Benefício fictício P3', type: 'GENERIC' }),
  });
  const plan = await handler('Benefit', 'criar plano', '/benefits/plans', token, {
    method: 'POST',
    body: JSON.stringify({
      benefitId: benefit.id,
      name: `Plano ${unique}`,
      employeeAmount: '1.00',
      companyAmount: '2.00',
      validFrom: '2027-01-01',
    }),
  });
  const enrollment = await handler('Benefit', 'criar adesão', '/benefits/enrollments', token, {
    method: 'POST',
    body: JSON.stringify({
      employmentContractId: fixtures.horizonSecondContract.id,
      benefitPlanId: plan.id,
      validFrom: '2027-01-01',
    }),
  });
  await handler('Benefit', 'alterar adesão', `/benefits/enrollments/${enrollment.id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'SUSPENDED', reason: 'Suspensão fictícia P3' }),
  });
}

async function exerciseVacation(token, fixtures) {
  await handler('Vacation', 'listar períodos', '/vacation-periods', token);
  const period = await handler('Vacation', 'criar período', '/vacation-periods', token, {
    method: 'POST',
    body: JSON.stringify({
      employmentContractId: fixtures.horizonSecondContract.id,
      accrualStart: '2024-01-01',
      accrualEnd: '2024-12-31',
    }),
  });
  await handler('Vacation', 'listar solicitações', '/vacation-requests', token, {}, (data) => {
    if (!Array.isArray(data) || data.some((item) => 'requestReason' in item)) {
      throw new Error('projeção de férias inválida');
    }
  });
  const request = await handler('Vacation', 'criar solicitação', '/vacation-requests', token, {
    method: 'POST',
    body: JSON.stringify({
      employmentContractId: fixtures.horizonSecondContract.id,
      vacationPeriodId: period.id,
      startDate: '2027-03-01',
      endDate: '2027-03-05',
    }),
  });
  await handler(
    'Vacation',
    'aprovar solicitação',
    `/vacation-requests/${request.id}/approve`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );
  await handler(
    'Vacation',
    'cancelar solicitação',
    `/vacation-requests/${fixtures.horizonVacationRequest.id}/cancel`,
    token,
    { method: 'POST', body: JSON.stringify({ reason: 'Cancelamento fictício P3' }) },
  );
  await handler('Vacation', 'criar férias coletivas', '/collective-vacations', token, {
    method: 'POST',
    body: JSON.stringify({
      name: `Coletiva fictícia ${unique}`,
      startDate: '2027-12-20',
      endDate: '2027-12-22',
    }),
  });
}

try {
  expectStatus(await call('/work-schedules'), [401], 'sem autenticação 401');
  const horizon = await prisma.company.findUniqueOrThrow({
    where: { taxId: '00.000.000/0001-00' },
  });
  const atlas = await prisma.company.findUniqueOrThrow({ where: { taxId: '11.111.111/0001-11' } });
  const horizonContracts = await prisma.employmentContract.findMany({
    where: { companyId: horizon.id },
    orderBy: { registrationNumber: 'asc' },
    take: 2,
  });
  if (horizonContracts.length < 2) throw new Error('fixture P3 exige dois contratos Horizon');
  const fixtures = {
    horizon,
    horizonContract: horizonContracts[0],
    horizonSecondContract: horizonContracts[1],
    atlasContract: await prisma.employmentContract.findFirstOrThrow({
      where: { companyId: atlas.id },
    }),
    horizonVacationRequest: await prisma.vacationRequest.findFirstOrThrow({
      where: { employmentContract: { companyId: horizon.id }, status: 'DRAFT' },
    }),
  };
  let adminToken = await login(
    env.DEMO_ADMIN_EMAIL,
    env.DEMO_ADMIN_PASSWORD,
    `${tracePrefix}admin-login`,
  );
  adminToken = await selectCompany(adminToken, horizon.id, `${tracePrefix}admin-context`);
  await exerciseTime(adminToken, fixtures);
  await exerciseBenefit(adminToken, fixtures);
  await exerciseVacation(adminToken, fixtures);

  let hrToken = await login(env.DEMO_HR_EMAIL, env.DEMO_HR_PASSWORD, `${tracePrefix}hr-login`);
  hrToken = await selectCompany(hrToken, horizon.id, `${tracePrefix}hr-context`);
  for (const path of ['/work-schedules', '/benefits', '/vacation-periods']) {
    expectStatus(
      await call(path, { headers: headers(hrToken, `${tracePrefix}hr-denied`) }),
      [403],
      `HR 403 ${path}`,
    );
  }
  for (const path of [
    `/employment-contracts/${fixtures.atlasContract.id}/time-balance`,
    `/benefits/enrollments/${fixtures.atlasContract.id}`,
    `/vacation-periods?employmentContractId=${fixtures.atlasContract.id}`,
  ]) {
    expectStatus(
      await call(path, { headers: headers(adminToken, `${tracePrefix}cross-company`) }),
      [404],
      `cross-company 404 ${path}`,
    );
  }
  for (const [family, expected] of Object.entries(expectedHandlers)) {
    if (completed.get(family) !== expected) {
      throw new Error(`${family}: ${completed.get(family)}/${expected}`);
    }
  }
  const auditCount = await prisma.auditLog.count({
    where: { traceId: { startsWith: tracePrefix } },
  });
  if (auditCount < 14) throw new Error(`auditoria P3 incompleta: ${auditCount}/14 decisões`);
  if (observedStatuses.some((status) => status >= 500)) {
    throw new Error('smoke P3 observou resposta 5xx');
  }
  console.log('FULL DELIVERY P3 SMOKE — 21/21 PASS');
  console.log(`Auditoria transacional: ${auditCount}; HR 403; cross-company 404; zero 5xx.`);
} finally {
  await prisma.$disconnect();
}
