# ETP-015 — Implementation Backlog

**Status:** especificação aprovada; ETP-015.1 concluída e ETP-015.2 não iniciada

Cada entrega nasce de `develop` atualizada, possui branch/PR próprios e só avança após evidência do
gate aplicável.

## ETP-015.1 — Identity Context Foundation

**Status:** `COMPLETED`

- **Objetivo:** estabilizar principal, sessão, trace e contrato imutável de aplicação.
- **Dependências:** ADR-007, DAL-01/05; Gate A.
- **Módulos afetados:** auth, request context, correlation middleware e filtro global.
- **Banco esperado:** nenhum; sessão/revogação futura requer proposta separada.
- **Testes:** JWT inválido/expirado, usuário inativo, trace e ausência de principal.
- **Riscos:** mudar claims/contratos existentes.
- **Aceite:** principal único, sem Express na aplicação e `401` uniforme.
- **Rollback:** restaurar adapter de principal sem abrir rota protegida.
- **Evidências:** contratos, matriz negativa, OpenAPI e checks.
- **Conclusão:** PR #53 incorporado à `develop` em 29/07/2026 pelo merge
  `dac460d8bd84bbe0a1e9f39360f4c740c47c2e4e`, com CI aprovado.
- **Revisão técnica:** uso de `RefreshToken` como registro de sessão classificado como
  `ACCEPTABLE WITH FOLLOW-UP`; a chave exclusiva é o hash SHA-256 do `sessionId`, sem armazenar token
  bruto e sem alterar o schema.
- **Follow-ups não bloqueantes:** avaliar modelo dedicado e migration aditiva de sessão; definir
  issuer/audience do JWT com plano de compatibilidade; implementar política de limpeza de registros
  expirados, rotação/refresh, logout backend, revogação global e identidade técnica em entregas
  futuras explicitamente aprovadas. Nenhum desses itens integra ou inicia a ETP-015.2.

## ETP-015.2 — Active Company Resolution

**Status:** `NOT STARTED`

- **Objetivo:** tornar empresa ativa a única autoridade empresarial.
- **Dependências:** 015.1, BDP-009, DAL-04/05.
- **Módulos afetados:** application context, auth/company selection e repositories.
- **Banco esperado:** reutilizar `UserCompanyRole`; evolução só após Gate A.
- **Testes:** assignment vigente, empresa inativa, spoofing e duas empresas.
- **Riscos:** consultas amplas ou quebra na troca de empresa.
- **Aceite:** contexto validado e `404` fora do escopo.
- **Rollback:** preservar validação e reverter apenas forma de seleção.
- **Evidências:** queries, testes API/PostgreSQL e cache segmentado documentado.

## ETP-015.3 — Capability Catalog and Assignments

- **Objetivo:** governar catálogo e concessões explícitas.
- **Dependências:** 015.2, DAL-02/03/04/13.
- **Módulos afetados:** auth, Prisma e administração futura.
- **Banco esperado:** campos/constraints aditivos aprovados no modelo.
- **Testes:** catálogo, vigência, revogação, grants e seed sem assignment.
- **Riscos:** privilege creep e capability global em domínio.
- **Aceite:** nenhuma autorização por role name; concessão auditável.
- **Rollback:** migration reversível sem apagar histórico; negar em ambiguidade.
- **Evidências:** diff do seed, matriz de capabilities e testes PostgreSQL.

## ETP-015.4 — Authorization Guards and Decorators

- **Objetivo:** padronizar allowlist pública, capability e deny-by-default.
- **Dependências:** 015.1–015.3, DAL-01/02/05.
- **Módulos afetados:** auth, metadata NestJS, OpenAPI e CI.
- **Banco esperado:** nenhum.
- **Testes:** metadata ausente, `401`, `403`, grants e rota pública.
- **Riscos:** guard global prematuro.
- **Aceite:** primitives reutilizáveis opt-in e regra para impedir rota nova sem classificação.
- **Rollback:** desativar apenas enforcement da família, preservando JWT/isolamento ativados.
- **Evidências:** unitários, E2E e inventário atualizado.

## ETP-015.5 — Enterprise Query Isolation

- **Objetivo:** filtrar empresa antes do lookup em repositories/casos de uso.
- **Dependências:** 015.2/015.4, DAL-04/05.
- **Módulos afetados:** ports/repositories de cada família migrada.
- **Banco esperado:** índices compostos quando comprovados.
- **Testes:** list/detail/write com duas empresas e IDs enumerados.
- **Riscos:** pós-filtragem ou relação indireta sem join empresarial.
- **Aceite:** nenhuma query empresarial ampla; `404` uniforme.
- **Rollback:** adapter de query anterior somente se mantiver filtro seguro.
- **Evidências:** SQL/Prisma revisado, testes e planos de consulta.

## ETP-015.6 — Sensitive Data Projection and Masking

- **Objetivo:** projeção mínima e acesso integral por capability adicional.
- **Dependências:** 015.3–015.5, DAL-06 e limites BDP-001/011.
- **Módulos afetados:** serializers/query projections e contratos compartilhados.
- **Banco esperado:** nenhum por padrão.
- **Testes:** campo allowlisted, masking, capability integral e cache entre empresas.
- **Riscos:** inferir política final de PII.
- **Aceite:** somente campos homologados; itens bloqueados permanecem fora.
- **Rollback:** reduzir projeção; nunca ampliar dados para compatibilidade.
- **Evidências:** matriz de campos e testes de snapshot/segurança.

## ETP-015.7 — Authorization Audit Events

- **Objetivo:** cobrir escritas críticas e leituras sensíveis.
- **Dependências:** 015.1–015.6, DAL-07/08/13.
- **Módulos afetados:** `AuditWriterService`, sanitizer e casos de uso.
- **Banco esperado:** campos/índices somente se Gate A comprovar necessidade.
- **Testes:** atomicidade, rollback, metadata proibida e grant usado.
- **Riscos:** PII em logs e volume excessivo.
- **Aceite:** eventos allowlist, trace completo e falha crítica atômica.
- **Rollback:** reduzir evento não crítico; não separar auditoria de escrita crítica.
- **Evidências:** testes PostgreSQL e amostras sanitizadas.

## ETP-015.8 — Payroll Closure P0 Migration

- **Objetivo:** proteger `/payroll-closures` e delegar ao fechamento canônico.
- **Dependências:** 015.1–015.7, BDP-014, DAL-09–14; Gate B/C.
- **Módulos afetados:** payroll-closures, payroll-periods, OpenAPI e clientes existentes.
- **Banco esperado:** nenhum modelo paralelo; reutilizar persistence da ETP-014.
- **Testes:** contratos, `401/403/404`, close/reopen/replay/concorrência e auditoria.
- **Riscos:** envelope incompatível e consumidor invisível.
- **Aceite:** uma única regra canônica, cinco capabilities e telemetria segura.
- **Rollback:** restaurar adapter/envelope, nunca serviço legado independente.
- **Evidências:** testes PostgreSQL, inventário de consumidores e plano de janela.

## ETP-015.9 — Legacy Route Rollout

- **Objetivo:** migrar famílias restantes por prioridade P1–P4.
- **Dependências:** 015.8 estável e BDPs de cada família.
- **Módulos afetados:** controllers/services/repositories e clientes por família.
- **Banco esperado:** somente índices/constraints aprovados por incremento.
- **Testes:** matriz negativa, isolamento, auditoria, masking e regressão do consumidor.
- **Riscos:** 163 handlers, decisões materiais e APIs externas invisíveis.
- **Aceite:** gate individual, inventário atualizado e zero bypass na família.
- **Rollback:** por família, preservando autenticação e isolamento.
- **Evidências:** telemetria, owner, janela, OpenAPI e checks.

Esta entrega é um programa de ondas, não um único PR. Deve ser decomposta sem renumerar a governança:

- **015.9a — P1:** empresa, colaboradores, contratos, parâmetros e rubricas, respeitando BDPs;
- **015.9b — P2:** organização, admissão, afastamentos e remuneração variável;
- **015.9c — P3:** jornada, benefícios e férias;
- **015.9d — P4/preservação:** superfícies públicas legítimas e reconciliação das já protegidas.

Cada onda e cada família possuem PR, gate, rollback e aceite próprios. Uma família bloqueada não
impede outra sem dependência material.

## ETP-015.10 — Hardening and Legacy Removal Readiness

- **Objetivo:** provar prontidão para enforcement global e futura remoção.
- **Dependências:** 015.1–015.9 e Gate D.
- **Módulos afetados:** AppModule, CI, OpenAPI, observabilidade e documentação.
- **Banco esperado:** nenhum, salvo índice comprovado.
- **Testes:** inventário completo, segurança, carga, falha/rollback e consumidores.
- **Riscos:** falso zero de uso e remoção precoce.
- **Aceite:** 163 rotas classificadas, zero rota empresarial implícita e relatório de prontidão.
- **Rollback:** manter aliases protegidos; remoção somente em iniciativa/PR posterior.
- **Evidências:** comunicação, telemetria, aceite dos owners e checklist final.

## Ordem final recomendada e resultado da revisão

1. 015.1 principal/sessão/revogação;
2. 015.2 empresa ativa;
3. 015.3 catálogo/assignments;
4. 015.4 decorators/guards;
5. 015.5 isolamento de repositories;
6. 015.7 fundação de auditoria necessária ao enforcement;
7. 015.6 projeção/masking por família (pode ocorrer em paralelo somente após 015.5/015.7);
8. 015.8 fechamento P0;
9. 015.9a–d, sequencial por prioridade e independente por família aprovada;
10. 015.10 hardening e prontidão de remoção.

O ajuste move 015.7 antes de ativar masking/leituras sensíveis e explicita que 015.9 não é uma entrega
monolítica. Não há dependência circular. 015.3 é o único incremento com migration provável; 015.6 e
015.9 permanecem condicionados às BDPs materiais de cada família.
