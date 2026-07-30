# MVP-001 — Registro de riscos da demonstração

O seed da MVP-001.3 falha fora do modo local, persiste apenas hashes e não atribui capabilities.
Refresh, MFA e recuperação de senha permanecem fora do protótipo e devem ser apresentados como
limitações explícitas.

| ID      | Risco                                              | Probabilidade/impacto | Mitigação e evidência requerida                                           |
| ------- | -------------------------------------------------- | --------------------- | ------------------------------------------------------------------------- |
| MVP-R01 | seed atual não permite login                       | alta/alta             | identidade e vínculo fictícios explícitos, testados e documentados        |
| MVP-R02 | grants de demo ampliarem acesso                    | média/alta            | assignments mínimos, sem associação automática e testes de capability     |
| MVP-R03 | vazamento entre empresas                           | média/crítica         | duas empresas fictícias e testes negativos de backend                     |
| MVP-R04 | reset atingir banco não local                      | baixa/crítica         | fail-closed por ambiente/host e alvo explícito, sem credencial versionada |
| MVP-R05 | dashboard induzir percepção de dado real           | mitigado/média        | rótulo permanente, banco local e empresa ativa visíveis                   |
| MVP-R06 | fluxo falhar por massa relacional incompleta       | alta/alta             | fixture determinística e smoke test antes da apresentação                 |
| MVP-R07 | APIs legadas permanecerem sem autorização uniforme | alta/alta             | limitar roteiro, não enfraquecer controles e não antecipar ETP-015.4      |
| MVP-R08 | logout local ser interpretado como revogação       | média/média           | documentar limite; backend logout permanece follow-up                     |
| MVP-R09 | dependência de Docker/portas impedir start         | média/média           | preflight, health checks e diagnóstico objetivo                           |
| MVP-R10 | apresentação depender de internet                  | baixa/alta            | operação integralmente local e dependências previamente instaladas        |
| MVP-R11 | gate produtivo ser confundido com gate local       | média/média           | manter gate de destino pendente e registrar separação explícita           |
| MVP-R12 | escopo crescer para módulos complexos              | alta/média            | MoSCoW, um fluxo principal e gates por incremento                         |

Owner, prazo e aceitação de cada risco deverão ser definidos na implementação; não são presumidos
nesta descoberta.
