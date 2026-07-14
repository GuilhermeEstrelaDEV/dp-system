# Arquitetura Proposta

**Status:** proposta aprovada para fundação técnica; a adoção será registrada por etapas.

## Estilo arquitetural

Monólito modular em TypeScript, com fronteiras explícitas de domínio. Essa escolha atende ao porte inicial, reduz complexidade operacional e permite extrações futuras de módulos que comprovadamente demandem escala independente.

```text
Aplicação Web (Next.js)
        ↓ REST/OpenAPI
API modular (NestJS)
 ├─ Identidade e organização
 ├─ Pessoas e contratos
 ├─ Rotinas de DP
 ├─ Folha e cálculos
 ├─ Documentos e workflows
 ├─ Relatórios
 └─ Integrações
        ↓
PostgreSQL | Redis/filas | armazenamento de arquivos S3
```

## Tecnologias-base

| Camada                   | Decisão                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| Frontend                 | React, Vite e TypeScript em `apps/web`                                                             |
| Backend                  | NestJS, TypeScript e OpenAPI                                                                       |
| Dados                    | PostgreSQL, Prisma e migrações versionadas em `apps/api/prisma`                                    |
| Monorepo                 | pnpm workspaces e Turborepo                                                                        |
| Reuso                    | `packages/ui`, `packages/types`, `packages/config`, `packages/eslint-config` e `packages/tsconfig` |
| Processamento assíncrono | Redis e BullMQ                                                                                     |
| Arquivos                 | Armazenamento compatível com S3                                                                    |
| Testes                   | Jest, testes de integração e Playwright                                                            |
| Operação                 | Docker, CI/CD, logs estruturados, métricas e backups                                               |

## Fronteiras de domínio

Cada módulo deve expor contratos próprios e não acessar tabelas internas de outro módulo diretamente. Integrações entre módulos ocorrerão por casos de uso, eventos de domínio ou interfaces de consulta explicitamente definidas.

Módulos iniciais: `identity`, `organization`, `people`, `employment`, `benefits`, `time`, `leave`, `payroll`, `documents`, `workflow`, `reporting` e `integrations`. Eles existirão apenas quando suas etapas de domínio forem aprovadas; a ETP-002 entrega exclusivamente a fundação técnica.

## Requisitos não funcionais

- Multiempresa com isolamento lógico e políticas de acesso por empresa.
- Trilhas de auditoria imutáveis para operações críticas.
- Criptografia de dados sensíveis e gestão externa de segredos.
- Processamentos de cálculo e integrações em fila, com idempotência.
- Backups testados e recuperação documentada.
- Ambientes separados para desenvolvimento, homologação e produção.

## Decisões de modelagem

- `Organization` representa o agrupamento administrativo; `Company`, a entidade empregadora.
- `Employee` representa a pessoa; `EmploymentContract` representa o vínculo, permitindo histórico e recontratação.
- Parâmetros legais, rubricas e regras têm período de vigência.
- Cálculos guardam entradas, regras aplicadas e resultados, permitindo reprodução e auditoria.
- Certificados digitais e credenciais ficam fora do banco relacional; somente referências seguras são persistidas.
