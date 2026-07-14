# Backlog Inicial Priorizado

## Critério de priorização

Prioridade considera risco legal, dependência técnica, valor operacional e necessidade para substituir a planilha com segurança.

## Incremento funcional 1 — Colaboradores e contratos

**Objetivo:** criar a fonte canônica de pessoas e vínculos empregatícios, sem cálculo de folha.

| ID      | História                                                               | Prioridade | Critério de aceite resumido                                                                |
| ------- | ---------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| FND-001 | Estruturar monorepo, ambientes Docker e pipeline de qualidade          | Must       | Aplicações iniciam em Docker e verificações automatizadas passam                           |
| FND-002 | Implementar identidade, RBAC por empresa e trilha de auditoria         | Must       | Acesso é negado fora da empresa/permissão e alterações críticas são auditadas              |
| ORG-001 | Cadastrar empresas, estabelecimentos, departamentos, cargos e jornadas | Must       | Catálogos possuem unicidade e inativação sem apagar histórico                              |
| EMP-001 | Cadastrar colaborador com identificação e documentos básicos           | Must       | Campos obrigatórios são validados, dados sensíveis protegidos e registro auditado          |
| EMP-002 | Criar e consultar vínculo/contrato com histórico                       | Must       | Admissão, empresa, setor, cargo e jornada são obrigatórios e alterações preservam vigência |
| EMP-003 | Importar piloto de colaboradores da planilha                           | Must       | Importação valida dados, informa erros por linha e não duplica registros                   |
| EMP-004 | Registrar observações com controle de visibilidade                     | Should     | Nota tem autor, data, classificação e auditoria                                            |
| DOC-001 | Anexar documentos ao colaborador                                       | Should     | Arquivo tem tipo, acesso, origem e retenção definidos                                      |

## Incrementos seguintes

| Ordem | Incremento                                 | Dependência principal                   |
| ----: | ------------------------------------------ | --------------------------------------- |
|     2 | Admissão, documentos e checklists          | EMP-001 e EMP-002                       |
|     3 | Férias, prazos, benefícios e jornada       | Estrutura e contratos                   |
|     4 | Lançamentos, rubricas, folha e conferência | Jornada, benefícios e parâmetros legais |
|     5 | Comissões, rescisão, eSocial e relatórios  | Folha homologada                        |

## Fora do incremento 1

- Cálculo ou fechamento de folha.
- Integração eSocial.
- Portal do colaborador.
- Migração em massa definitiva.
- Assinatura eletrônica de documentos.

## Casos de teste mínimos futuros

Quando o incremento 1 for implementado, deverão existir testes para autorização multiempresa, campos obrigatórios, unicidade de identificadores, vigência de contrato, inativação de catálogos, auditoria e importação idempotente.

## Dependências para iniciar a fundação técnica

A validação de negócio deve confirmar: empresa de cada vínculo, fonte oficial de CPF/dados pessoais, relação entre códigos ADM, significado de registros contábeis, tipos de contrato e catálogo oficial de setores/cargos.
