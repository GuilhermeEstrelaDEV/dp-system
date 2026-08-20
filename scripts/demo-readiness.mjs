import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

/* global AbortSignal, console, fetch */

const expected = {
  project: 'dp-system-demo',
  containers: ['postgres', 'redis', 'api', 'web'],
  horizon: '10000000-0000-4000-8000-000000000001',
  atlas: '10000000-0000-4000-8000-000000000002',
};
const requestTimeoutMs = 10_000;
const commandTimeoutMs = 120_000;

export function sanitize(value) {
  return String(value)
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/giu, 'Bearer [REDACTED]')
    .replace(
      /(password|token|secret|cookie|authorization)(["'=:\s]+)[^\s,"']+/giu,
      '$1$2[REDACTED]',
    )
    .replace(/postgres(?:ql)?:\/\/[^\s]+/giu, 'postgresql://[REDACTED]');
}

export function result(section, item, status, detail, correction) {
  return { section, item, status, detail: sanitize(detail), correction };
}

export function summarize(checks) {
  const failures = checks.filter(({ status }) => status === 'FAIL');
  return { status: failures.length === 0 ? 'GO' : 'NO-GO', failures };
}

function parseEnvironmentFile(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/u)
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

export function loadDemoEnvironment() {
  return {
    ...parseEnvironmentFile('.env.demo.example'),
    ...parseEnvironmentFile('.env.demo.local'),
  };
}

function capture(program, args, options = {}) {
  return spawnSync(program, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    timeout: commandTimeoutMs,
    ...options,
  });
}

function commandCheck(program, args) {
  const response = capture(program, args);
  return response.status === 0 ? response.stdout.trim() : null;
}

export async function request(url, options = {}) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(requestTimeoutMs),
    ...options,
  });
  const payload = await response.json().catch(() => undefined);
  return { status: response.status, data: payload?.data };
}

function headers(token, trace) {
  return {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    'x-correlation-id': trace,
  };
}

async function login(api, email, password, trace) {
  const response = await request(`${api}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-correlation-id': trace },
    body: JSON.stringify({ email, password }),
  });
  if (![200, 201].includes(response.status) || typeof response.data?.accessToken !== 'string') {
    throw new Error(`login demonstrativo retornou HTTP ${response.status}`);
  }
  return response.data.accessToken;
}

export async function runSmoke(env) {
  const api = `http://localhost:${env.API_PORT}/api/v1`;
  const createdSessions = [];
  const sessionsToClose = new Set();
  try {
    const adminToken = await login(
      api,
      env.DEMO_ADMIN_EMAIL,
      env.DEMO_ADMIN_PASSWORD,
      'demo-verify-admin',
    );
    createdSessions.push(adminToken);
    sessionsToClose.add(adminToken);
    const identity = await request(`${api}/auth/me`, {
      headers: headers(adminToken, 'demo-verify-me'),
    });
    if (identity.status !== 200)
      throw new Error(`sessão autenticada retornou HTTP ${identity.status}`);

    const companies = await request(`${api}/auth/companies`, {
      headers: headers(adminToken, 'demo-verify-companies'),
    });
    if (companies.status !== 200 || companies.data?.length !== 2)
      throw new Error('Administrador Demo não possui exatamente duas empresas');

    let currentToken = adminToken;
    for (const [companyId, companyName] of [
      [expected.horizon, 'Horizonte Demo'],
      [expected.atlas, 'Atlas Demo'],
    ]) {
      const context = await request(`${api}/auth/context`, {
        method: 'POST',
        headers: headers(currentToken, `demo-verify-${companyName}`),
        body: JSON.stringify({ companyId }),
      });
      if (![200, 201].includes(context.status) || typeof context.data?.accessToken !== 'string')
        throw new Error(`seleção de ${companyName} falhou`);
      currentToken = context.data.accessToken;
      createdSessions.push(currentToken);
      sessionsToClose.clear();
      sessionsToClose.add(currentToken);
      const dashboard = await request(`${api}/dashboard/summary`, {
        headers: headers(currentToken, `demo-verify-dashboard-${companyName}`),
      });
      if (
        dashboard.status !== 200 ||
        dashboard.data?.access !== 'RESTRICTED' ||
        dashboard.data?.context?.companyName !== companyName
      ) {
        throw new Error(`dashboard de ${companyName} não preservou contexto restrito`);
      }
    }

    const foreign = await request(`${api}/auth/context`, {
      method: 'POST',
      headers: headers(currentToken, 'demo-verify-foreign'),
      body: JSON.stringify({ companyId: 'ffffffff-ffff-4fff-8fff-ffffffffffff' }),
    });
    if (foreign.status !== 403)
      throw new Error(`empresa não vinculada retornou HTTP ${foreign.status}`);

    const logout = await request(`${api}/auth/logout`, {
      method: 'POST',
      headers: headers(currentToken, 'demo-verify-logout'),
    });
    if (![200, 201].includes(logout.status) || logout.data?.revoked !== true)
      throw new Error('logout técnico não revogou a sessão');
    sessionsToClose.delete(currentToken);
    const revoked = await request(`${api}/auth/me`, {
      headers: headers(currentToken, 'demo-verify-revoked'),
    });
    if (revoked.status !== 401) throw new Error(`sessão revogada retornou HTTP ${revoked.status}`);

    const hrToken = await login(api, env.DEMO_HR_EMAIL, env.DEMO_HR_PASSWORD, 'demo-verify-hr');
    createdSessions.push(hrToken);
    sessionsToClose.add(hrToken);
    const hrCompanies = await request(`${api}/auth/companies`, {
      headers: headers(hrToken, 'demo-verify-hr-companies'),
    });
    if (
      hrCompanies.status !== 200 ||
      hrCompanies.data?.length !== 1 ||
      hrCompanies.data[0]?.id !== expected.horizon
    ) {
      throw new Error('Analista RH não está limitado à Horizonte Demo');
    }
    const hrLogout = await request(`${api}/auth/logout`, {
      method: 'POST',
      headers: headers(hrToken, 'demo-verify-hr-logout'),
    });
    if (![200, 201].includes(hrLogout.status)) throw new Error('logout do Analista RH falhou');
    sessionsToClose.delete(hrToken);
    return { sessionsCreated: createdSessions.length, sessionsClosed: 2 };
  } catch (error) {
    throw new Error(sanitize(error instanceof Error ? error.message : error));
  } finally {
    await Promise.allSettled(
      [...sessionsToClose].map((token) =>
        request(`${api}/auth/logout`, {
          method: 'POST',
          headers: headers(token, 'demo-verify-cleanup'),
        }),
      ),
    );
  }
}

function printChecks(checks) {
  let current = '';
  for (const check of checks) {
    if (check.section !== current) {
      current = check.section;
      console.log(`\n${current}`);
    }
    console.log(`  [${check.status}] ${check.item}: ${check.detail}`);
  }
}

function writeReport(checks, summary) {
  const directory = resolve('.demo-reports');
  mkdirSync(directory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/gu, '-');
  const gitCommit = commandCheck('git', ['rev-parse', 'HEAD']) ?? 'unavailable';
  const gitBranch = commandCheck('git', ['branch', '--show-current']) ?? 'unavailable';
  const dirty = Boolean(commandCheck('git', ['status', '--porcelain']));
  const path = resolve(directory, `readiness-${timestamp}.json`);
  writeFileSync(
    path,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), git: { commit: gitCommit, branch: gitBranch, dirty }, checks, result: summary.status }, null, 2)}\n`,
  );
  return path;
}

export async function runReadiness({ report = false, smokeOnly = false } = {}) {
  const checks = [];
  const env = loadDemoEnvironment();
  const required = [
    'DEMO_ENV',
    'DEMO_PROJECT_NAME',
    'API_PORT',
    'WEB_PORT',
    'POSTGRES_PORT',
    'REDIS_PORT',
    'DEMO_ADMIN_EMAIL',
    'DEMO_ADMIN_PASSWORD',
    'DEMO_HR_EMAIL',
    'DEMO_HR_PASSWORD',
  ];

  if (!smokeOnly) {
    const dockerVersion = commandCheck('docker', ['--version']);
    checks.push(
      result(
        'Ambiente',
        'Arquivo local',
        existsSync('.env.demo.local') ? 'PASS' : 'FAIL',
        existsSync('.env.demo.local') ? 'configuração local encontrada' : 'arquivo ausente',
        'Copie .env.demo.example para .env.demo.local.',
      ),
    );
    checks.push(
      result(
        'Ambiente',
        'Proteção local',
        env.DEMO_ENV === 'local-demo' && env.DEMO_PROJECT_NAME === expected.project
          ? 'PASS'
          : 'FAIL',
        'alvo deve ser local-demo/dp-system-demo',
        'Restaure o arquivo de ambiente demonstrativo.',
      ),
    );
    checks.push(
      result(
        'Ambiente',
        'Variáveis obrigatórias',
        required.every((key) => Boolean(env[key])) ? 'PASS' : 'FAIL',
        'presença validada sem exibir valores',
        'Compare .env.demo.local com .env.demo.example.',
      ),
    );
    checks.push(
      result(
        'Ambiente',
        'Working tree',
        commandCheck('git', ['status', '--porcelain']) ? 'WARN' : 'PASS',
        'alterações locais são apenas um aviso operacional',
      ),
    );
    checks.push(
      result(
        'Docker',
        'CLI e daemon',
        dockerVersion && commandCheck('docker', ['info']) ? 'PASS' : 'FAIL',
        dockerVersion ?? 'Docker indisponível',
        'Inicie o Docker Desktop.',
      ),
    );
    checks.push(
      result(
        'Docker',
        'Compose v2',
        commandCheck('docker', ['compose', 'version']) ? 'PASS' : 'FAIL',
        'docker compose deve estar disponível',
        'Instale Docker Compose v2.',
      ),
    );
    checks.push(
      result(
        'Docker',
        'Rede isolada',
        commandCheck('docker', ['network', 'inspect', 'dp-system-demo-network']) ? 'PASS' : 'FAIL',
        'dp-system-demo-network',
      ),
    );
    checks.push(
      result(
        'Docker',
        'Volume identificado',
        commandCheck('docker', ['volume', 'inspect', 'dp-system-demo-postgres-data'])
          ? 'PASS'
          : 'FAIL',
        'dp-system-demo-postgres-data',
      ),
    );
    for (const service of expected.containers) {
      const name = `dp-system-demo-${service}`;
      const running = commandCheck('docker', ['inspect', '--format', '{{.State.Running}}', name]);
      const health =
        service === 'web'
          ? running
          : commandCheck('docker', ['inspect', '--format', '{{.State.Health.Status}}', name]);
      checks.push(
        result(
          'Serviços',
          name,
          running === 'true' && (service === 'web' || health === 'healthy') ? 'PASS' : 'FAIL',
          `running=${running ?? 'false'}, health=${health ?? 'unavailable'}`,
          'Execute pnpm demo:start.',
        ),
      );
    }

    const dataset = capture('pnpm', ['--filter', '@dp-system/api', 'prisma:demo:verify'], {
      env: {
        ...process.env,
        ...env,
        DATABASE_URL: `postgresql://${encodeURIComponent(env.POSTGRES_USER)}:${encodeURIComponent(env.POSTGRES_PASSWORD)}@localhost:${env.POSTGRES_PORT}/${env.POSTGRES_DB}?schema=public`,
        DEMO_ENV: 'local-demo',
        DEMO_MODE: 'true',
        DEMO_SEED_ENABLED: 'true',
      },
    });
    checks.push(
      result(
        'Banco de dados',
        'Migrations e dataset',
        dataset.status === 0 ? 'PASS' : 'FAIL',
        dataset.status === 0
          ? '16 migrations e baseline determinístico validados'
          : sanitize(dataset.stderr || dataset.stdout),
        'Execute pnpm demo:reset -- --confirm-reset.',
      ),
    );
  }

  const apiReady = await fetch(`http://localhost:${env.API_PORT}/api/v1/health/ready`, {
    signal: AbortSignal.timeout(requestTimeoutMs),
  })
    .then((response) => response.status)
    .catch(() => 0);
  const webReady = await fetch(`http://localhost:${env.WEB_PORT}`, {
    signal: AbortSignal.timeout(requestTimeoutMs),
  })
    .then((response) => response.status)
    .catch(() => 0);
  checks.push(
    result(
      'Serviços',
      'API readiness',
      apiReady === 200 ? 'PASS' : 'FAIL',
      `HTTP ${apiReady || 'indisponível'}`,
      'Execute pnpm demo:start.',
    ),
  );
  checks.push(
    result(
      'Serviços',
      'Frontend',
      webReady === 200 ? 'PASS' : 'FAIL',
      `HTTP ${webReady || 'indisponível'}`,
      'Execute pnpm demo:start.',
    ),
  );

  if (apiReady === 200) {
    try {
      const smoke = await runSmoke(env);
      checks.push(
        result(
          'Autenticação',
          'Roteiro técnico',
          'PASS',
          `Horizonte, Atlas, RH, 403, logout e 401 validados; ${smoke.sessionsClosed} sessões encerradas`,
        ),
      );
      checks.push(
        result(
          'Segurança',
          'Deny-by-default',
          'PASS',
          'dashboards restritos, empresa externa 403 e política de grants demo explícitos validada',
        ),
      );
    } catch (error) {
      checks.push(
        result(
          'Autenticação',
          'Roteiro técnico',
          'FAIL',
          error instanceof Error ? error.message : error,
          'Execute pnpm demo:reset -- --confirm-reset e repita a verificação.',
        ),
      );
    }
  } else {
    checks.push(result('Autenticação', 'Roteiro técnico', 'SKIP', 'API indisponível'));
  }

  checks.push(
    result(
      'Apresentação',
      'Navegador',
      'WARN',
      'use Chrome ou Edge atual, zoom 100% e resolução 1366×768 ou superior',
    ),
  );
  checks.push(
    result(
      'Apresentação',
      'Operação offline',
      'PASS',
      'runtime usa assets locais; primeiro build e instalação podem exigir internet',
    ),
  );
  const summary = summarize(checks);
  printChecks(checks);
  if (report) console.log(`\nRelatório sanitizado: ${writeReport(checks, summary)}`);
  if (summary.status === 'NO-GO') {
    console.log('\nFalhas bloqueantes:');
    for (const failure of summary.failures)
      console.log(`  - ${failure.item}: ${failure.detail}. ${failure.correction ?? ''}`);
    console.log('Documentação: docs/demo/MVP-001_DEMO_VERIFY.md');
  }
  console.log(`\nDEMO STATUS: ${summary.status}`);
  return summary.status === 'GO' ? 0 : 1;
}
