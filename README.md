# Portal do Cliente v2.3.0 — Versão final consolidada

Base anterior: **v2.3.0 — Etapa 2: Promoções e Eventos**.

Esta entrega consolida, em uma única versão estável, os módulos:

- Podcasts;
- Vídeos;
- Promoções;
- Eventos.

Também preserva integralmente as entregas anteriores de usabilidade, prévia, programação, locutores, notícias, temas e auditoria funcional.

## Correções da consolidação

- A programação só mostra **AGORA** quando o dia e o horário realmente correspondem ao programa.
- A grade completa é ordenada de forma consistente por dia e horário.
- Os botões de reprodução da prévia passam a manter o mesmo estado visual.
- A navegação do cabeçalho e do rodapé exibe apenas seções realmente disponíveis.
- Registros legados sem campo de destaque não são mais marcados automaticamente como destacados durante a edição.
- O Dashboard ganhou um resumo integrado dos quatro módulos da v2.3.0.
- Identificação interna atualizada para `2.3.0-final` e schema interno `5`.

## Compatibilidade

- Nenhuma migração SQL é necessária.
- O formato atual do Worker/D1 foi preservado.
- Registros das etapas anteriores continuam compatíveis.
- A publicação continua supervisionada pela Central Rádios Brasil.
