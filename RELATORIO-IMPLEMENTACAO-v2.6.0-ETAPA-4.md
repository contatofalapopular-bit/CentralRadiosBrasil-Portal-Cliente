# Relatório de implementação — v2.6.0 Etapa 4

## Objetivo

Impedir que imagens fora do padrão informado sejam enviadas ou salvas como novos arquivos.

## Implementação

- leitura das dimensões reais antes do upload;
- comparação exata de largura e altura;
- validação de MIME JPG/PNG/WEBP;
- validação do peso original;
- mensagens com tamanho recebido e obrigatório;
- campos obrigatórios bloqueiam o cadastro sem imagem válida;
- bloqueio de salvamento/publicação enquanto uma imagem está em validação;
- remoção do recorte, redimensionamento e compressão automática no navegador;
- envio do arquivo original validado ao endpoint já existente.

## Isolamento

Nenhum endpoint, URL, banco ou repositório externo foi modificado.
