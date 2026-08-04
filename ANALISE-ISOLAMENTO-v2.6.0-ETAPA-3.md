# Análise de isolamento — v2.6.0 Etapa 3

## Escopo alterado

Somente os arquivos do Portal do Cliente:

- `app.js`;
- `styles.css`;
- `index.html`;
- `config.js` apenas para atualizar a identificação da versão;
- documentação e resultados de testes.

## Worker e endpoints

A URL do Worker foi mantida sem alteração.

Os 9 endpoints da Etapa 2 continuam exatamente os mesmos:

- `/api/cliente/login`;
- `/api/cliente/logout`;
- `/api/cliente/sessao`;
- `/api/cliente/dashboard`;
- `/api/cliente/site`;
- `/api/cliente/site/midias`;
- `/api/cliente/site/rascunho`;
- `/api/cliente/site/solicitar-publicacao`;
- `/api/cliente/trocar-senha`.

Endpoints adicionados: **0**  
Endpoints removidos: **0**

## Banco e persistência

Não há tabela nova, coluna nova ou migração SQL. As configurações são incluídas no mesmo JSON do rascunho já utilizado pelo CMS.

## Compatibilidade

Dados anteriores sem campos de cor recebem automaticamente as cores originais do modelo. Portanto, a atualização não modifica visualmente os sites existentes até o cliente desativar a opção “Usar cores originais do modelo”.
