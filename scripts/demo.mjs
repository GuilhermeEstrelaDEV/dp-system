import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

/* global console */

const command = process.argv[2];
const args = new Set(process.argv.slice(3));
const envFile = '.env.demo.local';
const exampleFile = '.env.demo.example';
const composeFile = 'docker-compose.demo.yml';
const projectName = 'dp-system-demo';

function info(message) {
  console.log(`[demo] ${message}`);
}

function fail(message, correction) {
  console.error(`[demo] FALHA: ${message}`);
  if (correction) console.error(`[demo] Ação corretiva: ${correction}`);
  process.exit(1);
}

function run(program, commandArgs, options = {}) {
  const result = spawnSync(program, commandArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
  if (result.error || result.status !== 0) {
    fail(`${program} ${commandArgs.join(' ')} não concluiu.`, options.correction);
  }
}

function capture(program, commandArgs) {
  const result = spawnSync(program, commandArgs, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

function validateTools() {
  info('Validando Docker e pnpm...');
  if (!capture('docker', ['--version']))
    fail('Docker não está disponível.', 'Instale e inicie o Docker Desktop.');
  if (!capture('docker', ['compose', 'version']))
    fail('Docker Compose não está disponível.', 'Instale Docker Compose v2.');
  const pnpmVersion = capture('pnpm', ['--version']);
  if (!pnpmVersion) fail('pnpm não está disponível.', 'Habilite o Corepack e instale pnpm 9.');
  if (!pnpmVersion.startsWith('9.')) fail(`pnpm ${pnpmVersion} não é suportado.`, 'Use pnpm 9.x.');
  if (!capture('docker', ['info'])) {
    fail('Docker Engine não está acessível.', 'Inicie o Docker Desktop e tente novamente.');
  }
}

function prepareEnvironment() {
  if (!existsSync(envFile)) {
    copyFileSync(exampleFile, envFile);
    info(`${envFile} criado a partir de ${exampleFile}.`);
  } else {
    info(`${envFile} já existe e não foi sobrescrito.`);
  }
  const env = Object.fromEntries(
    readFileSync(envFile, 'utf8')
      .split(/\r?\n/u)
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
  if (env.DEMO_ENV !== 'local-demo' || env.DEMO_PROJECT_NAME !== projectName) {
    fail(
      `${envFile} não identifica o ambiente local de demonstração.`,
      `Restaure DEMO_ENV=local-demo e DEMO_PROJECT_NAME=${projectName}.`,
    );
  }
  return env;
}

function compose(...composeArgs) {
  run('docker', [
    'compose',
    '--project-name',
    projectName,
    '--env-file',
    envFile,
    '--file',
    composeFile,
    ...composeArgs,
  ]);
}

function databaseUrl(env) {
  return `postgresql://${encodeURIComponent(env.POSTGRES_USER)}:${encodeURIComponent(env.POSTGRES_PASSWORD)}@localhost:${env.POSTGRES_PORT}/${env.POSTGRES_DB}?schema=public`;
}

function waitForPostgres() {
  info('Aguardando health check do PostgreSQL 16...');
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    const health = capture('docker', [
      'inspect',
      '--format',
      '{{.State.Health.Status}}',
      'dp-system-demo-postgres',
    ]);
    if (health === 'healthy') return;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }
  fail(
    'PostgreSQL não ficou saudável em 60 segundos.',
    'Execute pnpm demo:status e consulte docker logs dp-system-demo-postgres.',
  );
}

function childEnvironment(env) {
  return {
    ...process.env,
    ...env,
    DATABASE_URL: databaseUrl(env),
    DEMO_ENV: 'local-demo',
    DEMO_MODE: 'true',
    DEMO_SEED_ENABLED: 'true',
  };
}

function verifyDataset(env, requireServices = true) {
  info('Verificando integridade e isolamento do dataset demonstrativo...');
  run('pnpm', ['--filter', '@dp-system/api', 'prisma:demo:verify'], {
    env: childEnvironment(env),
    correction: 'Execute pnpm demo:reset -- --confirm-reset para reconstruir o baseline.',
  });
  if (!requireServices) return;
  const apiStatus = capture('curl', [
    '--silent',
    '--output',
    process.platform === 'win32' ? 'NUL' : '/dev/null',
    '--write-out',
    '%{http_code}',
    `http://localhost:${env.API_PORT}/api/v1/health/ready`,
  ]);
  const webStatus = capture('curl', [
    '--silent',
    '--output',
    process.platform === 'win32' ? 'NUL' : '/dev/null',
    '--write-out',
    '%{http_code}',
    `http://localhost:${env.WEB_PORT}`,
  ]);
  if (apiStatus !== '200' || webStatus !== '200') {
    fail(
      `readiness incompleta (API=${apiStatus ?? 'indisponível'}, frontend=${webStatus ?? 'indisponível'}).`,
      'Execute pnpm demo:start e repita pnpm demo:data:verify.',
    );
  }
  info('Dataset, API e frontend verificados com sucesso.');
}

function setup() {
  validateTools();
  const env = prepareEnvironment();
  info('Subindo somente o PostgreSQL da demonstração...');
  compose('up', '--detach', 'postgres');
  waitForPostgres();
  const childEnv = childEnvironment(env);
  info('Gerando Prisma Client...');
  run('pnpm', ['prisma:generate'], { env: childEnv });
  info('Aplicando migrations existentes...');
  run('pnpm', ['prisma:migrate:deploy'], { env: childEnv });
  info('Executando o seed demonstrativo disponível...');
  run('pnpm', ['prisma:seed'], { env: childEnv });
  info('Criando identidades e vínculos exclusivamente demonstrativos...');
  run('pnpm', ['prisma:seed:demo'], { env: childEnv });
  verifyDataset(env, false);
  info('Setup concluído com massa fictícia local. Consulte docs/product/MVP-001_DEMO_ACCOUNTS.md.');
  showUrls(env);
  info('Execute pnpm demo:start para iniciar API e frontend.');
}

function showUrls(env) {
  info(`Frontend: http://localhost:${env.WEB_PORT}`);
  info(`API: http://localhost:${env.API_PORT}/api/v1`);
  info(`Health: http://localhost:${env.API_PORT}/api/v1/health/ready`);
}

function start() {
  validateTools();
  const env = prepareEnvironment();
  info('Construindo e iniciando os containers da demonstração...');
  compose('up', '--detach', '--build');
  showUrls(env);
  info('Use pnpm demo:status para inspecionar e pnpm demo:stop para interromper.');
}

function stop() {
  validateTools();
  prepareEnvironment();
  info('Interrompendo os containers sem remover dados...');
  compose('stop');
  info('Ambiente interrompido. Use pnpm demo:start para retomá-lo.');
}

function status() {
  validateTools();
  const env = prepareEnvironment();
  compose('ps', '--all');
  showUrls(env);
}

function verify() {
  validateTools();
  const env = prepareEnvironment();
  verifyDataset(env);
}

function reset() {
  validateTools();
  prepareEnvironment();
  if (!args.has('--confirm-reset')) {
    fail(
      'reset recusado sem confirmação explícita.',
      'Execute pnpm demo:reset -- --confirm-reset. Apenas o volume dp-system-demo-postgres-data será removido.',
    );
  }
  info('Removendo exclusivamente containers, rede e volume nomeados do projeto dp-system-demo...');
  compose('down', '--volumes', '--remove-orphans');
  info('Dados demonstrativos removidos. Recriando o baseline local...');
  setup();
  start();
  verify();
  info('Credenciais fictícias: consulte docs/product/MVP-001_DEMO_ACCOUNTS.md.');
}

const commands = { setup, start, stop, status, reset, verify };
if (!command || !(command in commands)) {
  fail(
    'comando desconhecido.',
    'Use pnpm demo:setup, demo:start, demo:stop, demo:status, demo:data:verify ou demo:reset -- --confirm-reset.',
  );
}
commands[command]();
