# ETP-015 — Permission Classification Release Gate

## Resultado atual

**APPROVED — READY FOR CONTROLLED MIGRATION**

O Gate A estrutural permanece `APPROVED`. Este subgate bloqueia apenas a migration da ETP-015.3 até
que risco, sensibilidade e tratamento fail-closed sejam homologados. PC-01..PC-21 foram aprovadas por
Guilherme Estrela em 29/07/2026, sem condições bloqueadoras. A ETP-015.3 permanece `NOT STARTED` e
nenhuma migration foi criada.

## Checklist de liberação

- [x] inventário contém exatamente 19 códigos atuais;
- [x] cada código aparece uma vez na matriz técnica;
- [x] cada código possui recomendação e justificativa individual;
- [x] PC-01..PC-19 estão `APPROVED`;
- [x] `riskLevel` foi homologado para os 19 códigos por Segurança;
- [x] `sensitivity` foi homologada para os 19 códigos por Privacidade/DPO;
- [x] PC-20, política fail-closed, está `APPROVED`;
- [x] PC-21, governança de novos códigos, está `APPROVED`;
- [x] nenhuma decisão/classificação permanece `PENDING`;
- [x] nenhuma condição bloqueadora está aberta;
- [x] matriz homologada corresponde exatamente ao inventário do seed/repositório;
- [x] relatório pré-migration foi especificado para ausentes, extras e duplicados;
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

Segurança, Privacidade/DPO e Produto foram representados por Guilherme Estrela na homologação. As
regras fail-closed permanecem obrigatórias para a futura migration; esta aprovação não inicia a
ETP-015.3 nem ativa autorização funcional.
