# Central Rádios Brasil — Portal do Cliente v1.2.1

## Commit 22.18 — Parte 1 de 7: Estrutura principal

Esta versão reconstrói a estrutura do painel administrativo do cliente com a sequência funcional aprovada:

1. Inicial
2. Configurações
3. Layout
4. Módulos
5. Conteúdo
6. Usuários

As áreas comerciais de Faturas, Contrato e Publicação continuam disponíveis em uma seção secundária, sem interromper a sequência principal de administração do site.

## O que esta entrega implementa

- menu lateral completo e expansível;
- página inicial com dados reais já disponíveis no Worker;
- cabeçalho com identificação do cliente e do site;
- sessão, logout e troca de senha preservados;
- navegação responsiva para computador e celular;
- ligação dos itens do novo menu às telas funcionais já existentes;
- destaque da seção ativa;
- preservação de rascunhos, prévia, histórico, solicitação e aprovação de publicação;
- aviso explícito onde ainda não existem estatísticas reais, sem inventar visitas.

## Compatibilidade

- Worker principal: v1.14.2
- Admin da Central: v3.10.0
- Repositório: `CentralRadiosBrasil-Portal-Cliente`

Esta atualização substitui somente os arquivos do Portal do Cliente. Não exige migração no D1 e não apaga dados.

## Próximas partes

- Parte 2: Configurações
- Parte 3: Layout
- Parte 4: Módulos
- Parte 5: Conteúdo
- Parte 6: Usuários e permissões
- Parte 7: Estatísticas e auditoria
