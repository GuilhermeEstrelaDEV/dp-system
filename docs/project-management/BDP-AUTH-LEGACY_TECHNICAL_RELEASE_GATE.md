# BDP-AUTH-LEGACY — Gate de liberação da primeira fase técnica

**Identificador:** provisório; não reserva numeração definitiva
**Status:** `READY FOR HUMAN DECISION`
**Resultado atual:** `BLOCKED`; nenhuma implementação está autorizada

## Objetivo

Impedir que documentação preparada seja interpretada como autorização para guards, capabilities,
assignments, mudanças contratuais ou migrations. O gate deve ser reaplicado após o merge da resolução
humana e antes da criação de qualquer branch técnica.

## Gate A — decisão e governança

- [ ] BDP homologada em resolução versionada, com identificador definitivo e ata/evidência.
- [ ] DAL-01 a DAL-14 aprovadas conforme a matriz RACI.
- [ ] matriz papel–capability aprovada, sem assignment automático.
- [ ] BDP-009 v1 e BDP-014 v1 preservadas sem contradição.
- [ ] dependências pendentes delimitadas por família e fora do recorte inicial.
- [ ] PR documental da resolução mesclado e confirmado em `origin/develop`.

## Gate B — recorte técnico

- [ ] família e rotas do primeiro recorte nomeadas explicitamente.
- [ ] classificação pública/global/empresarial de cada rota aprovada.
- [ ] capabilities, segregação, grants e responsáveis aprovados.
- [ ] consumidores internos e externos inventariados.
- [ ] compatibilidade de URI, envelope, status e OpenAPI especificada.
- [ ] adapter/delegação canônica e ausência de regra duplicada demonstrados no desenho.
- [ ] nenhuma decisão material de BDP pendente foi incorporada ao recorte.

## Gate C — segurança, dados e auditoria

- [ ] principal e empresa ativa seguem o ADR-007.
- [ ] 401/403/404 e filtro empresarial antes do lookup aprovados.
- [ ] deny-by-default e allowlist pública definidos para o recorte.
- [ ] projeção, mascaramento e capability sensível aprovados quando aplicáveis.
- [ ] eventos auditáveis, `actorId`, `companyId`, `traceId`, motivo e metadata allowlist definidos.
- [ ] logs e telemetria excluem token, senha, documento, dados bancários e body integral.
- [ ] limites temporários preservam a BDP-011 sem criar descarte automático.

## Gate D — testes e operação

- [ ] testes caracterizadores dos consumidores e contratos legados especificados.
- [ ] matriz 401/403/404, duas empresas, grants e ausência de efeito colateral aprovada.
- [ ] testes transacionais PostgreSQL definidos quando houver escrita/auditoria.
- [ ] testes de frontend, cache empresarial e troca de sessão definidos quando aplicáveis.
- [ ] baseline de cobertura registrado e regressão mínima acordada.
- [ ] telemetria segura, responsável de observação e janela aprovados.
- [ ] rollback mantém JWT, isolamento e rotas seguras; nunca restaura bypass.
- [ ] plano de incidentes e critérios de interrupção definidos.

## Gate E — repositório e publicação

- [ ] branch técnica criada da `develop` sincronizada somente após os gates anteriores.
- [ ] PR limita-se a uma família ou fundação explicitamente aprovada.
- [ ] zero assignment automático e zero nome fixo de papel em regra de domínio.
- [ ] migrations aditivas somente se justificadas e testadas em PostgreSQL limpo.
- [ ] OpenAPI, inventário, documentação e rollback atualizados no mesmo incremento.
- [ ] `pnpm check`, cobertura, Prisma quando aplicável, Prettier e `git diff --check` verdes.
- [ ] revisão de Segurança e Engenharia; DP/Produto/DPO conforme a RACI do recorte.

## Condição objetiva de liberação

A primeira implementação técnica está liberada somente quando **todos** os itens dos Gates A a D
estiverem marcados com evidência e responsáveis, e os itens do Gate E estiverem incorporados ao plano
do primeiro PR. Item vazio, rejeitado ou condicionado mantém o resultado `BLOCKED`.

## Registro de execução futura

| Campo                      | Valor     |
| -------------------------- | --------- |
| Data do gate               |           |
| Commit de `origin/develop` |           |
| Resolução homologada       |           |
| Primeiro recorte           |           |
| Evidências                 |           |
| Responsável técnico        |           |
| Resultado                  | `BLOCKED` |

O resultado não pode ser liberado por este pacote documental; exige nova execução após a decisão
humana.
