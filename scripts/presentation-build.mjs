import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

/* global console */

const require = createRequire(import.meta.url);
const PptxGenJS = require('pptxgenjs');

const sourcePath = resolve('docs/presentation/MVP-001_EXECUTIVE_DECK.md');
const outputPath = resolve(
  process.env.PRESENTATION_OUTPUT ??
    'docs/presentation/generated/DP-System_MVP-001_Executive_Deck.pptx',
);
const assetDirectory = resolve('docs/presentation/assets/mvp-001');
const expectedCount = 15;
const assetBySlide = new Map([
  [5, '01-login-local.png'],
  [6, '02-seletor-empresas.png'],
  [7, '03-dashboard-horizonte.png'],
  [8, '06-dashboard-atlas.png'],
  [10, '05-acesso-restrito.png'],
  [12, '04-ajuda-demonstracao.png'],
]);
const colors = {
  navy: '092A3D',
  blue: '176B8F',
  bright: '24A2D8',
  ink: '102A3A',
  muted: '526978',
  canvas: 'F4F8FA',
  white: 'FFFFFF',
  line: 'D8E3E9',
  warning: 'F5A623',
  safe: '16836D',
};

function section(block, heading) {
  const expression = new RegExp(`### ${heading}\\n\\n([\\s\\S]*?)(?=\\n### |$)`, 'u');
  return block.match(expression)?.[1]?.trim() ?? '';
}

export function parseDeck(source) {
  return source
    .split(/\n---\n/u)
    .filter((block) => /^## Slide /mu.test(block))
    .map((block) => {
      const match = block.match(/^## Slide (\d+) — (.+)$/mu);
      if (!match) throw new Error('Bloco de slide sem título válido.');
      const content = section(block, 'Conteúdo visível');
      return {
        number: Number(match[1]),
        title: match[2].trim(),
        time: block.match(/^\*\*Tempo:\*\* (.+)$/mu)?.[1]?.trim() ?? '',
        bullets: [...content.matchAll(/^- (.+)$/gmu)].map((item) => item[1].trim()),
        notes: section(block, 'Nota do apresentador'),
        evidence: section(block, 'Evidência de origem'),
        transition: section(block, 'Transição'),
      };
    });
}

function addFooter(slide, number) {
  slide.addShape('line', { x: 0.65, y: 7.03, w: 12.03, h: 0, line: { color: colors.line } });
  slide.addText('Protótipo local · Dados fictícios · 31/07/2026', {
    x: 0.7,
    y: 7.08,
    w: 6.8,
    h: 0.18,
    fontFace: 'Aptos',
    fontSize: 9,
    color: colors.muted,
    margin: 0,
  });
  slide.addText(String(number).padStart(2, '0'), {
    x: 11.9,
    y: 7.05,
    w: 0.7,
    h: 0.22,
    fontFace: 'Aptos Display',
    fontSize: 10,
    bold: true,
    color: colors.blue,
    align: 'right',
    margin: 0,
  });
}

function addBrand(slide, inverse = false) {
  const background = inverse ? colors.white : colors.navy;
  const foreground = inverse ? colors.navy : colors.white;
  slide.addShape('roundRect', {
    x: 0.66,
    y: 0.46,
    w: 0.38,
    h: 0.38,
    rectRadius: 0.06,
    fill: { color: background },
    line: { color: background },
  });
  slide.addText('D', {
    x: 0.73,
    y: 0.52,
    w: 0.22,
    h: 0.19,
    fontFace: 'Aptos Display',
    fontSize: 13,
    bold: true,
    color: foreground,
    margin: 0,
    align: 'center',
  });
  slide.addText('DP-System', {
    x: 1.14,
    y: 0.5,
    w: 1.4,
    h: 0.24,
    fontFace: 'Aptos Display',
    fontSize: 13,
    bold: true,
    color: inverse ? colors.white : colors.navy,
    margin: 0,
  });
}

function addTitle(slide, spec) {
  addBrand(slide);
  slide.addText(spec.title, {
    x: 0.68,
    y: 0.96,
    w: 11.8,
    h: 0.54,
    fontFace: 'Aptos Display',
    fontSize: 29,
    bold: true,
    color: colors.ink,
    margin: 0,
    breakLine: false,
    fit: 'shrink',
  });
  slide.addText(spec.time, {
    x: 11.7,
    y: 0.55,
    w: 0.9,
    h: 0.2,
    fontFace: 'Aptos',
    fontSize: 9,
    color: colors.muted,
    align: 'right',
    margin: 0,
  });
}

function bulletRuns(bullets) {
  return bullets.map((text) => ({
    text,
    options: {
      bullet: { indent: 16 },
      hanging: 4,
      breakLine: true,
      paraSpaceAfterPt: 10,
    },
  }));
}

function addStandardBody(slide, spec, asset) {
  const hasAsset = Boolean(asset);
  slide.addShape('roundRect', {
    x: 0.68,
    y: 1.72,
    w: hasAsset ? 5.05 : 7.15,
    h: 4.93,
    rectRadius: 0.08,
    fill: { color: colors.white },
    line: { color: colors.line, width: 1 },
    shadow: { type: 'outer', color: 'B8C6CE', blur: 1.5, angle: 45, distance: 1, opacity: 0.16 },
  });
  slide.addText(bulletRuns(spec.bullets), {
    x: 0.98,
    y: 2.02,
    w: hasAsset ? 4.45 : 6.55,
    h: 4.25,
    fontFace: 'Aptos',
    fontSize: 18,
    color: colors.ink,
    valign: 'mid',
    margin: 0.04,
    breakLine: false,
    fit: 'shrink',
  });
  if (asset) {
    slide.addShape('roundRect', {
      x: 6.05,
      y: 1.72,
      w: 6.6,
      h: 4.93,
      rectRadius: 0.08,
      fill: { color: colors.navy },
      line: { color: colors.navy },
    });
    slide.addImage({ path: asset, x: 6.18, y: 1.85, w: 6.34, h: 3.96 });
    slide.addText('Captura real · 1440×900 · dados fictícios', {
      x: 6.25,
      y: 5.96,
      w: 6.1,
      h: 0.24,
      fontFace: 'Aptos',
      fontSize: 10,
      color: colors.white,
      align: 'center',
      margin: 0,
    });
  } else {
    slide.addShape('roundRect', {
      x: 8.15,
      y: 1.72,
      w: 4.5,
      h: 4.93,
      rectRadius: 0.08,
      fill: { color: colors.navy },
      line: { color: colors.navy },
    });
    slide.addText(String(spec.number).padStart(2, '0'), {
      x: 8.6,
      y: 2.05,
      w: 3.6,
      h: 1.3,
      fontFace: 'Aptos Display',
      fontSize: 64,
      bold: true,
      color: colors.bright,
      align: 'center',
      margin: 0,
    });
    slide.addText(spec.transition, {
      x: 8.62,
      y: 3.55,
      w: 3.56,
      h: 1.65,
      fontFace: 'Aptos',
      fontSize: 17,
      color: colors.white,
      align: 'center',
      valign: 'mid',
      margin: 0.05,
      fit: 'shrink',
    });
    slide.addShape('line', {
      x: 9.3,
      y: 5.57,
      w: 2.2,
      h: 0,
      line: { color: colors.bright, width: 3 },
    });
  }
}

function addCover(slide, spec) {
  slide.background = { color: colors.navy };
  addBrand(slide, true);
  slide.addShape('arc', {
    x: 8.85,
    y: -1.0,
    w: 5.5,
    h: 5.5,
    adjustPoint: 0.25,
    rotate: 18,
    fill: { color: colors.blue, transparency: 25 },
    line: { color: colors.bright, transparency: 15, width: 2 },
  });
  slide.addText('DP-System', {
    x: 0.76,
    y: 1.72,
    w: 7.5,
    h: 0.8,
    fontFace: 'Aptos Display',
    fontSize: 42,
    bold: true,
    color: colors.white,
    margin: 0,
  });
  slide.addText(spec.bullets[0], {
    x: 0.79,
    y: 2.65,
    w: 7.2,
    h: 0.68,
    fontFace: 'Aptos Display',
    fontSize: 25,
    color: 'DDECF3',
    margin: 0,
    fit: 'shrink',
  });
  slide.addText(spec.bullets.slice(1).join('\n'), {
    x: 0.8,
    y: 3.62,
    w: 6.6,
    h: 1.05,
    fontFace: 'Aptos',
    fontSize: 18,
    color: colors.white,
    breakLine: true,
    margin: 0,
  });
  slide.addShape('line', {
    x: 0.8,
    y: 5.25,
    w: 3.0,
    h: 0,
    line: { color: colors.bright, width: 4 },
  });
  slide.addText('Validação gerencial · não representa prontidão produtiva', {
    x: 0.8,
    y: 5.48,
    w: 7.4,
    h: 0.35,
    fontFace: 'Aptos',
    fontSize: 15,
    color: 'B9D5E3',
    margin: 0,
  });
  slide.addText('01', {
    x: 11.85,
    y: 6.92,
    w: 0.7,
    h: 0.22,
    fontFace: 'Aptos',
    fontSize: 10,
    color: colors.white,
    align: 'right',
    margin: 0,
  });
}

function addNotes(slide, spec) {
  slide.addNotes(
    `Tempo: ${spec.time}\n\nNota do apresentador:\n${spec.notes}\n\nEvidência:\n${spec.evidence}\n\nTransição:\n${spec.transition}`,
  );
}

export function validateSpecs(specs) {
  if (specs.length !== expectedCount) throw new Error(`Esperados ${expectedCount} slides.`);
  for (const [index, spec] of specs.entries()) {
    if (spec.number !== index + 1) throw new Error(`Numeração inválida no slide ${index + 1}.`);
    if (!spec.title || !spec.time || !spec.notes || !spec.evidence || !spec.transition) {
      throw new Error(`Slide ${spec.number} possui metadado obrigatório vazio.`);
    }
    if (spec.bullets.length < 3 || spec.bullets.length > 6) {
      throw new Error(`Slide ${spec.number} deve possuir de 3 a 6 pontos visíveis.`);
    }
  }
}

async function main() {
  if (!existsSync(sourcePath)) throw new Error(`Fonte textual ausente: ${sourcePath}`);
  const specs = parseDeck(readFileSync(sourcePath, 'utf8'));
  validateSpecs(specs);
  for (const file of assetBySlide.values()) {
    if (!existsSync(resolve(assetDirectory, file)))
      throw new Error(`Asset obrigatório ausente: ${file}`);
  }

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Equipe DP-System';
  pptx.company = 'DP-System';
  pptx.subject = 'MVP-001 — Protótipo local para validação gerencial';
  pptx.title = 'DP-System — MVP-001';
  pptx.lang = 'pt-BR';
  pptx.theme = {
    headFontFace: 'Aptos Display',
    bodyFontFace: 'Aptos',
    lang: 'pt-BR',
  };

  for (const spec of specs) {
    const slide = pptx.addSlide();
    slide.background = { color: colors.canvas };
    if (spec.number === 1) {
      addCover(slide, spec);
    } else {
      addTitle(slide, spec);
      const assetName = assetBySlide.get(spec.number);
      addStandardBody(slide, spec, assetName ? resolve(assetDirectory, assetName) : undefined);
      addFooter(slide, spec.number);
    }
    addNotes(slide, spec);
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  await pptx.writeFile({ fileName: outputPath, compression: true });
  const size = statSync(outputPath).size;
  console.log(`[presentation] deck gerado: ${outputPath}`);
  console.log(`[presentation] slides: ${specs.length}; tamanho: ${size} bytes`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  await main();
