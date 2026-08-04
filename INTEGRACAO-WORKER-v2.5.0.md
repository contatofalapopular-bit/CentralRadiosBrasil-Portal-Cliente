# Integração do Worker — usuários e permissões v2.5.0

## Dados persistidos pelo CMS

O Portal salva em:

```text
conteudo.textos_institucionais.cms_v2.security
conteudo.textos_institucionais.cms_v2.audit
conteudo.textos_institucionais.cms_v2.backup
```

## Requisito para segurança completa

A interface já oculta áreas e bloqueia ações. Entretanto, segurança real exige que o Worker também valide a permissão do usuário autenticado antes de executar qualquer endpoint de escrita.

O Worker deve:

1. Identificar o usuário da sessão por e-mail ou ID.
2. Consultar o perfil e as áreas permitidas.
3. Validar a ação solicitada.
4. Recusar com HTTP 403 quando não autorizado.
5. Registrar a tentativa na auditoria do servidor.

## Ações esperadas

- `view`
- `create`
- `edit`
- `duplicate`
- `toggle`
- `delete`
- `save`
- `publish`
- `manage_users`
- `audit`
- `backup`
- `export`

## Credenciais adicionais

Para login independente de usuários adicionais, o Worker precisa oferecer gerenciamento de credenciais/convites. A interface desta versão já prepara e persiste os usuários, perfis, áreas, situação e exigência de 2FA.
