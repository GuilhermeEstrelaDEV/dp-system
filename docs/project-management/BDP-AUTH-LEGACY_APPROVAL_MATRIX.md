# BDP-AUTH-LEGACY — Matriz de aprovação e dependências

**Identificador:** provisório; não reserva numeração definitiva
**Status:** `READY FOR HUMAN DECISION`
**Legenda RACI:** `R` responsável por preparar; `A` aprovador e autoridade final; `C` consultado;
`I` informado. Somente papéis marcados como `A` aparecem na coluna “Aprovadores” do questionário.

## Matriz RACI

| Decisão                    | Produto | DP  | Segurança | Jurídico/DPO | Engenharia | Diretoria/Operação |
| -------------------------- | :-----: | :-: | :-------: | :----------: | :--------: | :----------------: |
| DAL-01 — classificação     |    R    |  C  |     A     |      C       |     R      |         I          |
| DAL-02 — granularidade     |    R    |  A  |     A     |      C       |     R      |         I          |
| DAL-03 — concessão         |    C    |  R  |     A     |      I       |     C      |         A          |
| DAL-04 — administração     |    C    |  C  |     A     |      I       |     R      |         I          |
| DAL-05 — 401/403/404       |    C    |  I  |     A     |      C       |     R      |         I          |
| DAL-06 — dados sensíveis   |    C    |  R  |     A     |      A       |     C      |         I          |
| DAL-07 — auditoria         |    I    |  C  |     A     |      A       |     R      |         I          |
| DAL-08 — metadata/retenção |    I    |  C  |     A     |      A       |     R      |         I          |
| DAL-09 — compatibilidade   |    A    |  C  |     C     |      I       |     R      |         C          |
| DAL-10 — rollout           |    A    |  C  |     A     |      I       |     R      |         C          |
| DAL-11 — rollback          |    I    |  C  |     A     |      I       |     R      |         C          |
| DAL-12 — depreciação       |    A    |  I  |     C     |      I       |     R      |         C          |
| DAL-13 — segregação/grants |    C    |  R  |     A     |      C       |     C      |         A          |
| DAL-14 — primeiro recorte  |    A    |  A  |     A     |      C       |     R      |         C          |

`A` exige aprovação humana; não é autorização automática. Nomes e evidências devem constar no
questionário.

## Dependências das BDPs existentes

| BDP     | Estado observado       | Relação com autorização legada                                            | Efeito sobre esta homologação                                             |
| ------- | ---------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| BDP-001 | pendente               | fonte e exposição de PII de colaboradores                                 | bloqueia projeção final de employee/admission                             |
| BDP-002 | pendente               | fonte canônica de setor e cargo                                           | bloqueia decisões materiais de organização; não bloqueia testes negativos |
| BDP-003 | pendente               | identificadores de vínculo                                                | bloqueia busca/exportação definitiva por identificadores                  |
| BDP-004 | pendente               | salário e vigência                                                        | bloqueia visibilidade e mutações salariais definitivas                    |
| BDP-005 | pendente               | empresa de cada vínculo                                                   | bloqueia migração material com vínculo empresarial ambíguo                |
| BDP-006 | pendente               | remuneração variável                                                      | bloqueia regras, alçadas e efeitos; não bloqueia testes de acesso         |
| BDP-007 | pendente               | jornada e banco de horas                                                  | bloqueia políticas materiais de jornada                                   |
| BDP-008 | pendente               | benefícios e elegibilidade                                                | bloqueia regras materiais e documentos de benefício                       |
| BDP-009 | resolvida v1           | contexto híbrido, empresa ativa, deny-by-default, 404, grants e auditoria | vinculante; reutilizar sem reabrir workflow de folha                      |
| BDP-010 | pendente               | fornecedores e integrações                                                | bloqueia depreciação de consumidores externos não inventariados           |
| BDP-011 | pendente               | LGPD, dados médicos, retenção, descarte e exportação                      | bloqueia política final de dados sensíveis e retenção                     |
| BDP-012 | pendente               | organização raiz e unicidade fiscal                                       | bloqueia escopo definitivo da administração global                        |
| BDP-013 | pendente               | hierarquia e filial                                                       | bloqueia regras materiais de estrutura organizacional                     |
| BDP-014 | `APPROVED — VERSION 1` | fechamento canônico, capabilities e transição do legado                   | vinculante para o recorte P0 e seus adapters                              |

BDPs pendentes não impedem homologar autenticação, isolamento e falha fechada. Elas impedem aprovar
comportamento material, projeção sensível, integração ou concessão dependente de conteúdo indefinido.

## Critérios objetivos de aprovação

- [ ] DAL-01 a DAL-14 possuem alternativa, justificativa, exceções, evidência, data e aprovadores.
- [ ] todos os `A` da RACI registraram aprovação explícita ou exceção formalmente aceita.
- [ ] matriz papel–capability preenchida sem criar assignment ou regra por nome de papel.
- [ ] as 163 rotas têm classificação aprovada ou bloqueio/dependência explícita.
- [ ] as cinco capabilities de fechamento têm concessão, segregação e sensibilidade decididas.
- [ ] 401/403/404, empresa ativa e filtro antes do lookup foram homologados.
- [ ] auditoria, metadata, leituras sensíveis e limites temporários da BDP-011 estão claros.
- [ ] compatibilidade, telemetria, rollout, rollback e depreciação possuem responsáveis e gates.
- [ ] o primeiro recorte técnico e seus consumidores foram aprovados.
- [ ] conflitos com BDP-009 e BDP-014 foram descartados por revisão explícita.
- [ ] identificador definitivo e versão foram atribuídos pela governança humana.
- [ ] resolução versionada substitui as propostas sem apagar o histórico.

Até todos os itens serem atendidos, o estado permanece `READY FOR HUMAN DECISION` e nenhuma fase
técnica é liberada.

## Resultado da homologação

| Campo                     | Preenchimento humano               |
| ------------------------- | ---------------------------------- |
| Resultado                 | `APROVAR`, `REJEITAR` ou `AJUSTAR` |
| Identificador definitivo  |                                    |
| Versão                    |                                    |
| Data                      |                                    |
| Evidência/ata             |                                    |
| Exceções aceitas          |                                    |
| Responsável pelo registro |                                    |

Este quadro vazio é intencional e não representa aprovação.
