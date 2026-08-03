# Central Rádios Brasil — Portal do Cliente v1.3.0

Parte 2 do Commit 22.18: Configurações e biblioteca de imagens.

## Incluído
- estrutura visual inspirada no painel de referência aprovado;
- revisão global de espaçamentos;
- Configurações: Principal, Redes Sociais, Player, Google e Fale Conosco;
- upload real de imagens com otimização automática;
- biblioteca de imagens por site;
- upload em todos os campos visuais já existentes;
- rascunho, prévia, publicação, contrato e faturas preservados.

## Dependência
Requer Worker v1.15.0. Publique o Worker antes deste Portal.

## Observação técnica
Nesta etapa as mídias são armazenadas no D1, com limite de 25 MB por site. Uma migração futura para Cloudflare R2 poderá ampliar a capacidade sem mudar o painel.
