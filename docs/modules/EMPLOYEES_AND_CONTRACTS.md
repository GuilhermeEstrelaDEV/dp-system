# Colaboradores e contratos de trabalho

## Escopo da ETP-005

A etapa introduz os cadastros demonstrativos de `employees`, `employee_contacts`, `employment_contracts` e `contract_history`. Um colaborador pode ter contratos ao longo do tempo; cada contrato pertence a uma empresa e referencia cargo obrigatório, além de filial, departamento e centro de custo quando aplicáveis.

`registrationNumber` é informado manualmente e é único por empresa. A aplicação impede, na camada de serviço, mais de um contrato ativo para o mesmo colaborador na mesma empresa. Alterações e inativações acrescentam um item em `contract_history`; não há exclusão física de entidades de domínio.

## API e rotas

- `GET`, `POST`, `PATCH` e ativação/inativação em `/employees`;
- contatos somente em `/employees/:employeeId/contacts`, também por inativação;
- `GET`, `POST`, `PATCH`, histórico e ativação/inativação em `/employment-contracts`;
- telas em `/colaboradores`, `/colaboradores/:employeeId`, `/contratos`, `/contratos/:contractId` e `/employees/:employeeId/contracts`.

## Expansão posterior do perfil e LGPD

Uma entrega posterior adicionou CPF normalizado, data de nascimento, estado civil, nacionalidade e naturalidade opcionais no banco/API, além de endereço estruturado e contato de emergência. E-mail e telefones continuam em `employee_contacts`; empresa, organização, matrícula e condições do vínculo continuam em `employment_contracts` e `Admission`. A criação pela interface exige nome, CPF e nascimento, sem endurecer registros ou integrações legadas.

A listagem não expõe os novos dados. O detalhe exige `employee.read`, a escrita exige `employee.manage` e ambos preservam o isolamento pela empresa ativa. Os eventos de auditoria registram ação e identificador, sem CPF, nascimento, contato, endereço ou payload pessoal. Todos os exemplos e testes usam dados fictícios.

Permanecem deliberadamente adiados: documentos, dependentes, dados bancários, saúde, salário, histórico salarial, anexos e categoria eSocial. Categorias sensíveis não são coletadas. A matriz completa está em [Expansão do perfil de colaborador](../product/EMPLOYEE_PROFILE_EXPANSION.md).

## Limites

Não foram criadas regras trabalhistas, cálculos, integrações externas, importação de planilha, dados reais, capabilities ou grants. Autenticação, autorização deny-by-default, auditoria e isolamento empresarial já existentes foram preservados.
