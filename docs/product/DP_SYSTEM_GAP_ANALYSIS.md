# Gap analysis do DP-System

## Critério

Prioridade considera valor operacional, reutilização da arquitetura, risco e dependências humanas:

- `P0 — ESSENCIAL`: preservar fluxos de folha, segurança e isolamento já aprovados.
- `P1 — ALTA`: completar UX/CRUD ou oferecer capacidade segura sobre dados existentes.
- `P2 — MÉDIA`: novo domínio de RH que exige especificação própria.
- `P3 — FUTURA`: integração, automação avançada ou alto grau de decisão externa.

Categorias: `A` UX de algo existente; `B` backend existe/frontend incompleto; `C` fluxo quebrado;
`D` CRUD incompleto; `E` ausente; `F` decisão legal/negócio; `G` integração externa.

## Backlog priorizado

| Gap                                                      | Categoria | Prioridade | Evidência                                          | Recorte seguro / bloqueio                             |
| -------------------------------------------------------- | --------- | ---------- | -------------------------------------------------- | ----------------------------------------------------- |
| Padronizar ações primárias, formulários e feedback       | A         | P1         | controles e estados variam por módulo              | Wave 1, sem regra nova                                |
| Unificar loading, erro, vazio e confirmação              | A         | P1         | primitives existem, adoção incompleta              | Wave 1                                                |
| Tornar edição/status de Employee e Contract descobríveis | A/B       | P1         | API completa, UI dispersa                          | Wave 1                                                |
| Melhorar seletores de lançamentos de folha               | A/B       | P1         | UI exige UUID manual                               | usar dados já autorizados, sem cálculo                |
| Reorganizar menu por modelo mental de RH                 | A         | P1         | navegação atual tem quatro grupos genéricos        | Wave 2                                                |
| Busca/filtros/paginação consistentes                     | A/B       | P1         | suporte desigual entre telas                       | Wave 2                                                |
| Expandir dashboard com métricas confiáveis               | B         | P1         | modelos existem, endpoint é restrito               | somente agregados aprovados                           |
| Histórico consolidado do colaborador                     | B/E       | P1         | históricos por domínio já existem                  | Wave 3; projeção mínima                               |
| Central de relatórios básicos e CSV                      | E         | P1         | modelos e isolamento existem                       | Wave 3; sem inferência legal                          |
| Gestão documental                                        | E/F       | P1         | só requisito lógico admissional                    | BDP-011 + decisão de storage                          |
| Desligamento/checklist                                   | E/F       | P1         | ausente                                            | separar workflow administrativo de cálculo rescisório |
| Reembolsos                                               | E         | P1         | ausente                                            | valores administrativos, sem integração financeira    |
| Tarefas e pendências operacionais                        | E         | P1         | sinais existem em vários domínios                  | requer catálogo/eventos aprovados                     |
| Portal do colaborador                                    | E/F       | P1         | identidade não se vincula canonicamente a Employee | decidir self-scope e projeções                        |
| Portal do gestor                                         | E/F       | P1         | hierarquia gestor-equipe ausente                   | decidir vínculo e escopo                              |
| Organograma simples                                      | B/F       | P1         | estrutura existe sem relação completa              | depende da BDP-013                                    |
| Calendário e alertas de férias                           | B/F       | P2         | períodos/solicitações existem                      | sem cálculo legal inferido                            |
| Recrutamento e pipeline                                  | E         | P2         | ausente                                            | Wave 6 com domínio próprio                            |
| Desempenho, metas, PDI e 1:1                             | E         | P2         | ausente                                            | Wave 7 com permissões específicas                     |
| Pesquisas, eNPS e treinamentos                           | E/F       | P2         | ausente                                            | anonimato/privacidade antes de pesquisas              |
| 9-box e sucessão                                         | E/F       | P3         | ausente                                            | decisão de governança de talento                      |
| Assinatura digital, eSocial, bancos e contabilidade      | G/F       | P3         | não autorizados                                    | integração externa e regras legais                    |
| IA e automações preditivas                               | E/F/G     | P3         | ausente                                            | somente após governança, dados e observabilidade      |

## Sequência recomendada

1. Wave 1 — UX e completude dos CRUDs existentes.
2. Wave 2 — navegação, dashboard, busca e filtros.
3. Wave 3 — histórico, relatórios e fundação documental; storage continua bloqueado se BDP-011
   permanecer pendente.
4. Waves 4–5 — somente recortes liberados por decisões de desligamento, privacidade e hierarquia.
5. Waves 6–8 — novos domínios independentes, cada um com classificação de rotas, capabilities,
   auditoria e isolamento antes do código.

Não há feature classificada como `BROKEN` na baseline automatizada. Isso não elimina os achados de
usabilidade relatados nem substitui homologação humana das jornadas.
