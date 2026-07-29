# ETP-015 Gate A — Technical Release Gate

## Resultado atual

**APPROVED — READY FOR CONTROLLED IMPLEMENTATION**

As decisões GA-01..GA-15 foram homologadas por Guilherme Estrela em 29/07/2026, sem condições
bloqueadoras. A ETP-015.3 permanece `NOT STARTED`; a aprovação do desenho não cria migration nem
ativa autorização funcional.

**Subgate de classificação:** `APPROVED — READY FOR CONTROLLED MIGRATION`. PC-01..PC-21 homologaram
risco e sensibilidade dos 19 códigos e a política fail-closed em 29/07/2026. A migration ainda não
foi criada, a ETP-015.3 permanece `NOT STARTED` e nenhum campo obrigatório poderá receber default
inventado.

## Checklist decisório

- [x] GA-01 a GA-15 possuem decisão inequívoca;
- [x] aprovador e data estão identificados em cada decisão;
- [x] justificativa e evidência estão anexadas;
- [x] nenhuma condição bloqueadora permanece aberta;
- [x] estratégia Permission/Capability está fechada;
- [x] campos e taxonomia do catálogo estão fechados;
- [x] RolePermission e UserCompanyRole estão fechados;
- [x] proveniência, revogação, vigência e unicidade temporal estão fechadas;
- [x] constraints e índices foram aceitos por Arquitetura e DBA/Operação;
- [x] migration blueprint e backfill foram aprovados;
- [x] rollout e rollback foram aprovados;
- [x] Segurança confirmou zero assignments automáticos e zero ampliação de acesso;
- [x] riscos e custos de lock foram aceitos;
- [x] matriz, questionário e documentos técnicos são consistentes;
- [x] ETP-015.3 permanece `NOT STARTED` durante a homologação.

## Critérios técnicos após aprovação humana

Antes do primeiro PR de migration, registrar:

1. baseline de contagens, códigos, pares e vínculos;
2. classificação homologada de todos os códigos existentes;
3. query de detecção de duplicidade/sobreposição com resultado tratado;
4. fixture de upgrade e PostgreSQL 16 limpo;
5. teste de concorrência da exclusion constraint;
6. diff comprovando zero inserts em assignments pelo seed/migration;
7. comparação do conjunto efetivo antes/depois;
8. plano de lock, backup, forward fix e rollback ensaiado;
9. escopo do PR limitado à persistência, sem ativar resolvedor/guard;
10. rastreabilidade GA-01..GA-15 no PR.

## Matriz de consistência

| Tema                     | Package     | Matrix   | Questionnaire | Blueprint/Rollback | Estado   |
| ------------------------ | ----------- | -------- | ------------- | ------------------ | -------- |
| GA-01..GA-03 catálogo    | definido    | APPROVED | respondido    | M1/M2              | aprovado |
| GA-04..GA-09 assignments | definido    | APPROVED | respondido    | M1–M3              | aprovado |
| GA-10..GA-12 dados       | definido    | APPROVED | respondido    | M2/M3              | aprovado |
| GA-13..GA-14 operação    | definido    | APPROVED | respondido    | rollout/rollback   | aprovado |
| GA-15 zero grants        | obrigatório | APPROVED | respondido    | verificações       | aprovado |

## Saída objetiva

O Gate A estrutural está `APPROVED — READY FOR CONTROLLED IMPLEMENTATION`. Os critérios técnicos
pré-PR e o [subgate de classificação](ETP-015_PERMISSION_CLASSIFICATION_RELEASE_GATE.md) continuam
obrigatórios. A ETP-015.3 só muda de `NOT STARTED` por iniciativa posterior; esta homologação não
inicia implementação.
