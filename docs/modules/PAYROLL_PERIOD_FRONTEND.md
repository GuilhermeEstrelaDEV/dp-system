# Frontend de fechamento de competência

**ETP:** 014 — Fase 6  
**Status:** `READY FOR REVIEW`

A tela de competências liga ao Histórico de Fechamentos. Rotas protegidas por
`payroll.period.close.history` mostram versões atuais e históricas, badges, predecessores,
sucessores, execução, review, hash e ações de consulta. Telas dedicadas exibem detalhe, manifesto
imutável e timeline cronológica com ator e trace resumido.

A interface consulta readiness para apresentar blockers, warnings e exigência de nova execução e
novo review. Fechar e reabrir aparecem somente quando estado e capabilities permitem e usam os
contratos canônicos com idempotência, token e versão esperada. Erros `401`, `403`, `404`, `409` e de
servidor seguem o cliente HTTP tipado existente.

Não há edição ou exclusão de manifesto, eventos ou histórico.
