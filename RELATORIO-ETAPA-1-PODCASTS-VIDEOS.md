# Relatório — v2.3.0 Etapa 1

## Escopo concluído

A etapa consolida os módulos Podcasts e Vídeos sobre a base estável v2.2.1.

### Compatibilidade

Os registros antigos continuam aceitos. Campos novos recebem valores padrão ao carregar: temporada, episódio, duração, destaque e tipo do vídeo. A persistência permanece dentro de `textos_institucionais`, portanto não há migração D1.

### Validações

- URLs públicas HTTP/HTTPS;
- episódios duplicados por programa, temporada e número;
- vídeos duplicados por URL;
- compatibilidade entre tipo selecionado e URL;
- números inteiros não negativos para temporada, episódio e duração.

### Próxima etapa

A Etapa 2 da v2.3.0 será Promoções e Eventos.
