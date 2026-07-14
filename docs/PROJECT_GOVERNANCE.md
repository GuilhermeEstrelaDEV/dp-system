# Governança de Desenvolvimento

## Papel técnico

O projeto será conduzido com responsabilidade de arquitetura e liderança técnica: definição de fronteiras de módulo, decisões documentadas, qualidade contínua e evolução incremental.

## Fluxo obrigatório para cada entrega

1. **Planejar:** registrar objetivo, escopo, impacto, critérios de aceite e riscos.
2. **Documentar:** atualizar requisito, decisão arquitetural ou regra de negócio antes da alteração técnica.
3. **Implementar:** alterar somente o necessário, com módulos coesos e interfaces claras.
4. **Validar:** executar verificações proporcionais ao risco (lint, testes unitários, integração, fluxo ponta a ponta e revisão de dados quando aplicável).
5. **Encerrar:** registrar resultado, limitações, evidências de validação e documentação atualizada.

## Definition of Ready

Uma história só pode entrar em desenvolvimento quando possuir:

- problema e resultado esperado claros;
- responsável de negócio para tirar dúvidas;
- regras, dados de entrada e exceções conhecidos;
- critério de aceite verificável;
- impacto em LGPD, folha e eSocial avaliado quando pertinente.

## Definition of Done

Uma entrega só será considerada concluída quando:

- atender aos critérios de aceite;
- tiver testes e validações adequados ao risco;
- não introduzir regressão conhecida;
- preservar auditoria, autorização e histórico quando manipular dados de DP;
- tiver documentação e changelog da etapa atualizados;
- estiver revisada e pronta para homologação quando afetar cálculo ou obrigação legal.

## Padrões de engenharia

- Clean Code, SOLID, baixo acoplamento e alta coesão.
- Regras de negócio no domínio, nunca dispersas em telas ou consultas.
- Dependências externas atrás de interfaces/adaptadores.
- Datas, parâmetros legais e tabelas com vigência; nenhum valor legal crítico fixado em código.
- Migrações de banco reversíveis quando possível e sempre revisadas.
- Observabilidade, logs estruturados e tratamento explícito de erros.
- Alterações em módulos concluídos exigem justificativa, avaliação de impacto e testes de regressão.

## Segurança e dados pessoais

- Menor privilégio por padrão, RBAC por empresa e segregação de funções.
- Dados sensíveis criptografados em repouso e em trânsito.
- Auditoria para leitura sensível, inclusão, alteração, aprovação, fechamento e transmissão.
- Retenção, anonimização e exportação de dados definidas antes da entrada em produção.
