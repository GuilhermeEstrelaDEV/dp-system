import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { URL } from 'node:url';

/* global AbortSignal, console, fetch */

const requireFromApi = createRequire(new URL('../apps/api/package.json', import.meta.url));
const { PrismaClient } = requireFromApi('@prisma/client');

const expectedHandlers = Object.freeze({
  Organization: 24,
  Admission: 19,
  Leave: 5,
  Compensation: 8,
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
if (env.DEMO_ENV !== 'local-demo' || env.DEMO_MODE !== 'true')
  throw new Error('Smoke P2 recusado: ambiente local-demo não confirmado');

const api = `http://localhost:${env.API_PORT}/api/v1`;
const web = `http://localhost:${env.WEB_PORT}`;
const unique = Date.now().toString().slice(-7);
const tracePrefix = `p2-smoke-${unique}-`;
const observedStatuses = [];
const completed = new Map(Object.keys(expectedHandlers).map((family) => [family, 0]));
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
  expectStatus(response, options.accepted ?? [200], label);
  if (validate) validate(response.data);
  completed.set(family, index);
  console.log(`[PASS] ${family} ${index}/${expectedHandlers[family]} — ${label}`);
  return response.data;
}

async function exerciseOrganization(token, fixtures) {
  const resources = [
    ['branches', fixtures.horizonBranch.id, { code: `P2-B-${unique}`, name: 'Filial P2 fictícia' }],
    [
      'departments',
      fixtures.horizonDepartment.id,
      {
        code: `P2-D-${unique}`,
        name: 'Departamento P2 fictício',
        branchId: fixtures.horizonBranch.id,
      },
    ],
    [
      'positions',
      fixtures.horizonPosition.id,
      {
        code: `P2-P-${unique}`,
        name: 'Cargo P2 fictício',
        description:
          'Descrição longa fictícia para validar quebra de linha da tabela compartilhada.',
      },
    ],
    [
      'cost-centers',
      fixtures.horizonCostCenter.id,
      { code: `P2-C-${unique}`, name: 'Centro P2 fictício' },
    ],
  ];
  for (const [resource, existingId, body] of resources) {
    await handler('Organization', `${resource} list`, `/${resource}`, token, {}, (data) => {
      if (!Array.isArray(data?.items) || data.items.length === 0)
        throw new Error(`${resource}: lista vazia`);
      if (data.items.some((item) => 'address' in item))
        throw new Error(`${resource}: projeção ampliada`);
    });
    await handler('Organization', `${resource} detail`, `/${resource}/${existingId}`, token);
    const created = await handler('Organization', `${resource} create`, `/${resource}`, token, {
      method: 'POST',
      accepted: [201],
      body: JSON.stringify(body),
    });
    await handler('Organization', `${resource} update`, `/${resource}/${created.id}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ name: `${body.name} atualizada` }),
    });
    await handler(
      'Organization',
      `${resource} inactivate`,
      `/${resource}/${created.id}/inactivate`,
      token,
      { method: 'PATCH', body: '{}' },
    );
    await handler(
      'Organization',
      `${resource} activate`,
      `/${resource}/${created.id}/activate`,
      token,
      { method: 'PATCH', body: '{}' },
    );
  }
}

async function exerciseAdmission(token, fixtures) {
  await handler('Admission', 'template list', '/checklist-templates', token);
  const template = await handler('Admission', 'template create', '/checklist-templates', token, {
    method: 'POST',
    accepted: [201],
    body: JSON.stringify({
      name: `Template P2 ${unique}`,
      description: 'Template fictício do smoke P2',
      items: [{ title: 'Validar registro fictício', sortOrder: 1, isRequired: true }],
    }),
  });
  await handler('Admission', 'template detail', `/checklist-templates/${template.id}`, token);

  const process = await handler('Admission', 'process create', '/admission-processes', token, {
    method: 'POST',
    accepted: [201],
    body: JSON.stringify({
      employeeId: fixtures.horizonContract.employeeId,
      employmentContractId: fixtures.horizonContract.id,
      checklistTemplateId: template.id,
      plannedAdmissionDate: '2026-10-01',
      operationalOwner: 'Equipe fictícia P2',
      notes: 'Observação que não pode retornar na projeção pública',
    }),
  });
  await handler('Admission', 'process list', '/admission-processes', token, {}, (data) => {
    if (
      !Array.isArray(data) ||
      data.some((item) => 'notes' in item || 'cancellationReason' in item)
    )
      throw new Error('projeção admissional ampliada');
  });
  await handler('Admission', 'process detail', `/admission-processes/${process.id}`, token);
  await handler('Admission', 'process update', `/admission-processes/${process.id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ operationalOwner: 'Equipe P2 atualizada' }),
  });
  const checklist = await handler(
    'Admission',
    'checklist from template',
    `/admission-processes/${process.id}/checklist/from-template`,
    token,
    { method: 'POST', accepted: [201], body: '{}' },
  );
  await handler(
    'Admission',
    'checklist get',
    `/admission-processes/${process.id}/checklist`,
    token,
  );
  await handler(
    'Admission',
    'checklist item update',
    `/admission-checklist-items/${checklist.items[0].id}`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify({ status: 'COMPLETED' }),
    },
  );
  await handler(
    'Admission',
    'documents list',
    `/admission-processes/${process.id}/documents`,
    token,
  );
  const document = await handler(
    'Admission',
    'document create',
    `/admission-processes/${process.id}/documents`,
    token,
    {
      method: 'POST',
      accepted: [201],
      body: JSON.stringify({
        documentType: 'Documento lógico P2',
        isRequired: true,
        observation: 'Fictícia',
      }),
    },
  );
  await handler('Admission', 'document update', `/admission-documents/${document.id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ observation: 'Atualização fictícia' }),
  });
  await handler(
    'Admission',
    'document received',
    `/admission-documents/${document.id}/mark-received`,
    token,
    { method: 'POST', accepted: [201], body: '{}' },
  );
  await handler(
    'Admission',
    'document reviewed',
    `/admission-documents/${document.id}/mark-reviewed`,
    token,
    { method: 'POST', accepted: [201], body: '{}' },
  );
  await handler(
    'Admission',
    'process complete',
    `/admission-processes/${process.id}/complete`,
    token,
    { method: 'POST', accepted: [201], body: '{}' },
  );

  const cancelId = randomUUID();
  await prisma.admissionProcess.create({
    data: {
      id: cancelId,
      employeeId: fixtures.cancelContract.employeeId,
      employmentContractId: fixtures.cancelContract.id,
      companyId: fixtures.horizon.id,
      plannedAdmissionDate: new Date('2026-11-01T00:00:00.000Z'),
      status: 'DRAFT',
    },
  });
  await handler('Admission', 'process cancel', `/admission-processes/${cancelId}/cancel`, token, {
    method: 'POST',
    accepted: [201],
    body: JSON.stringify({ reason: 'Cancelamento fictício do smoke P2' }),
  });
  await handler(
    'Admission',
    'template inactivate',
    `/checklist-templates/${template.id}/inactivate`,
    token,
    { method: 'PATCH', body: '{}' },
  );
  await handler(
    'Admission',
    'template activate',
    `/checklist-templates/${template.id}/activate`,
    token,
    { method: 'PATCH', body: '{}' },
  );
}

async function exerciseLeave(token, fixtures) {
  await handler('Leave', 'leave types list', '/leave-types', token);
  const type = await handler('Leave', 'leave type create', '/leave-types', token, {
    method: 'POST',
    accepted: [201],
    body: JSON.stringify({
      code: `P2-L-${unique}`,
      name: 'Afastamento P2 fictício',
      requiresExpectedReturn: true,
    }),
  });
  await handler('Leave', 'leave cases list', '/leave-cases', token, {}, (data) => {
    if (!Array.isArray(data) || data.some((item) => 'reason' in item))
      throw new Error('projeção de afastamento ampliada');
  });
  const leave = await handler('Leave', 'leave case create', '/leave-cases', token, {
    method: 'POST',
    accepted: [201],
    body: JSON.stringify({
      employmentContractId: fixtures.leaveContract.id,
      leaveTypeId: type.id,
      startDate: '2026-10-10',
      expectedReturnDate: '2026-10-15',
      reason: 'Motivo fictício',
    }),
  });
  await handler('Leave', 'leave return', `/leave-cases/${leave.id}/return`, token, {
    method: 'POST',
    accepted: [201],
    body: JSON.stringify({ actualReturnDate: '2026-10-15', reason: 'Retorno fictício' }),
  });
}

async function exerciseCompensation(token, fixtures) {
  const cases = [
    [
      'events',
      {
        employmentContractId: fixtures.compContract.id,
        referencePeriod: '2026-10-01',
        type: 'DEMONSTRATIVE_BONUS',
        amount: '125.50',
        policyReference: 'Referência fictícia',
      },
    ],
    [
      'advances',
      {
        employmentContractId: fixtures.compContract.id,
        referencePeriod: '2026-10-01',
        amount: '100.00',
      },
    ],
    [
      'off-cycle-payments',
      {
        employmentContractId: fixtures.compContract.id,
        referencePeriod: '2026-10-01',
        amount: '80.00',
        reason: 'Pagamento externo fictício',
      },
    ],
    [
      'reconciliations',
      {
        payrollRunId: fixtures.horizonRun.id,
        type: 'DEMONSTRATIVE_COMPARISON',
        differenceAmount: '-10.00',
        notes: 'Conciliação fictícia',
      },
    ],
  ];
  for (const [resource, body] of cases) {
    const query =
      resource === 'reconciliations'
        ? `payrollRunId=${fixtures.horizonRun.id}`
        : `employmentContractId=${fixtures.compContract.id}`;
    await handler(
      'Compensation',
      `${resource} list`,
      `/variable-compensation/${resource}?${query}`,
      token,
      {},
      (data) => {
        if (
          !Array.isArray(data) ||
          data.some((item) => 'reason' in item || 'notes' in item || 'policyReference' in item)
        )
          throw new Error(`${resource}: projeção ampliada`);
      },
    );
    await handler(
      'Compensation',
      `${resource} create`,
      `/variable-compensation/${resource}`,
      token,
      { method: 'POST', accepted: [201], body: JSON.stringify(body) },
    );
  }
}

let adminToken;
try {
  const [health, frontend] = await Promise.all([
    call('/health/ready'),
    fetch(web, { signal: AbortSignal.timeout(15_000) }),
  ]);
  expectStatus(health, [200], 'health');
  if (frontend.status !== 200) throw new Error(`frontend: HTTP ${frontend.status}`);
  expectStatus(await call('/branches'), [401], 'autenticação obrigatória');

  const horizon = await prisma.company.findFirstOrThrow({ where: { tradeName: 'Horizonte Demo' } });
  const atlas = await prisma.company.findFirstOrThrow({ where: { tradeName: 'Atlas Demo' } });
  const horizonContracts = await prisma.employmentContract.findMany({
    where: { companyId: horizon.id, status: 'ACTIVE' },
    orderBy: { registrationNumber: 'asc' },
    take: 5,
  });
  const fixtures = {
    horizon,
    atlas,
    horizonContract: horizonContracts[0],
    cancelContract: horizonContracts[1],
    leaveContract: horizonContracts[2],
    compContract: horizonContracts[3],
    horizonBranch: await prisma.branch.findFirstOrThrow({ where: { companyId: horizon.id } }),
    horizonDepartment: await prisma.department.findFirstOrThrow({
      where: { companyId: horizon.id },
    }),
    horizonPosition: await prisma.position.findFirstOrThrow({ where: { companyId: horizon.id } }),
    horizonCostCenter: await prisma.costCenter.findFirstOrThrow({
      where: { companyId: horizon.id },
    }),
    atlasBranch: await prisma.branch.findFirstOrThrow({ where: { companyId: atlas.id } }),
    atlasAdmission: await prisma.admissionProcess.findFirstOrThrow({
      where: { companyId: atlas.id },
    }),
    atlasLeave: await prisma.leaveCase.findFirstOrThrow({
      where: { employmentContract: { companyId: atlas.id } },
    }),
    atlasContract: await prisma.employmentContract.findFirstOrThrow({
      where: { companyId: atlas.id },
    }),
    horizonRun: await prisma.payrollRun.findFirstOrThrow({
      where: { payrollPeriod: { companyId: horizon.id } },
    }),
  };

  adminToken = await login(
    env.DEMO_ADMIN_EMAIL,
    env.DEMO_ADMIN_PASSWORD,
    `${tracePrefix}admin-login`,
  );
  adminToken = await selectCompany(adminToken, horizon.id, `${tracePrefix}admin-context`);
  await exerciseOrganization(adminToken, fixtures);
  await exerciseAdmission(adminToken, fixtures);
  await exerciseLeave(adminToken, fixtures);
  await exerciseCompensation(adminToken, fixtures);

  let hrToken = await login(env.DEMO_HR_EMAIL, env.DEMO_HR_PASSWORD, `${tracePrefix}hr-login`);
  hrToken = await selectCompany(hrToken, horizon.id, `${tracePrefix}hr-context`);
  for (const path of [
    '/branches',
    '/admission-processes',
    '/leave-cases',
    `/variable-compensation/events?employmentContractId=${fixtures.compContract.id}`,
  ])
    expectStatus(
      await call(path, { headers: headers(hrToken, `${tracePrefix}hr-denied`) }),
      [403],
      `HR 403 ${path}`,
    );

  for (const path of [
    `/branches/${fixtures.atlasBranch.id}`,
    `/admission-processes/${fixtures.atlasAdmission.id}`,
    `/leave-cases/${fixtures.atlasLeave.id}/return`,
    `/variable-compensation/events?employmentContractId=${fixtures.atlasContract.id}`,
  ]) {
    const method = path.includes('/return') ? 'POST' : 'GET';
    expectStatus(
      await call(path, {
        method,
        headers: headers(adminToken, `${tracePrefix}cross-company`),
        ...(method === 'POST' ? { body: JSON.stringify({ actualReturnDate: '2026-10-15' }) } : {}),
      }),
      [404],
      `cross-company 404 ${path}`,
    );
  }

  for (const [family, expected] of Object.entries(expectedHandlers)) {
    if (completed.get(family) !== expected)
      throw new Error(`${family}: ${completed.get(family)}/${expected}`);
  }
  const auditCount = await prisma.auditLog.count({
    where: { traceId: { startsWith: tracePrefix } },
  });
  if (auditCount < 36) throw new Error(`auditoria P2 incompleta: ${auditCount}/36 decisões`);
  if (observedStatuses.some((status) => status >= 500))
    throw new Error('smoke P2 observou resposta 5xx');
  console.log('FULL DELIVERY P2 SMOKE — 56/56 PASS');
  console.log(
    `Auditoria transacional: ${auditCount} eventos; HR 403; cross-company 404; zero 5xx.`,
  );
} finally {
  await prisma.$disconnect();
}
