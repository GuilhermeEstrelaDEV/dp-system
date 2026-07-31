# MVP-001 — Mapa de evidências executivas

Cada afirmação material do deck possui origem rastreável. “Verificador” significa resultado obtido
no ambiente local em 31/07/2026; não constitui métrica produtiva.

| Slides | Afirmação                                                          | Evidência primária                                                                                                | Classificação           |
| ------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1, 4   | escopo local, incremental e sem prontidão produtiva                | [escopo](../project-management/MVP-001_PROTOTYPE_SCOPE.md), [roadmap](../ROADMAP.md)                              | documental              |
| 2      | problema de centralização, rastreabilidade e regras explícitas     | [diagnóstico](../project-management/MVP-001_CURRENT_STATE_ASSESSMENT.md)                                          | descoberta              |
| 3      | 2 empresas, 26 colaboradores/contratos, 10 competências e 8 ciclos | [dataset](../product/MVP-001_DEMO_DATASET.md), `pnpm demo:data:verify`                                            | banco local             |
| 3      | PostgreSQL 16 e 16 migrations                                      | [aceite final](../quality/MVP-001_FINAL_ACCEPTANCE_EVIDENCE.md), `pnpm demo:setup`                                | banco local             |
| 5, 6   | login, empresa ativa, dashboard, restrição, troca e logout         | [fluxos](../product/MVP-001_CORE_FLOWS.md), `pnpm demo:rehearse`                                                  | fluxo real              |
| 7      | Horizonte: 5 ciclos, 4 achados abertos e 6 competências            | [dataset](../product/MVP-001_DEMO_DATASET.md), `pnpm demo:data:verify`                                            | banco local             |
| 8      | Atlas: 3 ciclos, 1 achado aberto e 4 competências                  | [dataset](../product/MVP-001_DEMO_DATASET.md), `pnpm demo:data:verify`                                            | banco local             |
| 7, 8   | contexto empresarial visível e estado restrito                     | [capturas](assets/mvp-001/), [fluxo empresarial](../product/MVP-001_COMPANY_CONTEXT_FLOW.md)                      | interface real          |
| 9      | JWT, sessão lógica, isolamento e zero grants                       | [revisão de segurança](../quality/MVP-001_SECURITY_REVIEW.md), `pnpm demo:verify`                                 | segurança local         |
| 10     | CRUD legado fora do roteiro e bloqueio pré-fetch                   | [limites](../quality/MVP-001_KNOWN_LIMITATIONS.md), [captura](assets/mvp-001/05-acesso-restrito.png)              | limitação aceita        |
| 11     | 376 testes no aceite; cobertura API 70,34% e web 77,50% em linhas  | [aceite final](../quality/MVP-001_FINAL_ACCEPTANCE_EVIDENCE.md)                                                   | baseline MVP-001.8      |
| 11     | soak 30,3 min, 7/7 checkpoints, sem 5xx/restart                    | [estabilização](../quality/MVP-001_STABILIZATION_REPORT.md)                                                       | ensaio local            |
| 12     | comandos operacionais e contingência                               | [setup](../DEMO_LOCAL_SETUP.md), [guia](../demo/MVP-001_DEMO_OPERATOR_GUIDE.md)                                   | operação local          |
| 13     | bundle 529,69 kB e 8 advisories não críticos                       | [limites](../quality/MVP-001_KNOWN_LIMITATIONS.md), [revisão de segurança](../quality/MVP-001_SECURITY_REVIEW.md) | risco aceito            |
| 14, 15 | alternativas e perguntas para decisão                              | [matriz](MVP-001_MANAGEMENT_DECISION_MATRIX.md), [formulário](MVP-001_MANAGER_FEEDBACK_FORM.md)                   | proposta não vinculante |

## Afirmações deliberadamente excluídas

Não existe evidência aprovada para quantidade de planilhas/abas, fórmulas, horas poupadas, ganho
financeiro, ROI, prazo produtivo, custo ou redução percentual de erros. Esses dados não aparecem no
deck e só poderão ser incluídos após medição e homologação próprias.
