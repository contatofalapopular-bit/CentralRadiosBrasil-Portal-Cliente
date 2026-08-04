# Guia de atualização — v2.6.0 Etapa 3

## Repositório correto

Publique somente no repositório do **Portal do Cliente**.

Não envie estes arquivos para:

- Portal Público/PWA;
- Worker/API;
- Painel Administrativo;
- firmware;
- qualquer outro repositório.

## Instalação

1. Guarde uma cópia da v2.6.0 Etapa 2 atualmente instalada.
2. Descompacte o pacote da Etapa 3.
3. Envie o conteúdo interno para a raiz do repositório do Portal do Cliente.
4. Substitua os arquivos com nomes iguais.
5. Não envie o ZIP fechado para a raiz.
6. Confirme o commit somente na branch utilizada pelo Portal do Cliente.
7. Aguarde a publicação e pressione `Ctrl + F5`.

## Teste rápido após publicar

1. Abra **Editor Visual**.
2. Escolha um modelo.
3. Clique em um bloco.
4. Desative **Usar cores originais do modelo**.
5. Altere fundo, título, texto, chamada e botão.
6. Confirme a mudança na prévia desktop, tablet e celular.
7. Troque de modelo e confirme que as cores não foram copiadas para ele.
8. Volte ao primeiro modelo e confirme que as cores foram preservadas.
9. Clique em **Salvar rascunho**.
10. Recarregue a página e confirme a persistência.

## Retorno à versão anterior

Em caso de problema, restaure o backup da Etapa 2. Não é necessário reverter Worker ou D1, pois esta entrega não altera endpoints nem exige migração SQL.
