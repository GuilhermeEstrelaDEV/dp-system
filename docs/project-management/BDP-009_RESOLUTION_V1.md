# Resolução da BDP-009 — versão 1

## Status

**Resolvida e implementada para a versão 1.** Este registro governou a ETP-013, formalmente concluída em 22/07/2026. As evidências estão no [relatório final](ETP-013_FINAL_REPORT.md).

## Decisões aprovadas

### 1. Vínculo usuário–empresa

- RBAC por empresa.
- Um usuário pode participar de várias empresas.
- O assignment associa usuário, empresa, papel e status, em estrutura equivalente a `UserCompanyRole`.
- O papel é resolvido no contexto da empresa ativa.
- A estrutura deve aceitar vigência/revogação e preservar histórico auditável.

### 2. Escopo das permissões

- Modelo híbrido.
- Capacidades globais são restritas à administração da plataforma.
- Capacidades operacionais são resolvidas na empresa ativa.
- Operações de folha nunca são autorizadas apenas por capacidade global.
- A matriz papel–capacidade é configurável no banco, não em controllers ou domínio.

### 3. Contexto autenticado e empresa ativa

O contexto de aplicação contém `actorId`, `companyId`, capacidades efetivas e `traceId`. O frontend pode selecionar a empresa, mas o backend valida assignment ativo. `companyId` recebido em DTO, query, rota ou header não é autoridade por si só.

### 4. Workflow v1

Fluxo principal:

```text
PREPARATION -> REVIEW -> SUBMITTED -> APPROVED -> CLOSED
```

Reabertura:

```text
APPROVED | CLOSED -> REOPENED -> PREPARATION | REVIEW
-> SUBMITTED -> APPROVED
```

Toda reabertura exige justificativa, gera auditoria, retorna a um estado editável definido pelo caso de uso e invalida aprovações anteriores sem removê-las.

### 5. Segregação de funções

- O preparador não aprova a própria folha.
- O aprovador não altera diretamente lançamentos da execução aprovada.
- O autor pode resolver o próprio achado, mas achado `BLOCKING` exige validação final por outro ator.
- Exceção administrativa é explícita, temporária, expira e é auditada; nunca é silenciosa.

### 6. Aprovação v1

- Aprovação sequencial em duas etapas:
  1. conferência operacional por Analista ou Supervisor de DP;
  2. aprovação final por Gestor de RH.
- Papéis são dados configuráveis, não constantes de domínio.
- O desenho de etapas deve suportar N níveis futuros sem refatoração estrutural.

### 7. Alçadas

- Não existe alçada financeira por valor na versão 1.
- Autorização depende de capacidade e papel dentro da empresa.
- O modelo deve aceitar extensão futura por valor, empresa ou tipo de folha.

### 8. Substituição temporária

Deve registrar titular, substituto, empresa, início, fim, motivo, concedente e status. Expira automaticamente, pode ser revogada e é integralmente auditada.

### 9. Acesso emergencial

- Disponível apenas a administradores autorizados por capacidade específica.
- Exige motivo, escopo e duração.
- Registra `actorId`, `companyId`, `traceId`, timestamp, IP, user-agent e escopo.
- Expira automaticamente e nunca é permanente.

### 10. Recursos fora do escopo

- Recurso pertencente a empresa inacessível retorna `404` externamente.
- O backend filtra por empresa antes do lookup e não revela existência.
- A tentativa é registrada internamente para auditoria/segurança.

### 11. Auditoria

Toda ação crítica registra `actorId`, `companyId`, `traceId`, `action`, `entityType`, `entityId`, estado anterior/posterior, motivo, timestamp, IP e user-agent. O histórico é append-only e não admite exclusão física operacional.

### 12. Visibilidade por capacidade

O backend projeta dados sensíveis conforme capacidade efetiva. O frontend não desmascara dados nem decide acesso.

Papéis candidatos v1:

- `PLATFORM_ADMIN`;
- `COMPANY_ADMIN`;
- `HR_MANAGER`;
- `PAYROLL_SUPERVISOR`;
- `PAYROLL_ANALYST`;
- `FINANCE`;
- `VIEWER`;
- `AUDITOR`.

Capacidades candidatas v1:

- `payroll.view`, `payroll.edit`, `payroll.submit`, `payroll.review`;
- `payroll.approve`, `payroll.reject`, `payroll.reopen`, `payroll.close`;
- `payroll.export`, `payroll.audit`;
- `company.manage`, `user.manage`, `role.manage`;
- `delegation.manage`, `emergency_access.manage`.

Os catálogos são iniciais e configuráveis. A atribuição final deve ser persistida e seedada de forma revisável; nomes não entram em regras de domínio.

## Condições técnicas atendidas e limites futuros

A BDP-009 v1 foi materializada por:

- autenticação por access token e encerramento local; refresh, revogação persistente e logout de backend permanecem futuros;
- migration do RBAC empresarial e auditoria;
- principal/contexto, guards, policies e deny-by-default progressivo;
- modelo persistente do workflow e contratos HTTP revisados;
- implementação de backend, frontend e testes conforme [Plano técnico da ETP-013](ETP-013_FUNCTIONAL_IMPLEMENTATION_PLAN.md).

Decisões futuras sobre alçadas financeiras, níveis adicionais e novas policies exigem nova versão desta resolução e, quando arquitetural, novo ADR ou revisão explícita.
