# Relatório de integração

## Fontes analisadas
1. `CentralRadiosBrasil-Portal-Cliente-main.zip`: autenticação, API, D1, mídias, rascunho, publicação, contratos e faturas.
2. `CentralRadiosBrasil-CMS-Multitema-v2.0.0-Prototipo-Morada(1).zip`: painel CMS, editor visual, temas, CRUD e prévia pública.

## Estratégia
A interface CMS foi conectada aos endpoints já existentes, sem substituir o Worker e sem criar banco paralelo. O conteúdo conhecido continua nos campos atuais; metadados novos ficam dentro de `textos_institucionais.cms_v2`.

## Não incluído de forma fictícia
- audiência;
- ouvintes online;
- usuários adicionais;
- DNS automático;
- publicação direta sem revisão.
