# Estratégia futura de testes — autorização das APIs legadas

**Status:** especificação; nenhum teste implementado nesta entrega

## 1. Matriz obrigatória por rota

Cada rota empresarial precisa cobrir:

| Caso                             | Resultado esperado                                        |
| -------------------------------- | --------------------------------------------------------- |
| sem token                        | `401`, nenhum acesso ao serviço/persistência              |
| token inválido/expirado          | `401`, sem revelar empresa/recurso                        |
| sem empresa ativa                | negação fechada conforme contrato transversal             |
| sem capability                   | `403`, nenhum efeito colateral                            |
| recurso de outra empresa         | `404`, lookup filtrado e sem payload                      |
| `companyId` malicioso no cliente | ignorado como autoridade ou rejeitado; contexto prevalece |
| metadata/capability ausente      | deny-by-default                                           |
| grant expirado/revogado          | `403`                                                     |
| substituição válida              | somente capabilities e empresa concedidas                 |
| emergência válida                | escopo/duração/motivo e auditoria reforçada               |
| escrita válida                   | estado + evento + `AuditLog` atômicos                     |
| falha de auditoria               | rollback integral                                         |
| leitura sensível                 | projeção/mascaramento e auditoria aprovados               |

## 2. Testes por camada

### Domínio e aplicação

- capability correta por caso de uso;
- empresa ativa obrigatória e imutável;
- filtro empresarial antes do lookup;
- segregação e grants;
- competência `CLOSED` bloqueando todos os writers homologados;
- nenhum nome fixo de papel;
- falha fechada para configuração ausente.

### Controller/API

- 401/403/404 e envelopes estáveis;
- decorator e guard declarados;
- OpenAPI security/capability/erros/depreciação;
- path/query/body não promovem empresa a autoridade;
- aliases mantêm envelope durante janela aprovada.

### PostgreSQL

- transação conjunta com `AuditLog`;
- rollback real;
- constraints e append-only;
- concorrência/idempotência em fechamento;
- isolamento com duas empresas;
- grants vigentes, expirados e revogados;
- nenhum registro parcial após conflito.

### Frontend

- rota protegida, sessão expirada e troca de empresa;
- botões por capability apenas como controle visual;
- 401 encerra/recupera sessão conforme contrato;
- 403 e 404 não vazam recurso;
- cache segmentado/limpo por empresa;
- adapter legado/canônico durante transição;
- acessibilidade e estados de erro.

### Segurança e observabilidade

- logs sem token, senha, documento, dados bancários ou body integral;
- trace propagado sem PII;
- telemetria agrega rota/resultado sem conteúdo;
- leitura sensível não aparece em cache de outra empresa;
- teste de enumeração por IDs;
- rate limit preservado para login e superfícies públicas.

## 3. Regressão mínima por fase

| Fase                      | Suítes adicionais                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------- |
| fechamento legado         | API + PostgreSQL: close/reopen/replay/concorrência/404; frontend dos dois clientes |
| folha                     | CLOSED, execução, lançamentos, rubricas, parâmetros, mensagens e totais            |
| organização               | CRUD, status, unicidades e duas empresas                                           |
| colaboradores/admissão    | PII, contatos, contratos, históricos, checklists e documentos lógicos              |
| jornada/benefícios/férias | contrato empresarial, movimentos/históricos e decisões                             |
| remuneração variável      | isolamento e auditoria sem implementar BDP-006                                     |
| depreciação               | ausência de consumidor, OpenAPI, telemetria e rollback                             |

## 4. Gates de CI

- `pnpm check`, cobertura e build;
- Prisma generate/validate quando houver impacto;
- PostgreSQL 16 provisionado para suítes transacionais;
- seed confirma zero assignment automático não homologado;
- OpenAPI comparado para breaking changes;
- Prettier e `git diff --check`;
- nenhum merge com teste negativo pendente.

## 5. Critério de aceite

Uma família só sai de “legada” quando todas as rotas possuem testes 401/403/404, isolamento,
capability, regressão de consumidor e auditoria aplicável, com merge confirmado em `develop`.
