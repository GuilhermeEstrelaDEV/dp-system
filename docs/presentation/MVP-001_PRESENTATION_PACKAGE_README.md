# MVP-001 — Pacote de apresentação executiva

**Estado:** `IMPLEMENTED — PRESENTATION PACKAGE AVAILABLE`

Este diretório reúne o material oficial para validação gerencial do protótipo local. O pacote usa
somente dados fictícios e evidências verificáveis; não representa ambiente produtivo nem aprovação
de continuidade.

## Conteúdo

- [fonte canônica do deck](MVP-001_EXECUTIVE_DECK.md);
- [PPTX gerado](generated/DP-System_MVP-001_Executive_Deck.pptx) e
  [PDF de contingência](generated/DP-System_MVP-001_Executive_Deck.pdf);
- [mapa de evidências](MVP-001_EVIDENCE_MAP.md) e
  [apêndice técnico](MVP-001_TECHNICAL_APPENDIX.md);
- [guia do apresentador](MVP-001_PRESENTER_GUIDE.md),
  [roteiro final](MVP-001_FINAL_DEMO_SCRIPT.md),
  [checklist](MVP-001_PRESENTATION_DAY_CHECKLIST.md) e
  [contingência](MVP-001_PRESENTATION_CONTINGENCY.md);
- [perguntas e respostas](MVP-001_EXECUTIVE_QA.md),
  [formulário](MVP-001_MANAGER_FEEDBACK_FORM.md),
  [registro CSV](MVP-001_FEEDBACK_REGISTER.csv) e
  [matriz de decisão](MVP-001_MANAGEMENT_DECISION_MATRIX.md);
- [critérios de aceite](MVP-001_PRESENTATION_ACCEPTANCE_CRITERIA.md) e
  [relatório de ensaio](MVP-001_REHEARSAL_REPORT.md).

## Gerar e validar

Com o ambiente local preparado:

```bash
pnpm presentation:capture
pnpm presentation:build
pnpm presentation:pdf
pnpm presentation:verify
```

O deck tem 15 slides em 16:9, notas do apresentador e seis capturas reais. `presentation:verify`
valida estrutura Open XML, títulos, notas, imagens, dimensões e conteúdo sensível. O PDF depende do
Microsoft PowerPoint instalado; PPTX, fonte textual e capturas formam o pacote portátil principal.

## Limites

- execução e dados exclusivamente locais;
- nenhuma credencial está incorporada aos artefatos;
- métricas do dataset não equivalem a indicadores reais da organização;
- telas restritas evidenciam deny-by-default e não simulam CRUD funcional;
- ETP-015.4 permanece `NOT STARTED`.
