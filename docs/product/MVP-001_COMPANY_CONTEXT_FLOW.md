# MVP-001 — Fluxo de contexto empresarial

`/auth/companies` retorna somente empresas ativas com assignment temporal ativo. A escolha em
`POST /auth/context` é validada pelo backend, auditada e produz JWT com `activeCompanyId`. Empresa
sem vínculo é recusada e uma falha de troca preserva o contexto anterior.

O Administrador Demo acessa duas empresas e o Analista RH apenas a principal. Nenhum perfil recebe
capabilities automaticamente: papel, empresa ativa e capability permanecem conceitos distintos.
