# MVP-001 — Registro de riscos da demonstração

O seed da MVP-001.3 falha fora do modo local, persiste apenas hashes e não atribui capabilities.
Refresh, MFA e recuperação de senha permanecem fora do protótipo e devem ser apresentados como
limitações explícitas.

| ID      | Risco                                              | Probabilidade/impacto | Mitigação e evidência requerida                                                      |
| ------- | -------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------ |
| MVP-R01 | seed atual não permite login                       | mitigado/baixa        | identidade e vínculo fictícios explícitos, testados e documentados                   |
| MVP-R02 | grants de demo ampliarem acesso                    | mitigado/alta         | zero grants, sem associação automática e verificador fail-closed                     |
| MVP-R03 | vazamento entre empresas                           | mitigado/crítica      | IDs separados, verificador e testes negativos de backend                             |
| MVP-R04 | reset atingir banco não local                      | baixa/crítica         | fail-closed por ambiente/host e alvo explícito, sem credencial versionada            |
| MVP-R05 | dashboard induzir percepção de dado real           | mitigado/média        | rótulo permanente, banco local e empresa ativa visíveis                              |
| MVP-R06 | fluxo falhar por massa relacional incompleta       | mitigado/média        | dataset determinístico e `demo:data:verify`; leitura segue bloqueada por autorização |
| MVP-R07 | APIs legadas permanecerem sem autorização uniforme | aceita/alta           | gate pré-fetch, roteiro restrito e migração exclusiva na ETP-015.4                   |
| MVP-R08 | logout ser interpretado como revogação global      | média/média           | revogar sessão atual e documentar que revogação global permanece follow-up           |
| MVP-R09 | dependência de Docker/portas impedir start         | mitigado/média        | `demo:verify`, health checks, diagnóstico e ação corretiva objetiva                  |
| MVP-R10 | apresentação depender de internet                  | mitigado/alta         | checklist offline e operação local previamente validada                              |
| MVP-R11 | gate produtivo ser confundido com gate local       | média/média           | manter gate de destino pendente e registrar separação explícita                      |
| MVP-R12 | escopo crescer para módulos complexos              | alta/média            | MoSCoW, um fluxo principal e gates por incremento                                    |
| MVP-R13 | relatório operacional expor segredo                | mitigado/alta         | sanitização testada, metadados mínimos e diretório local ignorado                    |
| MVP-R14 | corrida entre Compose e porta publicada            | mitigado/alta         | start aguarda banco/API/web no host antes de liberar verificação                     |
| MVP-R15 | bundle inicial acima de 500 kB                     | aceita/média          | cache aquecido; code splitting permanece em hardening futuro                         |
| MVP-R16 | falha do runtime durante a apresentação            | mitigado/alta         | PPTX, PDF, screenshots e resumo testados sem serviços ao vivo                        |
| MVP-R17 | afirmação executiva sem evidência                  | mitigado/alta         | mapa de evidências e exclusão explícita de ROI, prazo, custo e ganho não homologados |

Riscos residuais, contingência e owner futuro estão detalhados em
[limitações conhecidas](../quality/MVP-001_KNOWN_LIMITATIONS.md). Nenhum risco aceito autoriza
enfraquecimento de segurança.
