# MVP-001 — Dataset demonstrativo

## Baseline

O dataset usa a data-base fixa `2026-07-01`, IDs UUID determinísticos e somente conteúdo fictício.
Ele é criado por `pnpm demo:setup` e reconstruído por `pnpm demo:reset -- --confirm-reset`.

| Conteúdo                 | Horizonte | Atlas | Total |
| ------------------------ | --------: | ----: | ----: |
| empresas                 |         1 |     1 |     2 |
| filiais                  |         1 |     1 |     2 |
| departamentos            |         5 |     3 |     8 |
| cargos                   |         8 |     5 |    13 |
| centros de custo         |         3 |     2 |     5 |
| colaboradores e contatos |        18 |     8 |    26 |
| contratos                |        18 |     8 |    26 |
| admissões concluídas     |         4 |     2 |     6 |
| competências e execuções |         6 |     4 |    10 |
| conferências             |         5 |     3 |     8 |
| achados                  |         6 |     2 |     8 |
| eventos append-only      |        15 |    10 |    25 |

Empresas:

- `10000000-0000-4000-8000-000000000001`: Horizonte Serviços Empresariais Demonstrativos Ltda.;
- `10000000-0000-4000-8000-000000000002`: Atlas Soluções Administrativas Demonstrativas Ltda.

Usuários preservados:

- `20000000-0000-4000-8000-000000000001`: Administrador Demo, vinculado às duas empresas;
- `20000000-0000-4000-8000-000000000002`: Analista RH Demo, vinculado somente à Horizonte.

Há três vínculos empresariais e zero `RolePermission`. Senhas existem somente como hash `scrypt`.
E-mails usam `@dp-system.local`; nomes seguem `Colaborador Demo Hnn/Ann`; os identificadores fiscais
`00.000.000/0001-00` e `11.111.111/0001-11` são sintéticos e inválidos para operação real.

## Dashboard

| Empresa   | Ciclos | Achados abertos | Competências | Meses com eventos |
| --------- | -----: | --------------: | -----------: | ----------------: |
| Horizonte |      5 |               4 |            6 |                 5 |
| Atlas     |      3 |               1 |            4 |                 3 |

Esses números não são persistidos como agregados: são derivados das entidades canônicas. Como as
contas demo possuem zero grants, a interface apresenta `RESTRICTED`. Os valores ficam disponíveis
somente a um principal que venha a receber as capabilities por processo futuro aprovado; o seed não
contorna essa regra.

## Estratégia de idempotência

Registros-base usam IDs e chaves naturais estáveis. Entidades mutáveis usam `upsert`; eventos
append-only usam IDs fixos e `createMany(..., skipDuplicates: true)`. O seed não executa `delete`,
`TRUNCATE` ou limpeza de tabelas. O reset completo remove exclusivamente o volume nomeado do Compose
demo e recria os mesmos IDs e relações.

## Limitações

Jornada, benefícios, férias, afastamentos, rubricas, lançamentos, cálculos, decisões de aprovação e
AuditLog sintético não recebem massa. Essas áreas exigiriam regras adicionais ou não contribuem para
o dashboard e o fluxo já existente. MVP-001.6 e ETP-015.4 permanecem não iniciadas.
