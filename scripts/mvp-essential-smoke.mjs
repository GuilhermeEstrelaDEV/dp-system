import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

/* global AbortSignal, console, fetch */

const fixture = {
  horizon: '10000000-0000-4000-8000-000000000001',
  atlas: '10000000-0000-4000-8000-000000000002',
  period: 'a0000000-0000-4000-8000-000000000004',
  run: 'b0000000-0000-4000-8000-000000000004',
  review: 'c0000000-0000-4000-8000-000000000004',
};

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

const env = {
  ...environmentFile('.env.demo.example'),
  ...environmentFile('.env.demo.local'),
};
if (env.DEMO_ENV !== 'local-demo' || env.DEMO_MODE !== 'true') {
  throw new Error('Smoke recusado: ambiente local-demo não confirmado');
}

const api = `http://localhost:${env.API_PORT}/api/v1`;
const web = `http://localhost:${env.WEB_PORT}`;
const results = [];
const observedStatuses = [];

async function call(path, options = {}) {
  const response = await fetch(path.startsWith('http') ? path : `${api}${path}`, {
    signal: AbortSignal.timeout(15_000),
    ...options,
  });
  observedStatuses.push(response.status);
  const payload = await response.json().catch(() => undefined);
  return { status: response.status, data: payload?.data, error: payload?.error };
}

function headers(token, traceId, extra = {}) {
  return {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    'x-correlation-id': traceId,
    ...extra,
  };
}

function pass(label, detail) {
  results.push({ label, detail });
  console.log(`[PASS ${String(results.length).padStart(2, '0')}/17] ${label}: ${detail}`);
}

function expectStatus(response, accepted, label) {
  if (!accepted.includes(response.status)) {
    const detail = response.error?.message ?? response.error?.code ?? 'sem detalhe seguro';
    throw new Error(
      `${label}: HTTP ${response.status}; esperado ${accepted.join(' ou ')}; detalhe: ${detail}`,
    );
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

let currentAdminToken;
let currentHrToken;
try {
  const [health, frontend] = await Promise.all([
    call('/health/ready'),
    call(web).then((response) => response),
  ]);
  expectStatus(health, [200], 'health');
  expectStatus(frontend, [200], 'frontend');
  pass('Infraestrutura local', 'API pronta e frontend acessível');

  currentAdminToken = await login(
    env.DEMO_ADMIN_EMAIL,
    env.DEMO_ADMIN_PASSWORD,
    'mvp-smoke-admin-login',
  );
  pass('Login válido', 'Administrador Demo autenticado');

  const invalidLogin = await call('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-correlation-id': 'mvp-smoke-invalid-login' },
    body: JSON.stringify({ email: env.DEMO_ADMIN_EMAIL, password: 'invalid-demo-password' }),
  });
  expectStatus(invalidLogin, [401], 'login inválido');
  pass('Login inválido', 'credencial incorreta negada com 401');

  const me = await call('/auth/me', {
    headers: headers(currentAdminToken, 'mvp-smoke-me'),
  });
  expectStatus(me, [200], 'identidade');
  pass('Identidade autenticada', 'principal resolvido pelo endpoint canônico');

  const companies = await call('/auth/companies', {
    headers: headers(currentAdminToken, 'mvp-smoke-companies'),
  });
  expectStatus(companies, [200], 'empresas');
  if (!Array.isArray(companies.data) || companies.data.length !== 2) {
    throw new Error('Administrador Demo deve visualizar exatamente duas empresas');
  }
  currentAdminToken = await selectCompany(
    currentAdminToken,
    fixture.horizon,
    'mvp-smoke-horizon-context',
  );
  pass('Empresa ativa', 'Horizonte selecionada entre duas empresas permitidas');

  const dashboard = await call('/dashboard/summary', {
    headers: headers(currentAdminToken, 'mvp-smoke-dashboard'),
  });
  expectStatus(dashboard, [200], 'dashboard');
  if (dashboard.data?.context?.companyName !== 'Horizonte Demo') {
    throw new Error('dashboard fora do contexto Horizonte');
  }
  pass('Dashboard', 'projeção restrita da Horizonte carregada');

  const review = await call(`/payroll-reviews/${fixture.review}`, {
    headers: headers(currentAdminToken, 'mvp-smoke-review'),
  });
  expectStatus(review, [200], 'conferência');
  if (review.data?.status !== 'CLOSED') throw new Error('conferência canônica não está CLOSED');
  pass('Conferência da folha', 'ciclo fictício fechado e consultável');

  const readiness = await call(
    `/payroll-periods/${fixture.period}/closure-readiness?payrollRunId=${fixture.run}`,
    { headers: headers(currentAdminToken, 'mvp-smoke-readiness') },
  );
  expectStatus(readiness, [200], 'readiness');
  if (readiness.data?.isReady !== true || readiness.data?.blockers?.length !== 0) {
    throw new Error('readiness real não liberou o fixture canônico');
  }
  pass('Readiness real', 'isReady=true e zero blockers');

  const closePayload = {
    payrollRunId: fixture.run,
    expectedConsistencyToken: readiness.data.consistencyToken,
    expectedClosureVersion: 0,
    warningAcknowledgements: (readiness.data.acknowledgementsRequired ?? []).map((warningCode) => ({
      warningCode,
      acknowledged: true,
      reason: 'Reconhecimento fictício exclusivo da demonstração local',
    })),
    note: 'Fechamento fictício executado pelo smoke do MVP essencial',
  };
  const closeKey = randomUUID();
  const close = await call(`/payroll-periods/${fixture.period}/close`, {
    method: 'POST',
    headers: headers(currentAdminToken, 'mvp-smoke-close', { 'idempotency-key': closeKey }),
    body: JSON.stringify(closePayload),
  });
  expectStatus(close, [201], 'fechamento');
  if (close.data?.status !== 'CLOSED' || close.data?.idempotentReplay !== false) {
    throw new Error('resposta inicial de fechamento inválida');
  }
  pass('Fechamento real', 'versão 1 criada pelo serviço canônico');

  const replay = await call(`/payroll-periods/${fixture.period}/close`, {
    method: 'POST',
    headers: headers(currentAdminToken, 'mvp-smoke-close-replay', {
      'idempotency-key': closeKey,
    }),
    body: JSON.stringify(closePayload),
  });
  expectStatus(replay, [200], 'replay do fechamento');
  if (replay.data?.idempotentReplay !== true || replay.data?.closureId !== close.data?.closureId) {
    throw new Error('replay não reutilizou o fechamento original');
  }
  pass('Replay idempotente', 'mesma evidência retornada sem duplicar versão');

  const history = await call(`/payroll-periods/${fixture.period}/history`, {
    headers: headers(currentAdminToken, 'mvp-smoke-history'),
  });
  expectStatus(history, [200], 'histórico');
  if (history.data?.versions?.length !== 1 || history.data.versions[0]?.version !== 1) {
    throw new Error('histórico não retornou exatamente a versão fechada');
  }
  pass('Histórico público', 'versão fechada presente na timeline');

  const [events, manifest] = await Promise.all([
    call(`/payroll-periods/${fixture.period}/history/1/events`, {
      headers: headers(currentAdminToken, 'mvp-smoke-history-events'),
    }),
    call(`/payroll-periods/${fixture.period}/history/1/manifest`, {
      headers: headers(currentAdminToken, 'mvp-smoke-history-manifest'),
    }),
  ]);
  expectStatus(events, [200], 'eventos');
  expectStatus(manifest, [200], 'manifesto');
  if (!events.data?.events?.some(({ type }) => type === 'PERIOD_CLOSED')) {
    throw new Error('timeline sem PERIOD_CLOSED');
  }
  if (manifest.data?.hash !== close.data?.manifestHash)
    throw new Error('hash do manifesto divergente');
  pass('Evidência append-only', 'timeline e manifesto SHA-256 coerentes');

  currentAdminToken = await selectCompany(
    currentAdminToken,
    fixture.atlas,
    'mvp-smoke-atlas-context',
  );
  const foreignPeriod = await call(`/payroll-periods/${fixture.period}/history`, {
    headers: headers(currentAdminToken, 'mvp-smoke-cross-company'),
  });
  expectStatus(foreignPeriod, [404], 'isolamento empresarial');
  pass('Isolamento empresarial', 'recurso da Horizonte ocultado na Atlas com 404');

  currentAdminToken = await selectCompany(
    currentAdminToken,
    fixture.horizon,
    'mvp-smoke-return-horizon',
  );
  currentHrToken = await login(env.DEMO_HR_EMAIL, env.DEMO_HR_PASSWORD, 'mvp-smoke-hr-login');
  currentHrToken = await selectCompany(currentHrToken, fixture.horizon, 'mvp-smoke-hr-context');
  const denied = await call(
    `/payroll-periods/${fixture.period}/closure-readiness?payrollRunId=${fixture.run}`,
    { headers: headers(currentHrToken, 'mvp-smoke-hr-denied') },
  );
  expectStatus(denied, [403], 'deny-by-default');
  pass('Deny-by-default', 'Analista RH sem grant recebeu 403');

  const reopenKey = randomUUID();
  const reopenPayload = {
    reason: 'Reabertura fictícia controlada para demonstração do MVP essencial',
    expectedConsistencyToken: close.data.consistencyToken,
    expectedClosureVersion: close.data.closureVersion,
    note: 'Nenhum dado real utilizado',
  };
  const reopen = await call(`/payroll-periods/${fixture.period}/reopen`, {
    method: 'POST',
    headers: headers(currentAdminToken, 'mvp-smoke-reopen', { 'idempotency-key': reopenKey }),
    body: JSON.stringify(reopenPayload),
  });
  expectStatus(reopen, [201], 'reabertura');
  if (reopen.data?.status !== 'OPEN' || reopen.data?.idempotentReplay !== false) {
    throw new Error('resposta inicial de reabertura inválida');
  }
  const reopenReplay = await call(`/payroll-periods/${fixture.period}/reopen`, {
    method: 'POST',
    headers: headers(currentAdminToken, 'mvp-smoke-reopen-replay', {
      'idempotency-key': reopenKey,
    }),
    body: JSON.stringify(reopenPayload),
  });
  expectStatus(reopenReplay, [200], 'replay da reabertura');
  if (reopenReplay.data?.idempotentReplay !== true)
    throw new Error('replay da reabertura inválido');
  pass('Reabertura controlada', 'sucessor OPEN criado e replay idempotente validado');

  const logout = await call('/auth/logout', {
    method: 'POST',
    headers: headers(currentAdminToken, 'mvp-smoke-logout'),
  });
  expectStatus(logout, [200, 201], 'logout');
  const revoked = await call('/auth/me', {
    headers: headers(currentAdminToken, 'mvp-smoke-revoked'),
  });
  expectStatus(revoked, [401], 'sessão revogada');
  currentAdminToken = undefined;
  pass('Logout técnico', 'sessão revogada e reutilização negada com 401');

  const frontendRoute = await call(`${web}/folha/conferencia`);
  expectStatus(frontendRoute, [200], 'rota frontend');
  if (observedStatuses.some((status) => status >= 500)) {
    throw new Error('resposta 5xx inesperada observada');
  }
  pass('Frontend e estabilidade', 'rota essencial atualizável e zero respostas 5xx');

  if (results.length !== 17) throw new Error(`smoke incompleto: ${results.length}/17`);
  console.log('\nMVP ESSENTIAL SMOKE: 17/17 PASS');
} finally {
  await Promise.allSettled(
    [currentAdminToken, currentHrToken]
      .filter((token) => typeof token === 'string')
      .map((token) =>
        call('/auth/logout', {
          method: 'POST',
          headers: headers(token, 'mvp-smoke-cleanup'),
        }),
      ),
  );
}
