# Central Rádios Brasil — Portal do Cliente

## v3.0.0 — Etapa 1: Pré-produção e lançamento seguro

Esta entrega inicia a preparação real do CMS para uso por clientes. Ela foi construída exclusivamente sobre a **v2.6.0 Final Consolidada** e não modifica Worker, D1, Portal Público/PWA, Painel Administrativo, firmware ou qualquer outro repositório.

### O que foi adicionado

- nova área **Pré-produção** no menu do Portal;
- análise separada entre requisitos comprováveis no navegador e requisitos que dependem do servidor;
- classificação independente:
  - Portal apto ou não para piloto controlado;
  - lançamento geral apto ou pendente;
- diagnóstico de conexão com o Worker;
- indicador visual de conexão na barra superior;
- validação de identidade, e-mail, localização, stream, domínio, tema e blocos;
- verificação de auditoria, backup e administrador principal;
- registro de falhas JavaScript e promessas não tratadas na sessão;
- exportação do relatório de pré-produção em JSON;
- criação de ponto de restauração antes do piloto;
- pré-checagem local antes de solicitar publicação;
- histórico das análises salvo no mesmo rascunho atual.

### Limites desta etapa

O Portal não afirma que os controles abaixo já existem no servidor. Eles aparecem como **pendências externas obrigatórias**:

- permissões validadas em cada endpoint;
- isolamento entre emissoras;
- validação de mídias no servidor;
- expiração e revogação de sessões;
- rate limiting e proteção contra tentativas de login;
- CORS restrito aos domínios autorizados;
- backup e recuperação reais do D1 e das mídias.

Nenhuma dessas pendências foi alterada nesta entrega. Elas deverão ser analisadas antes de qualquer mudança no Worker.

### Identificação técnica

- Release interna: `3.0.0-stage1`
- Schema interno: `13`
- Endpoint de rascunho: `/api/cliente/site/rascunho`
- Endpoints existentes: `9`
- Endpoints novos: `0`
- Migração SQL: não necessária

### Auditoria

- regressão funcional da v2.6.0: **46/46**;
- testes específicos de pré-produção: **20/20**;
- verificações estáticas e de isolamento: **21/21**;
- total desta entrega: **87/87 aprovadas**;
- exceções JavaScript: `0`;
- erros relevantes de console: `0`.

Consulte os relatórios incluídos no pacote antes de avançar para a análise do Worker e do D1.
