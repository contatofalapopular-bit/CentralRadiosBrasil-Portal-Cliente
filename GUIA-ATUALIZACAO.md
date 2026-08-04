# Guia de atualização — v2.4.0 Final Consolidada

## Origem

Atualize a partir da **v2.4.0 Etapa 2 — Parceiros e Popups**.

## Procedimento

1. Baixe e guarde uma cópia completa da instalação atual.
2. Confirme a URL do Worker existente em `config.js`.
3. Substitua os arquivos da instalação pelos arquivos deste pacote.
4. Não execute migração SQL: o schema de dados permanece na versão 7.
5. Abra o Portal do Cliente e use `Ctrl + F5`.
6. Salve um rascunho de teste.
7. Abra a prévia nos modos desktop, tablet e celular.
8. Confira campanhas e banners em suas posições.
9. Abra uma notícia e confira o banner de página interna.
10. Teste o fechamento do popup por botão, clique externo e tecla Esc.

## Reversão

Se ocorrer um problema no ambiente publicado, restaure o backup da v2.4.0 Etapa 2. Os dados permanecem compatíveis, pois não houve migração SQL.
