# Fundação transversal de autorização e auditoria

## Estado

A fase transversal anterior à persistência do workflow da ETP-013 está implementada. Ela fornece auditoria transacional, contexto HTTP, substituição temporária e acesso emergencial genéricos. Não cria ciclo, achado, submissão ou decisão de folha.

## Auditoria transacional

`AuditWriterService.transaction` recebe o caso de uso e entrega o mesmo `Prisma.TransactionClient` para a alteração e para `append`. Falha em qualquer escrita aborta a transação. A aplicação só expõe criação de eventos; não existem métodos ou endpoints de update/delete.

Cada evento registra ator, empresa, trace, sessão, ação, entidade, estados anterior/posterior, motivo, IP, user-agent e timestamp do banco. Metadata aceita somente `capabilities`, `status`, `startsAt`, `expiresAt`, `grantType`, `outcome` e `source`. Estados e metadata são verificados recursivamente e rejeitam nomes associados a senha, hash, token, secret, cookie, autorização e dados bancários.

## Contexto HTTP

O principal inclui `ipAddress` e `userAgent`. Por padrão, o IP vem da conexão direta. `X-Forwarded-For` só influencia `request.ip` quando `TRUST_PROXY=true`; a opção deve ser habilitada apenas atrás de proxy controlado. User-agent é evidência declarada pelo cliente, não fonte de autorização.

## Grants temporários

`TemporarySubstitution` preserva titular, substituto, empresa, concedente, capabilities explícitas, vigência, motivo, status e revogação. O titular e o substituto devem ser distintos. Só podem ser concedidas capabilities efetivamente pertencentes ao titular na empresa; papéis nunca são copiados.

`EmergencyAccess` preserva beneficiário, concedente, empresa, capabilities, motivo, vigência e revogação. Auto concessão e delegação de `emergency_access.manage` são proibidas. `EMERGENCY_ACCESS_MAX_HOURS`, limitado entre 1 e 24 horas, define o teto técnico e usa 8 horas por padrão.

Grants vencidos deixam de participar do contexto imediatamente pela consulta de vigência. Listagens administrativas reconciliam o status para `EXPIRED` e gravam auditoria. Desde a ETP-015.7, os IDs dos grants efetivamente usados integram a decisão imutável e a metadata do evento crítico correspondente; não há evento `ACCESS_GRANT_USED` separado fora da transação de negócio.

## Evolução pela ETP-015.7

O `AuditWriterService` é o único adapter de `AuditLog`, usa catálogo fechado, envelope tipado e
allowlist por evento. Assignments, grants e mutações de folha exigem o transaction client do caso de
uso, de modo que falha da auditoria causa rollback integral. O append-only continua garantido na
camada de aplicação e por verificador AST; não existe trigger dedicado nesta versão.

## Endpoints

Todas as rotas abaixo exigem JWT, empresa ativa e capability também validada no serviço:

- `GET|POST /api/v1/access-grants/substitutions` — `delegation.manage`;
- `POST /api/v1/access-grants/substitutions/:id/revoke` — `delegation.manage`;
- `GET|POST /api/v1/access-grants/emergency` — `emergency_access.manage`;
- `POST /api/v1/access-grants/emergency/:id/revoke` — `emergency_access.manage`.

IDs são filtrados pela empresa ativa; concessões externas ao contexto retornam `404`.

## Limites

- não há scheduler independente para materializar expiração sem leitura administrativa;
- não há consulta pública do AuditLog;
- retenção permanece vinculada à BDP-011;
- nenhuma rota legada recebeu guard global;
- o frontend administrativo permanece para fase posterior.
