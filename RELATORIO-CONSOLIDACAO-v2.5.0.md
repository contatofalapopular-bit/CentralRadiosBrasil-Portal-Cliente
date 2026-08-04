# Relatório de consolidação — Portal do Cliente v2.5.0

## Escopo

Consolidação dos módulos de usuários, permissões, auditoria e backup sobre a v2.4.0 Final Consolidada.

## Entregas

### Usuários

- Administrador principal protegido.
- CRUD de usuários adicionais.
- Situações Ativo, Convite pendente e Suspenso.
- Exigência de 2FA por usuário.
- Bloqueio de e-mail duplicado.
- Alteração de senha da conta atual pelo endpoint existente.

### Permissões

- Seis perfis padrão.
- Áreas de acesso por perfil e por usuário.
- Menu filtrado pela permissão de visualização.
- Ações bloqueadas conforme o perfil.
- Testes específicos para Redator, Comercial e Somente leitura.

### Auditoria

- Histórico persistido no rascunho.
- Auditoria funcional executável pelo painel.
- Exportação CSV.
- Registro de falhas e permissões negadas.

### Backup

- Envelope versionado e checksum.
- Importação com validação de integridade.
- Pontos manuais e automáticos.
- Restauração com preservação do estado atual.
- Configuração de limite e automações.

## Dados

- Release: `2.5.0-final`.
- Schema: `8`.
- Migração SQL: não necessária.
- Persistência: Worker/D1 pelo rascunho já existente.

## Resultado

A versão passou em 190 de 190 verificações automatizadas em navegador, sem exceções JavaScript e sem erros de console.
