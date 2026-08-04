# Guia de atualização — Portal do Cliente v3.0.0 Etapa 2

1. Confirme que o Worker v1.17.0 está implantado e que `/api` informa `1.17.0`.
2. Faça backup do repositório atual do Portal do Cliente.
3. Envie **todo o conteúdo desta pasta** para a raiz do repositório do Portal do Cliente.
4. Não envie a pasta externa do pacote; `index.html`, `app.js`, `styles.css` e `config.js` devem ficar na raiz.
5. Aguarde a publicação do GitHub Pages e pressione `Ctrl + F5`.
6. Entre com a conta principal e abra **Usuários**.
7. Crie um usuário de teste, copie a senha temporária e valide a troca obrigatória.

## Rollback

O ZIP principal contém a versão anterior completa. Se for necessário retornar, restaure o Portal anterior e o Worker compatível. As novas tabelas do D1 podem permanecer; não as apague.
