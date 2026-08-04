# Relatório de Testes — v2.4.0 Final Consolidada

## Ambiente

- Chromium headless.
- API do Worker simulada em memória.
- Nenhum dado de produção foi acessado ou alterado.
- Pacote carregado com CSS e JavaScript reais da entrega.

## Resultado

**98 de 98 verificações aprovadas.**

### Cobertura

- Identificação da versão final.
- Dashboard consolidado e auditoria comercial.
- 29 áreas do menu abertas individualmente.
- Popup aberto, identificado e fechado por Esc.
- Foco inicial e estrutura acessível do popup.
- Campanhas nas posições:
  - após o cabeçalho;
  - após o player;
  - antes de notícias;
  - entre seções;
  - antes do rodapé.
- Ordem física das posições no documento.
- Banner de página interna.
- Abertura do conteúdo completo da notícia.
- Proteção contra exclusão de anunciante vinculado.
- Salvamento no Worker simulado.
- Persistência de `release: 2.4.0-final` e `schemaVersion: 7`.
- Seis temas:
  - Morada;
  - Music;
  - News;
  - Gospel;
  - Jovem;
  - Personalizado.
- Cada tema em desktop, tablet e celular.
- Preservação da publicidade em todos os temas e tamanhos.
- Auditoria de nomes acessíveis dos botões.
- Zero exceções JavaScript.
- Zero erros de console.

## Validação estática adicional

- Sintaxe JavaScript aprovada por `node --check`.
- Nenhum ID duplicado no HTML principal.
- Nenhum nome de função duplicado no JavaScript.
- Configuração e identificação da versão final confirmadas.
