# ETP-015.7 — Rollout e rollback

## Rollout controlado

1. Validar catálogo, manifesto e allowlist em CI.
2. Aplicar as 16 migrations existentes em PostgreSQL 16 limpo; nenhuma migration desta etapa.
3. Executar seed e confirmar 19 capabilities e zero grants automáticos.
4. Executar testes unitários, HTTP e PostgreSQL da auditoria e regressão de payroll.
5. Medir insert, transação crítica, volume e tamanho médio de metadata no ambiente local.
6. Publicar aplicação mantendo o schema existente.
7. Observar erros do writer, rollbacks e volume por código/empresa/trace.

## Rollback

- O código pode voltar à versão anterior porque não existe mudança de schema nem código de evento
  incompatível.
- Eventos já gravados não são removidos nem reescritos.
- Em falha de metadata ou catálogo, corrigir o produtor/allowlist por novo commit; não tornar o
  evento crítico opcional.
- Não separar auditoria de assignment, grant, payroll review ou fechamento para contornar falha.
- A remoção temporária só é admissível para evento informativo de autenticação, com risco registrado.

## Sinais de parada

- aumento material de lock/latência na transação crítica;
- rejeição inesperada de metadata válida;
- evento sem actor/company/trace aplicável;
- divergência entre evento de domínio e `AuditLog`;
- qualquer escrita crítica confirmada sem evento correspondente.

## Limites operacionais

O ensaio local não aprova índices, retenção, particionamento ou destino externo. O schema possui
índices por empresa, ator, trace, sessão e recurso. Qualquer alteração depende de evidência de
ambiente-alvo e de nova migration aprovada.
