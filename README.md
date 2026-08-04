# Central Rádios Brasil — Portal do Cliente

## v2.6.0 — Etapa 3: Personalização completa de cores por bloco

Esta entrega evolui exclusivamente o **Portal do Cliente**, usando a v2.6.0 Etapa 2 como base. Nenhum arquivo do Worker, Portal Público/PWA, Painel Administrativo, firmware ou outro repositório foi alterado.

### O que foi implementado

Cada um dos 14 blocos, em cada um dos 6 modelos, pode manter uma paleta própria com:

- fundo do bloco;
- títulos;
- textos e descrições;
- chamadas, categorias e metadados;
- fundo dos botões;
- texto dos botões.

As configurações ficam isoladas por **modelo + bloco**. Alterar Notícias no News 24h não modifica Notícias no Gospel, Popular, Regional, Jovem ou Personalizado.

### Controles adicionados

- seletor visual de cor;
- campo hexadecimal sincronizado;
- opção “Usar cores originais do modelo”;
- botão “Restaurar cores” sem apagar composição, título ou ordem do bloco;
- verificação automática de contraste;
- alerta para combinações abaixo de 3:1 ou 4,5:1, conforme o tipo de texto.

### Compatibilidade

- o modelo Jovem continua com a identidade original por padrão;
- registros da Etapa 2 são normalizados automaticamente;
- o mesmo endpoint de rascunho continua sendo usado;
- nenhuma migração SQL é necessária;
- nenhuma biblioteca externa foi adicionada.

### Persistência

Endpoint preservado:

`/api/cliente/site/rascunho`

Estrutura:

`textos_institucionais.cms_v2.editor.blocks[modelo][bloco]`

Campos de cor:

- `useThemeColors`;
- `backgroundColor`;
- `titleColor`;
- `textColor`;
- `eyebrowColor`;
- `buttonColor`;
- `buttonTextColor`.

Release interna: `2.6.0-stage3`  
Schema interno: `11`

### Validação

- bateria específica da Etapa 3: 56/56;
- regressão da Etapa 2: 46/46;
- regressão da Etapa 1: 48/48;
- total em navegador: 150/150;
- persistência real simulada no endpoint existente: aprovada;
- exceções JavaScript: 0;
- erros relevantes de console: 0;
- endpoints adicionados: 0;
- endpoints removidos: 0.
