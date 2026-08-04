# Análise de isolamento — v2.6.0 Final Consolidada

## Escopo autorizado

Somente o repositório do Portal do Cliente.

## Comparação com a Etapa 4.1

- `styles.css`: preservado integralmente;
- `config.js`: somente a identificação da versão foi atualizada;
- `WORKER_URL`: preservada;
- `TOKEN_KEY`: preservada;
- timeout de requisições: preservado;
- nove endpoints: preservados;
- endpoint novo: nenhum;
- endpoint removido: nenhum;
- arquivo SQL: nenhum;
- migração de D1: nenhuma;
- biblioteca externa: nenhuma.

## Alteração funcional da consolidação

A função que reúne os blocos restantes da página passou a chamar o mesmo pipeline de apresentação usado pelos blocos principais. Isso garante que título, largura, composição, fundo, alinhamento, visibilidade e cores sejam aplicados a todos os blocos, independentemente da posição escolhida pelo modelo.

## Repositórios não alterados

- Worker/API;
- Portal Público/PWA;
- Painel Administrativo;
- firmware ESP32;
- outros repositórios do ecossistema.
