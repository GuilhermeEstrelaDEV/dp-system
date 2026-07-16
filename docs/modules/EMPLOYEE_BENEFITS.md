# Benefícios de colaboradores

## Escopo da ETP-008

O módulo mantém um catálogo de benefícios por empresa, planos parametrizáveis e adesões vinculadas ao contrato de trabalho. Os tipos iniciais são vale-transporte, vale-refeição, vale-alimentação e um tipo genérico. Todo conteúdo exibido pela interface é demonstrativo.

## Modelo e regras técnicas

- Valores da empresa, do colaborador e a coparticipação opcional usam `Decimal(15,2)` e trafegam como texto decimal; não há cálculo de folha nem arredondamento financeiro no módulo.
- Cada plano tem vigência. A API rejeita data final anterior à inicial.
- A adesão verifica que o plano pertence à mesma empresa do contrato e impede sobreposição de adesões ativas para o mesmo benefício.
- Suspensão e cancelamento são alterações lógicas com justificativa e histórico append-only. Não há exclusão de entidades de domínio.
- A elegibilidade implementada é exclusivamente organizacional (empresa do contrato). Critérios legais, familiares, médicos, sindicais ou por faixa salarial não foram inferidos.

## API

- `GET /benefits?companyId=&search=&type=` lista o catálogo e seus planos ativos.
- `POST /benefits` cria um item de catálogo.
- `POST /benefits/plans` cria um plano com vigência, valores e coparticipação opcional.
- `GET /benefits/enrollments/:employmentContractId` consulta adesões e histórico lógico de um contrato.
- `POST /benefits/enrollments` registra uma adesão.
- `PATCH /benefits/enrollments/:id` suspende ou cancela uma adesão, sempre com justificativa.

## Interface e limites

A rota `/beneficios` usa TanStack Query, React Hook Form e Zod. Ela inclui estados de carregamento, erro e vazio, pesquisa, filtro por tipo, paginação local do resultado de catálogo e formulários para catálogo, plano e adesão. A consulta de adesões permite suspensão e cancelamento demonstrativos.

Não há integração com operadoras, upload de documentos, dados de saúde, cálculo de descontos, eventos de folha, regras de aceitação/recusa, dependentes ou dados pessoais reais.

## Decisões pendentes

As regras de VT/VR, demais benefícios, elegibilidade material, descontos, coparticipação definitiva e documentos de recusa dependem da decisão BDP-008. O módulo não deve ser usado para apuração trabalhista enquanto essas regras não forem homologadas por RH e DP.
