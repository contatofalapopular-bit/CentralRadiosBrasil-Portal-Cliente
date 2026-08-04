# Análise de pré-produção — v3.0.0 Etapa 1

## Objetivo

Preparar o Portal do Cliente para um piloto controlado sem presumir que controles internos do Worker e do D1 já estejam prontos para vários clientes.

## Resultado

O Portal agora consegue avaliar e registrar:

- carregamento e autenticação da sessão;
- disponibilidade percebida do Worker;
- uso de HTTPS;
- existência do site e do rascunho;
- identidade pública da emissora;
- validade básica do e-mail e do stream;
- domínio/subdomínio disponível;
- modelo visual e blocos ativos;
- validação preventiva de novas imagens;
- existência de auditoria funcional;
- existência de ponto de restauração;
- administrador principal protegido;
- erros capturados no navegador.

## Dois níveis de aprovação

### Portal apto para piloto

Significa que não existem falhas locais críticas no Portal do Cliente. Não significa que o ambiente completo esteja liberado para vários clientes.

### Produção geral apta

Só poderá ser marcada quando as pendências de servidor forem verificadas com evidências. Nesta etapa, elas permanecem pendentes por decisão de segurança.

## Bloqueio antes da publicação

A solicitação de publicação passa por uma pré-checagem local. Ela é bloqueada quando faltam requisitos críticos como:

- sessão ativa;
- Worker acessível;
- site carregado;
- nome e e-mail válidos;
- stream válido;
- modelo visual válido;
- blocos ativos;
- administrador principal válido.

Pendências de servidor não são silenciosamente ignoradas: ficam exibidas na área Pré-produção, mas a publicação supervisionada continua disponível para um piloto controlado quando os requisitos locais estão corretos.

## Persistência

Os resultados são armazenados dentro do mesmo rascunho:

`textos_institucionais.cms_v2.production`

Não foi criado endpoint novo.
