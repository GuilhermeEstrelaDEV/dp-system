import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseDeck, validateSpecs } from './presentation-build.mjs';
import { forbiddenFindings, pngDimensions, visibleText } from './presentation-verify.mjs';

test('parses the canonical 15-slide source with complete metadata', () => {
  const source = readFileSync('docs/presentation/MVP-001_EXECUTIVE_DECK.md', 'utf8');
  const specs = parseDeck(source);
  validateSpecs(specs);
  assert.equal(specs.length, 15);
  assert.equal(specs[0].title, 'DP-System');
  assert.equal(specs[14].title, 'Decisão esperada dos gestores');
});

test('detects secrets, external URLs and placeholders in visible content', () => {
  const findings = forbiddenFindings(
    'TODO Authorization: Bearer abc.def password=hidden https://example.com',
  );
  assert.equal(findings.length, 5);
  assert.deepEqual(forbiddenFindings('Protótipo local com dados fictícios.'), []);
});

test('extracts text from Open XML slide nodes', () => {
  assert.equal(
    visibleText('<a:t>DP-System</a:t><a:t>Dados &amp; limites</a:t>'),
    'DP-System\nDados & limites',
  );
});

test('reads PNG dimensions without image processing dependencies', () => {
  const buffer = Buffer.alloc(24);
  buffer.write('PNG', 1, 'ascii');
  buffer.writeUInt32BE(1440, 16);
  buffer.writeUInt32BE(900, 20);
  assert.deepEqual(pngDimensions(buffer), { width: 1440, height: 900 });
});

test('keeps the local frontend API base free from a duplicated version segment', () => {
  const example = readFileSync('.env.demo.example', 'utf8');
  const client = readFileSync('apps/web/src/lib/api.ts', 'utf8');
  assert.match(example, /^VITE_API_URL=http:\/\/localhost:53000\/api$/mu);
  assert.match(client, /`\$\{apiBaseUrl\}\/v1\$\{path\}`/u);
});
