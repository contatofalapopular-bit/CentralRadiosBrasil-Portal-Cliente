# Central Rádios Brasil — Portal do Cliente

## v3.0.0 — Etapa 2: Usuários reais e permissões no servidor

Esta entrega integra o Portal do Cliente ao novo modelo de usuários individuais do Worker v1.17.0. A conta principal existente é preservada como **Administrador principal**, e usuários adicionais passam a ter login, sessão, perfil e permissões validadas pelo servidor.

### Recursos

- lista de usuários carregada diretamente do Worker;
- criação de usuários adicionais;
- perfis Administrador, Editor, Redator, Comercial, Auditor e Somente leitura;
- senha temporária com troca obrigatória;
- edição, suspensão, ativação, exclusão e redefinição de senha;
- proteção da conta principal;
- menus e ações ajustados às permissões recebidas na sessão;
- bloqueio server-side de operações não autorizadas;
- nenhuma lista de usuários usada como autoridade dentro do rascunho do site.

### Identificação técnica

- Portal: `3.0.0-stage2`
- Schema interno: `14`
- Worker mínimo: `1.17.0`
- Endpoint de rascunho preservado: `/api/cliente/site/rascunho`
- Migração manual de SQL: não necessária

### Implantação

Publique primeiro o Worker v1.17.0. Depois publique este Portal e faça `Ctrl + F5`. A conta principal atual continua funcionando e é espelhada automaticamente para a nova estrutura.

---

## Histórico anterior

# Central Rádios Brasil — Portal do Cliente

## v3.0.0 — Etapa 2: Pré-produção e lançamento seguro

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


## v3.0.0 — Etapa 2
Usuários adicionais agora possuem login individual e permissões validadas pelo Worker. A lista de usuários não é mais usada como autoridade dentro do rascunho do site.
