# MVP-001 — Autorização do dashboard executivo

`GET /dashboard/summary` exige JWT válido e empresa ativa resolvida pelo contexto canônico. O backend
não aceita `companyId` do cliente: a empresa vem exclusivamente do principal autenticado.

- conferência requer `payroll.review.view`;
- competências requerem `payroll.period.close.view`;
- nenhuma capability é atribuída automaticamente a papéis ou identidades demonstrativas.

Sem capability aplicável, a API retorna somente o contexto e `access: RESTRICTED`, sem números,
distribuições ou atividades. Esse contrato é deny-by-default e permite ao shell explicar a
restrição sem tratar ausência de grant como falha técnica.

Não há autorização por nome de papel, leitura de outra empresa, agregação global, actor, metadata de
auditoria ou dado pessoal na atividade recente. Seed, assignments, Prisma e migrations permanecem
inalterados, assim como o estado `NOT STARTED` da ETP-015.4.

As identidades locais da MVP-001.3 possuem zero grants; portanto, o login demonstrativo padrão exibe
o estado restrito. As visualizações completas são verificadas por testes com principais
explicitamente autorizados, sem criar grants de demonstração.
