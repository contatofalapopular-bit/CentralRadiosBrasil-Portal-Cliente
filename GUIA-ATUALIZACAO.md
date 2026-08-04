# Guia de atualização — v2.3.0 Etapa 2

Base anterior: **v2.3.0 — Etapa 1: Podcasts e Vídeos**  
Nova entrega: **v2.3.0 — Etapa 2: Promoções e Eventos**

1. Faça uma cópia da instalação atual.
2. Substitua os arquivos do Portal pelos arquivos deste pacote.
3. Não altere `WORKER_URL` em `config.js`.
4. Publique normalmente no mesmo repositório/serviço.
5. Abra o Portal e pressione `Ctrl + F5`.
6. Teste Promoções e Eventos antes de publicar o rascunho real.

## Banco e integração

Não existe migração SQL. Os novos campos continuam dentro de `textos_institucionais.promocoes` e `textos_institucionais.eventos`, no mesmo rascunho persistido pelo Worker/D1.

Registros antigos são normalizados automaticamente. Campos não existentes recebem valores seguros sem apagar dados.
