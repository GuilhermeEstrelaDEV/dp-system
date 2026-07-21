# ADR-007 — Contexto de identidade e autorização empresarial

**Status:** Proposta

## Contexto

A plataforma possui tabelas de usuário, papéis, permissões e auditoria, além de configuração JWT. Ainda não existe autenticação funcional, principal por requisição, vínculo usuário–empresa, autorização aplicada ou writer de auditoria. A ETP-013 exige identidade, isolamento empresarial, segregação configurável e evidência do ator, mas BDP-009 permanece pendente.

## Decisão proposta

- transportar um principal autenticado mínimo da infraestrutura para um contexto imutável de aplicação;
- resolver empresa ativa e capacidades no backend, sem confiar em payload ou frontend;
- modelar atribuições de acesso por empresa antes de reutilizar `UserRole` em domínio empresarial;
- adotar deny-by-default quando a migração das rotas permitir enforcement seguro;
- aplicar autorização na borda e novamente no caso de uso;
- registrar ator e trace em auditoria append-only e transacional;
- representar segregação por policies versionadas, sem codificar cargos ou alçadas;
- negar operações decisórias quando policy/configuração estiver ausente.

## Consequências

- será necessária decisão e migration para o vínculo usuário–empresa;
- o rollout deverá ser incremental porque as rotas atuais são públicas;
- papéis e capacidades continuam catálogos técnicos; atribuições finais dependem de homologação;
- a ETP-013 não pode expor submissão ou decisão antes de BDP-009 e das policies aprovadas;
- testes negativos e multiempresa tornam-se obrigatórios para cada rota protegida.

## Pontos ainda não decididos

- formato persistente do membership/assignment;
- contrato de seleção da empresa ativa;
- política de revogação/cache de capacidades;
- convenção `403`/`404` fora do escopo;
- matriz final de capacidades, alçadas, substituições e emergência.

Detalhes e plano incremental estão em [Especificação técnica de identidade, autorização e auditoria](../IDENTITY_AUTHORIZATION_SPECIFICATION.md).
