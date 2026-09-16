# Triagem de feedback da homologação

## Objetivo

Este processo transforma relatos da homologação em itens reproduzíveis e priorizáveis sem alterar
automaticamente escopo, regra de negócio ou autorização. A origem deve apontar para uma jornada da
[matriz de homologação](HUMAN_HOMOLOGATION_MATRIX.md) sempre que aplicável.

## Classificação

| Classe            | Uso                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `BUG`             | Comportamento implementado diverge do contrato ou resultado esperado documentado.                |
| `UX`              | Fluxo funciona, mas descoberta, compreensão ou eficiência de uso é inadequada.                   |
| `VISUAL`          | Problema de layout, espaçamento, tipografia, contraste ou responsividade sem mudança funcional.  |
| `PERFORMANCE`     | Latência, consumo ou escala observada prejudica o uso esperado.                                  |
| `ACCESSIBILITY`   | Barreira de teclado, foco, semântica, leitura assistiva, contraste ou compreensão não visual.    |
| `BUSINESS_RULE`   | Regra aprovada está ausente ou incorreta; exige referência à decisão que a sustenta.             |
| `NEW_REQUIREMENT` | Necessidade não coberta pelo escopo aprovado; requer análise e decisão antes do desenvolvimento. |
| `OUT_OF_SCOPE`    | Relato válido, porém explicitamente fora da entrega ou ambiente em homologação.                  |

## Severidade

| Severidade        | Definição                                                                                                                                                        | Tratamento mínimo                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `P0 — bloqueador` | Impede homologação segura, causa perda/corrupção, vazamento entre empresas, bypass de autorização, exposição de segredo/PII ou 5xx sistêmico em jornada crítica. | Interromper a jornada, preservar evidência e escalar imediatamente. |
| `P1 — crítico`    | Fluxo essencial indisponível ou resultado material incorreto, sem alternativa segura aceitável.                                                                  | Bloqueia aceite do fluxo até decisão e correção verificadas.        |
| `P2 — importante` | Impacto relevante com alternativa segura ou restrita, sem perda de integridade ou segurança.                                                                     | Planejar correção e registrar condição de aceite.                   |
| `P3 — melhoria`   | Ajuste incremental que não impede uso seguro nem altera resultado material.                                                                                      | Priorizar em backlog sem promover escopo automaticamente.           |

Severidade mede impacto, não esforço. Um item `NEW_REQUIREMENT` pode ser P0 para a operação e ainda
assim permanecer bloqueado por decisão humana; um problema visual não deve ser elevado apenas por
preferência estética.

## Fluxo de triagem

1. Registrar o relato sem editar a evidência original.
2. Remover credenciais, tokens e dados pessoais desnecessários.
3. Reproduzir no mesmo ambiente e contexto empresarial, quando seguro.
4. Classificar natureza e severidade com justificativa.
5. Identificar contrato, BDP, ADR, capability ou limitação relacionada.
6. Decidir entre corrigir, especificar, deferir, rejeitar ou escalar.
7. Vincular PR somente depois de existir uma entrega separada e aprovada.
8. Retestar e manter evidência do resultado; não transformar automaticamente em `PASS` humano.

## Template

```text
ID:
Origem:
Tela/módulo:
Descrição:
Como reproduzir:
Esperado:
Obtido:
Classificação:
Severidade:
Evidência:
Decisão:
PR relacionado:
```

## Regras de decisão

- `BUSINESS_RULE` sem decisão documental deve ser convertido em pendência de governança, não em
  código presumido.
- `NEW_REQUIREMENT` não integra Wave 3 ou qualquer release por registro automático.
- `OUT_OF_SCOPE` permanece rastreável e deve indicar o documento que define o limite.
- Incidentes de isolamento, autorização, auditoria ou PII exigem revisão de Segurança e não podem
  ser reclassificados para P3.
- Produção, Gate D e alterações de ambiente continuam fora deste processo.
