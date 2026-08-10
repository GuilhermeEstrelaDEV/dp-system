# ETP-015.8 — P0 Consumer Inventory

**Freeze:** 2026-08-10. A ausência de referência versionada não prova ausência de consumidor.

## Consumidores versionados conhecidos

| Consumidor                                 | Antes                         | Depois                                                 | Estado     |
| ------------------------------------------ | ----------------------------- | ------------------------------------------------------ | ---------- |
| página `/folha/fechamentos`                | cliente `payroll-closures.ts` | painel e API canônicos de payroll periods              | migrado    |
| teste `payroll-closures.test.tsx`          | shapes legados                | readiness, evidência explícita, close/reopen canônicos | migrado    |
| página `/folha/competencias/:id/historico` | histórico canônico            | painel canônico reutilizável                           | preservado |
| `PayrollClosuresController`                | handlers deferred             | aliases protegidos e deprecated                        | adaptado   |
| `PayrollClosuresService`                   | Prisma e regras próprias      | delegação exclusiva                                    | adaptado   |
| testes API do módulo                       | regras legadas                | caracterização e delegação                             | migrado    |
| OpenAPI                                    | DTOs legados incompletos      | schemas canônicos e depreciação                        | migrado    |
| inventários e documentação                 | família CLOSURE-LEGACY        | P0 compatibility adapter                               | atualizado |

Buscas no monorepo não localizaram collection HTTP versionada, script operacional ou chamada interna
adicional à URI legada. O arquivo cliente legado permanece como artefato de compatibilidade, mas não é
importado pelo consumidor principal.

## Consumidores potenciais não observáveis

- clientes externos e integrações não versionados;
- scripts locais ou pipelines fora deste repositório;
- collections pessoais de HTTP;
- consumidores do OpenAPI anterior;
- consultas diretas às tabelas legadas;
- caches e bookmarks da URI histórica.

Por isso as quatro URIs não foram removidas. A telemetria segura deve embasar comunicação e janela
antes de DAL-12. Nenhuma data de remoção ou `Sunset` foi criada.

## Campos anteriormente usados pelo frontend

O frontend usava `action`, `engineVersion`, `parameterVersion`, `reason` e `payrollPeriodId`. Esses
campos não são reexpostos porque violariam o contrato `MINIMAL` ou representariam o evento legado em
vez do agregado canônico. A tela migrou para `version`, `status`, referências seguras, manifesto
resumido e timeline canônica.
