# ETP-015.4 — Evidências de aceite

## Escopo comprovado

- metadata e decorators canônicos imutáveis;
- guard global com deny-by-default para handler novo;
- allowlist pública nominal de quatro handlers;
- JWT, empresa ativa e capability compostos sem duplicar resolução;
- catálogo validado por requisição, sem cache;
- 129 handlers legados nominalmente adiados;
- OpenAPI com bearer, `401`, `403` e extensões não sensíveis;
- verificador de 26 controllers e 165 handlers integrado aos testes.

## Resultados direcionados

| Evidência                              | Resultado                                    |
| -------------------------------------- | -------------------------------------------- |
| typecheck da API                       | `PASS`                                       |
| testes de metadata e guards            | `PASS`                                       |
| E2E público/401/403/grant/sem metadata | `PASS`                                       |
| reconciliação de rotas                 | `PASS — 165/165`                             |
| migrations em PostgreSQL 16 limpo      | `PASS — 16/16`                               |
| seed canônico em banco limpo           | `PASS — 19 capabilities, 0 assignments`      |
| constraints e vigência no PostgreSQL   | `PASS — 4/4 testes com limpeza das fixtures` |

## Regressão e cobertura

- API: 63 suítes executadas, 298 testes aprovados; 4 suítes/18 testes PostgreSQL condicionais
  permanecem fora da execução comum e o recorte necessário foi executado explicitamente;
- frontend: 21 arquivos e 76 testes aprovados;
- cobertura API: 71,47% de linhas, 70,36% de branches, 49,53% de funções e 71,47% de statements;
- cobertura frontend: 77,50% de linhas, 74,15% de branches, 61,89% de funções e 77,50% de
  statements;
- o banco temporário `dp_system_etp0154_test` foi removido depois do ensaio e o banco demonstrativo
  não foi alterado pelo teste de integração.

## Verificação operacional

- `pnpm check`, `pnpm test`, `pnpm build`, `pnpm prisma:generate` e `pnpm prisma:validate`: `PASS`;
- scripts operacionais: 28/28 testes aprovados; o projeto não configura percentual de cobertura
  para os scripts Node;
- `pnpm demo:status` e `pnpm demo:data:verify`: `PASS` com os quatro containers saudáveis;
- `pnpm demo:verify`: `DEMO STATUS: GO`;
- `pnpm demo:rehearse`: `DEMO STATUS: GO`;
- `pnpm presentation:verify`: `PASS` para 15 slides, 15 notas, seis imagens, links locais e
  ausência de segredo/dado pessoal/URL externa;
- segunda execução de `pnpm demo:start`: `PASS`, com build integralmente reutilizado do cache;
- logs da API reconstruída: zero resposta `5xx` inesperada e zero ocorrência de token, senha ou
  connection string;
- o parser do roteiro executivo passou a normalizar finais de linha CRLF/LF, corrigindo a única
  falha de portabilidade encontrada por `pnpm check` no Windows.

## Restrições verificáveis

- migrations novas ou alteradas: 0;
- alterações Prisma: 0;
- alterações de seed funcional: 0;
- grants/assignments automáticos: 0;
- endpoints de negócio novos: 0;
- famílias legadas migradas: 0;
- frontend alterado: 0;
- início da ETP-015.5 ou posterior: 0.
