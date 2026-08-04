# Commit 22.18 — Etapa 2

## Módulos concluídos nesta entrega

### Programação

- múltiplos dias por programa;
- categorias;
- horário inicial e final;
- vínculo com locutor;
- imagem e cor de identificação;
- filtros por dia e status;
- bloqueio de conflito de horário;
- duplicação segura, inicialmente inativa.

### Locutores

- foto, função, biografia, contatos e redes;
- ordem de exibição;
- vínculo com a programação;
- busca, status, edição, duplicação e exclusão.

### Notícias

- título, slug, categoria, tags e autoria;
- data e horário;
- rascunho, agendamento, publicação e arquivamento;
- resumo, conteúdo, capa e destaque;
- slug único;
- filtros editoriais;
- agendamento respeitado na prévia.

## Temas

Todos utilizam o mesmo conteúdo e as mesmas configurações. A diferença está na composição visual:

- Morada: estrutura aprovada preservada;
- Music: escuro, player e podcasts em destaque;
- News: manchetes e hierarquia jornalística;
- Gospel: composição acolhedora e centralizada;
- Jovem: visual bento, vibrante e audiovisual;
- Personalizado: layout institucional limpo com cores do cliente.

## Persistência

A entrega continua usando o Worker e o D1 existentes. Os campos adicionais são armazenados nos objetos de conteúdo já utilizados pelo CMS; não existe migração SQL nesta versão.
