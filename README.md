# Central Rádios Brasil — Portal do Cliente

## v2.6.0 — Final Consolidada

Esta versão encerra a fase **Editor Visual e temas consolidados**. Ela reúne, em uma única base estável do Portal do Cliente:

- seis modelos de site, com estruturas visuais distintas;
- modelo Jovem preservado por padrão;
- opções específicas por modelo;
- 14 blocos ativáveis, reordenáveis e configuráveis;
- configurações independentes por modelo e bloco;
- cores próprias de fundo, títulos, textos, chamadas e botões;
- verificação automática de contraste;
- prévia em tempo real para desktop, tablet e celular;
- validação obrigatória de formato, peso e dimensões das imagens antes do envio;
- Editor Visual reorganizado, sem rolagem horizontal geral nas resoluções auditadas;
- usuários, permissões, auditoria e backup preservados;
- todos os módulos editoriais e comerciais das versões anteriores.

### Correção encontrada na consolidação

A auditoria final identificou que os blocos montados no trecho complementar de alguns modelos eram exibidos, mas não recebiam integralmente o título, composição e cores escolhidos no Editor Visual. A montagem foi unificada para que **todos os blocos**, inclusive os posicionados automaticamente no restante da página, passem pelo mesmo mecanismo de apresentação.

### Identificação técnica

- Release interna: `2.6.0-final`
- Schema interno: `12`
- Endpoint de rascunho: `/api/cliente/site/rascunho`
- Migração SQL: não necessária

### Isolamento

Esta entrega modifica somente arquivos do **Portal do Cliente**. Não houve alteração no Worker, D1, Portal Público/PWA, Painel Administrativo, firmware ou outro repositório. A URL do Worker e os nove endpoints existentes foram preservados.

### Auditoria final

- verificações em Chromium: 46/46;
- verificações estáticas e de isolamento: 20/20;
- total da consolidação: **66/66 aprovadas**;
- exceções JavaScript: 0;
- erros relevantes de console: 0;
- endpoints adicionados: 0;
- endpoints removidos: 0.

Consulte `RELATORIO-CONSOLIDACAO-v2.6.0-FINAL.md` e `RESULTADOS-AUDITORIA-v2.6.0-FINAL.json`.
