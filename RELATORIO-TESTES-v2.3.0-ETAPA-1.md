# Relatório de testes — v2.3.0 Etapa 1

Data: 03/08/2026  
Ambiente: Chromium headless com API simulada, sem alteração no Worker/D1 de produção.

## Resultado

- Auditoria de regressão da v2.2.1: **72 de 72 verificações aprovadas**.
- Testes específicos de Podcasts e Vídeos: **19 de 19 verificações aprovadas**.
- Total: **91 de 91 verificações aprovadas**.
- Exceções JavaScript: **0**.

## Testes específicos aprovados

- indicadores e campos completos de Podcasts;
- filtro por programa e ordenação;
- criação de episódio com temporada, número, duração, categoria e destaque;
- bloqueio de episódio duplicado;
- bloqueio de áudio sem URL pública válida;
- abertura do player e exibição dos metadados;
- indicadores e campos completos de Vídeos;
- filtro por categoria e ordenação;
- criação de vídeo do YouTube Shorts;
- bloqueio de URL duplicada, inclusive formatos diferentes do mesmo vídeo do YouTube/Vimeo;
- validação de incompatibilidade entre tipo selecionado e endereço;
- abertura em iframe;
- miniatura automática do YouTube;
- cards de mídia sem ações mortas.

## Regressão preservada

Continuaram aprovados os fluxos de programação, notícias, locutores, promoções, eventos, galeria, publicidade, parceiros, temas, prévia responsiva, WhatsApp, aplicativo, configurações, criação, edição, duplicação, ativação e exclusão.
