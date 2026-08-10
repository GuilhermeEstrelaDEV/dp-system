# MVP-001 — Limitações conhecidas

| Limitação                                            | Impacto na demonstração                        | Contingência                                                   | Owner futuro                 |
| ---------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------- | ---------------------------- |
| 125 handlers legados ainda adiados                   | CRUDs não podem integrar o roteiro             | manter gate visual e inventário nominal; não simular segurança | ETP-015.9–015.10             |
| aliases P0 ainda existem e estão deprecated          | consumidor externo pode usar contrato antigo   | falhar fechado, telemetria segura e revisão humana Gate C      | Gate C / janela posterior    |
| zero grants nas contas demo                          | dashboard e folha exibem estado restrito       | explicar deny-by-default; não criar grant ad hoc               | governança de autorização    |
| sem fluxo estrutura → colaborador → contrato         | não há escrita ponta a ponta autorizada        | usar inventário e massa fictícia sem abrir APIs legadas        | ETP-015.4/iniciativa futura  |
| sem MFA, refresh e revogação global                  | autenticação é local e de curta duração        | novo login e logout da sessão atual                            | recorte futuro aprovado      |
| bundle inicial acima de 500 kB                       | aviso de build, sem falha local observada      | ambiente previamente aquecido                                  | hardening/code splitting     |
| offline depende de cache prévio                      | primeira instalação/build pode exigir internet | executar `demo:ready` antes de desconectar                     | operação local               |
| sem mobile completo/WCAG formal                      | demonstração homologada para notebook/desktop  | Edge/Chrome, 1366×768, zoom 100%                               | iniciativa de acessibilidade |
| sem produção/cloud/CI de deploy                      | protótipo não pode ser publicado               | executar somente Compose local                                 | iniciativa futura específica |
| auditoria de leitura limitada a grants; zero masking | dashboard/folha não geram eventos de leitura   | manter perfil `MINIMAL`; ampliar só após decisão humana        | BDP-001/011 e etapa futura   |
| append-only sem trigger dedicado                     | DBA ainda pode alterar logs por acesso direto  | writer único + verifier; hardening exige migration aprovada    | hardening futuro             |
| advisories transitivos de tooling/Prisma             | oito alertas moderados/altos, sem crítico      | não expor tooling; planejar upgrades compatíveis               | manutenção de dependências   |
| sem validação gerencial concluída                    | prioridades e continuidade não estão aprovadas | usar pacote executivo e registrar decisão explícita            | gestão do produto            |

Nenhuma limitação autoriza bypass, dado real, concessão automática ou representação de recurso
inexistente como funcional.

Requests antigos de `/payroll-closures` sem a evidência canônica não são compatibilizados por
síntese: falham fechados. Telemetria é apenas local; comunicação, janela e remoção dependem da
aprovação humana do Gate C. Produção, cloud e deploy não estão autorizados.
