# MVP-001 — Estados dos fluxos essenciais

| Estado                      | Detecção                        | Mensagem/ação segura                                             |
| --------------------------- | ------------------------------- | ---------------------------------------------------------------- |
| Credencial inválida         | `401` no login                  | informar credenciais inválidas sem criar sessão                  |
| Sessão expirada ou revogada | `401` em chamada autenticada    | limpar token/cache e retornar ao login                           |
| Sem empresa ativa           | principal sem `activeCompanyId` | redirecionar para seleção empresarial                            |
| Sem capability              | `hasCapability` falso           | mostrar `Acesso restrito`, sem fetch nem ação destinada a falhar |
| Dashboard restrito          | contrato `access: RESTRICTED`   | mostrar contexto, ocultar métricas e explicar deny-by-default    |
| Sem dados                   | resposta autorizada vazia       | mostrar estado vazio, distinto de erro e restrição               |
| API indisponível            | falha de rede/5xx               | mensagem técnica controlada e tentativa novamente quando segura  |
| Registro inexistente        | `404`                           | mensagem de não encontrado sem revelar outra empresa             |
| Conflito                    | `409`                           | explicar conflito sem resposta bruta                             |
| Validação                   | `400`                           | manter campos e indicar correção                                 |
| Rota inexistente            | roteador `*`                    | página 404, sem placeholder funcional                            |

O estado restrito não expõe o código interno da capability, não renderiza dados parciais e preserva
links seguros para dashboard e, quando aplicável, troca de empresa.
