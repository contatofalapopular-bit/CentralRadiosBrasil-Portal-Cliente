# Análise de dependências e isolamento — v2.6.0 Etapa 1

## Escopo permitido

Somente os arquivos do Portal do Cliente foram alterados:

- `app.js`
- `styles.css`
- `index.html`
- `config.js` — apenas número da versão
- `manifest.webmanifest` — apenas número da versão

## Escopo não alterado

- Worker/API
- Banco D1
- Portal Público/PWA
- Painel Administrativo
- Firmware ESP32
- Repositórios de emissoras
- Domínios e rotas externas

## Verificações realizadas

- A URL `WORKER_URL` permaneceu idêntica à v2.5.0.
- A lista de endpoints `/api/cliente/*` permaneceu idêntica.
- Nenhuma biblioteca externa foi adicionada.
- Nenhuma fonte externa foi adicionada.
- Nenhum asset de terceiros foi incorporado.
- Os IDs dos seis temas foram preservados para evitar quebra de registros existentes.
- Os novos layouts usam somente dados já existentes no rascunho do CMS.

## Persistência

O schema interno passou de 8 para 9 dentro de `textos_institucionais.cms_v2`, mas o formato continua sendo salvo pelo endpoint de rascunho já existente. Não há necessidade de migração SQL nem de alteração no Worker.

## Rollback

Para voltar à versão anterior, basta republicar o conteúdo do ZIP `CentralRadiosBrasil-Portal-do-Cliente-v2.5.0-Final-Auditoria.zip` no mesmo repositório.
