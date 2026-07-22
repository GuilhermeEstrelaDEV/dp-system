# ADR-007 — Contexto de identidade e autorização empresarial

**Status:** Aceita para a versão 1

## Contexto

A plataforma possui tabelas de usuário, papéis, permissões e auditoria, além de configuração JWT. Ainda não existe autenticação funcional, principal por requisição, vínculo usuário–empresa, autorização aplicada ou writer de auditoria. A ETP-013 exige identidade, isolamento empresarial, segregação configurável e evidência do ator; a resolução v1 da BDP-009 fornece as decisões necessárias para orientar essa implementação.

## Decisão

- transportar um principal autenticado mínimo da infraestrutura para um contexto imutável de aplicação;
- resolver empresa ativa e capacidades no backend, sem confiar em payload ou frontend;
- modelar atribuições de acesso por empresa antes de reutilizar `UserRole` em domínio empresarial;
- adotar deny-by-default quando a migração das rotas permitir enforcement seguro;
- aplicar autorização na borda e novamente no caso de uso;
- registrar ator e trace em auditoria append-only e transacional;
- representar segregação por policies versionadas, sem codificar cargos ou alçadas;
- negar operações decisórias quando policy/configuração estiver ausente.
- adotar RBAC híbrido: funções administrativas globais e operações de domínio sempre resolvidas na empresa ativa;
- persistir assignments usuário–empresa–papel configuráveis e permitir múltiplas empresas por usuário;
- retornar `404` para recurso de empresa fora do escopo, mantendo auditoria interna;
- suportar substituição temporária e acesso emergencial explícitos, expiráveis e auditados;
- aplicar visibilidade de dados por capacidade efetiva.

## Consequências

- será necessária decisão e migration para o vínculo usuário–empresa;
- o rollout deverá ser incremental porque as rotas atuais são públicas;
- papéis e capacidades continuam catálogos técnicos; atribuições finais dependem de homologação;
- a ETP-013 não pode expor submissão ou decisão antes de BDP-009 e das policies aprovadas;
- testes negativos e multiempresa tornam-se obrigatórios para cada rota protegida.

## Extensões futuras

- política de revogação/cache de capacidades;
- alçadas por valor, empresa ou tipo de folha;
- workflows com mais de dois níveis ou etapas paralelas;
- novas políticas de delegação e visibilidade.

As decisões v1 estão em [Resolução da BDP-009](../../project-management/BDP-009_RESOLUTION_V1.md). Detalhes arquiteturais e plano incremental estão em [Especificação técnica de identidade, autorização e auditoria](../IDENTITY_AUTHORIZATION_SPECIFICATION.md) e [Plano técnico da ETP-013](../../project-management/ETP-013_FUNCTIONAL_IMPLEMENTATION_PLAN.md).
