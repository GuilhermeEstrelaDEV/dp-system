# MVP-001 — Estados de interface do dashboard

| Estado                  | Apresentação                                      | Ação disponível                     |
| ----------------------- | ------------------------------------------------- | ----------------------------------- |
| empresa não selecionada | solicitação explícita de seleção                  | selecionar empresa                  |
| carregando              | skeletons identificados para tecnologia assistiva | aguardar                            |
| erro controlado         | alerta sem dados residuais                        | tentar novamente                    |
| acesso restrito         | explicação de ausência de capability              | nenhuma ação privilegiada           |
| sem dados               | estado vazio da empresa ativa                     | continuar navegação                 |
| dados disponíveis       | cards, distribuições, timeline e atividade        | atalho autorizado para conferências |

Os gráficos são listas semânticas com rótulos e valores textuais, sem depender apenas de cor. O
atalho de conferências aparece somente com `payroll.review.view`; recursos indisponíveis não são
simulados.
