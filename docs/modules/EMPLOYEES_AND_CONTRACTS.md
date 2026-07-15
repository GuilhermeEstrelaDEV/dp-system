# Colaboradores e contratos de trabalho

## Escopo da ETP-005

A etapa introduz os cadastros demonstrativos de `employees`, `employee_contacts`, `employment_contracts` e `contract_history`. Um colaborador pode ter contratos ao longo do tempo; cada contrato pertence a uma empresa e referencia cargo obrigatório, além de filial, departamento e centro de custo quando aplicáveis.

`registrationNumber` é informado manualmente e é único por empresa. A aplicação impede, na camada de serviço, mais de um contrato ativo para o mesmo colaborador na mesma empresa. Alterações e inativações acrescentam um item em `contract_history`; não há exclusão física de entidades de domínio.

## API e rotas

- `GET`, `POST`, `PATCH` e ativação/inativação em `/employees`;
- contatos somente em `/employees/:employeeId/contacts`, também por inativação;
- `GET`, `POST`, `PATCH`, histórico e ativação/inativação em `/employment-contracts`;
- telas em `/colaboradores`, `/colaboradores/:employeeId`, `/contratos`, `/contratos/:contractId` e `/employees/:employeeId/contracts`.

## LGPD: dados tratados e adiados

Esta etapa trata somente nome legal, nome preferencial opcional, e-mail ou telefone fornecido manualmente e dados operacionais do contrato. Todos os exemplos e testes devem usar dados evidentemente fictícios. Logs e documentação não devem registrar valores de contatos.

Foram deliberadamente adiados: CPF, data de nascimento, endereço, documentos identificáveis, dependentes, dados bancários, saúde, salário, histórico salarial, anexos e categoria eSocial. Esses dados dependem das decisões BDP-001 e BDP-004, de fonte oficial, retenção, controles de acesso e estratégia de proteção antes de qualquer persistência.

## Limites

Não há autenticação funcional, autorização, regras de Departamento Pessoal, cálculo, integração externa, importação de planilha ou uso de dados reais. `User`, `Role`, `Permission` e `AuditLog` não foram alterados.
