# Matriz de riscos e integrações — v3.0.0

| Controle | Situação nesta etapa | Risco sem validação | Repositório afetado em eventual correção |
|---|---|---|---|
| Permissões nos endpoints | Pendente de análise | Usuário pode tentar ação proibida fora da interface | Worker/API |
| Isolamento entre emissoras | Pendente de análise | Leitura ou gravação cruzada entre clientes | Worker/API e D1 |
| Validação de mídias no servidor | Pendente de análise | Arquivo fora do padrão pode ser enviado sem usar o Portal | Worker/API |
| Expiração e revogação de sessão | Pendente de análise | Token antigo pode continuar válido | Worker/API |
| Rate limiting de login | Pendente de análise | Tentativas automatizadas e abuso | Worker/API |
| CORS por origem | Pendente de análise | Uso da API por origem não autorizada | Worker/API |
| Backup completo de produção | Pendente de análise | Recuperação incompleta de D1 ou mídias | Worker/API, D1 e armazenamento |
| Portal do Cliente | Implementado e auditado | Falhas locais antes do piloto | Apenas este repositório |
| Validação preventiva de imagens | Implementada no navegador | Pode ser contornada fora da interface | Servidor ainda pendente |
| Auditoria e backup local do CMS | Implementados | Não substituem backup de infraestrutura | Servidor ainda pendente |

## Regra de mudança

Nenhum repositório externo deve ser alterado sem:

1. backup identificado;
2. inventário de endpoints e tabelas afetadas;
3. análise de compatibilidade com Portal Público/PWA e Admin;
4. plano de rollback;
5. testes em ambiente separado;
6. aprovação explícita do usuário.
