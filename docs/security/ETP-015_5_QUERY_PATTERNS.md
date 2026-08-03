# ETP-015.5 — Patterns canônicos de query

## Patterns aprovados

| Operação                | Pattern obrigatório                                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| listagem                | `companyId = scope.companyId` no primeiro `where`; busca, ordenação, paginação, cursor e total operam dentro desse predicado |
| detalhe                 | `id AND companyId` na mesma query; ausência e outra empresa têm o mesmo `404`                                                |
| criação                 | repository recebe scope e injeta `companyId`; relações são verificadas por join/assignment na mesma empresa                  |
| atualização/estado      | lookup e `updateMany` escopados; `count = 0` é ausência; transação mantém o mesmo scope                                      |
| exclusão lógica         | mesmo predicado de atualização; exclusão física não foi introduzida                                                          |
| aggregate/count/groupBy | `companyId` participa da query enviada ao PostgreSQL, nunca é aplicado ao resultado                                          |
| relação direta          | todos os IDs empresariais são resolvidos com `companyId` na mesma query                                                      |
| relação indireta        | join obrigatório até a raiz empresarial no banco; o ID pai isolado não é prova                                               |
| transação               | scope é argumento imutável de todo repository usado pelo callback; retry não o recalcula                                     |
| catálogo global         | somente modelo homologado; escrita governada e incapaz de substituir empresa ativa                                           |

Listagens migradas nesta entrega não expõem paginação, busca ou cursor. Esses recursos, quando forem
migrados por família, deverão aplicar o predicado empresarial antes de `skip`, `take`, cursor,
ordenação e total. Não existe cache de backend no recorte.

## Patterns proibidos

- `findUnique({ id })` empresarial seguido de comparação em memória;
- consulta ampla com `.filter()` por empresa no JavaScript;
- `update`/`delete` somente por ID após lookup;
- `companyId` de DTO, query, path ou header como autoridade;
- fallback para primeira empresa, empresa do recurso ou singleton global;
- relation connect por ID sem comprovar empresa;
- count/groupBy global seguido de separação;
- cache por ID ou usuário sem empresa;
- SQL concatenado ou sem predicate empresarial;
- retornar `403` após descobrir que o recurso pertence a outra empresa.

## Modelos globais aprovados

| Modelo           | Owner                               | Consumidores                       | Proteção e risco                                                                                      |
| ---------------- | ----------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `Permission`     | governança de Segurança/Arquitetura | guards e administração futura      | catálogo somente; status/scope validados; risco de privilege creep mitigado por zero grant automático |
| `Role`           | governança de acesso                | assignments globais e empresariais | nome/código nunca autoriza caso de uso                                                                |
| `RolePermission` | governança de acesso                | resolução de capabilities          | assignment explícito, temporal, revogável e auditado; não é assignment de usuário/empresa             |
| `UserRole`       | administração de plataforma         | capacidades `platform.*`           | não pode autorizar operação de domínio empresarial                                                    |

## Raw SQL, cache e performance

Nenhum raw SQL ou cache foi criado. O advisory lock existente usa tagged template parametrizado e
chave `companyId:payrollPeriodId`. Os índices existentes cobrem empresa/status e empresa/vigência nos
modelos migrados; o ensaio `EXPLAIN ANALYZE` não demonstrou necessidade de migration ou índice novo.

## Relações indiretas documentadas para ondas futuras

- colaborador → contrato → empresa;
- processo → contrato → empresa;
- departamento → branch/unidade → empresa;
- execução → competência → empresa;
- finding → ciclo de conferência → empresa.

Esses patterns são vinculantes, mas não migram os handlers legados nesta entrega.
