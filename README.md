# Portal do Cliente — Central Rádios Brasil

## v2.4.0 — Final Consolidada

Base consolidada sobre a v2.4.0 Etapa 2. Reúne os módulos de anunciantes, campanhas publicitárias, banners, parceiros e popups, preservando integralmente as entregas editoriais da v2.3.0.

### Comercial consolidado

- Cadastro reutilizável de anunciantes.
- Campanhas vinculadas a anunciantes, com período, situação, prioridade, formato, peças desktop/mobile, destino e métricas reais recebidas do Worker.
- Banners editoriais, institucionais e comerciais, com período, prioridade e peças responsivas.
- Parceiros com categoria, descrição, logomarca, contatos, redes sociais, ordem e destaque.
- Popups com período, prioridade, dispositivo, frequência, atraso, CTA e fechamento acessível.

### Correções da consolidação final

- As posições das campanhas agora são respeitadas na prévia.
- Campanhas e banners concorrem pela prioridade em cada posição, sem duplicação do mesmo módulo.
- “Entre seções” é inserido entre conteúdos, e não no final da página.
- “Após o player”, “Antes de notícias” e “Antes do rodapé” aparecem no ponto correto.
- Banners de “Página interna” aparecem ao abrir notícias e outros conteúdos completos.
- O Dashboard informa conflitos de prioridade, peças ausentes, anunciantes inválidos e excesso de popups ativos.
- Anunciantes vinculados a campanhas não podem ser excluídos acidentalmente.
- Campanhas publicadas não podem utilizar anunciante desativado.
- O popup possui identificação acessível, foco inicial, retenção de foco por Tab, fechamento por Esc, botão ou clique externo.
- A abertura da prévia foi ajustada para preservar o foco do popup.

### Integração e dados

- Versão interna: `2.4.0-final`.
- Schema interno: `7`.
- Nenhuma migração SQL necessária.
- O rascunho continua sendo salvo pelo Worker/D1 já utilizado pelo Portal do Cliente.
- A prévia não cria impressões, cliques ou frequência fictícia.
- Métricas e controle de frequência no site público dependem da integração do Portal Público/Worker.

### Instalação

1. Faça backup da versão atualmente publicada.
2. Descompacte este pacote.
3. Publique os arquivos sobre a v2.4.0 Etapa 2.
4. Preserve a configuração do Worker em `config.js`, caso o seu ambiente use uma URL diferente.
5. Limpe o cache com `Ctrl + F5`.
6. Teste login, salvamento, prévia, publicidade, banners, parceiros e popups.

A próxima versão do roadmap é **v2.5.0 — Usuários, permissões, auditoria e backup**.
