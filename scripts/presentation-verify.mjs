import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import JSZip from 'jszip';

/* global console */

const deckPath = resolve(
  process.env.PRESENTATION_OUTPUT ??
    'docs/presentation/generated/DP-System_MVP-001_Executive_Deck.pptx',
);
const assetDirectory = resolve('docs/presentation/assets/mvp-001');
const trackingFiles = [
  resolve('docs/ROADMAP.md'),
  resolve('docs/project-management/MASTER_EXECUTION_STATUS.md'),
  resolve('docs/project-management/MVP-001_IMPLEMENTATION_BACKLOG.md'),
];
const relatedDocumentation = [
  resolve('README.md'),
  ...trackingFiles,
  resolve('docs/project-management/MVP-001_DEMO_ACCEPTANCE_CRITERIA.md'),
  resolve('docs/project-management/MVP-001_DEMO_RISK_REGISTER.md'),
  resolve('docs/demo/MVP-001_DEMO_OPERATOR_GUIDE.md'),
  resolve('docs/demo/MVP-001_DEMO_CONTINGENCY_PLAN.md'),
  resolve('docs/quality/MVP-001_FINAL_ACCEPTANCE_EVIDENCE.md'),
  resolve('docs/quality/MVP-001_KNOWN_LIMITATIONS.md'),
  resolve('docs/quality/MVP-001_STABILIZATION_REPORT.md'),
  ...readdirSync(resolve('docs/presentation'))
    .filter((name) => name.endsWith('.md'))
    .map((name) => resolve('docs/presentation', name)),
];
const expectedTitles = [
  'DP-System',
  'Por que este projeto existe',
  'Um cenário pequeno, porém representativo',
  'Objetivo do DP-System',
  'O que o protótipo entrega hoje',
  'Jornada demonstrativa',
  'Horizonte: contexto identificado e seguro',
  'Atlas: troca sem vazamento empresarial',
  'Segurança por padrão',
  'Limites seguros, não atalhos',
  'Evidências de estabilidade',
  'Operação previsível da demonstração',
  'Limitações e riscos conhecidos',
  'Próximos passos possíveis',
  'Decisão esperada dos gestores',
];
const expectedAssets = [
  '01-login-local.png',
  '02-seletor-empresas.png',
  '03-dashboard-horizonte.png',
  '04-ajuda-demonstracao.png',
  '05-acesso-restrito.png',
  '06-dashboard-atlas.png',
];

function decodeXml(value) {
  return value
    .replace(/&amp;/gu, '&')
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&quot;/gu, '"')
    .replace(/&#39;/gu, "'");
}

export function visibleText(xml) {
  return [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/gu)]
    .map((match) => decodeXml(match[1]))
    .join('\n');
}

export function forbiddenFindings(text) {
  const checks = [
    ['placeholder', /\b(?:TODO|FIXME|Lorem ipsum|placeholder|inserir imagem|definir depois)\b/giu],
    [
      'credencial',
      /(?:DemoAdmin#|DemoRh#|Bearer\s+[A-Za-z0-9._~-]+|password\s*[=:]|senha\s*[=:]\s*\S+)/giu,
    ],
    ['token', /(?:eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|token\s*[=:]\s*\S+)/giu],
    ['segredo', /(?:postgres(?:ql)?:\/\/\S+|authorization\s*:|client_secret\s*[=:])/giu],
    ['dado pessoal', /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/gu],
    ['URL externa', /https?:\/\/\S+/giu],
  ];
  return checks.flatMap(([kind, expression]) =>
    [...text.matchAll(expression)].map((match) => `${kind}: ${match[0]}`),
  );
}

export function pngDimensions(buffer) {
  if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error('Asset não é um PNG válido.');
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function validateLocalMarkdownLinks(files) {
  const failures = [];
  for (const file of files) {
    const markdown = readFileSync(file, 'utf8');
    for (const match of markdown.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/gu)) {
      const rawTarget = match[1].trim().replace(/^<|>$/gu, '');
      if (/^(?:https?:|mailto:|#)/u.test(rawTarget)) continue;
      const target = decodeURIComponent(rawTarget.split('#', 1)[0]);
      if (!target) continue;
      const resolvedTarget = resolve(dirname(file), target);
      if (!existsSync(resolvedTarget)) failures.push(`${file}: ${rawTarget}`);
    }
  }
  if (failures.length) throw new Error(`Links Markdown locais inválidos: ${failures.join('; ')}`);
}

async function inspect(path) {
  if (!existsSync(path)) throw new Error(`Deck ausente: ${path}`);
  const size = statSync(path).size;
  if (size < 100_000 || size > 20_000_000)
    throw new Error(`Tamanho de deck fora do limite: ${size}`);
  const buffer = readFileSync(path);
  const zip = await JSZip.loadAsync(buffer, { checkCRC32: true });
  for (const required of ['[Content_Types].xml', 'ppt/presentation.xml', 'docProps/core.xml']) {
    if (!zip.file(required)) throw new Error(`Entrada obrigatória ausente no PPTX: ${required}`);
  }
  const coreProperties = await zip.file('docProps/core.xml').async('string');
  const creator = decodeXml(coreProperties.match(/<dc:creator>(.*?)<\/dc:creator>/u)?.[1] ?? '');
  const lastModifiedBy = decodeXml(
    coreProperties.match(/<cp:lastModifiedBy>(.*?)<\/cp:lastModifiedBy>/u)?.[1] ?? '',
  );
  if (creator !== 'Equipe DP-System' || lastModifiedBy !== 'Equipe DP-System') {
    throw new Error('Metadados do PPTX expõem autoria não sanitizada.');
  }
  const slideEntries = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/u.test(name))
    .sort((left, right) => Number(left.match(/\d+/u)?.[0]) - Number(right.match(/\d+/u)?.[0]));
  if (slideEntries.length !== expectedTitles.length) {
    throw new Error(
      `Esperados ${expectedTitles.length} slides; encontrados ${slideEntries.length}.`,
    );
  }
  const texts = [];
  for (const [index, entry] of slideEntries.entries()) {
    const xml = await zip.file(entry).async('string');
    const text = visibleText(xml);
    if (text.trim().length < 20) throw new Error(`Slide ${index + 1} está vazio.`);
    if (!text.includes(expectedTitles[index])) {
      throw new Error(`Título esperado ausente no slide ${index + 1}: ${expectedTitles[index]}`);
    }
    texts.push(text);
  }
  const combinedText = texts.join('\n');
  const forbidden = forbiddenFindings(combinedText);
  if (forbidden.length) throw new Error(`Conteúdo proibido no deck: ${forbidden.join('; ')}`);

  const notes = Object.keys(zip.files).filter((name) =>
    /^ppt\/notesSlides\/notesSlide\d+\.xml$/u.test(name),
  );
  if (notes.length !== expectedTitles.length) {
    throw new Error(`Notas esperadas em 15 slides; encontradas em ${notes.length}.`);
  }
  for (const entry of notes) {
    const noteText = visibleText(await zip.file(entry).async('string'));
    const forbiddenNotes = forbiddenFindings(noteText);
    if (forbiddenNotes.length)
      throw new Error(`Conteúdo proibido em notas: ${forbiddenNotes.join('; ')}`);
  }

  const mediaEntries = Object.keys(zip.files).filter((name) =>
    /^ppt\/media\/[^/]+\.png$/u.test(name),
  );
  if (mediaEntries.length !== expectedAssets.length) {
    throw new Error(
      `Esperadas ${expectedAssets.length} imagens no deck; encontradas ${mediaEntries.length}.`,
    );
  }
  for (const name of expectedAssets) {
    const assetPath = resolve(assetDirectory, name);
    if (!existsSync(assetPath)) throw new Error(`Asset fonte ausente: ${name}`);
    const dimensions = pngDimensions(readFileSync(assetPath));
    if (dimensions.width < 1366 || dimensions.height < 768) {
      throw new Error(`Asset ${name} abaixo de 1366×768.`);
    }
  }

  const fingerprint = createHash('sha256')
    .update(
      JSON.stringify({
        texts,
        media: expectedAssets.map((name) =>
          createHash('sha256')
            .update(readFileSync(resolve(assetDirectory, name)))
            .digest('hex'),
        ),
      }),
    )
    .digest('hex');
  return {
    size,
    slides: slideEntries.length,
    notes: notes.length,
    media: mediaEntries.length,
    fingerprint,
  };
}

async function main() {
  validateLocalMarkdownLinks([...new Set(relatedDocumentation)]);
  const primary = await inspect(deckPath);
  const compareArgument = process.argv.indexOf('--compare');
  if (compareArgument >= 0) {
    const comparisonPath = process.argv[compareArgument + 1];
    if (!comparisonPath) throw new Error('Informe o caminho após --compare.');
    const comparison = await inspect(resolve(comparisonPath));
    if (primary.fingerprint !== comparison.fingerprint) {
      throw new Error('As duas gerações divergem em conteúdo ou assets.');
    }
    console.log(`[presentation] gerações estruturalmente equivalentes: ${primary.fingerprint}`);
  }

  const tracking = trackingFiles.map((path) => readFileSync(path, 'utf8')).join('\n');
  if (!tracking.includes('IMPLEMENTED — PRESENTATION PACKAGE AVAILABLE')) {
    throw new Error('MVP-001.9 não está registrada como implementada.');
  }
  if (!tracking.includes('IMPLEMENTED — LOCAL PROTOTYPE READY FOR MANAGEMENT VALIDATION')) {
    throw new Error('MVP-001 não está registrada como pronta para validação gerencial.');
  }
  if (!tracking.includes('ETP-015.4') || !tracking.includes('NOT STARTED')) {
    throw new Error('Estado NOT STARTED da ETP-015.4 não foi preservado.');
  }

  console.log(`[presentation] PPTX válido: ${deckPath}`);
  console.log(
    `[presentation] slides=${primary.slides}; notas=${primary.notes}; imagens=${primary.media}; bytes=${primary.size}`,
  );
  console.log('[presentation] nenhum placeholder, segredo, dado pessoal ou URL externa detectado.');
  console.log('[presentation] links Markdown locais válidos.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  await main();
