# Relatório — v2.4.0 Etapa 1

## Escopo
Publicidade e banners, incluindo cadastro de anunciantes.

## Regras implementadas
- Situação automática por data e horário: agendada/ativa/encerrada.
- Controles manuais de pausa e cancelamento.
- Prioridade de 0 a 999.
- Imagens desktop obrigatórias e imagem mobile opcional com fallback.
- Links restritos a HTTP/HTTPS.
- Bloqueio de duplicidades.
- Campanhas exigem anunciante cadastrado.
- Métricas são somente leitura de dados persistidos; nenhum número é inventado pela prévia.

## Compatibilidade
Registros legados são normalizados automaticamente. Schema interno do CMS: 6. Nenhuma migração SQL.
