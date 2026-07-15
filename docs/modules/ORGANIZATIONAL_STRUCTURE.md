# Estrutura Organizacional

A ETP-004 implementa empresas, filiais, departamentos, cargos e centros de custo. Os registros são multiempresa, usam UUID, status ativo/inativo e não possuem exclusão física.

As rotas REST estão sob `/api/v1/companies`, `/branches`, `/departments`, `/positions` e `/cost-centers`. Listas usam paginação, pesquisa, status e escopo de empresa para recursos subordinados.

`branches` é a terminologia canônica para filiais, conforme ADR-006. Dados de seed e exemplos são exclusivamente fictícios.
