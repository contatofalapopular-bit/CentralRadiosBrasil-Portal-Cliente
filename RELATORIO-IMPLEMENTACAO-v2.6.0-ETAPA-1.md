# Relatório de implementação — v2.6.0 Etapa 1

## Objetivo

Transformar os temas em experiências realmente distintas, e não apenas variações de cor.

## Referências estudadas

- BandNews FM — hierarquia jornalística, ao vivo, notícias, apresentadores e podcasts.
- Nativa 93 — player, participação, pedido de música, promoções e programação.
- Rádio Melodia — louvores, programação do dia, notícias, eventos e comunidade.
- Rádio Bandeirantes Goiânia — portal regional, editorias, ao vivo, live e conteúdo local.

As referências foram usadas apenas para análise de produto e composição. Nenhum código, marca, texto ou identidade visual foi copiado.

## Alterações principais

- Quatro layouts novos e independentes.
- Paletas exclusivas por modelo.
- Composições próprias de hero, player, notícias e programação.
- Faixa de últimas notícias no News 24h.
- Central ao vivo no Portal Regional & TV.
- Atalhos participativos no Rádio Popular & Musical.
- Blocos de acolhimento e comunidade no Gospel Inspira.
- Modelo Jovem preservado.
- Seletor de temas atualizado com público-alvo e miniaturas estruturais.
- Auditoria interna ampliada para renderizar e validar os seis modelos.

## Arquitetura

As novas estruturas são geradas no `renderSitePreview()` e usam funções específicas de composição. O conteúdo continua vindo das mesmas coleções do CMS.

Não há duplicação de banco, conteúdo ou endpoint.
