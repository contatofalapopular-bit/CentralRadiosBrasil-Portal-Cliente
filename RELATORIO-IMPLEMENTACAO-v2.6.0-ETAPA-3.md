# Relatório de implementação — v2.6.0 Etapa 3

## Objetivo

Permitir personalização completa das cores de todos os blocos em todos os modelos, sem transformar os temas em cópias entre si e sem criar dependência no Worker.

## Resultado

Cada combinação de 6 modelos por 14 blocos possui configuração independente, totalizando:

- 84 paletas isoladas;
- 6 cores configuráveis por paleta;
- 504 valores de cor preservados pelo editor.

## Cores disponíveis

1. fundo do bloco;
2. título;
3. texto;
4. chamada/metadado;
5. botão;
6. texto do botão.

## Segurança visual

O editor calcula contraste por luminância relativa e informa:

- título e fundo: recomendação mínima de 3:1;
- texto e fundo: recomendação mínima de 4,5:1;
- chamada e fundo: recomendação mínima de 4,5:1;
- texto e botão: recomendação mínima de 4,5:1.

O aviso não bloqueia o cliente, mas deixa a perda de legibilidade visível antes da publicação.

## Restauração

“Restaurar cores” volta somente a paleta para o modelo original. Composição, largura, quantidade de itens, título personalizado, chamada e ordem do bloco permanecem preservados.
