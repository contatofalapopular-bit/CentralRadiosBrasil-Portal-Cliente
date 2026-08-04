# Guia de atualização — v2.3.0 Etapa 1

Base anterior: **v2.2.1 — Auditoria Funcional**  
Nova entrega: **v2.3.0 — Etapa 1: Podcasts e Vídeos**

## Procedimento

1. Guarde uma cópia da instalação v2.2.1.
2. Descompacte este pacote.
3. Substitua no repositório do Portal do Cliente os arquivos `index.html`, `app.js`, `styles.css`, `config.js` e `manifest.webmanifest`.
4. Publique normalmente no GitHub/Cloudflare usado pelo projeto.
5. Abra o portal e pressione `Ctrl+F5` para limpar o cache da versão anterior.
6. Teste a abertura de um podcast e de um vídeo já cadastrados antes de criar novos registros.

## Banco de dados

Não há migração SQL. Os novos campos continuam sendo salvos no conteúdo do site já utilizado pelo Worker/D1.

## Compatibilidade

Os podcasts e vídeos antigos permanecem carregáveis. Ao editar um registro antigo, o CMS passa a oferecer os novos campos de organização e validação.
