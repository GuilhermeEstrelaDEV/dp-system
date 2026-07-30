import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { result, sanitize, summarize } from './demo-readiness.mjs';

/* global URL */

test('sanitizes credentials, tokens and connection strings', () => {
  const output = sanitize(
    'Authorization: Bearer abc.def password=secret postgresql://user:pass@host/db',
  );
  assert.doesNotMatch(output, /abc\.def|secret|user:pass/u);
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
