# ETP-015 Gate A — Technical Release Gate

## Resultado atual

**NOT READY — HUMAN APPROVAL REQUIRED**

O pacote técnico está preparado, mas nenhuma decisão humana GA foi homologada. A ETP-015.3 permanece
`NOT STARTED`; nenhuma migration ou implementação está autorizada.

## Checklist decisório

- [ ] GA-01 a GA-15 possuem decisão inequívoca;
- [ ] aprovador e data estão identificados em cada decisão;
- [ ] justificativa e evidência estão anexadas;
- [ ] nenhuma condição bloqueadora permanece aberta;
- [ ] estratégia Permission/Capability está fechada;
- [ ] campos e taxonomia do catálogo estão fechados;
- [ ] RolePermission e UserCompanyRole estão fechados;
- [ ] proveniência, revogação, vigência e unicidade temporal estão fechadas;
- [ ] constraints e índices foram aceitos por Arquitetura e DBA/Operação;
- [ ] migration blueprint e backfill foram aprovados;
- [ ] rollout e rollback foram aprovados;
- [ ] Segurança confirmou zero assignments automáticos e zero ampliação de acesso;
- [ ] riscos e custos de lock foram aceitos;
- [ ] matriz, questionário e documentos técnicos são consistentes;
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

| Tema                     | Package     | Matrix  | Questionnaire | Blueprint/Rollback | Estado            |
| ------------------------ | ----------- | ------- | ------------- | ------------------ | ----------------- |
| GA-01..GA-03 catálogo    | definido    | PENDING | sem resposta  | M1/M2              | aguardando humano |
| GA-04..GA-09 assignments | definido    | PENDING | sem resposta  | M1–M3              | aguardando humano |
| GA-10..GA-12 dados       | definido    | PENDING | sem resposta  | M2/M3              | aguardando humano |
| GA-13..GA-14 operação    | definido    | PENDING | sem resposta  | rollout/rollback   | aguardando humano |
| GA-15 zero grants        | obrigatório | PENDING | sem resposta  | verificações       | aguardando humano |

## Saída objetiva

O resultado só muda para `READY FOR ETP-015.3` após todos os checkboxes decisórios possuírem evidência
e as condições técnicas pré-PR estarem atribuídas. A preparação documental, isoladamente, não altera
o estado deste gate.
