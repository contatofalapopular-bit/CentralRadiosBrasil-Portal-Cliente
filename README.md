# Central Rádios Brasil — Portal do Cliente

## v2.6.0 — Etapa 4.1: Reorganização do Editor Visual

Esta entrega evolui exclusivamente o **Portal do Cliente**, usando a v2.6.0 Etapa 3 como base. Nenhum arquivo do Worker, Portal Público/PWA, Painel Administrativo, firmware ou outro repositório foi alterado.

### Validação antes do envio

Todo novo arquivo de imagem é conferido antes da chamada ao endpoint de mídia:

- formatos permitidos: JPG, PNG e WEBP;
- largura e altura reais em pixels;
- proporção correspondente ao padrão informado;
- peso máximo original do arquivo;
- obrigatoriedade da imagem nos cadastros que exigem peça, capa ou logomarca.

O Portal **não recorta, não redimensiona e não comprime automaticamente**. Um arquivo fora do padrão é rejeitado e a mensagem mostra o valor recebido e o padrão exigido.

### Campos abrangidos

Logomarca da rádio, banner principal, player, programação, locutores, notícias, podcasts, vídeos, promoções, galeria, eventos, equipe, anunciantes, campanhas desktop/mobile, parceiros, banners desktop/mobile, popups, SEO, ícone do aplicativo e QR Code.

### Compatibilidade e isolamento

- endpoint de mídia preservado: `/api/cliente/site/midias`;
- endpoint de rascunho preservado: `/api/cliente/site/rascunho`;
- endpoints adicionados: 0;
- endpoints removidos: 0;
- Worker e D1 não alterados;
- nenhuma migração SQL;
- conteúdos anteriores preservados;
- imagens já cadastradas não são apagadas automaticamente;
- toda nova seleção passa pela validação obrigatória.

### Auditoria

- testes específicos: 39/39;
- regressão Etapa 1: 48/48;
- regressão Etapa 2: 46/46;
- regressão Etapa 3: 56/56;
- total: **189/189 verificações aprovadas**;
- persistência: aprovada;
- exceções JavaScript: 0;
- erros relevantes de console: 0.

Release interna: `2.6.0-stage4`  
Schema interno: `12`


## Correção de usabilidade — Editor Visual

- elimina a rolagem horizontal geral do módulo em resoluções comuns de notebook e desktop;
- mantém lista de blocos, controles e prévia organizados em colunas proporcionais;
- prévia ao vivo permanece fixa enquanto os controles possuem rolagem independente;
- ao selecionar um bloco, a coluna de controles desloca-se para a configuração correspondente sem retirar a prévia da tela;
- reduz espaçamentos e tamanhos internos para aproveitar melhor a área útil;
- adapta o editor para desktop, tablet e celular sem alterar os modelos do site;
- preserva validação de imagens, cores por bloco, schema 12 e os endpoints existentes.

Release interna: `2.6.0-stage4.1`.
