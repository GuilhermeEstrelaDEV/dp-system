# ETP-015 — Permission Classification Release Gate

## Resultado atual

**NOT READY — HUMAN APPROVAL REQUIRED**

O Gate A estrutural permanece `APPROVED`. Este subgate bloqueia apenas a migration da ETP-015.3 até
que risco, sensibilidade e tratamento fail-closed sejam homologados. A ETP-015.3 permanece
`NOT STARTED` e nenhuma migration foi criada.

## Checklist de liberação

- [x] inventário contém exatamente 19 códigos atuais;
- [x] cada código aparece uma vez na matriz técnica;
- [x] cada código possui recomendação e justificativa individual;
- [ ] PC-01..PC-19 estão `APPROVED`;
- [ ] `riskLevel` foi homologado para os 19 códigos por Segurança;
- [ ] `sensitivity` foi homologada para os 19 códigos por Privacidade/DPO;
- [ ] PC-20, política fail-closed, está `APPROVED`;
- [ ] PC-21, governança de novos códigos, está `APPROVED`;
- [ ] nenhuma decisão/classificação permanece `PENDING`;
- [ ] nenhuma condição bloqueadora está aberta;
- [ ] matriz homologada corresponde exatamente ao inventário do seed/repositório;
- [ ] relatório pré-migration foi especificado para ausentes, extras e duplicados;
- [x] nenhum default genérico ou inferência por nome/role foi proposto;
- [x] ETP-015.3 permanece `NOT STARTED`;
- [x] migration permanece `NOT CREATED`.

## Invariantes fail-closed

- extra no banco: `BLOCK`;
- ausente no upgrade: `BLOCK`; ausente em banco vazio: `WARN` antes do seed homologado;
- duplicidade: `BLOCK`;
- classificação nula ou `PENDING`: `BLOCK`;
- código descontinuado sem classificação/status coerente: `BLOCK`;
- código futuro sem homologação: `BLOCK`;
- nenhuma falha pode resultar em fallback permissivo, assignment ou grant.

## Evidência necessária

Segurança e Privacidade/DPO devem preencher PC-01..PC-21 e a decisão geral. Produto deve participar
dos itens de administração de acesso, aprovação, fechamento, reabertura e demais impactos indicados.
Somente depois a conclusão poderá mudar para `READY FOR CONTROLLED MIGRATION`.
