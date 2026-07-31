# MVP-001 — Perguntas e respostas executivas

## O protótipo está pronto para produção?

Não. Ele é exclusivamente local, não possui operação produtiva, cloud, deploy ou compromissos de
suporte.

## O sistema já substitui os processos atuais?

Não. O objetivo é validar problema, linguagem, experiência e direção técnica. CRUDs legados não
integram o roteiro.

## Os dados apresentados são reais?

Não. São dados fictícios, determinísticos e identificados como demonstrativos.

## Por que o dashboard aparece restrito?

As identidades demo possuem zero grants. O produto preserva deny-by-default e não cria permissões
apenas para tornar a apresentação visualmente mais rica.

## A separação entre empresas funciona?

O fluxo local valida vínculo, principal autenticado e contexto ativo no backend. Testes negativos e
o gate automatizado verificam que uma empresa não acessa recursos da outra.

## Quais métricas de retorno já existem?

Nenhuma métrica financeira ou de produtividade foi homologada. O deck não atribui ROI, economia de
tempo ou redução percentual de erro.

## Quais são os maiores riscos?

Proteção incompleta das APIs legadas, ausência de produção, dependência local de Docker, primeiro
build potencialmente online, bundle acima do alvo e advisories transitivos não críticos.

## Qual é a próxima etapa?

Depende da decisão gerencial. A descoberta da ETP-015.4 é uma possibilidade ainda não iniciada; ela
não está automaticamente aprovada por esta demonstração.

## O que a gestão precisa decidir?

Se o problema está bem representado, quais fluxos e indicadores têm prioridade, quais riscos devem
ser tratados primeiro e se a iniciativa deve avançar, ser ajustada, mantida ou encerrada.
