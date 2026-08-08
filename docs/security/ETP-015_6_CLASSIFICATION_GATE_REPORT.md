# ETP-015.6 — Relatório do gate de classificação de campos

**Status:** `BLOCKED — FIELD CLASSIFICATION DECISIONS REQUIRED`

**Baseline auditada:** `origin/develop@f8fded9c3440d9257c0cdddfdf72084704b72e41`

## Resultado executivo

O recorte funcional da ETP-015.6 não pode ser iniciado com segurança. A documentação vigente aprova
o princípio técnico de projeção por allowlist, masking e acesso integral por capability, mas não
homologa a classificação material, a finalidade, a máscara ou a projeção mínima de nenhum campo das
respostas canônicas candidatas.

O bloqueio é obrigatório pelas próprias regras da etapa:

- DAL-06 exige classificação e projeção por família; não define campos nem máscaras;
- DAL-07 exige auditoria para leituras sensíveis; não classifica quais leituras o são;
- DAL-08 limita metadata, mas não autoriza persistir evento de leitura nem seu conteúdo;
- BDP-001 continua pendente e trata fontes oficiais de dados pessoais, sem classificá-los para
  projeção;
- BDP-011 continua pendente para política LGPD, acesso, retenção, descarte e exportação;
- o catálogo atual possui 19 capabilities, mas nenhuma capability homologada para acesso integral a
  dados sensíveis;
- o catálogo de auditoria possui 26 eventos e nenhum código homologado de leitura sensível;
- a ETP-015.7 registrou explicitamente zero leituras sensíveis ativadas e condicionou a cobertura a
  BDP-001/011.

Nenhuma classificação foi inferida pelo nome do campo, pelo tipo, pelo papel, pelo ambiente demo ou
pelo consumidor atual.

## Fontes vinculantes verificadas

- [Resolução BDP-AUTH-LEGACY v1](../project-management/BDP-AUTH-LEGACY_RESOLUTION_V1.md), DAL-06,
  DAL-07, DAL-08 e DAL-13;
- [Pendências de negócio](../project-management/BUSINESS_DECISIONS_PENDING.md), BDP-001 e BDP-011;
- [Backlog da ETP-015](../project-management/ETP-015_IMPLEMENTATION_BACKLOG.md);
- [Release gates da ETP-015](../project-management/ETP-015_RELEASE_GATES.md);
- [Desenho técnico de autorização](../architecture/AUTHORIZATION_FOUNDATION_TECHNICAL_DESIGN.md);
- [ETP-015.7 — eventos de auditoria](ETP-015_7_AUTHORIZATION_AUDIT_EVENTS.md);
- [Catálogo de 26 eventos](ETP-015_7_AUDIT_EVENT_CATALOG.md);
- [Inventário de auditoria](ETP-015_7_AUDIT_COVERAGE_INVENTORY.md);
- [Allowlist de metadata](ETP-015_7_METADATA_ALLOWLIST.md).

## Inventário estrutural das superfícies candidatas

Foram inspecionados 33 endpoints canônicos em cinco famílias. A coluna “campos observados” registra
os paths estruturais retornados pelo runtime atual; ela não atribui sensibilidade.

| Família                           | Endpoints | Campos observados nas respostas                                                                                                                                                                                                                     | Decisão do gate                                                                                                                                                  |
| --------------------------------- | --------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| autenticação e contexto           |         5 | `accessToken`, `tokenType`, `actorId`, `activeCompanyId`, `sessionId`, `permissions`, `traceId`, `ipAddress`, `userAgent`, `accessGrants.*`, `email`, `displayName`, `roleCodes`, `company.id`, `company.legalName`, `company.tradeName`, `revoked` | tokens de sessão ficam `OUT_OF_SCOPE`; todos os campos de identidade, empresa e concessão ficam `BLOCKED_PENDING_DECISION`                                       |
| grants temporários e emergenciais |         6 | todos os escalares de `TemporarySubstitution` e `EmergencyAccess`, incluindo IDs de atores, capabilities, vigência, motivos, revogação e timestamps                                                                                                 | `BLOCKED_PENDING_DECISION`; os repositories carregam e devolvem registros integrais                                                                              |
| dashboard executivo               |         1 | contexto empresarial, estado de acesso, métricas, distribuições, timeline e atividade recente                                                                                                                                                       | `BLOCKED_PENDING_DECISION`; agregação não equivale a classificação homologada                                                                                    |
| payroll review                    |        14 | escalares de ciclo, achado, evento, estágio, decisão e invalidação; descrições, motivos, metadata, IDs e nomes de atores; relações aninhadas                                                                                                        | `BLOCKED_PENDING_DECISION`; os reads atuais incluem modelos Prisma amplos                                                                                        |
| payroll periods canônico          |         7 | readiness, histórico, timeline, manifesto seguro, close e reopen; IDs, estados, datas, atores, motivos, warnings, totals, referências e hashes                                                                                                      | `ALREADY MINIMAL` somente como característica contratual já documentada do manifesto; classificação material para ETP-015.6 permanece `BLOCKED_PENDING_DECISION` |

Os handlers legados não integram o inventário material desta etapa. Os 129 handlers permanecem
`LEGACY_DEFERRED`.

## Matriz de fluxos

| Fluxo                    | Endpoints                                                     | Situação da projeção atual                                  | Classificação ETP-015.6                                        |
| ------------------------ | ------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| login/context/logout     | `POST /auth/login`, `POST /auth/context`, `POST /auth/logout` | contratos de sessão existentes                              | `OUT_OF_SCOPE` para masking; nenhuma mudança                   |
| identidade               | `GET /auth/me`                                                | select parcial de usuário, combinado com principal completo | `BLOCKED BY FIELD DECISION`                                    |
| empresas disponíveis     | `GET /auth/companies`                                         | select de `id`, `legalName`, `tradeName`                    | `BLOCKED BY FIELD DECISION`                                    |
| grants                   | seis rotas `/access-grants/*`                                 | retorno integral dos registros Prisma                       | `BLOCKED BY FIELD DECISION`                                    |
| dashboard                | `GET /dashboard/summary`                                      | queries agregadas e select mínimo de empresa/eventos        | `BLOCKED BY FIELD DECISION`                                    |
| payroll review           | 14 rotas canônicas                                            | combinação de selects e includes amplos                     | `BLOCKED BY FIELD DECISION`                                    |
| readiness                | `GET /payroll-periods/:id/closure-readiness`                  | DTO explícito, mas com warnings, metadata e referências     | `BLOCKED BY FIELD DECISION`                                    |
| histórico de competência | quatro rotas de `/history`                                    | projeções públicas seguras aprovadas na ETP-014             | `ALREADY MINIMAL`; sem nova política material                  |
| close/reopen             | duas rotas canônicas                                          | DTOs explícitos                                             | `BLOCKED BY FIELD DECISION` para atores, motivos e referências |

## Matriz do gate de campos

Sem uma matriz humana homologada, as categorias operacionais ficam restritas ao seguinte resultado.
`BLOCKED_PENDING_DECISION` não é uma categoria material de sensibilidade; é somente o estado do gate.

| Grupo de campos                    | Origem                  | Classificação aprovada                                                    | Projeção mínima                            | Masking                                   | FULL                    | Auditoria de leitura               | Estado                               |
| ---------------------------------- | ----------------------- | ------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------- | ----------------------- | ---------------------------------- | ------------------------------------ |
| identidade e contato do usuário    | `User`, principal       | ausente                                                                   | não homologada                             | não homologado                            | sem capability          | sem evento                         | `BLOCKED_PENDING_DECISION`           |
| identificação empresarial          | `Company`               | ausente                                                                   | não homologada                             | não homologado                            | sem capability          | sem evento                         | `BLOCKED_PENDING_DECISION`           |
| grants, assignments e atores       | auth/RBAC               | ausente                                                                   | não homologada                             | não homologado                            | sem capability          | sem evento                         | `BLOCKED_PENDING_DECISION`           |
| achados, descrições e motivos      | payroll review          | ausente                                                                   | não homologada                             | não homologado                            | sem capability          | sem evento                         | `BLOCKED_PENDING_DECISION`           |
| decisões, histórico e atores       | payroll review/period   | ausente                                                                   | não homologada                             | não homologado                            | sem capability          | sem evento                         | `BLOCKED_PENDING_DECISION`           |
| valores consolidados e referências | manifesto de fechamento | contrato seguro aprovado na ETP-014, sem classificação material ETP-015.6 | existente                                  | não aplicável sem decisão                 | sem capability sensível | sem evento de leitura              | `ALREADY MINIMAL`, sem ativação nova |
| tokens e credenciais               | autenticação            | contrato técnico de sessão                                                | somente resposta da operação autenticadora | proibido registrar/cachear fora da sessão | não aplicável           | eventos de autenticação existentes | `OUT_OF_SCOPE`                       |

Contagens materiais neste gate:

- `NOT_SENSITIVE`: 0 campos homologados;
- `INCLUDE_MINIMAL`: 0 campos novos homologados;
- `INCLUDE_MASKED`: 0 campos homologados;
- `INCLUDE_FULL_WITH_CAPABILITY`: 0 campos homologados;
- `OMIT_ALWAYS`: 0 campos homologados;
- `BLOCKED_PENDING_DECISION`: todos os grupos materiais candidatos;
- leituras sensíveis ativadas: 0.

## Capabilities e auditoria

As 19 capabilities atuais foram inventariadas. Elas autorizam plataforma, grants, payroll review e
fechamento, mas nenhuma foi homologada como capability adicional de acesso integral a campos
sensíveis. Em particular, `platform.manage`, capabilities de `view` e nomes de papéis não podem ser
reutilizados como fallback.

O catálogo de auditoria permanece com 26 eventos. Não existe código homologado para leitura sensível.
Criar um código sem a classificação do recurso, finalidade e allowlist de metadata contrariaria o
catálogo fechado e DAL-07/08. `AuditWriterService` continua sendo o único writer; nenhum writer,
sanitizador, trail ou evento paralelo foi criado.

## Caches, logs, OpenAPI e frontend

- O frontend mantém o token e o contexto da sessão em `sessionStorage`; esse comportamento não foi
  alterado.
- React Query mantém respostas em memória e é limpo nos fluxos de sessão/empresa existentes; não foi
  criada chave de cache por perfil porque nenhum perfil foi homologado.
- Não há cache de resposta sensível no backend canônico inspecionado.
- O logger estruturado e o sanitizador de metadata existentes foram preservados; nenhum payload de
  resposta foi adicionado a logs ou `AuditLog`.
- OpenAPI, DTOs, serializers e frontend não foram alterados, pois publicar perfis inexistentes seria
  enganoso.

## Anti-patterns encontrados e adiados

Os seguintes pontos requerem correção quando a matriz for homologada:

1. `AccessGrantsRepository` usa `findMany` sem `select` e devolve todos os escalares persistidos.
2. Payroll review usa `include` amplo em ciclos, achados, eventos, decisões e invalidações.
3. `GET /auth/me` combina campos do principal técnico com dados do usuário no contrato público.
4. O histórico de payroll review retorna `reason`, metadata, trace e identificadores de atores sem uma
   matriz material da ETP-015.6.
5. A capability de visualização do recurso não é, por si só, capability homologada de acesso integral.

Nenhum ponto foi “corrigido” por pós-filtro, masking arbitrário ou ocultação apenas no frontend.

## Decisões necessárias para desbloqueio

Uma homologação humana deve, por família e campo:

1. atribuir a classificação material aprovada e sua fonte;
2. definir finalidade e conjunto `MINIMAL`;
3. definir exatamente a máscara, inclusive comprimentos curtos e valores inválidos;
4. definir omissão versus `null` legítimo;
5. aprovar os campos liberados no perfil `FULL`;
6. aprovar uma capability existente adequada ou autorizar uma nova capability por processo próprio;
7. classificar a leitura como sensível ou não sensível;
8. homologar código de evento, recurso, finalidade e metadata quando a auditoria for obrigatória;
9. definir política de cache, busca, ordenação, paginação e exportação;
10. aprovar compatibilidade/versionamento dos contratos que hoje retornam objetos amplos.

BDP-001 e BDP-011 devem ser resolvidas ou complementadas por uma decisão específica que cubra esses
itens. A decisão precisa abranger ao menos identidade, empresas, grants, payroll review e payroll
periods antes de declarar a ETP-015.6 funcionalmente disponível.

## Impacto e rollback

Não houve alteração de runtime; portanto, não há rollout funcional. O rollback documental consiste em
reverter este relatório, sem tocar nos 26 eventos históricos, nas 19 capabilities, nas 16 migrations,
nos contratos públicos ou no dataset demo.

## Confirmações de escopo

- zero código funcional;
- zero migration e zero alteração Prisma;
- zero seed, grant, assignment ou capability;
- zero endpoint, DTO, serializer ou frontend alterado;
- zero leitura sensível ativada;
- zero família legada migrada;
- zero início da ETP-015.8 ou de etapa posterior;
- ETP-015.6 permanece não iniciada e bloqueada no gate de classificação.
