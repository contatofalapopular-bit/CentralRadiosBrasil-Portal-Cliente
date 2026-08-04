# Relatório de Consolidação — v2.4.0 Final

## Base utilizada

- v2.4.0 Etapa 1 — Publicidade e Banners.
- v2.4.0 Etapa 2 — Parceiros e Popups.
- Base editorial v2.3.0 Final Consolidada preservada.

## Ajustes funcionais

### Posicionamento comercial

Foi criado um fluxo único para campanhas e banners ativos. As peças são selecionadas conforme período, publicação, posição e prioridade.

Correspondência das campanhas:

- Topo do site → Após o cabeçalho.
- Após o player → Após o player.
- Player → Após o player.
- Entre programação e notícias → Antes de notícias.
- Entre seções → Entre seções.
- Antes do rodapé → Antes do rodapé.

Em cada posição, a prévia mostra até duas peças de maior prioridade. Em página interna, é exibida a peça de maior prioridade.

### Auditoria comercial no Dashboard

O painel identifica:

- campanha sem anunciante;
- campanha ligada a anunciante desativado;
- campanha ou banner sem peça desktop;
- mais de duas peças concorrendo na mesma posição;
- mais de um banner concorrendo em página interna;
- vários popups elegíveis para o mesmo dispositivo.

### Segurança de vínculos

- A exclusão de anunciante é bloqueada enquanto houver campanha vinculada.
- Campanha publicada com anunciante desativado é rejeitada.
- Cadastros legados continuam sendo carregados.

### Popup acessível

- `role="dialog"` e `aria-modal="true"`.
- Título e descrição associados por identificadores próprios.
- Foco inicial no botão de fechar.
- Foco mantido dentro do popup com Tab e Shift+Tab.
- Fechamento por botão, clique fora e tecla Esc.
- Retorno do foco ao elemento anterior.

## Persistência

- Versão: `2.4.0-final`.
- Schema: `7`.
- Campo de release salvo no `cms_v2`.
- Sem migração SQL.
