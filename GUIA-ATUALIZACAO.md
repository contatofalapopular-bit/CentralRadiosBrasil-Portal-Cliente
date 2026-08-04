# Guia de atualização — v2.6.0 Etapa 4

## Repositório correto

Publique somente no repositório do **Portal do Cliente**. Não envie estes arquivos ao Worker, Portal Público/PWA, Admin ou firmware.

## Procedimento

1. Guarde uma cópia da v2.6.0 Etapa 3 instalada.
2. Descompacte este pacote.
3. Envie o conteúdo interno para a raiz do repositório do Portal do Cliente.
4. Confirme a substituição de `index.html`, `app.js`, `styles.css`, `config.js` e `manifest.webmanifest`.
5. Aguarde a publicação e pressione `Ctrl + F5`.
6. Teste ao menos uma imagem válida e uma imagem fora do padrão.

## Retorno

Para desfazer, republique a cópia da Etapa 3. Não há migração SQL nem alteração no Worker.
