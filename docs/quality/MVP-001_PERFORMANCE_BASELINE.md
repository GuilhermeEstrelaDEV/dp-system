# MVP-001 — Baseline de performance local

Medição em 31/07/2026, Windows, Docker Desktop, PostgreSQL 16 Alpine, uma instância local, dados
determinísticos e cache de imagens aquecido. Os valores são diagnósticos, não SLO de produção.

| Operação                 |                                        Resultado |
| ------------------------ | -----------------------------------------------: |
| readiness, 10 amostras   | mínimo 3,45 ms; média 18,17 ms; máximo 145,55 ms |
| login Administrador Demo |                                        163,89 ms |
| listar empresas          |                                         44,63 ms |
| selecionar contexto      |                                         75,84 ms |
| dashboard restrito       |                                         35,62 ms |
| `demo:verify` completo   |                                           6,73 s |
| `demo:rehearse`          |                                           1,55 s |
| build web                |        218 módulos; 529,69 kB JS; 154,76 kB gzip |

Não houve `5xx`, timeout ou reinício no roteiro. O aviso de chunk acima de 500 kB é risco residual
não bloqueante; code splitting está fora da estabilização e permanece no backlog de hardening.
