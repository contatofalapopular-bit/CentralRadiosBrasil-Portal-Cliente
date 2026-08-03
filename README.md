# Portal do Cliente — Central Rádios Brasil v1.0.0

Primeira entrega do Commit 22.18.

## Recursos

- login individual por e-mail e senha;
- troca obrigatória da senha temporária;
- visão de contratos, serviços, faturas e pagamentos;
- editor somente dos campos liberados pelo Admin;
- prévia local do Modelo Rádio Essencial;
- rascunho com histórico de versões;
- solicitação de publicação para revisão administrativa.

## Publicação sugerida

Crie um repositório separado, por exemplo `CentralRadiosBrasil-Portal-Cliente`, publique estes arquivos no GitHub Pages e, depois dos testes, conecte o endereço `cliente.centralradiosbrasil.com.br`.

O arquivo `config.js` já aponta para o Worker principal atual. Caso a URL do Worker mude, altere apenas `WORKER_URL`.
