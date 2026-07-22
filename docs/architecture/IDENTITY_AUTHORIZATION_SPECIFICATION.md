# Especificação técnica de identidade, autorização e auditoria

## 1. Estado e finalidade

**Status:** arquitetura v1 aprovada; identidade, RBAC e infraestrutura transversal implementados incrementalmente, workflow ainda pendente.

Este documento define a arquitetura candidata para transportar identidade autenticada, restringir acesso por empresa, aplicar autorização deny-by-default, suportar segregação configurável e auditar operações críticas. Ele não atribui capacidades a cargos reais, não define alçadas e não cria workflow de aprovação.

## 2. Diagnóstico da arquitetura atual

| Área        | Estado atual                                                                                      | Lacuna para a ETP-013                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Identidade  | Prisma contém `User`, status, senha opcional e tokens; `AuthModule` configura apenas `JwtModule`. | Não há login, strategy, validação de token, sessão funcional ou principal no request.                    |
| Papéis      | `Role`, `Permission`, `UserRole` e `RolePermission` existem.                                      | `UserRole` é global; não representa acesso ou papel por empresa.                                         |
| Empresa     | Entidades de domínio usam `companyId` e serviços conferem algumas relações.                       | O cliente informa filtros/IDs; não há empresa ativa autorizada derivada da identidade.                   |
| Autorização | Apenas rate limit está registrado como guard global.                                              | Não há guard de autenticação, decorators de capacidade, policy ou deny-by-default.                       |
| Auditoria   | `AuditLog` aceita ator opcional, entidade, ação, `traceId`, metadata e timestamp.                 | Não há writer transacional, sanitização de metadata, integração com casos de uso ou consulta autorizada. |
| Correlação  | Middleware valida ou cria `x-correlation-id`.                                                     | O identificador não é transportado junto com ator e empresa até a aplicação.                             |
| Folha       | Serviços validam relacionamentos e estados técnicos.                                              | Controllers e serviços não recebem contexto de atuação nem aplicam permissão empresarial.                |
| Frontend    | Rotas e chamadas funcionam sem sessão real.                                                       | Não há bootstrap de sessão, seletor de empresa autorizada ou capacidades devolvidas pela API.            |

Conclusão: os modelos atuais são uma fundação de plataforma, mas não formam uma camada funcional de identidade/autorização. Ligar um guard global agora quebraria as APIs existentes; criar apenas tipos sem decidir o vínculo usuário–empresa produziria um contrato enganoso. Por isso esta etapa é documental.

## 3. Princípios obrigatórios

- **Deny-by-default:** ausência de identidade, empresa ativa, capacidade ou política aplicável resulta em negação.
- **Backend como autoridade:** o frontend nunca concede acesso e nenhum `actorId`, papel ou permissão é aceito do body/query.
- **Empresa explícita e autorizada:** toda operação empresarial usa uma empresa ativa validada contra os vínculos do usuário.
- **Menor privilégio:** capacidades são granulares e atribuídas apenas no escopo homologado.
- **Segregação configurável:** o mecanismo é técnico; participantes, combinações proibidas, etapas e alçadas dependem de BDP-009.
- **Auditoria append-only:** operações críticas registram ator, empresa, ação, alvo, correlação e resultado sem payload sensível.
- **Defesa em profundidade:** guards protegem a borda e casos de uso conferem empresa, recurso e invariantes novamente.
- **Falha fechada:** configuração ausente ou ambígua nunca habilita submissão ou decisão.

## 4. Propagação da identidade

### 4.1 Claims mínimos candidatos

O access token deve conter somente claims estáveis de sessão: `sub` (usuário), `sid` (sessão), `jti`, `iat` e `exp`. Papéis, permissões e empresa ativa não devem ser confiados como autoridade duradoura dentro do token sem estratégia explícita de revogação/versionamento.

### 4.2 Principal autenticado

Após validar assinatura, expiração, sessão e status do usuário, a strategy produz um principal interno:

```ts
type AuthenticatedPrincipal = Readonly<{
  userId: string;
  sessionId: string;
  tokenId: string;
}>;
```

Esse principal é criado exclusivamente pela infraestrutura de autenticação. Controllers não leem claims diretamente e serviços não dependem de Express.

### 4.3 Contexto de atuação

A camada de aplicação recebe um contexto explícito e imutável:

```ts
type ApplicationActorContext = Readonly<{
  actorId: string;
  companyId: string;
  sessionId: string;
  traceId: string;
  permissionCodes: readonly string[];
  roleAssignmentIds: readonly string[];
}>;
```

O `traceId` deriva do correlation ID validado. `actorId` deriva do principal. `companyId`, permissões e assignments são resolvidos no backend para a requisição e nunca são copiados de payloads de negócio.

### 4.4 Empresa ativa

Contrato candidato: o cliente envia `x-company-id`; um resolvedor confere se a empresa está ativa e pertence ao escopo vigente do usuário. A decisão final sobre seleção por header, rota ou sessão deve ser aprovada antes da implementação. Sem empresa ativa válida, rotas empresariais retornam negação e não fazem consulta ampla.

## 5. Modelo técnico candidato de acesso

O catálogo global `Role`/`Permission` pode ser reutilizado, mas `UserRole` não atende RBAC por empresa. A próxima revisão de banco deve escolher explicitamente entre:

1. atribuição composta usuário–empresa–papel, preservando o catálogo global; ou
2. membership usuário–empresa separado de atribuições de papel no membership.

Ambos precisam representar status, vigência, origem, criação e revogação auditáveis. A escolha afeta migrations, unicidades, administração e revogação; nenhuma migration deve ser criada antes dessa decisão arquitetural.

Capacidades candidatas, sem atribuição a cargos:

- `payroll_review.read`;
- `payroll_review.finding.create`;
- `payroll_review.finding.resolve`;
- `payroll_review.finding.reopen`;
- `payroll_review.submit`;
- `payroll_review.decision.record`;
- `payroll_review.audit.read`;
- `payroll_review.sensitive_values.read`.

Os códigos separam operações técnicas. Eles não determinam quem recebe cada capacidade nem se uma decisão é suficiente para concluir uma etapa.

## 6. Pontos de autorização

### 6.1 Pipeline HTTP candidato

1. `CorrelationIdMiddleware` cria/valida o `traceId`.
2. guard de autenticação valida token, sessão e usuário.
3. resolvedor de empresa ativa valida o escopo empresarial.
4. guard de capacidade exige declaração explícita da rota.
5. controller valida DTO e chama um caso de uso com `ApplicationActorContext`.
6. caso de uso recarrega o recurso, confere `resource.companyId === context.companyId` e aplica a policy.
7. transação persiste mudança, evento de domínio e auditoria.

Rotas públicas devem usar marcação explícita e lista mínima (por exemplo, health e futuros endpoints de sessão). Ausência de metadata de autorização em rota protegida deve negar acesso.

### 6.2 Controllers

- declaram capacidade necessária, mas não escolhem papel ou alçada;
- não recebem `actorId`, `companyId` autorizado ou permissões do DTO;
- não transformam falha de policy em sucesso parcial;
- respostas podem incluir capacidades efetivas para orientar a interface, sem torná-la autoridade.

### 6.3 Casos de uso e serviços

- recebem contexto por parâmetro ou porta de aplicação, nunca por variável global;
- filtram consultas por empresa antes de buscar o identificador sempre que possível;
- retornam `404` ou `403` conforme convenção de não exposição a ser aprovada;
- invocam uma porta de policy para operações decisórias;
- negam se a policy/configuração necessária não existir;
- não consultam nomes de cargos para decidir acesso.

## 7. Auditoria

Criar futuramente uma porta `AuditWriter` e adaptador Prisma. Para escritas críticas, mudança de estado, evento append-only e `AuditLog` devem compartilhar transação ou mecanismo outbox com garantia equivalente.

Campos mínimos:

- `actorUserId`: sempre preenchido em ação autenticada;
- `entityType` e `entityId`: agregado afetado;
- `action`: código técnico estável;
- `traceId`: contexto da requisição;
- `occurredAt`: relógio do servidor;
- metadata allowlisted: `companyId`, estado anterior/novo, motivo categórico, policy/version e resultado.

Metadata não deve conter token, senha, documento, dados bancários, payload integral ou valores individuais sem necessidade aprovada. Falha ao auditar ação crítica deve abortar a transação.

## 8. Segregação técnica sem decisão de negócio

A infraestrutura deve permitir policies que comparem ator atual com eventos anteriores e assignments vigentes. Invariantes técnicas:

- identidade de cada ação crítica é obrigatória e imutável;
- histórico de participantes não pode ser reescrito;
- policy e versão usadas na decisão devem ser preservadas;
- ausência de policy aplicável nega submissão/decisão;
- a aplicação não pode inferir segregação por nome de cargo;
- bypass emergencial não existe até haver regra homologada e auditável;
- mudança posterior de papel não altera retroativamente o ator e contexto registrados.

BDP-009 deve definir quais atores podem executar cada ação, quantos níveis existem, quais combinações são proibidas, quais alçadas se aplicam e como tratar substituição ou emergência.

## 9. Contratos técnicos candidatos da ETP-013

Todos os comandos recebem ator, empresa e trace pela infraestrutura, fora do payload.

| Operação candidata        | Payload de negócio mínimo                                               | Capacidade técnica candidata     | Regra ainda pendente                                   |
| ------------------------- | ----------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------ |
| Submeter ciclo            | `cycleId`, justificativa/idempotency key quando homologadas             | `payroll_review.submit`          | etapa de destino, participantes e pré-condições finais |
| Registrar decisão         | `cycleId`, código `APPROVE` ou `REJECT`, justificativa, idempotency key | `payroll_review.decision.record` | significado, alçada, suficiência e efeitos             |
| Criar achado              | execução/ciclo, severidade, descrição e referência técnica              | `payroll_review.finding.create`  | quem pode criar e visibilidade                         |
| Resolver achado           | `findingId`, justificativa, idempotency key                             | `payroll_review.finding.resolve` | quem pode resolver bloqueantes                         |
| Reabrir achado            | `findingId`, justificativa, idempotency key                             | `payroll_review.finding.reopen`  | quem pode reabrir e impactos no ciclo                  |
| Reabrir competência/ciclo | identificador e justificativa                                           | capacidade ainda não nomeada     | ator, invalidação, nova aprovação e efeitos            |

Esses são contratos de análise, não endpoints autorizados. Códigos decisórios não aprovam folha por si: somente registram intenção sujeita à policy e ao estado homologado.

## 10. Dependências por camada

### Banco

- vínculo usuário–empresa e atribuição de papel com status/vigência;
- sessão/revogação coerente com JWT;
- revisão de `AuditLog` para indexação por empresa ou metadata consultável;
- entidades da ETP-013 somente após estabilização do workflow;
- FKs restritivas, sem exclusão em cascata de evidências/auditoria.

### API

- strategy e guard de autenticação;
- principal e resolvedor de contexto empresarial;
- decorators/guard de capacidade deny-by-default;
- porta de policy e porta de auditoria;
- erros padronizados para não autenticado, negado e conflito;
- idempotência para ações críticas.

### Frontend

- bootstrap de sessão e expiração segura;
- seleção apenas entre empresas retornadas pela API;
- envio do identificador de empresa pelo contrato aprovado;
- consumo de capacidades efetivas para exibir/desabilitar ações;
- tratamento de `401`, `403` e `409`;
- nenhuma regra de autorização ou alçada no bundle.

## 11. Estratégia de testes

### Unitários

- criação imutável do principal/contexto;
- deny-by-default sem identidade, empresa, capacidade ou policy;
- resolução de capacidades por assignment vigente;
- comparação de empresa do contexto e do recurso;
- metadata de auditoria allowlisted e redaction;
- policies genéricas negam quando configuração estiver ausente.

### Integração/API

- token ausente, inválido, expirado, revogado e usuário bloqueado;
- acesso cruzado entre empresas negado em listagem e detalhe;
- spoofing de `actorId`, empresa e permissões pelo payload ignorado/rejeitado;
- guard e serviço aplicam a mesma fronteira;
- escrita e auditoria são atômicas;
- concorrência, idempotência e revogação de assignment.

### Frontend

- sessão ausente/expirada;
- troca de empresa limpa caches empresariais;
- ação oculta/desabilitada não substitui negação da API;
- tratamento acessível de acesso negado e conflito;
- nenhum dado de outra empresa permanece após troca de contexto.

### Segurança

- matriz negativa por rota/capacidade;
- enumeração de IDs entre empresas;
- alteração de headers/claims/payloads;
- logs e auditoria sem dados sensíveis;
- regressão das rotas públicas explicitamente permitidas.

## 12. Plano incremental

1. Homologar o modelo usuário–empresa e registrar ADR aceito.
2. Implementar login/refresh/logout, strategy JWT e revogação com testes, sem alterar módulos de DP.
3. Implementar principal, contexto empresarial e capacidades em modo opt-in para rotas técnicas novas.
4. Migrar rotas existentes por módulo; somente depois habilitar deny-by-default global.
5. Implementar `AuditWriter` transacional e consulta auditada.
6. Integrar a fundação neutra de achados a persistência/API não decisória, após revisão do modelo.
7. Homologar BDP-009 e implementar policy/versionamento e contratos decisórios.
8. Implementar frontend de conferência e integração com fechamento após testes de autorização e segregação.

Cada incremento precisa preservar compatibilidade ou declarar migração de clientes. Nenhuma etapa pode habilitar ação decisória com policy ausente.

## 13. Decisões v1 e extensões futuras

A resolução v1 aprovou RBAC empresarial híbrido, contexto de empresa ativa, duas etapas sequenciais, segregação, ausência de alçada financeira, substituição temporária, emergência auditada, `404` fora do escopo e visibilidade por capacidade.

Permanecem fora da versão 1 e exigem decisão futura antes de implementação:

- alçadas financeiras por valor, empresa ou tipo de folha;
- níveis adicionais ou aprovação paralela;
- delegação além da substituição temporária;
- prazos, notificações e escalonamento;
- tolerâncias de conciliação, se existirem;
- alterações da matriz papel–capacidade v1;
- retenção final de auditoria, vinculada à BDP-011 e Jurídico/DPO.

A BDP-009 foi resolvida para a versão 1 conforme [registro formal](../project-management/BDP-009_RESOLUTION_V1.md). A ETP-013 continua em fundação parcial até a implementação do [plano técnico](../project-management/ETP-013_FUNCTIONAL_IMPLEMENTATION_PLAN.md).
