# Auditoria integrada — v2.5.0

## Resultado geral

- Total: 190 verificações.
- Aprovadas: 190.
- Falhas: 0.
- Exceções JavaScript: 0.
- Erros de console: 0.

## Bateria 1 — Navegação e conteúdo editorial

**74/74 aprovadas**.

- 30 áreas do menu abertas.
- Programação, locutores, notícias, podcasts, vídeos, promoções e galeria.
- Visualizar conteúdo salvo.
- Abrir edição.
- Abrir novo cadastro.
- Duplicar e excluir cópia.
- Ativar e desativar quando aplicável.

## Bateria 2 — Comercial, editor, temas e prévia

**64/64 aprovadas**.

- Eventos, equipe, anunciantes, campanhas, parceiros, banners e popups.
- Visualização, edição, novo cadastro, duplicação, exclusão e status.
- Editor visual e alternância de blocos.
- Seis temas.
- Prévia desktop, tablet e celular.
- Abertura dos conteúdos salvos pelos cards da prévia.

## Bateria 3 — Sistema

**32/32 aprovadas**.

- Usuários: criar, editar, suspender, ativar e excluir.
- Alteração de senha.
- Auditoria interna com 82 verificações e nenhuma falha.
- Exportação CSV.
- Criação, download, restauração, importação e exclusão de backup.
- Checksum validado.
- Configurações, publicação e salvamento.
- Persistência do schema 8, security, audit e backup.

## Bateria 4 — Permissões

**20/20 aprovadas**.

- Redator vê conteúdo e não vê comercial, usuários, backup ou publicação.
- Redator pode criar e editar, mas não excluir nem alterar status.
- Somente leitura não cria, edita ou salva, mas visualiza.
- Comercial acessa campanhas e não acessa conteúdo editorial.

## Ambiente

- Chromium headless.
- API Worker simulada.
- Nenhum dado real de produção foi alterado.
