# BDP-AUTH-LEGACY — Questionário de homologação humana

**Identificador:** provisório; não reserva numeração definitiva
**Status:** `READY FOR HUMAN DECISION`
**Natureza:** formulário documental; não aprova decisões nem autoriza implementação

## Como preencher

Cada decisão exige alternativa selecionada, justificativa, evidência, data e manifestação dos
aprovadores. A matriz RACI é a fonte autoritativa: `R` prepara, `A` aprova, `C` é consultado e `I` é
informado. Respostas incompletas mantêm a decisão `PENDING`. Recomendações do pacote são propostas
técnicas não vinculantes.

## Registro das decisões

| ID     | Decisão bloqueante                 | Alternativas a homologar                                                     | Área principal responsável | Responsáveis pela preparação (`R`) | Aprovadores (`A`)             | Consultados (`C`)                 | Informados (`I`)                 | Decisão selecionada | Justificativa | Data | Status    |
| ------ | ---------------------------------- | ---------------------------------------------------------------------------- | -------------------------- | ---------------------------------- | ----------------------------- | --------------------------------- | -------------------------------- | ------------------- | ------------- | ---- | --------- |
| DAL-01 | Classificação das superfícies      | pública explícita; autenticação; global administrativa; empresarial; interna | Produto                    | Produto, Engenharia                | Segurança                     | DP, Jurídico/DPO                  | Diretoria/Operação               |                     |               |      | `PENDING` |
| DAL-02 | Granularidade das capabilities     | módulo; recurso; leitura/escrita; caso de uso; ação sensível                 | Produto                    | Produto, Engenharia                | DP, Segurança                 | Jurídico/DPO                      | Diretoria/Operação               |                     |               |      | `PENDING` |
| DAL-03 | Matriz de concessão                | assignment manual; template revisável; seed por papel                        | DP                         | DP                                 | Segurança, Diretoria/Operação | Produto, Engenharia               | Jurídico/DPO                     |                     |               |      | `PENDING` |
| DAL-04 | Administração global e empresarial | global; empresarial; híbrida conforme BDP-009 v1                             | Engenharia                 | Engenharia                         | Segurança                     | Produto, DP                       | Jurídico/DPO, Diretoria/Operação |                     |               |      | `PENDING` |
| DAL-05 | Semântica de negação               | 401/403/404 uniformes; exceções documentadas                                 | Engenharia                 | Engenharia                         | Segurança                     | Produto, Jurídico/DPO             | DP, Diretoria/Operação           |                     |               |      | `PENDING` |
| DAL-06 | Visibilidade de dados sensíveis    | integral; mascarada; projeção allowlist; capability adicional                | DP                         | DP                                 | Segurança, Jurídico/DPO       | Produto, Engenharia               | Diretoria/Operação               |                     |               |      | `PENDING` |
| DAL-07 | Cobertura de auditoria             | escritas; escritas + leituras sensíveis; todas as leituras                   | Engenharia                 | Engenharia                         | Segurança, Jurídico/DPO       | DP                                | Produto, Diretoria/Operação      |                     |               |      | `PENDING` |
| DAL-08 | Metadata e retenção de auditoria   | allowlist; campos adicionais; prazo conforme BDP-011                         | Engenharia                 | Engenharia                         | Segurança, Jurídico/DPO       | DP                                | Produto, Diretoria/Operação      |                     |               |      | `PENDING` |
| DAL-09 | Compatibilidade do legado          | corte; alias; adapter; delegação canônica                                    | Engenharia                 | Engenharia                         | Produto                       | DP, Segurança, Diretoria/Operação | Jurídico/DPO                     |                     |               |      | `PENDING` |
| DAL-10 | Estratégia de rollout              | big bang; família a família; observe-only/flag antes do enforcement          | Engenharia                 | Engenharia                         | Produto, Segurança            | DP, Diretoria/Operação            | Jurídico/DPO                     |                     |               |      | `PENDING` |
| DAL-11 | Política de rollback               | retirar enforcement; flag; adapter anterior sem reabrir bypass               | Engenharia                 | Engenharia                         | Segurança                     | DP, Diretoria/Operação            | Produto, Jurídico/DPO            |                     |               |      | `PENDING` |
| DAL-12 | Depreciação e remoção              | prazo fixo; evidência de uso; comunicação e janela                           | Engenharia                 | Engenharia                         | Produto                       | Segurança, Diretoria/Operação     | DP, Jurídico/DPO                 |                     |               |      | `PENDING` |
| DAL-13 | Segregação e grants                | separação por ação; substituição; emergência; incompatibilidades             | DP                         | DP                                 | Segurança, Diretoria/Operação | Produto, Jurídico/DPO, Engenharia | —                                |                     |               |      | `PENDING` |
| DAL-14 | Primeiro recorte técnico           | fechamento P0; outra família; nenhuma fase até dependências adicionais       | Engenharia                 | Engenharia                         | Produto, DP, Segurança        | Jurídico/DPO, Diretoria/Operação  | —                                |                     |               |      | `PENDING` |

## Perguntas por área

### Produto

1. Quais superfícies precisam permanecer públicas e qual necessidade verificável justifica cada uma?
2. Quais consumidores internos e externos precisam de compatibilidade por família?
3. Qual janela, comunicação e evidência permitem deprecar e remover um contrato?
4. O primeiro recorte deve ser a consolidação de `/payroll-closures` ou outra família? Por quê?
5. Quais mudanças de erro exigem versionamento ou adapter?

### Departamento Pessoal

1. Quais ações devem ser separadas entre visualizar, manter, executar, conferir, aprovar, fechar,
   reabrir e exportar?
2. Quais combinações configuram conflito de função na operação real?
3. Quem pode solicitar, conceder e revogar acesso temporário sem nomes fixos de papéis no código?
4. Quais leituras revelam salário, totais, ocorrências, documentos ou dados trabalhistas sensíveis?
5. Quais famílias não podem avançar antes das BDPs materiais relacionadas?

### Segurança

1. A allowlist pública limita-se a health, login e OpenAPI habilitado por ambiente?
2. O contrato `401` sem identidade, `403` sem capability e `404` fora da empresa está aprovado?
3. Quais operações exigem capability adicional, motivo ou auditoria reforçada?
4. Quais grants são incompatíveis e quais condições de expiração e revogação são obrigatórias?
5. Quais métricas permitem observe-only sem comunicar falsamente que a rota está protegida?

### Jurídico/DPO

1. Quais campos devem ser mascarados ou omitidos por padrão em respostas e exportações?
2. Quais leituras sensíveis precisam de `AuditLog`, motivo ou finalidade declarada?
3. Quais campos são proibidos em logs, telemetria e metadata de auditoria?
4. Que parte depende da BDP-011 e qual preservação mínima vale até sua resolução?
5. Há restrições adicionais para documentos admissionais, dados médicos, afastamentos ou dados
   bancários?

### Engenharia

1. O ADR-007 é suficiente ou alguma decisão exige revisão arquitetural?
2. Quais aliases podem delegar ao caso canônico sem alterar envelope, status e idempotência?
3. Qual telemetria comprova consumidores sem registrar token, body ou PII?
4. Qual rollback preserva autenticação e isolamento ao reverter um adapter?
5. Quais testes, índices ou constraints exigem proposta própria antes de cada família?

## Confirmação dos aprovadores

| Área               | Nome/função | Decisões em que possui `A`       | Resultado (`APROVAR`, `REJEITAR`, `AJUSTAR`) | Evidência/data |
| ------------------ | ----------- | -------------------------------- | -------------------------------------------- | -------------- |
| Produto            |             | DAL-09, 10, 12, 14               |                                              |                |
| DP                 |             | DAL-02, 14                       |                                              |                |
| Segurança          |             | DAL-01 a 08, DAL-10, 11, 13 e 14 |                                              |                |
| Jurídico/DPO       |             | DAL-06, 07 e 08                  |                                              |                |
| Diretoria/Operação |             | DAL-03 e 13                      |                                              |                |

Nenhuma assinatura isolada aprova a BDP. A aprovação só pode ser registrada quando todos os critérios
da [matriz de aprovação](BDP-AUTH-LEGACY_APPROVAL_MATRIX.md) estiverem atendidos.
