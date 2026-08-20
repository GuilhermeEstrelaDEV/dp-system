import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

/* global console */

const command = process.argv[2];
const envFile = '.env.demo.local';
const exampleFile = '.env.demo.example';

function fail(message) {
  console.error(`[demo-access] FALHA: ${message}`);
  process.exit(1);
}

function parseEnvironment(path) {
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

function readEnvironment() {
  if (!existsSync(envFile)) {
    fail(`${envFile} ausente. Execute pnpm demo:setup antes do provisioning explícito.`);
  }
  return { ...parseEnvironment(exampleFile), ...parseEnvironment(envFile) };
}

if (!['grant', 'status', 'revoke'].includes(command ?? '')) {
  fail('comando inválido. Use grant, status ou revoke.');
}
if (process.env.NODE_ENV === 'production') {
  fail('execução recusada em NODE_ENV=production.');
}

const environment = readEnvironment();
if (
  environment.DEMO_ENV !== 'local-demo' ||
  environment.DEMO_MODE !== 'true' ||
  environment.DEMO_SEED_ENABLED !== 'true' ||
  environment.POSTGRES_DB !== 'dp_system_demo'
) {
  fail('arquivo local não identifica o ambiente dp_system_demo aprovado.');
}

const databaseUrl = `postgresql://${encodeURIComponent(environment.POSTGRES_USER)}:${encodeURIComponent(environment.POSTGRES_PASSWORD)}@localhost:${environment.POSTGRES_PORT}/dp_system_demo?schema=public`;
const result = spawnSync(
  'pnpm',
  ['--filter', '@dp-system/api', 'exec', 'tsx', 'prisma/demo-access.ts', command],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      ...environment,
      NODE_ENV: process.env.NODE_ENV ?? 'development',
      DATABASE_URL: databaseUrl,
      DEMO_ENV: 'local-demo',
      DEMO_MODE: 'true',
      DEMO_SEED_ENABLED: 'true',
    },
  },
);
if (result.error || result.status !== 0) {
  fail(`operação ${command} não concluiu; nenhuma elevação adicional foi aplicada.`);
}
