# Guia de atualização — Portal do Cliente v2.6.0 Final Consolidada

## Repositório correto

Publique estes arquivos somente no repositório do **Portal do Cliente**, na mesma branch atualmente usada pelo GitHub Pages.

Não envie este pacote para o Worker, Portal Público/PWA, Painel Administrativo, firmware ou qualquer outro repositório.

## Antes de atualizar

1. Faça uma cópia da versão v2.6.0 Etapa 4.1 instalada.
2. Confirme que o repositório selecionado é o Portal do Cliente.
3. Não apague configurações, secrets ou arquivos de outros projetos.

## Instalação

1. Descompacte o ZIP.
2. Abra a pasta interna `CentralRadiosBrasil-Portal-Cliente-v2.6.0-Final-Consolidada`.
3. Envie o conteúdo interno para a raiz do repositório do Portal do Cliente.
4. Substitua `index.html`, `app.js`, `styles.css`, `config.js` e `manifest.webmanifest`.
5. Mantenha os arquivos históricos já existentes no repositório.
6. Aguarde o GitHub Pages concluir a implantação.
7. Abra o Portal e pressione `Ctrl + F5`.

## Validação recomendada

- abra os seis modelos;
- altere um título e uma cor em um bloco que esteja no fim da página;
- confirme a mudança imediatamente na prévia;
- teste uma imagem correta e outra fora das dimensões;
- percorra desktop, tablet e celular;
- salve o rascunho;
- abra Auditoria e execute a auditoria completa.

## Retorno à versão anterior

Republique a cópia da Etapa 4.1. Não existe migração SQL e não houve alteração no Worker, portanto o retorno é feito somente pelos arquivos do Portal do Cliente.
