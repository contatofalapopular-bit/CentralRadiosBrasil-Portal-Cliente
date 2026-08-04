# Relatório de testes — v3.0.0 Etapa 1

## Bateria 1 — Regressão funcional

- 31 áreas do menu;
- Editor Visual em quatro resoluções;
- seis temas;
- configurações por bloco;
- cores personalizadas;
- abertura de conteúdos;
- validação de imagens;
- salvamento;
- auditoria;
- isolamento de endpoints.

Resultado: **46/46 aprovadas**.

## Bateria 2 — Pré-produção

- indicador de conexão;
- abertura da nova área;
- separação entre Portal e servidor;
- classificação de piloto e produção geral;
- persistência da análise;
- schema e release;
- exportação JSON;
- ponto de segurança;
- atalhos para Auditoria e Publicação;
- pré-checagem antes da solicitação;
- ausência de endpoint novo;
- erros JavaScript e console.

Resultado: **20/20 aprovadas**.

## Bateria 3 — Isolamento estático

- arquivos principais;
- sintaxe JavaScript;
- versão e schema;
- WORKER_URL;
- nove endpoints;
- ausência de biblioteca externa;
- ausência de SQL ou código do Worker;
- persistência no mesmo `cms_v2`;
- monitor de conexão;
- captura de falhas;
- preservação da validação de imagens e dos seis temas;
- IDs HTML únicos;
- manifesto e política de referência.

Resultado: **21/21 aprovadas**.

## Total

**87/87 verificações aprovadas.**
