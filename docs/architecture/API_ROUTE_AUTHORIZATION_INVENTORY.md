# Inventário de autorização das rotas

## Classificação atual

| Controller/família    | Rotas                                                                | Classificação             | Estado                                 |
| --------------------- | -------------------------------------------------------------------- | ------------------------- | -------------------------------------- |
| Health                | `/health`, `/health/live`, `/health/ready`                           | Pública                   | Mantida pública para operação          |
| Auth login            | `POST /auth/login`                                                   | Pública                   | Rate limit; credenciais validadas      |
| Auth bootstrap        | `GET /auth/me`, `GET /auth/companies`, `POST /auth/context`          | Autenticada               | JWT; seleção valida assignment         |
| Access grants         | seis rotas sob `/access-grants`                                      | Autenticada e empresarial | JWT, capability e validação no serviço |
| Swagger               | `/api/docs`, `/api/docs-json`                                        | Pública/configurável      | Somente quando habilitado              |
| Companies             | todas sob `/companies`                                               | Ainda legada              | Sem migração neste incremento          |
| Organização           | todas sob `/branches`, `/departments`, `/positions`, `/cost-centers` | Ainda legada              | Recebem companyId do cliente           |
| Employees/contracts   | todas sob `/employees`, `/employment-contracts`                      | Ainda legada              | Exige desenho de visibilidade sensível |
| Admission             | `/admission-processes`, checklists e documentos                      | Ainda legada              | Exige capabilities homologadas         |
| Time management       | jornadas, feriados, marcações e saldos                               | Ainda legada              | Exige inventário por operação          |
| Benefits              | todas sob `/benefits`                                                | Ainda legada              | Exige visibilidade por capability      |
| Vacations/leaves      | férias, afastamentos e tipos                                         | Ainda legada              | Exige migração por caso de uso         |
| Payroll configuration | competências, rubricas e parâmetros                                  | Ainda legada              | Não migrada para evitar quebra         |
| Payroll operation     | lançamentos, execuções e fechamentos                                 | Ainda legada              | Prioridade para fase do workflow       |
| Variable compensation | todas sob `/variable-compensation`                                   | Ainda legada              | BDP-006 continua pendente              |

Não há rota administrativa da plataforma protegida nesta fase; capabilities globais continuam disponíveis apenas como fundação.

## Estratégia progressiva

1. definir capability e sensibilidade de cada caso de uso;
2. adaptar o serviço para receber principal e derivar empresa ativa;
3. filtrar lookup por empresa antes de buscar por ID;
4. aplicar `JwtAuthGuard`, `CapabilitiesGuard` e metadata explícita;
5. repetir autorização no serviço e auditar escritas na mesma transação;
6. adicionar testes `401`, `403`, `404`, multiempresa e regressão;
7. somente após todo o inventário sair de “ainda legada”, avaliar guard global.
