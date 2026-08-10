# ETP-015.6 — Sensitive Read Audit Matrix

| Código    | Evento                 | Superfície                         | Capability                                       | Estado          |
| --------- | ---------------------- | ---------------------------------- | ------------------------------------------------ | --------------- |
| AR-01     | autenticação/contexto  | `/auth/*`                          | autenticação/vínculo                             | `NOT ACTIVATED` |
| AR-02     | contexto empresarial   | `/auth/companies`, `/auth/context` | vínculo                                          | `NOT ACTIVATED` |
| AR-03     | `ACCESS_GRANTS_VIEWED` | listas de grants                   | `delegation.manage` ou `emergency_access.manage` | `ACTIVE`        |
| AR-04     | dashboard              | `/dashboard/summary`               | `platform.read`                                  | `NOT ACTIVATED` |
| AR-05..07 | payroll review         | leituras e workflow                | capability da operação                           | `NOT ACTIVATED` |
| AR-08..10 | payroll periods        | readiness/histórico/decisões       | capability da operação                           | `NOT ACTIVATED` |

AR-03 é gravado uma vez por resposta bem-sucedida, inclusive lista vazia. O writer valida que existe
exatamente uma das duas capabilities homologadas e recusa metadata fora de `grantType` e
`projectionProfile`. O catálogo runtime passa de 26 para 27 eventos; nenhum outro evento foi ativado.
