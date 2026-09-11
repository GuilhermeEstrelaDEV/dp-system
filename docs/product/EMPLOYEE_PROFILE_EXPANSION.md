# Expansão do perfil de colaborador

## Objetivo e limites

Esta entrega amplia o cadastro básico de `Employee` com dados pessoais, contato, endereço e contato
de emergência estritamente necessários ao fluxo administrativo demonstrativo. Ela não cria regra
trabalhista, fiscal ou previdenciária e não usa os novos dados para cálculo, benefício ou decisão
automatizada.

O agregado `Employee` continua representando a pessoa. Empresa, matrícula, filial, departamento,
cargo, centro de custo, regime, jornada e datas contratuais permanecem em `EmploymentContract` e
`Admission`; nenhum desses valores foi duplicado. E-mail e telefones reutilizam `EmployeeContact`.

## Inventário anterior

Antes desta expansão, `Employee` possuía seis campos escalares persistidos: `id`, `legalName`,
`preferredName`, `status`, `createdAt` e `updatedAt`. Os DTOs de criação e edição aceitavam apenas
os nomes; contatos eram mantidos por endpoints próprios. Não havia modelo de endereço nem contato
de emergência.

O acesso existente foi preservado:

- leitura: `employee.read`;
- escrita: `employee.manage`;
- auditoria: `EMPLOYEE_CREATED`, `EMPLOYEE_UPDATED` e `EMPLOYEE_STATUS_CHANGED`;
- isolamento: vínculo empresarial derivado de `EmploymentContract`, com `404` para outra empresa;
- listagem: projeção mínima com nome, status e timestamps, sem dados pessoais adicionais.

## Matriz de dados

Na coluna “Obrigatório”, “novo cadastro” representa somente a validação da interface. Banco e API
mantêm os novos campos opcionais para preservar registros, fixtures e clientes legados.

| Campo            | Entidade correta           | Já existia?         | Implementado | Obrigatório   | Validação                                                  | Sensibilidade            | Exposição mínima                        | Auditoria                 |
| ---------------- | -------------------------- | ------------------- | ------------ | ------------- | ---------------------------------------------------------- | ------------------------ | --------------------------------------- | ------------------------- |
| `legalName`      | `Employee`                 | Sim                 | Reutilizado  | Sim           | texto não vazio, até 160 caracteres                        | pessoal                  | lista e detalhe                         | somente id, ação e status |
| `preferredName`  | `Employee`                 | Sim                 | Reutilizado  | Não           | até 160 caracteres                                         | pessoal                  | lista e detalhe                         | sem valor no payload      |
| `cpf`            | `Employee`                 | Não                 | Sim          | Novo cadastro | 11 dígitos e verificadores válidos; persistido sem máscara | pessoal de identificação | omitido da lista e mascarado no detalhe | nunca registrado          |
| `birthDate`      | `Employee`                 | Não                 | Sim          | Novo cadastro | data real, não futura e a partir de 1900-01-01             | pessoal                  | somente detalhe autorizado              | nunca registrado          |
| `maritalStatus`  | `Employee`                 | Não                 | Sim          | Não           | enum estável, sem inferência de gênero                     | pessoal                  | somente detalhe autorizado              | nunca registrado          |
| `nationality`    | `Employee`                 | Não                 | Sim          | Não           | até 80 caracteres                                          | pessoal                  | somente detalhe autorizado              | nunca registrado          |
| `placeOfBirth`   | `Employee`                 | Não                 | Sim          | Não           | até 120 caracteres                                         | pessoal                  | somente detalhe autorizado              | nunca registrado          |
| `personalEmail`  | `EmployeeContact`          | Estrutura existente | Sim          | Não           | formato de e-mail; normalizado para minúsculas             | contato pessoal          | detalhe e gestão de contatos            | nunca registrado          |
| `phone`          | `EmployeeContact`          | Estrutura existente | Sim          | Não           | 10 a 15 dígitos; persistido sem máscara                    | contato pessoal          | detalhe e gestão de contatos            | nunca registrado          |
| `secondaryPhone` | `EmployeeContact`          | Estrutura existente | Sim          | Não           | 10 a 15 dígitos; persistido sem máscara                    | contato pessoal          | detalhe e gestão de contatos            | nunca registrado          |
| `postalCode`     | `EmployeeAddress`          | Não                 | Sim          | Não           | 8 dígitos quando informado                                 | endereço pessoal         | somente detalhe autorizado              | nunca registrado          |
| `street`         | `EmployeeAddress`          | Não                 | Sim          | Não           | até 160 caracteres                                         | endereço pessoal         | somente detalhe autorizado              | nunca registrado          |
| `number`         | `EmployeeAddress`          | Não                 | Sim          | Não           | até 30 caracteres                                          | endereço pessoal         | somente detalhe autorizado              | nunca registrado          |
| `complement`     | `EmployeeAddress`          | Não                 | Sim          | Não           | até 120 caracteres                                         | endereço pessoal         | somente detalhe autorizado              | nunca registrado          |
| `district`       | `EmployeeAddress`          | Não                 | Sim          | Não           | até 120 caracteres                                         | endereço pessoal         | somente detalhe autorizado              | nunca registrado          |
| `city`           | `EmployeeAddress`          | Não                 | Sim          | Não           | até 120 caracteres                                         | endereço pessoal         | somente detalhe autorizado              | nunca registrado          |
| `state`          | `EmployeeAddress`          | Não                 | Sim          | Não           | duas letras maiúsculas                                     | endereço pessoal         | somente detalhe autorizado              | nunca registrado          |
| `country`        | `EmployeeAddress`          | Não                 | Sim          | Não           | até 80 caracteres                                          | endereço pessoal         | somente detalhe autorizado              | nunca registrado          |
| `name`           | `EmployeeEmergencyContact` | Não                 | Sim          | Condicional   | obrigatório quando o contato é informado                   | contato de terceiro      | somente detalhe autorizado              | nunca registrado          |
| `relationship`   | `EmployeeEmergencyContact` | Não                 | Sim          | Condicional   | até 80 caracteres                                          | contato de terceiro      | somente detalhe autorizado              | nunca registrado          |
| `phone`          | `EmployeeEmergencyContact` | Não                 | Sim          | Condicional   | 10 a 15 dígitos; persistido sem máscara                    | contato de terceiro      | somente detalhe autorizado              | nunca registrado          |

## Decisões de modelagem

### Compatibilidade aditiva

A migration `0017_employee_profile_expansion` adiciona cinco colunas anuláveis a `employees` e
duas relações opcionais de um para um. Não há `DROP`, backfill compulsório ou alteração de migration
histórica. A obrigatoriedade no banco ou API fica adiada até existir migração dos dados legados e
decisão explícita de compatibilidade.

### CPF

O backend é a autoridade da normalização e validação. A máscara do frontend é apenas visual. Não há
índice `UNIQUE`: `Employee` não possui `companyId` direto, pode participar de vínculos em empresas e
a política de identidade entre empresas não foi decidida. Duplicidade de CPF deve ser resolvida em
decisão específica antes de qualquer constraint.

### Datas e estado civil

O limite de 1900-01-01 é somente uma barreira técnica contra datas absurdas. Não representa idade
mínima de trabalho. Estado civil é informativo e não dispara regra de folha ou benefício.

### Endereço e emergência

As relações próprias evitam texto agregado e permitem evolução controlada. Não existe consulta
pública nem integração de CEP. O contato de emergência é opcional; quando iniciado, nome, relação e
telefone formam um conjunto obrigatório para evitar registros parciais.

## API, projeções e segurança

`CreateEmployeeDto` e `UpdateEmployeeDto` aceitam o perfil expandido, rejeitam propriedades
desconhecidas pelo `ValidationPipe` global e validam novamente CPF, data e telefones no serviço. A
criação e a edição persistem o perfil e a auditoria na mesma transação.

A listagem continua sem CPF, nascimento, contatos ou endereço. O detalhe inclui os dados do perfil
somente após `employee.read` e o filtro pela empresa ativa. Escritas continuam exigindo
`employee.manage`; `platform.manage` não é bypass. Nenhuma capability ou grant foi adicionado.

Os eventos existentes registram o identificador, a ação e o status, nunca o CPF, data de nascimento,
e-mail, telefone, endereço ou payload completo.

## Frontend

Criação e edição reutilizam o mesmo `EmployeeForm` e os componentes compartilhados `FormSection`,
`FormField` e `FormActions`. O formulário usa duas colunas quando há espaço e uma coluna em telas
estreitas. O detalhe separa resumo, dados pessoais, contato, endereço, contato de emergência,
organização, contrato atual e histórico. A listagem permanece deliberadamente mínima.

## Dados demonstrativos

O seed cria somente pessoas fictícias das empresas Horizonte Demo e Atlas, com CPFs sintéticos
válidos, datas, contatos, endereços e contatos de emergência determinísticos. Esses valores são
demonstrativos e não representam pessoas reais conhecidas.

## Dados analisados e não implementados

| Dado                                                                                                          | Classificação            | Decisão desta entrega                                                       |
| ------------------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------- |
| PIS/PASEP                                                                                                     | `ADMISSION`              | `DEFERRED`: depende de necessidade e regra aprovada do processo admissional |
| CTPS digital                                                                                                  | `ADMISSION`              | `DEFERRED`: não pertence ao perfil básico sem contrato aprovado             |
| RG/documento de identidade                                                                                    | `DOCUMENT MODULE`        | `DEFERRED`: requer modelo documental e política de retenção                 |
| CNH                                                                                                           | `DOCUMENT MODULE`        | `DEFERRED`: somente para função com necessidade comprovada                  |
| Título eleitoral                                                                                              | `DOCUMENT MODULE`        | `DEFERRED`: sem necessidade aprovada                                        |
| Dados bancários                                                                                               | módulo financeiro futuro | `DEFERRED`: não pertencem ao perfil básico                                  |
| Raça/cor, religião, orientação sexual, saúde, deficiência, biometria, filiação política e informação sindical | dado sensível            | Fora do escopo; nenhuma coleta autorizada                                   |

## Testes e follow-ups

Os testes cobrem perfil completo, edição, CPF válido e inválido, data futura, enum, endereço,
emergência, projeção mínima, `403`, `404`, isolamento empresarial, auditoria sem PII, formulário,
validação e persistência demonstrativa.

Permanecem pendentes, sem bloquear esta entrega:

- decidir identidade/unicidade de CPF entre empresas;
- planejar o preenchimento dos registros legados antes de eventual endurecimento de nulabilidade;
- aprovar qualquer ampliação de projeção ou capability para campos pessoais;
- definir retenção e eventual módulo documental antes de coletar documentos adicionais.
