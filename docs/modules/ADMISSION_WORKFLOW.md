# Admissão e checklist admissional

## Escopo demonstrativo

A ETP-006 controla processos admissionais, templates reutilizáveis, snapshots de checklist, prazos internos configuráveis e requisitos documentais lógicos. Nenhum arquivo, documento real, conteúdo identificável, assinatura, OCR, eSocial ou notificação externa é armazenado ou enviado.

## Regras

- O contrato deve pertencer ao colaborador e define a empresa do processo.
- Não há dois processos ativos para o mesmo contrato.
- Template ativo gera uma instância independente; edições posteriores não modificam seus itens.
- Itens obrigatórios devem estar concluídos ou marcados como não aplicáveis com justificativa antes da conclusão.
- Cancelamento e reabertura exigem justificativa.

## Limitações e LGPD

Tipos de documento são apenas rótulos demonstrativos. A lista oficial de documentos, prazos legais e responsáveis operacionais depende de validação do DP e das decisões BDP-001 e BDP-011.

## Interface e API

- `/admissoes` lista processos demonstrativos; detalhes, checklist e documentos lógicos usam rotas filhas por identificador.
- `/configuracoes/checklists` lista templates e permite somente ativação ou inativação lógica nesta etapa.
- A API expõe processos, templates, instâncias de checklist e requisitos documentais sem upload ou leitura de arquivos.

## Dados tratados e adiados

Tratados: identificadores técnicos, referências a colaborador/contrato já existentes, estado do processo, rótulos de checklist/documento, justificativas operacionais e prazos internos configuráveis. Adiados: conteúdo documental, CPF, endereço, banco, dados médicos, assinatura, metadados de arquivo, OCR, eSocial e critérios legais de prazo/obrigatoriedade.
