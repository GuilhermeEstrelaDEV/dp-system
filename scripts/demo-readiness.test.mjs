import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { request, result, sanitize, summarize } from './demo-readiness.mjs';

/* global AbortSignal, Response, URL */

test('sanitizes credentials, tokens and connection strings', () => {
  const output = sanitize(
    'Authorization: Bearer abc.def password=secret postgresql://user:pass@host/db',
  );
  assert.doesNotMatch(output, /abc\.def|secret|user:pass/u);
  assert.match(output, /REDACTED/u);
});

test('sanitizes structured secret values used by reports', () => {
  const output = sanitize('{"token":"private-token","cookie":"session-cookie"}');
  assert.doesNotMatch(output, /private-token|session-cookie/u);
  assert.match(output, /REDACTED/u);
});

test('returns GO when there are no blocking failures', () => {
  assert.equal(
    summarize([
      result('Docker', 'daemon', 'PASS', 'ok'),
      result('Browser', 'version', 'WARN', 'review'),
    ]).status,
    'GO',
  );
});

test('returns NO-GO when a blocking verification fails', () => {
  const summary = summarize([result('Serviços', 'API', 'FAIL', 'offline', 'demo:start')]);
  assert.equal(summary.status, 'NO-GO');
  assert.equal(summary.failures.length, 1);
});

test('result sanitizes details and does not mutate state', () => {
  const check = result('Segurança', 'output', 'FAIL', 'token=private', 'corrigir');
  assert.doesNotMatch(check.detail, /private/u);
  assert.deepEqual(Object.keys(check), ['section', 'item', 'status', 'detail', 'correction']);
});

test('applies a finite timeout to readiness HTTP requests', async () => {
  const originalFetch = globalThis.fetch;
  let signal;
  globalThis.fetch = async (_url, options) => {
    signal = options?.signal;
    return new Response(JSON.stringify({ data: { ready: true } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  try {
    assert.deepEqual(await request('http://localhost/health'), {
      status: 200,
      data: { ready: true },
    });
    assert.ok(signal instanceof AbortSignal);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

for (const item of [
  'Docker indisponível',
  'container ausente',
  'porta ocupada',
  'API não pronta',
  'frontend não pronto',
  'migration pendente',
  'dataset incompleto',
  'grant indevido',
  'capability automática',
  'usuário ausente',
  'vínculo ausente',
  'autenticação inválida',
  'empresa não vinculada aceita',
  'dashboard indisponível',
  'logout inválido',
]) {
  test(`blocks presentation when detecting ${item}`, () => {
    const summary = summarize([result('Cenário controlado', item, 'FAIL', 'falha simulada')]);
    assert.equal(summary.status, 'NO-GO');
  });
}

test('readiness implementation contains no destructive Docker or database operation', () => {
  const source = readFileSync(new URL('./demo-readiness.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(
    source,
    /\['(?:down|rm|prune|stop)'\]|prisma:migrate:deploy|prisma:seed(?:[^:])/iu,
  );
});

test('readiness keeps report and rehearsal modes with finite command timeout', () => {
  const readiness = readFileSync(new URL('./demo-readiness.mjs', import.meta.url), 'utf8');
  const entrypoint = readFileSync(new URL('./demo.mjs', import.meta.url), 'utf8');
  assert.match(readiness, /const commandTimeoutMs = 120_000/u);
  assert.match(readiness, /const requestTimeoutMs = 10_000/u);
  assert.match(entrypoint, /runReadiness\(\{ report: args\.has\('--report'\) \}\)/u);
  assert.match(
    entrypoint,
    /runReadiness\(\{ smokeOnly: true, report: args\.has\('--report'\) \}\)/u,
  );
});
