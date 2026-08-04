# Portal do Cliente v2.3.0 — Etapa 1: Podcasts e Vídeos

Evolução direta da v2.2.1 — Auditoria Funcional. Mantém a arquitetura integrada com Worker + D1 e não exige migração SQL.

## Podcasts

- organização por programa, temporada e número do episódio;
- data de publicação, duração, categoria e destaque;
- URL pública de áudio obrigatória e validada;
- bloqueio de episódio duplicado dentro do mesmo programa/temporada;
- busca, filtros por publicação e programa, e ordenação;
- player completo na visualização do CMS e na prévia pública;
- cards com capa, destaque, episódio, data e duração.

## Vídeos

- suporte a YouTube, Vimeo, MP4, WebM, OGG, MOV, M4V, HLS e links externos;
- tipo automático ou escolhido pelo cliente, com validação de compatibilidade;
- categoria, data, duração, miniatura e destaque;
- miniatura automática para YouTube quando não houver imagem personalizada;
- bloqueio de URL duplicada;
- busca, filtros por publicação e categoria, e ordenação;
- player incorporado ou abertura segura do link original.

## Instalação

Substitua os arquivos da v2.2.1 pelos arquivos desta pasta e atualize o navegador com Ctrl+F5. Preserve um backup da versão anterior.
