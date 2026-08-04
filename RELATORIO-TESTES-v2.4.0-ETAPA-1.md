# Relatório de Testes — v2.4.0 Etapa 1

## Resultado

- Regressão integrada da v2.3.0: **64/64**
- Testes específicos de Publicidade e Banners: **38/38**
- Total: **102/102 verificações aprovadas**
- Exceções JavaScript: **0**
- Erros de console: **0**

## Cobertura específica

- Cadastro, visualização e duplicidade de anunciantes.
- Vínculo obrigatório entre campanha e anunciante.
- Campanhas ativas, agendadas, encerradas, pausadas e canceladas.
- Período por data e horário, prioridade, posição e formato.
- Imagens separadas para desktop e celular.
- Métricas reais de impressões, cliques e CTR em modo somente leitura.
- Confirmação de que a prévia não incrementa nem inventa métricas.
- Banners editoriais, comerciais e institucionais.
- Posições após o cabeçalho, antes de notícias, entre seções e antes do rodapé.
- Filtros, ordenação, validação de links, períodos e duplicidades.
- Persistência do schema interno 6 no rascunho do Worker/D1 simulado.
- Regressão das 29 áreas do menu, módulos editoriais, seis temas e três tamanhos de prévia.

Os testes usaram API simulada e não alteraram dados de produção.
