# Relatório de implementação — v2.6.0 Etapa 2

## Escopo

Consolidação do Editor Visual com opções independentes por modelo e por bloco, mantendo o mesmo conteúdo editorial e o mesmo fluxo de rascunho.

## Opções por modelo

Cada modelo recebeu controles adequados à sua finalidade, como cabeçalho, densidade, organização de manchetes, central ao vivo, atalhos de participação, faixa de notícias, formato do banner e superfícies. O modelo Jovem preserva sua identidade original.

## Opções por bloco

Cada tema guarda, separadamente, as configurações dos 14 blocos: composição, largura, fundo, alinhamento, limite de itens, título, chamada, descrição e acesso completo.

## Compatibilidade

- normalização automática de dados antigos;
- IDs existentes preservados;
- objeto novo salvo dentro de `cms_v2.editor`;
- schema interno 10;
- sem migração SQL.

## Correção adicional

O botão de prévia em tela cheia foi protegido contra o objeto de evento do navegador ser interpretado como ID de tema.
