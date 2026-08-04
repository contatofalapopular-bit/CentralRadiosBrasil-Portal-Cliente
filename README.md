# Portal do Cliente v2.0.0 — CMS Multitema Integrado

Esta versão combina o Portal do Cliente já publicado com o protótipo CMS Multitema.

## Compatibilidade
- Cloudflare Worker principal: v1.15.0
- Admin Central: v3.10.0
- GitHub Pages: compatível
- Banco: D1 existente

## Recursos integrados
- login, sessão e logout reais;
- cliente, contrato e faturas reais;
- site e permissões atuais;
- rascunho e histórico no D1;
- solicitação de publicação supervisionada;
- upload de imagens pela API existente;
- dashboard, editor visual, temas e prévia multitema;
- CRUD de programação, locutores, notícias, podcasts, vídeos, promoções, galeria, eventos, equipe, publicidade, parceiros, banners e popups;
- backup JSON;
- troca de senha.

## Instalação
Substitua os arquivos da raiz do repositório `CentralRadiosBrasil-Portal-Cliente` por estes arquivos e publique pelo GitHub Pages.

## Segurança dos dados
A versão preserva o formato atual de `conteudoRascunho`. Os dados adicionais do CMS ficam em `textos_institucionais.cms_v2`, sem exigir migração SQL.

## Limitações conhecidas
- usuários adicionais continuam controlados pela Central, pois o Worker atual não expõe CRUD de usuários;
- domínio e URL técnica do stream são somente leitura;
- audiência só aparecerá depois de uma integração real com o streaming.
