# Portal do Cliente — Central Rádios Brasil

## v2.5.0 — Usuários, permissões, auditoria e backup

Versão consolidada construída sobre a **v2.4.0 Final Consolidada**. Preserva os módulos editoriais e comerciais já aprovados e acrescenta controle de acesso, rastreabilidade e recuperação segura do rascunho.

### Usuários e permissões

- Administrador principal protegido contra exclusão e suspensão.
- Cadastro de usuários adicionais com nome, e-mail, perfil, situação e exigência de autenticação em duas etapas.
- Perfis prontos: Administrador, Editor, Redator, Comercial, Auditor e Somente leitura.
- Restrição do menu por área permitida.
- Restrição de ações: visualizar, criar, editar, duplicar, ativar/desativar, excluir, salvar, publicar, gerenciar usuários, auditar, exportar e restaurar backup.
- E-mails duplicados são bloqueados.
- Perfis sem permissão veem ações bloqueadas ou não enxergam as áreas correspondentes.

### Auditoria integrada

- Histórico com usuário, data/hora, ação, área, alvo, resultado e detalhes.
- Registro de criação, edição, duplicação, exclusão, alteração de status, salvamento, publicação, usuários, senhas, auditorias e backups.
- Auditoria funcional interna de rotas, elementos essenciais, identificadores, conteúdos, links, programação, notícias, vídeos, campanhas, usuários, backups, botões e cards da prévia.
- Exportação do histórico em CSV.
- Filtros por sucesso, alerta, erro e permissão negada.

### Backup e recuperação

- Exportação de backup completo em envelope versionado.
- Checksum para verificar integridade antes da importação.
- Compatibilidade com backups legados que possuem `radio`, `modules` e `content`.
- Pontos de restauração manuais e automáticos.
- Ponto automático antes de importar e antes de solicitar publicação.
- Download, restauração e exclusão de pontos.
- Preservação automática do estado atual antes de restaurar outro ponto.
- Limite configurável entre 1 e 10 pontos.

### Integração de dados

- Versão interna: `2.5.0-final`.
- Schema interno: `8`.
- Dados novos gravados em `textos_institucionais.cms_v2.security`, `audit` e `backup`.
- Nenhuma migração SQL obrigatória.
- O rascunho continua sendo salvo pelo endpoint já existente do Worker/D1.

### Observação de segurança

O Portal aplica as permissões no menu e nas ações e persiste a configuração no CMS. Para que usuários adicionais tenham credenciais independentes e para que a proteção seja também validada no servidor, o Worker deve autenticar cada usuário e conferir o perfil/permissão em todos os endpoints de escrita. O contrato esperado está documentado em `INTEGRACAO-WORKER-v2.5.0.md`.

### Auditoria de navegador

Foram executadas **190 verificações em Chromium**, divididas em quatro baterias:

- Navegação e conteúdo editorial: 74/74.
- Comercial, editor, temas e prévia: 64/64.
- Usuários, auditoria, backup, configurações e publicação: 32/32.
- Perfis e bloqueios de permissão: 20/20.

Resultado: **190/190 aprovadas**, com **0 exceções JavaScript** e **0 erros de console**. A API foi simulada para não alterar produção.

### Instalação

1. Faça backup da **v2.4.0 Final Consolidada**.
2. Descompacte este pacote.
3. Publique os arquivos sobre a versão atual do Portal do Cliente.
4. Preserve a URL correta do Worker em `config.js`.
5. Limpe o cache com `Ctrl + F5`.
6. Teste login, salvamento, usuários, auditoria, backup e publicação.

A próxima versão do roadmap é **v2.6.0 — Editor visual e temas consolidados**.
