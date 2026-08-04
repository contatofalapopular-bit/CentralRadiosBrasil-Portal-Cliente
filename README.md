# Central Rádios Brasil — Portal do Cliente

## v2.6.0 — Etapa 2: Editor Visual consolidado

Esta entrega evolui exclusivamente o repositório do **Portal do Cliente**, usando a v2.6.0 Etapa 1 como base.

### O que foi acrescentado

- opções visuais próprias para cada modelo;
- configurações de bloco separadas por tema;
- composição, largura, fundo e alinhamento por bloco;
- quantidade de itens por seção;
- título e chamada personalizados;
- controle de descrição e botão de acesso completo;
- reordenação por arrastar e por setas;
- prévia em desktop, tablet e celular;
- restauração individual do modelo ou do bloco;
- persistência dentro do mesmo rascunho já usado pelo Portal.

### Modelos

- Portal Regional & TV;
- Rádio Popular & Musical;
- News 24h;
- Gospel Inspira;
- Rádio Jovem — identidade original preservada;
- Estúdio Personalizado.

### Isolamento

- nenhum endpoint novo;
- URL do Worker preservada;
- nenhum arquivo do Worker alterado;
- nenhum outro repositório modificado;
- nenhuma biblioteca externa adicionada;
- nenhuma migração SQL;
- dados do editor armazenados em `textos_institucionais.cms_v2.editor` pelo endpoint já existente `/api/cliente/site/rascunho`.

### Compatibilidade

Configurações antigas sem o novo objeto `editor` recebem valores padrão automaticamente. Os IDs dos temas e dos blocos permanecem os mesmos.

### Validação

- 46/46 verificações específicas da Etapa 2;
- 48/48 verificações de regressão da Etapa 1;
- persistência validada no endpoint de rascunho atual;
- 0 exceções JavaScript;
- 0 erros de console relevantes;
- 9 endpoints existentes antes e depois da alteração, sem adições ou remoções.

### Informações internas

- Release: `2.6.0-stage2`;
- Schema interno: `10`;
- migração SQL: não necessária.
