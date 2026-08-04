# Guia de atualização — v2.5.0 Final

## Base de origem

Atualize a partir da **v2.4.0 Final Consolidada**.

## Procedimento

1. Baixe e guarde uma cópia da instalação atual.
2. Exporte também um backup JSON pelo painel atual.
3. Descompacte o pacote da v2.5.0.
4. Substitua os arquivos publicados do Portal do Cliente.
5. Confira `config.js` e preserve a URL do Worker do seu ambiente.
6. Faça `Ctrl + F5` após a publicação.
7. Entre no painel e abra:
   - Usuários e acesso;
   - Auditoria;
   - Backup;
   - Publicação.
8. Execute a auditoria completa dentro do painel.
9. Crie um ponto de restauração antes de iniciar novos cadastros.

## Compatibilidade

- Nenhuma migração SQL é necessária.
- O schema interno passa de 7 para 8.
- Conteúdos das versões v2.1.0 até v2.4.0 continuam compatíveis.
- Backups antigos continuam aceitos quando possuem a estrutura mínima do CMS.

## Retorno à versão anterior

Em caso de problema:

1. Restaure os arquivos da v2.4.0 Final Consolidada.
2. Importe o backup exportado antes da atualização, se necessário.
3. Limpe o cache do navegador.

A v2.5.0 grava os novos dados dentro de `cms_v2`, sem alterar as tabelas principais do D1.
