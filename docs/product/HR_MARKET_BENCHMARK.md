# Benchmark funcional público de plataformas de RH

## Método e limites

Pesquisa realizada em 10/09/2026 exclusivamente em páginas oficiais públicas. A matriz registra
sinais públicos das categorias de produto, sem representar validação prática, equivalência de
profundidade, disponibilidade em todos os planos ou conhecimento da implementação interna. Quando a
fonte consultada anuncia apenas uma capacidade relacionada, sem evidenciar o fluxo específico, a
classificação é parcial. “Não evidenciado” significa apenas que a fonte consultada não sustenta a
afirmação.

Fontes oficiais:

- [Convenia — plataforma RH e DP](https://mkt.convenia.com.br/)
- [Factorial — software de RH](https://factorialhr.com.br/software-recursos-humanos)
- [Sólides — plataforma RH e DP](https://solides.com.br/)
- [TOTVS RH — Linha Protheus](https://produtos.totvs.com/ficha-tecnica/tudo-sobre-totvs-rh-linha-protheus/)
- [Senior HCM](https://www.senior.com.br/solucoes/gestao-de-pessoas-hcm)

O benchmark não copia layout, texto, identidade, código ou regra proprietária. Integrações, IA,
assinatura, eSocial, folha legal e cálculo trabalhista aparecem apenas como referências de mercado e
continuam fora de qualquer autorização automática para o DP-System.

## Matriz

Legenda: `●` funcionalidade explicitamente anunciada na fonte pública consultada; `◐` capacidade
relacionada anunciada, sem evidência granular suficiente para afirmar o fluxo completo; `○` não
evidenciado na fonte consultada. A legenda vale igualmente para fornecedores e para o DP-System.

| Feature                           | Convenia | Factorial | Sólides | TOTVS | Senior | DP-System atual | Gap                                    | Prioridade |
| --------------------------------- | :------: | :-------: | :-----: | :---: | :----: | --------------- | -------------------------------------- | ---------- |
| Empresas/unidades                 |    ◐     |     ●     |    ●    |   ●   |   ●    | ●               | UX e hierarquia de grupo pendente      | P1         |
| Departamentos, cargos e centros   |    ◐     |     ●     |    ●    |   ●   |   ●    | ●               | hierarquia/filial parcial              | P1         |
| Colaboradores e contratos         |    ◐     |     ●     |    ●    |   ●   |   ●    | ●               | perfil mais rico bloqueado por dados   | P1         |
| Organograma                       |    ○     |     ●     |    ◐    |   ●   |   ●    | ○               | ausente                                | P1         |
| Histórico do colaborador          |    ◐     |     ●     |    ●    |   ●   |   ●    | ◐               | falta timeline consolidada             | P1         |
| Campos personalizados             |    ○     |     ●     |    ○    |   ●   |   ●    | ○               | ausente                                | P2         |
| Pré-admissão/admissão digital     |    ●     |     ●     |    ●    |   ●   |   ●    | ◐               | processo existe; coleta/assinatura não | P1/G       |
| Checklist de admissão             |    ●     |     ●     |    ●    |   ●   |   ●    | ●               | UX e acompanhamento                    | P1         |
| Onboarding                        |    ○     |     ●     |    ●    |   ●   |   ●    | ◐               | fluxo amplo ausente                    | P2         |
| Desligamento/offboarding          |    ●     |     ●     |    ●    |   ●   |   ●    | ○               | módulo ausente e regras pendentes      | P1/F       |
| Gestão de documentos              |    ●     |     ●     |    ●    |   ●   |   ●    | ◐               | só requisitos lógicos; sem storage     | P1/F       |
| Assinatura digital                |    ●     |     ●     |    ●    |   ●   |   ●    | ○               | integração externa futura              | P3/G       |
| Férias e ausências                |    ●     |     ●     |    ●    |   ●   |   ●    | ◐               | operação básica sem visão ampla        | P1/F       |
| Calendário de férias              |    ●     |     ●     |    ●    |   ●   |   ●    | ○               | ausente                                | P2/F       |
| Afastamentos                      |    ●     |     ●     |    ●    |   ●   |   ●    | ◐               | cadastro/retorno básicos               | P1/F       |
| Ponto/frequência                  |    ●     |     ●     |    ●    |   ●   |   ●    | ◐               | ocorrências e saldo, sem captura       | P1/F/G     |
| Escalas e turnos                  |    ○     |     ●     |    ●    |   ●   |   ●    | ◐               | jornada básica                         | P2/F       |
| Aprovação de ajustes de ponto     |    ○     |     ●     |    ●    |   ●   |   ●    | ○               | ausente                                | P2/F       |
| Banco de horas                    |    ○     |     ●     |    ●    |   ●   |   ●    | ◐               | saldo/fechamento técnico               | P1/F       |
| Catálogo de benefícios            |    ●     |     ●     |    ●    |   ●   |   ●    | ●               | políticas não homologadas              | P1/F       |
| Elegibilidade/adesão/custos       |    ●     |     ●     |    ●    |   ●   |   ●    | ◐               | regras e custos incompletos            | P1/F       |
| Folha — parâmetros/rubricas       |    ●     |     ◐     |    ●    |   ●   |   ●    | ●               | UX técnica                             | P1         |
| Folha — lançamentos/processamento |    ●     |     ◐     |    ●    |   ●   |   ●    | ◐               | fundação sem cálculo legal completo    | P1/F       |
| Conferência/aprovação             |    ●     |     ●     |    ●    |   ●   |   ●    | ●               | recorte v1 forte                       | P0         |
| Fechamento/reabertura/histórico   |    ●     |     ◐     |    ●    |   ●   |   ●    | ●               | recorte operacional forte              | P0         |
| Holerites                         |    ●     |     ●     |    ●    |   ●   |   ●    | ○               | depende de cálculo/documentos          | P3/F       |
| Reembolsos/despesas               |    ●     |     ●     |    ●    |   ◐   |   ◐    | ○               | módulo ausente                         | P1         |
| Recrutamento/ATS                  |    ○     |     ●     |    ●    |   ●   |   ●    | ○               | ausente                                | P2         |
| Banco de talentos/pipeline        |    ○     |     ●     |    ●    |   ●   |   ●    | ○               | ausente                                | P2         |
| Avaliação de desempenho           |    ●     |     ●     |    ●    |   ●   |   ●    | ○               | ausente                                | P2         |
| Metas/OKR                         |    ●     |     ●     |    ●    |   ●   |   ●    | ○               | ausente                                | P2         |
| PDI e 1:1                         |    ●     |     ●     |    ●    |   ●   |   ●    | ○               | ausente                                | P2         |
| 9-box/sucessão                    |    ○     |     ◐     |    ●    |   ●   |   ●    | ○               | ausente                                | P3         |
| Clima/eNPS                        |    ◐     |     ●     |    ●    |   ●   |   ●    | ○               | ausente; privacidade pendente          | P2/F       |
| Treinamentos/LMS                  |    ○     |     ●     |    ●    |   ●   |   ●    | ○               | ausente                                | P2         |
| Portal do colaborador             |    ◐     |     ●     |    ●    |   ●   |   ●    | ○               | self-scope ausente                     | P1         |
| Portal do gestor                  |    ○     |     ●     |    ●    |   ●   |   ●    | ○               | hierarquia e escopo ausentes           | P1/F       |
| Comunicação interna               |    ◐     |     ●     |    ●    |   ◐   |   ●    | ○               | ausente                                | P2         |
| Dashboard/People Analytics        |    ●     |     ●     |    ●    |   ●   |   ●    | ◐               | foco atual em folha                    | P1         |
| Relatórios personalizados         |    ●     |     ●     |    ●    |   ●   |   ●    | ○               | central ausente                        | P1         |
| Exportação                        |    ●     |     ●     |    ●    |   ●   |   ●    | ○               | CSV seguro ausente                     | P1         |
| Notificações/alertas              |    ●     |     ●     |    ●    |   ●   |   ●    | ◐               | alertas de domínio sem central         | P1         |
| App móvel                         |    ●     |     ●     |    ●    |   ●   |   ●    | ○               | fora do horizonte atual                | P3         |
| Integrações/API                   |    ●     |     ●     |    ●    |   ●   |   ●    | ◐               | API existe; externas não autorizadas   | P3/G       |

## Padrões de produto observados

1. Jornada integrada do colaborador, da atração ao desligamento.
2. Autoatendimento para colaborador e gestor com escopo estrito.
3. Ações primárias explícitas, listas pesquisáveis e estados operacionais visíveis.
4. Documentos, tarefas e notificações como infraestrutura transversal.
5. Indicadores derivados dos processos, com drill-down e filtros.
6. Integração entre DP operacional e desenvolvimento de pessoas.

Para o DP-System, os quatro primeiros investimentos seguros são consistência dos CRUDs, relatórios
básicos, histórico consolidado e uma fundação documental governada. Cálculo legal, integrações e
tratamento de dados sensíveis permanecem condicionados às decisões existentes.
