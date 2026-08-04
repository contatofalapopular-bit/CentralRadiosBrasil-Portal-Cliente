# Portal do Cliente — Central Rádios Brasil

## v2.6.0 — Etapa 1: Modelos diferenciados em código

Esta etapa foi construída sobre a **v2.5.0 Final Auditoria** e altera somente o repositório do **Portal do Cliente**.

Não houve alteração no Worker, no Portal Público/PWA, no Painel Administrativo, no firmware ou em qualquer outro repositório.

## Modelos disponíveis

### Portal Regional & TV

- Central de rádio e vídeo ao vivo.
- Hero editorial com player lateral.
- Manchetes locais em mosaico.
- Vídeos e programação em sequência de portal regional.
- Paleta azul, azul-marinho, laranja e azul-claro.

### Rádio Popular & Musical

- Player protagonista.
- Atalhos de pedido musical, promoções e programação.
- Hero e cards com linguagem mais quente e participativa.
- Podcasts em vitrine visual.
- Paleta coral, roxo profundo, amarelo e creme.

### News 24h

- Faixa de últimas notícias.
- Hierarquia forte de manchetes.
- Player em barra editorial.
- Programação em lista compacta.
- Paleta azul, azul-marinho, vermelho de alerta e cinza-claro.

### Gospel Inspira

- Hero acolhedor e centralizado.
- Blocos de programação, louvores, vídeos e agenda.
- Player e programação em composição própria.
- Paleta verde-petróleo, verde profundo, dourado e marfim.

### Rádio Jovem

O código e a identidade do modelo Jovem foram preservados.

### Estúdio Personalizado

Continua usando as cores cadastradas pela emissora, com estrutura flexível para projetos premium.

## Compatibilidade e isolamento

- IDs dos temas foram preservados: `morada`, `spotify`, `news`, `gospel`, `young` e `custom`.
- Conteúdos cadastrados na v2.5.0 continuam compatíveis.
- A URL do Worker em `config.js` não foi alterada.
- Nenhum endpoint novo foi criado.
- Nenhuma migração SQL é necessária.
- Schema interno: `9`.
- Release interna: `2.6.0-stage1`.

## Auditoria

A bateria em Chromium aprovou **48 de 48 verificações**, cobrindo:

- login simulado sem produção;
- 30 áreas do menu;
- seis modelos;
- estruturas específicas de cada modelo;
- desktop, tablet e celular;
- paletas distintas;
- abertura de notícias e programação;
- troca de tema;
- prévia ao vivo do Editor Visual;
- auditoria interna dos seis modelos;
- ausência de exceções JavaScript.

A API foi simulada e nenhum dado de produção foi alterado.

## Instalação

1. Faça backup da v2.5.0 instalada.
2. Descompacte o ZIP.
3. Envie o conteúdo interno somente ao repositório `CentralRádiosBrasil-Portal-Cliente`.
4. Não envie o ZIP fechado.
5. Não altere o Worker nem outros repositórios.
6. Aguarde o GitHub Pages concluir a publicação.
7. Pressione `Ctrl + F5`.
8. Abra **Temas** e visualize os seis modelos.

