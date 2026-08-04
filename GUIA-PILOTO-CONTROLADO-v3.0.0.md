# Guia de piloto controlado — v3.0.0

## Antes do piloto

1. Publique esta versão somente no repositório do Portal do Cliente.
2. Faça `Ctrl + F5`.
3. Entre com a conta administradora principal.
4. Abra **Auditoria** e execute a auditoria completa.
5. Abra **Pré-produção** e execute a análise.
6. Corrija qualquer falha local.
7. Crie um ponto de segurança.
8. Exporte o relatório JSON.
9. Revise a prévia em desktop, tablet e celular.
10. Use uma única emissora piloto, sem liberar novos clientes ainda.

## Durante o piloto

- conferir salvamento e recarga do rascunho;
- editar conteúdos e imagens;
- testar permissões apenas como comportamento da interface;
- registrar qualquer falha de sessão ou conexão;
- conferir publicação supervisionada;
- não considerar as permissões do servidor comprovadas sem auditoria do Worker.

## Critério para encerrar o piloto

- nenhuma falha local na área Pré-produção;
- auditoria funcional sem falhas;
- restauração testada;
- publicação supervisionada aprovada;
- análise separada do Worker/D1 concluída;
- plano de rollback documentado.
