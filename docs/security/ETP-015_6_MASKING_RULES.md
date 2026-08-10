# ETP-015.6 — Masking Rules

**Masking material aprovado:** `0`

Nenhuma regra de mascaramento foi homologada. Por isso, a etapa não substitui valores, não revela
prefixos/sufixos e não infere tratamento a partir de nomes, verbos, papéis ou tipos de dado.

| Situação                        | Comportamento                                          |
| ------------------------------- | ------------------------------------------------------ |
| Campo aprovado                  | incluir valor integral no perfil `MINIMAL`             |
| Campo não aprovado ou bloqueado | omitir a chave                                         |
| Campo `MIXED`                   | incluir somente os subcampos expressamente homologados |
| Solicitação de perfil `FULL`    | perfil inexistente; não há elevação                    |
| Nova necessidade de exposição   | bloquear até homologação humana                        |

BDP-001 e BDP-011 permanecem como dependências para qualquer política futura de conteúdo ou dados
sensíveis. Omissão não é apresentada como anonimização.
