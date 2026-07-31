import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

/* global console, localStorage, sessionStorage */

const outputDirectory = resolve('docs/presentation/assets/mvp-001');
const edgeCandidates = [
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

function environment(path) {
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

function requireValue(env, key) {
  const value = env[key];
  if (!value) throw new Error(`Variável obrigatória ausente: ${key}`);
  return value;
}

async function capture(page, name) {
  const path = resolve(outputDirectory, name);
  await page.screenshot({ path, fullPage: false });
  console.log(`[presentation] captura criada: ${path}`);
}

async function main() {
  const envPath = resolve('.env.demo.local');
  if (!existsSync(envPath)) throw new Error('Execute pnpm demo:setup antes de capturar os assets.');
  const env = { ...environment(resolve('.env.demo.example')), ...environment(envPath) };
  const baseUrl = `http://localhost:${requireValue(env, 'WEB_PORT')}`;
  const executablePath = edgeCandidates.find((candidate) => existsSync(candidate));
  if (!executablePath) throw new Error('Microsoft Edge não foi encontrado nesta estação.');
  mkdirSync(outputDirectory, { recursive: true });

  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({
    locale: 'pt-BR',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await capture(page, '01-login-local.png');

    await page.getByLabel('E-mail').fill(requireValue(env, 'DEMO_ADMIN_EMAIL'));
    await page.getByLabel('Senha').fill(requireValue(env, 'DEMO_ADMIN_PASSWORD'));
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    try {
      await page.waitForURL(/\/selecionar-empresa$/u, { timeout: 20_000 });
    } catch {
      const message = await page
        .locator('[role="alert"]')
        .textContent()
        .catch(() => undefined);
      throw new Error(`Login não avançou para a seleção empresarial: ${message ?? 'sem mensagem'}`);
    }
    await page.getByRole('heading', { name: 'Selecionar empresa' }).waitFor();
    await capture(page, '02-seletor-empresas.png');

    const horizon = page.locator('li').filter({ hasText: 'Horizonte Demo' });
    await horizon.getByRole('button', { name: 'Acessar empresa' }).click();
    await page.waitForURL(`${baseUrl}/`);
    await page.getByRole('heading', { name: 'Visão executiva' }).waitFor();
    await capture(page, '03-dashboard-horizonte.png');

    await page.getByRole('button', { name: 'Ajuda da demonstração' }).click();
    await page.getByRole('dialog', { name: 'Ajuda da demonstração' }).waitFor();
    await capture(page, '04-ajuda-demonstracao.png');
    await page.getByRole('button', { name: 'Fechar', exact: true }).click();

    await page.goto(`${baseUrl}/colaboradores`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Acesso restrito' }).waitFor();
    await capture(page, '05-acesso-restrito.png');

    await page.goto(`${baseUrl}/selecionar-empresa`, { waitUntil: 'networkidle' });
    const atlas = page.locator('li').filter({ hasText: 'Atlas Demo' });
    await atlas.getByRole('button', { name: 'Acessar empresa' }).click();
    await page.waitForURL(`${baseUrl}/`);
    await page.getByRole('heading', { name: 'Visão executiva' }).waitFor();
    await capture(page, '06-dashboard-atlas.png');

    const storage = await page.evaluate(() => ({
      localStorage: Object.keys(localStorage).length,
      sessionStorage: Object.keys(sessionStorage).length,
    }));
    if (storage.localStorage !== 0) {
      throw new Error('A captura detectou persistência inesperada em localStorage.');
    }
    console.log('[presentation] 6 capturas reais concluídas; nenhum segredo foi impresso.');
  } finally {
    await context.close();
    await browser.close();
  }
}

await main();
