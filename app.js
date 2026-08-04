(() => {
  "use strict";

  const CONFIG = window.CRB_CLIENTE_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let authToken = sessionStorage.getItem(CONFIG.TOKEN_KEY) || "";
  let dashboardData = null;
  let remoteSite = null;
  let versions = [];
  let mediaLibrary = [];
  let saveTimer = null;
  let saveQueue = Promise.resolve();
  let isLoading = false;

  const imageProfiles = {
    logo: { label: "Logomarca", width: 800, height: 400, maxKB: 300, fit: "contain" },
    hero: { label: "Banner principal", width: 1600, height: 600, maxKB: 600, fit: "cover" },
    square: { label: "Imagem quadrada", width: 800, height: 800, maxKB: 250, fit: "cover" },
    news: { label: "Capa 16:9", width: 1200, height: 675, maxKB: 300, fit: "cover" },
    gallery: { label: "Foto da galeria", width: 1600, height: 1200, maxKB: 600, fit: "cover" },
    banner: { label: "Banner horizontal", width: 1200, height: 400, maxKB: 300, fit: "cover" },
    ad: { label: "Publicidade horizontal", width: 728, height: 90, maxKB: 220, fit: "cover" },
    popup: { label: "Popup vertical", width: 900, height: 1200, maxKB: 350, fit: "cover" },
    app: { label: "Ícone do aplicativo", width: 512, height: 512, maxKB: 220, fit: "cover" }
  };

  const workerImageSpecs = Object.freeze({
    logo:{label:"Logomarca",width:800,height:400,maxKB:300,fit:"contain"}, favicon:{label:"Ícone do site",width:512,height:512,maxKB:120,fit:"cover"}, capa:{label:"Banner principal",width:1600,height:600,maxKB:600,fit:"cover"}, fundo:{label:"Plano de fundo",width:1920,height:1080,maxKB:700,fit:"cover"}, compartilhamento:{label:"Compartilhamento",width:1200,height:630,maxKB:300,fit:"cover"}, player:{label:"Imagem do player",width:800,height:800,maxKB:250,fit:"cover"}, destaque:{label:"Destaque",width:1200,height:675,maxKB:350,fit:"cover"}, galeria:{label:"Foto da galeria",width:1600,height:1200,maxKB:600,fit:"cover"}, locutor:{label:"Foto do locutor",width:800,height:1000,maxKB:300,fit:"cover"}, noticia:{label:"Capa da notícia",width:1200,height:675,maxKB:300,fit:"cover"}, parceiro:{label:"Logo do parceiro",width:600,height:300,maxKB:180,fit:"contain"}, programa:{label:"Capa do programa",width:800,height:800,maxKB:250,fit:"cover"}, publicidade:{label:"Publicidade",width:1200,height:400,maxKB:300,fit:"contain"}, musica:{label:"Capa da música",width:800,height:800,maxKB:250,fit:"cover"}, video:{label:"Miniatura do vídeo",width:1280,height:720,maxKB:300,fit:"cover"}, podcast:{label:"Capa do podcast",width:1400,height:1400,maxKB:400,fit:"cover"}, promocao:{label:"Imagem da promoção",width:1200,height:675,maxKB:300,fit:"cover"}, evento:{label:"Imagem do evento",width:1200,height:675,maxKB:300,fit:"cover"}, ouvinte:{label:"Foto do ouvinte",width:800,height:800,maxKB:250,fit:"cover"}, abertura:{label:"Publicidade de abertura",width:1200,height:675,maxKB:350,fit:"cover"}, qrcode:{label:"QR Code",width:512,height:512,maxKB:150,fit:"contain"}
  });

  function resolvedImageSpec(profileId, fieldName="imagem") {
    const workerProfile=resolveWorkerProfile(profileId,fieldName);
    return workerImageSpecs[workerProfile] || imageProfiles[profileId] || imageProfiles.news;
  }

  const navItems = [
    { section: "Painel" },
    { id: "dashboard", label: "Dashboard", icon: "⌂" },
    { id: "radio", label: "Minha Rádio", icon: "◉" },
    { id: "editor", label: "Editor Visual", icon: "▦", badge: "Novo" },
    { id: "themes", label: "Temas", icon: "◈" },
    { section: "Conteúdo" },
    { id: "programacao", label: "Programação", icon: "◷" },
    { id: "locutores", label: "Locutores", icon: "♟" },
    { id: "noticias", label: "Notícias", icon: "▤" },
    { id: "podcasts", label: "Podcasts", icon: "◉" },
    { id: "videos", label: "Vídeos", icon: "▶" },
    { id: "promocoes", label: "Promoções", icon: "★" },
    { id: "galeria", label: "Galeria", icon: "▧" },
    { id: "eventos", label: "Eventos", icon: "◫" },
    { id: "equipe", label: "Equipe", icon: "♣" },
    { section: "Comercial" },
    { id: "publicidade", label: "Publicidade", icon: "▰" },
    { id: "parceiros", label: "Parceiros", icon: "◇" },
    { id: "banners", label: "Banners", icon: "▱" },
    { id: "popups", label: "Popups", icon: "▣" },
    { section: "Integrações" },
    { id: "whatsapp", label: "WhatsApp", icon: "◍" },
    { id: "redes", label: "Redes Sociais", icon: "◎" },
    { id: "seo", label: "SEO", icon: "⌕" },
    { id: "dominio", label: "Domínio", icon: "⌁" },
    { id: "aplicativo", label: "Aplicativo", icon: "▯" },
    { section: "Sistema" },
    { id: "configuracoes", label: "Configurações", icon: "⚙" },
    { id: "usuarios", label: "Usuários e acesso", icon: "♙" },
    { id: "publicacao", label: "Publicação", icon: "✓" },
    { id: "faturas", label: "Faturas", icon: "$" },
    { id: "contrato", label: "Contrato", icon: "▤" },
    { id: "backup", label: "Backup", icon: "↻" }
  ];

  const modulesCatalog = [
    ["hero", "Banner principal", "Capa, chamada e botões"],
    ["player", "Player ao vivo", "Música atual, locutor e aplicativo"],
    ["programacao", "Programação", "Grade da emissora"],
    ["noticias", "Notícias", "Matérias e categorias"],
    ["promocoes", "Promoções", "Campanhas e sorteios"],
    ["podcasts", "Podcasts", "Episódios sob demanda"],
    ["videos", "Vídeos", "Clipes e entrevistas"],
    ["equipe", "Equipe", "Locutores e profissionais"],
    ["galeria", "Galeria", "Álbuns de fotos"],
    ["eventos", "Eventos", "Agenda da rádio"],
    ["publicidade", "Publicidade", "Banners e anunciantes"],
    ["parceiros", "Patrocinadores", "Marcas parceiras"],
    ["aplicativo", "Baixe o aplicativo", "Android, iOS e QR Code"],
    ["contato", "Contato", "Formulário, endereço e WhatsApp"]
  ];

  const themes = [
    { id: "morada", layout: "morada", name: "Rádio Morada Moderna", description: "Estrutura completa de rádio, notícias, programação e conteúdo local. Mantida como a referência aprovada.", colors: ["#e31c45", "#121d31", "#f1a11a", "#f4f6f9"] },
    { id: "spotify", layout: "music", name: "Rádio Music", description: "Experiência escura e imersiva, com player em destaque, capas grandes e foco em podcasts e música.", colors: ["#20d776", "#090b0f", "#b7ffcf", "#11151b"] },
    { id: "news", layout: "portal", name: "Rádio News", description: "Portal editorial claro, manchetes em primeiro plano, tipografia forte e programação compacta.", colors: ["#c91424", "#172033", "#f6b81a", "#f3f5f8"] },
    { id: "gospel", layout: "community", name: "Rádio Gospel", description: "Visual acolhedor e luminoso, com formas suaves, agenda, programação e comunidade em evidência.", colors: ["#7357c8", "#2d2346", "#d7a73b", "#fff9ef"] },
    { id: "young", layout: "bento", name: "Rádio Jovem", description: "Composição vibrante em blocos, player flutuante, vídeos e promoções com mais impacto visual.", colors: ["#ff3d8d", "#241342", "#45e3ff", "#fff4fb"] },
    { id: "custom", layout: "clean", name: "Tema Personalizado", description: "Estrutura limpa e institucional que usa as cores escolhidas em Minha Rádio.", colors: ["#138a7e", "#111827", "#f59e0b", "#f5f7fb"] }
  ];

  const schemas = {
    programacao: {
      title: "Programação", singular: "programa", imageProfile: "square",
      description: "Monte a grade semanal, vincule locutores e evite conflitos de horário.",
      fields: [
        ["titulo", "Nome do programa", "text", true],
        ["categoria", "Categoria", "select", true, ["Jornalismo","Musical","Entretenimento","Religioso","Esportivo","Variedades","Outro"]],
        ["dias", "Dias da semana", "multicheck", true, ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"]],
        ["inicio", "Início", "time", true], ["fim", "Fim", "time", true],
        ["locutor", "Locutor/apresentador", "locutor-select"],
        ["descricao", "Descrição", "textarea"], ["imagem", "Imagem do programa", "image", false, "square"],
        ["cor", "Cor de identificação", "color"], ["ativo", "Ativo", "checkbox"]
      ],
      summary: item => `${formatDays(item.dias || item.dia)} • ${item.inicio || "--:--"} às ${item.fim || "--:--"}`
    },
    locutores: {
      title: "Locutores", singular: "locutor", imageProfile: "square", description: "Cadastre comunicadores, organize a exibição e vincule-os à programação.",
      fields: [
        ["nome","Nome","text",true], ["cargo","Programa ou função","text"], ["bio","Biografia","textarea"],
        ["foto","Foto","image",false,"square"], ["email","E-mail público","email"], ["telefone","Telefone público","text"],
        ["instagram","Instagram","text"], ["facebook","Facebook","text"], ["ordem","Ordem de exibição","number"], ["ativo","Ativo","checkbox"]
      ],
      summary: item => `${item.cargo || "Locutor"}${item.ordem ? ` • Ordem ${item.ordem}` : ""}`
    },
    noticias: {
      title: "Notícias", singular: "notícia", imageProfile: "news", description: "Produza, agende e publique matérias com destaque, autoria e organização editorial.",
      fields: [
        ["titulo","Título","text",true], ["slug","Endereço amigável (slug)","text"], ["categoria","Categoria","text",true],
        ["tags","Tags separadas por vírgula","text"], ["autor","Autor","locutor-select"], ["data","Data de publicação","date",true],
        ["hora","Horário","time"], ["status","Situação editorial","select",true,["Rascunho","Agendada","Publicada","Arquivada"]],
        ["resumo","Resumo","textarea",true], ["conteudo","Conteúdo completo","richtext"], ["imagem","Imagem de capa","image",false,"news"],
        ["destaque","Notícia em destaque","checkbox"], ["ativo","Exibir no site quando publicada","checkbox"]
      ],
      summary: item => `${item.categoria || "Notícias"} • ${statusNewsLabel(item)} • ${formatDate(item.data)}`
    },
    podcasts: {
      title: "Podcasts", singular: "episódio", imageProfile: "square", description: "Organize programas, temporadas e episódios com player, destaque e publicação.",
      fields: [
        ["titulo","Título do episódio","text",true], ["programa","Podcast/programa","text",true],
        ["temporada","Temporada","number"], ["episodio","Número do episódio","number"],
        ["categoria","Categoria","text"], ["data","Data de publicação","date",true],
        ["duracaoMinutos","Duração em minutos","number"], ["audio","Endereço do áudio","url",true],
        ["descricao","Descrição","textarea"], ["imagem","Capa quadrada","image",false,"square"],
        ["destaque","Episódio em destaque","checkbox"], ["ativo","Publicado","checkbox"]
      ],
      summary: item => `${item.programa || "Podcast"} • ${episodeLabel(item)}${item.data ? ` • ${formatDate(item.data)}` : ""}${item.duracaoMinutos ? ` • ${formatDuration(item.duracaoMinutos)}` : ""}`
    },
    videos: {
      title: "Vídeos", singular: "vídeo", imageProfile: "news", description: "Cadastre e organize YouTube, Vimeo, arquivos diretos, transmissões e links externos.",
      fields: [
        ["titulo","Título","text",true], ["url","Endereço do vídeo","url",true],
        ["tipo","Tipo do vídeo","select",true,["Automático","YouTube","Vimeo","Arquivo de vídeo","Link externo","Transmissão ao vivo"]],
        ["categoria","Categoria","text",true], ["data","Data de publicação","date"],
        ["duracaoMinutos","Duração em minutos","number"], ["descricao","Descrição","textarea"],
        ["imagem","Miniatura personalizada","image",false,"news"], ["destaque","Vídeo em destaque","checkbox"],
        ["ativo","Publicado","checkbox"]
      ],
      summary: item => `${item.categoria || "Vídeo"} • ${videoTypeLabel(item)}${item.data ? ` • ${formatDate(item.data)}` : ""}${item.duracaoMinutos ? ` • ${formatDuration(item.duracaoMinutos)}` : ""}`
    },
    promocoes: {
      title: "Promoções", singular: "promoção", imageProfile: "news", description: "Gerencie promoções, datas e regulamentos.",
      fields: [["titulo","Título","text",true],["inicio","Início","date"],["fim","Encerramento","date"],["descricao","Descrição","textarea"],["regulamento","Regulamento","textarea"],["imagem","Imagem da promoção","image",false,"news"],["ativo","Ativa","checkbox"]],
      summary: item => item.fim ? `Encerra em ${formatDate(item.fim)}` : "Sem encerramento"
    },
    galeria: {
      title: "Galeria", singular: "foto", imageProfile: "gallery", description: "Cadastre fotos e organize álbuns.",
      fields: [["titulo","Título da foto","text",true],["album","Álbum","text"],["data","Data","date"],["descricao","Descrição","textarea"],["imagem","Fotografia","image",true,"gallery"],["ativo","Publicada","checkbox"]],
      summary: item => item.album || "Galeria"
    },
    eventos: {
      title: "Eventos", singular: "evento", imageProfile: "news", description: "Divulgue agenda, shows, transmissões externas e ações da rádio.",
      fields: [["titulo","Nome do evento","text",true],["data","Data","date",true],["hora","Horário","time"],["local","Local","text"],["descricao","Descrição","textarea"],["imagem","Imagem do evento","image",false,"news"],["ativo","Publicado","checkbox"]],
      summary: item => `${formatDate(item.data)}${item.hora ? ` • ${item.hora}` : ""}`
    },
    equipe: {
      title: "Equipe", singular: "profissional", imageProfile: "square", description: "Equipe administrativa, jornalismo, comercial e técnica.",
      fields: [["nome","Nome","text",true],["cargo","Cargo","text",true],["bio","Apresentação","textarea"],["foto","Foto","image",false,"square"],["email","E-mail público","email"],["ativo","Exibir no site","checkbox"]],
      summary: item => item.cargo || "Equipe"
    },
    publicidade: {
      title: "Publicidade", singular: "anúncio", imageProfile: "ad", description: "Gerencie anunciantes, posições e período de exibição.",
      fields: [["titulo","Nome da campanha","text",true],["anunciante","Anunciante","text"],["posicao","Posição","select",true,["Topo 728×90","Entre seções","Lateral 300×250","Rodapé","Player"]],["inicio","Início","date"],["fim","Fim","date"],["link","Link do anúncio","url"],["imagem","Peça publicitária","image",true,"ad"],["ativo","Campanha ativa","checkbox"]],
      summary: item => `${item.anunciante || "Anunciante"} • ${item.posicao || "Posição"}`
    },
    parceiros: {
      title: "Parceiros", singular: "parceiro", imageProfile: "logo", description: "Logos de patrocinadores e parceiros institucionais.",
      fields: [["nome","Nome da marca","text",true],["categoria","Categoria","text"],["link","Site ou rede social","url"],["logo","Logomarca","image",false,"logo"],["ordem","Ordem","number"],["ativo","Exibir no site","checkbox"]],
      summary: item => item.categoria || "Parceiro"
    },
    banners: {
      title: "Banners", singular: "banner", imageProfile: "banner", description: "Banners editoriais e comerciais fora da área de publicidade.",
      fields: [["titulo","Título interno","text",true],["posicao","Posição","select",true,["Banner principal","Página interna","Antes de notícias","Antes do rodapé"]],["link","Link","url"],["imagem","Imagem do banner","image",true,"banner"],["ativo","Ativo","checkbox"]],
      summary: item => item.posicao || "Banner"
    },
    popups: {
      title: "Popups", singular: "popup", imageProfile: "popup", description: "Avisos promocionais exibidos com frequência controlada.",
      fields: [["titulo","Título interno","text",true],["inicio","Início","date"],["fim","Fim","date"],["frequencia","Frequência","select",true,["Uma vez por sessão","Uma vez por dia","Sempre"]],["link","Link","url"],["imagem","Imagem do popup","image",true,"popup"],["ativo","Ativo","checkbox"]],
      summary: item => item.frequencia || "Popup"
    },
    usuarios: {
      title: "Usuários", singular: "usuário", description: "Controle quem pode editar o site e quais áreas cada perfil acessa.",
      fields: [["nome","Nome","text",true],["email","E-mail","email",true],["perfil","Perfil","select",true,["Administrador","Editor","Redator","Moderador","Somente leitura"]],["areas","Áreas permitidas","text"],["ativo","Acesso ativo","checkbox"]],
      summary: item => item.perfil || "Usuário"
    }
  };

  function uid(prefix = "item") {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function defaultState() {
    const today = new Date().toISOString().slice(0, 10);
    return {
      version: "2.3.0-etapa1",
      updatedAt: new Date().toISOString(),
      status: "rascunho",
      selectedTheme: "morada",
      radio: {
        nome: "Portal Cidade RV",
        slogan: "Informação, música e a voz da nossa cidade",
        descricao: "Uma rádio conectada com Rio Verde, levando informação, entretenimento e participação popular.",
        cidade: "Rio Verde",
        estado: "GO",
        email: "contato@exemplo.com.br",
        telefone: "(64) 0000-0000",
        whatsapp: "5564999999999",
        endereco: "Rio Verde — Goiás",
        streamUrl: "",
        musicaAtual: "Transmissão ao vivo",
        locutorAtual: "Programação da rádio",
        logo: "",
        hero: "",
        playerImage: "",
        cores: { primaria: "#e31c45", secundaria: "#121d31", destaque: "#f1a11a", fundo: "#f4f6f9" },
        listenersEnabled: false
      },
      modules: modulesCatalog.map(([id, label, description], index) => ({ id, label, description, enabled: !["eventos"].includes(id), order: index })),
      content: {
        programacao: [
          { id: uid("prog"), titulo: "Amanhecer da Cidade", categoria: "Variedades", dias: ["Segunda","Terça","Quarta","Quinta","Sexta"], inicio: "06:00", fim: "09:00", locutor: "Equipe Cidade", descricao: "Música, informação e prestação de serviço.", ativo: true },
          { id: uid("prog"), titulo: "Jornal da Manhã", categoria: "Jornalismo", dias: ["Segunda","Terça","Quarta","Quinta","Sexta"], inicio: "09:00", fim: "11:00", locutor: "Redação", descricao: "As principais notícias locais e do Brasil.", ativo: true },
          { id: uid("prog"), titulo: "Tarde Sertaneja", categoria: "Musical", dias: ["Segunda","Terça","Quarta","Quinta","Sexta"], inicio: "14:00", fim: "17:00", locutor: "Central Rádios", descricao: "Os sucessos do sertanejo.", ativo: true },
          { id: uid("prog"), titulo: "Noite Popular", categoria: "Entretenimento", dias: ["Segunda","Terça","Quarta","Quinta","Sexta"], inicio: "19:00", fim: "22:00", locutor: "Equipe", descricao: "Participação dos ouvintes.", ativo: true }
        ],
        locutores: [
          { id: uid("loc"), nome: "Apresentador 01", cargo: "Manhã da Cidade", bio: "Comunicador da emissora.", foto: "", ativo: true },
          { id: uid("loc"), nome: "Apresentadora 02", cargo: "Jornalismo", bio: "Notícias e entrevistas.", foto: "", ativo: true },
          { id: uid("loc"), nome: "Apresentador 03", cargo: "Tarde Sertaneja", bio: "Música e participação.", foto: "", ativo: true }
        ],
        noticias: [
          { id: uid("news"), titulo: "Portal Cidade RV amplia cobertura de notícias locais", categoria: "Cidade", data: today, resumo: "Nova fase reforça informação, serviço e participação da comunidade.", slug: "portal-cidade-rv-amplia-cobertura", status: "Publicada", autor: "Equipe Cidade", hora: "09:00", conteudo: "", imagem: "", destaque: true, ativo: true },
          { id: uid("news"), titulo: "Programação ganha novos espaços de música e jornalismo", categoria: "Rádio", data: today, resumo: "A emissora prepara novidades para os ouvintes.", slug: "programacao-ganha-novos-espacos", status: "Publicada", autor: "Redação", hora: "10:00", imagem: "", destaque: false, ativo: true },
          { id: uid("news"), titulo: "Comércio local participa de campanha promocional", categoria: "Economia", data: today, resumo: "Ação aproxima empresas e audiência.", slug: "comercio-local-participa-de-campanha", status: "Publicada", autor: "Equipe Comercial", hora: "11:00", imagem: "", destaque: false, ativo: true }
        ],
        podcasts: [
          { id: uid("pod"), titulo: "Entrevista da Semana", programa: "Cidade em Pauta", data: today, descricao: "Conversa com convidados sobre os assuntos da cidade.", audio: "", imagem: "", ativo: true },
          { id: uid("pod"), titulo: "Boletim do Agronegócio", programa: "Campo em Foco", data: today, descricao: "Mercado, clima e produção.", audio: "", imagem: "", ativo: true }
        ],
        videos: [
          { id: uid("vid"), titulo: "Bastidores da rádio", url: "", categoria: "Institucional", descricao: "Conheça nossa estrutura.", imagem: "", ativo: true },
          { id: uid("vid"), titulo: "Entrevista especial", url: "", categoria: "Entrevistas", descricao: "Conteúdo em vídeo.", imagem: "", ativo: true }
        ],
        promocoes: [
          { id: uid("promo"), titulo: "Promoção Ouvinte Premiado", inicio: today, fim: "", descricao: "Participe pelo WhatsApp e concorra a prêmios.", regulamento: "", imagem: "", ativo: true },
          { id: uid("promo"), titulo: "Sua música na programação", inicio: today, fim: "", descricao: "Envie seu pedido e participe.", regulamento: "", imagem: "", ativo: true }
        ],
        galeria: [
          { id: uid("foto"), titulo: "Nossa equipe", album: "Bastidores", data: today, descricao: "Dia a dia da rádio.", imagem: "", ativo: true },
          { id: uid("foto"), titulo: "Estúdio principal", album: "Estrutura", data: today, descricao: "Conheça nossos espaços.", imagem: "", ativo: true },
          { id: uid("foto"), titulo: "Ação externa", album: "Eventos", data: today, descricao: "Rádio perto da comunidade.", imagem: "", ativo: true }
        ],
        eventos: [],
        equipe: [
          { id: uid("team"), nome: "Equipe de Jornalismo", cargo: "Redação", bio: "Produção de notícias e entrevistas.", foto: "", email: "", ativo: true },
          { id: uid("team"), nome: "Equipe Comercial", cargo: "Publicidade", bio: "Relacionamento com anunciantes.", foto: "", email: "", ativo: true }
        ],
        publicidade: [],
        parceiros: [
          { id: uid("part"), nome: "Parceiro 01", categoria: "Patrocinador", link: "", logo: "", ordem: 1, ativo: true },
          { id: uid("part"), nome: "Parceiro 02", categoria: "Apoio", link: "", logo: "", ordem: 2, ativo: true }
        ],
        banners: [], popups: [],
        usuarios: [{ id: uid("user"), nome: "Administrador do cliente", email: "cliente@exemplo.com.br", perfil: "Administrador", areas: "Todas", ativo: true }]
      },
      integrations: {
        whatsapp: { numero: "5564999999999", mensagem: "Olá! Vim pelo site da rádio.", flutuante: true, pedidos: true },
        redes: { instagram: "", facebook: "", youtube: "", tiktok: "", x: "", spotify: "" },
        seo: { titulo: "Portal Cidade RV — Rádio e notícias", descricao: "Informação, música e participação em Rio Verde.", palavras: "rádio, notícias, rio verde, goiás", imagem: "" },
        dominio: { atual: "portalcidaderv.centralradiosbrasil.com.br", proprio: "", ssl: true },
        aplicativo: { android: "", ios: "", pwa: true, icone: "", qrcode: "" },
        configuracoes: { idioma: "pt-BR", timezone: "America/Sao_Paulo", moderacao: true, acessibilidade: true, cookies: true }
      }
    };
  }

  let state = loadState();
  let currentPage = "dashboard";
  let editing = null;
  let searchTerm = "";
  let collectionFilter = "todos";
  let collectionContextFilter = "todos";
  let collectionSort = "padrao";

  function loadState() { return defaultState(); }

  function deepMerge(target, source) {
    if (!source || typeof source !== "object") return target;
    Object.keys(source).forEach(key => {
      if (Array.isArray(source[key])) target[key] = source[key];
      else if (source[key] && typeof source[key] === "object") target[key] = deepMerge(target[key] || {}, source[key]);
      else target[key] = source[key];
    });
    return target;
  }

  function persist(show = true) {
    state.updatedAt = new Date().toISOString();
    updateChrome();
    clearTimeout(saveTimer);
    if (show) return queueRemoteSave(true);
    saveTimer = setTimeout(() => queueRemoteSave(false), 650);
  }

  function queueRemoteSave(show = true) {
    if (!remoteSite) { if (show) notify("O site ainda não está preparado para edição.", "error"); return Promise.resolve(); }
    const content = mapStateToSiteContent();
    saveQueue = saveQueue.catch(() => {}).then(async () => {
      setSaving(true);
      try {
        const result = await api("/api/cliente/site/rascunho", { method: "PUT", body: JSON.stringify({ conteudo: content }) });
        remoteSite.conteudoRascunho = result.conteudo || content;
        remoteSite.status_publicacao = "rascunho";
        state.status = "rascunho";
        if (result.versao) versions.unshift({ numero: result.versao, status: "rascunho", autor_tipo: "cliente", criado_em: new Date().toISOString() });
        if (show) notify(`Rascunho salvo${result.versao ? ` como versão ${result.versao}` : ""}.`, "success");
      } catch (error) {
        notify(error.message || "Não foi possível salvar o rascunho.", "error");
        throw error;
      } finally { setSaving(false); updateChrome(); }
    });
    return saveQueue;
  }

  function setSaving(saving) {
    const button = $("#save-button");
    if (!button) return;
    button.disabled = saving;
    button.textContent = saving ? "Salvando…" : "Salvar rascunho";
  }

  function notify(message, type = "success") {
    const box = $("#global-message");
    box.textContent = message;
    box.className = `global-message ${type}`;
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => box.classList.add("hidden"), 3000);
  }

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function formatDate(value) {
    if (!value) return "Sem data";
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("pt-BR").format(date);
  }

  function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
  }

  function renderNav() {
    const nav = $("#sidebar-nav");
    nav.innerHTML = navItems.map(item => {
      if (item.section) return `<span class="nav-section-label">${escapeHTML(item.section)}</span>`;
      return `<button class="nav-link ${item.id === currentPage ? "active" : ""}" data-page="${item.id}" type="button"><span class="nav-icon">${item.icon}</span><span>${escapeHTML(item.label)}</span>${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ""}</button>`;
    }).join("");
    $$("[data-page]", nav).forEach(button => button.addEventListener("click", () => navigate(button.dataset.page)));
  }

  function navigate(page) {
    currentPage = page;
    searchTerm = "";
    collectionFilter = "todos";
    collectionContextFilter = "todos";
    collectionSort = "padrao";
    renderNav();
    renderPage();
    if (window.innerWidth <= 980) $("#sidebar").classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateChrome() {
    $("#sidebar-radio-name").textContent = state.radio.nome || "Minha rádio";
    const status = $("#sidebar-status");
    status.textContent = statusLabel(state.status);
    status.className = `status-pill ${state.status === "publicado" ? "published" : "draft"}`;
  }

  function renderPage() {
    const item = navItems.find(entry => entry.id === currentPage);
    $("#page-title").textContent = item?.label || "Painel";
    $("#page-eyebrow").textContent = pageEyebrow(currentPage);
    const root = $("#page-root");
    if (currentPage === "dashboard") renderDashboard(root);
    else if (currentPage === "radio") renderRadio(root);
    else if (currentPage === "editor") renderVisualEditor(root);
    else if (currentPage === "themes") renderThemes(root);
    else if (currentPage === "usuarios") renderUsers(root);
    else if (currentPage === "publicacao") renderPublication(root);
    else if (currentPage === "faturas") renderInvoices(root);
    else if (currentPage === "contrato") renderContract(root);
    else if (schemas[currentPage]) renderCollection(root, currentPage);
    else renderIntegration(root, currentPage);
  }

  function pageEyebrow(page) {
    if (["dashboard", "radio", "editor", "themes"].includes(page)) return "Gestão do site";
    if (["programacao","locutores","noticias","podcasts","videos","promocoes","galeria","eventos","equipe"].includes(page)) return "Conteúdo editorial";
    if (["publicidade","parceiros","banners","popups"].includes(page)) return "Comercial e monetização";
    if (["whatsapp","redes","seo","dominio","aplicativo"].includes(page)) return "Integrações";
    return "Configuração do sistema";
  }

  function activeModules() { return state.modules.filter(item => item.enabled).sort((a,b) => a.order - b.order); }
  function countContent() { return Object.values(state.content).reduce((total, list) => total + (Array.isArray(list) ? list.length : 0), 0); }

  function pageHeader(title, description, actions = "") {
    return `<div class="page-header"><div><h2>${escapeHTML(title)}</h2><p>${escapeHTML(description)}</p></div><div class="page-actions">${actions}</div></div>`;
  }

  function renderDashboard(root) {
    const editorialCount = ["noticias","podcasts","videos","promocoes","eventos"].reduce((sum,key) => sum + (state.content[key] || []).length, 0);
    const mediaCount = mediaLibrary.length || (Object.values(state.content).flat().filter(item => item && Object.keys(item).some(key => ["imagem","foto","logo"].includes(key) && item[key])).length + [state.radio.logo,state.radio.hero,state.radio.playerImage].filter(Boolean).length);
    const invoices = dashboardData?.faturas || [];
    const openInvoices = invoices.filter(item => ["aberta","parcial","vencida"].includes(item.status));
    const contract = (dashboardData?.contratos || [])[0];
    root.innerHTML = `
      ${pageHeader("Visão geral", "Resumo do site e dos dados reais vinculados ao cliente.", `<button class="button primary" data-go="editor" type="button">Abrir editor visual</button>`)}
      <div class="kpi-grid">
        <article class="kpi-card"><span>Módulos ativos</span><strong>${activeModules().length}</strong><small>de ${state.modules.length} módulos disponíveis</small></article>
        <article class="kpi-card"><span>Conteúdos cadastrados</span><strong>${countContent()}</strong><small>registros no rascunho atual</small></article>
        <article class="kpi-card"><span>Imagens armazenadas</span><strong>${mediaCount}</strong><small>arquivos vinculados ao site</small></article>
        <article class="kpi-card"><span>Faturas em aberto</span><strong>${openInvoices.length}</strong><small>${contract ? `Contrato ${escapeHTML(contract.numero || "ativo")}` : "Nenhum contrato"}</small></article>
      </div>
      <div class="grid-2">
        <section class="card"><header class="card-header"><div><h3>Estrutura do site</h3><p>Módulos ativados no editor visual.</p></div><button class="button small secondary" data-go="editor" type="button">Organizar</button></header><div class="card-body"><div class="module-health">${activeModules().slice(0,10).map(module => `<div class="health-row"><div><strong><span class="health-dot"></span>${escapeHTML(module.label)}</strong><span>${escapeHTML(module.description)}</span></div><span class="badge active">Ativo</span></div>`).join("") || `<div class="empty-state"><strong>Nenhum módulo ativo</strong></div>`}</div></div></section>
        <section class="card"><header class="card-header"><div><h3>Publicação e versões</h3><p>Situação real do site no Worker.</p></div><button class="button small secondary" data-go="publicacao" type="button">Gerenciar</button></header><div class="card-body"><div class="activity-list">
          <div class="activity-item"><span class="activity-dot"></span><div><strong>Status</strong><p>${escapeHTML(statusLabel(remoteSite?.status_publicacao || state.status))}</p></div><span class="activity-time">Atual</span></div>
          <div class="activity-item"><span class="activity-dot"></span><div><strong>Tema</strong><p>${escapeHTML(themeById(state.selectedTheme).name)}</p></div><span class="activity-time">Selecionado</span></div>
          <div class="activity-item"><span class="activity-dot"></span><div><strong>Última versão</strong><p>${versions[0] ? `Versão ${Number(versions[0].numero)} • ${formatDateTime(versions[0].criado_em)}` : "Nenhuma versão registrada"}</p></div><span class="activity-time">D1</span></div>
        </div></div></section>
      </div>
      <div class="grid-2 equal" style="margin-top:18px">
        <section class="card"><header class="card-header"><div><h3>Dados reais, sem números inventados</h3><p>Audiência e ouvintes.</p></div></header><div class="card-body"><div class="notice">O painel não exibe audiência fictícia. O número de ouvintes só será mostrado quando existir uma fonte técnica confiável do streaming.</div></div></section>
        <section class="card"><header class="card-header"><div><h3>Integração ativa</h3><p>Ambiente utilizado nesta instalação.</p></div></header><div class="card-body"><div class="code-box">Portal: ${escapeHTML(CONFIG.VERSION || "2.3.0-etapa1")}\nWorker: ${escapeHTML(CONFIG.WORKER_URL || "—")}\nPersistência: Cloudflare D1\nMídias: API do site\nPublicação: supervisionada pela Central</div></div></section>
      </div>`;
    bindGoButtons(root);
  }

  function renderRadio(root) {
    const r = state.radio;
    root.innerHTML = `
      ${pageHeader("Minha Rádio", "Identidade, contatos, transmissão e aparência principal da emissora.", `<button class="button secondary" data-preview type="button">Visualizar alterações</button>`)}
      <form class="form-card" id="radio-form">
        <section class="form-section">
          <div class="form-section-heading"><div><h3>Identidade da emissora</h3><p>Informações exibidas no cabeçalho, capa e resultados de busca.</p></div></div>
          <div class="form-grid">
            ${fieldHTML("nome","Nome da rádio","text",r.nome,true)}
            ${fieldHTML("slogan","Slogan", "text",r.slogan)}
            ${fieldHTML("descricao","Descrição institucional","textarea",r.descricao,false,"full")}
            ${mediaFieldHTML("logo", "Logomarca", "logo", r.logo)}
            ${mediaFieldHTML("hero", "Banner principal", "hero", r.hero)}
            ${mediaFieldHTML("playerImage", "Imagem padrão do player", "square", r.playerImage)}
          </div>
        </section>
        <section class="form-section">
          <div class="form-section-heading"><div><h3>Contato e localização</h3><p>Dados públicos apresentados no site.</p></div></div>
          <div class="form-grid three">
            ${fieldHTML("cidade","Cidade","text",r.cidade)}${fieldHTML("estado","Estado","text",r.estado)}${fieldHTML("endereco","Endereço ou região","text",r.endereco)}
            ${fieldHTML("email","E-mail público","email",r.email)}${fieldHTML("telefone","Telefone","text",r.telefone)}${fieldHTML("whatsapp","WhatsApp com DDI e DDD","text",r.whatsapp)}
          </div>
        </section>
        <section class="form-section">
          <div class="form-section-heading"><div><h3>Player ao vivo</h3><p>A URL técnica é definida pela Central Rádios Brasil e aparece somente para consulta.</p></div></div>
          <div class="form-grid">
            ${fieldHTML("streamUrl","URL técnica do stream (controlada pela Central)","url",r.streamUrl).replace("<input ","<input readonly ")}
            ${fieldHTML("musicaAtual","Texto da música atual","text",r.musicaAtual)}
            ${fieldHTML("locutorAtual","Locutor ou programa atual","text",r.locutorAtual)}
            <div class="field"><span class="field-label">Contagem de ouvintes</span><div class="toggle-row"><div><strong>Exibir somente com dados reais</strong><small>Não permite informar números manualmente.</small></div><label class="switch"><input type="checkbox" name="listenersEnabled" ${r.listenersEnabled ? "checked" : ""} disabled><span></span></label></div></div>
          </div>
        </section>
        <section class="form-section">
          <div class="form-section-heading"><div><h3>Paleta personalizada</h3><p>Usada quando o tema “Personalizado” estiver selecionado.</p></div></div>
          <div class="form-grid three">
            ${colorFieldHTML("primaria","Cor principal",r.cores.primaria)}${colorFieldHTML("secundaria","Cor escura",r.cores.secundaria)}${colorFieldHTML("destaque","Cor de destaque",r.cores.destaque)}${colorFieldHTML("fundo","Fundo do site",r.cores.fundo)}
          </div>
        </section>
        <footer class="card-footer"><div class="page-actions"><button class="button primary" type="submit">Salvar Minha Rádio</button><button class="button secondary" data-preview type="button">Abrir prévia</button></div></footer>
      </form>`;
    bindImageInputs(root);
    $$("[data-preview]", root).forEach(button => button.addEventListener("click", openPreview));
    $("#radio-form").addEventListener("submit", event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      ["nome","slogan","descricao","cidade","estado","endereco","email","telefone","whatsapp","musicaAtual","locutorAtual"].forEach(key => state.radio[key] = String(form.get(key) || "").trim());
      ["logo","hero","playerImage"].forEach(key => state.radio[key] = String(form.get(key) || state.radio[key] || ""));
      ["primaria","secundaria","destaque","fundo"].forEach(key => state.radio.cores[key] = String(form.get(`cor_${key}`) || state.radio.cores[key]));
      state.integrations.whatsapp.numero = state.radio.whatsapp;
      persist();
      renderPage();
    });
  }

  function fieldHTML(name, label, type, value = "", required = false, className = "") {
    const requiredAttr = required ? "required" : "";
    if (type === "textarea") return `<div class="field ${className}"><label for="field-${name}">${escapeHTML(label)}</label><textarea id="field-${name}" name="${name}" ${requiredAttr}>${escapeHTML(value)}</textarea></div>`;
    return `<div class="field ${className}"><label for="field-${name}">${escapeHTML(label)}</label><input id="field-${name}" name="${name}" type="${type}" value="${escapeHTML(value)}" ${requiredAttr}></div>`;
  }

  function colorFieldHTML(name,label,value) {
    return `<div class="field"><label>${escapeHTML(label)}</label><div style="display:flex;gap:9px;align-items:center"><input type="color" name="cor_${name}" value="${escapeHTML(value)}"><input type="text" value="${escapeHTML(value)}" data-color-text="cor_${name}" aria-label="Código da cor"></div></div>`;
  }

  function mediaFieldHTML(name,label,profileId,value="") {
    const profile = resolvedImageSpec(profileId,name);
    return `<div class="field full"><span class="field-label">${escapeHTML(label)}</span><div class="media-uploader" data-media-field="${name}" data-profile="${profileId}">
      <div class="media-preview ${profile.width === profile.height ? "square" : ""}" data-media-preview>${value ? `<img src="${value}" alt="Prévia de ${escapeHTML(label)}">` : `<span>Sem imagem</span>`}</div>
      <div class="media-copy"><strong>${profile.width} × ${profile.height} px</strong><p>JPG, PNG ou WEBP. O navegador recorta, redimensiona e comprime automaticamente para até ${profile.maxKB} KB.</p>
      <input type="hidden" name="${name}" value="${value}"><label class="file-button">Selecionar imagem<input type="file" accept="image/jpeg,image/png,image/webp" data-image-input></label> <button class="button small ghost" type="button" data-remove-image>Remover</button><div class="media-status" data-media-status></div></div>
    </div></div>`;
  }

  function bindImageInputs(root) {
    $$('[data-media-field]', root).forEach(control => {
      const input = $('[data-image-input]', control);
      const hidden = $('input[type="hidden"]', control);
      const preview = $('[data-media-preview]', control);
      const status = $('[data-media-status]', control);
      input?.addEventListener("change", async () => {
        const file = input.files?.[0];
        if (!file) return;
        status.textContent = "Processando imagem…";
        try {
          const result = await processImage(file, control.dataset.profile, control.dataset.mediaField || "imagem");
          hidden.value = result.dataURL;
          preview.innerHTML = `<img src="${result.dataURL}" alt="Prévia da imagem enviada">`;
          status.textContent = `${result.width} × ${result.height} px • ${Math.ceil(result.bytes / 1024)} KB`;
        } catch (error) {
          status.textContent = error.message;
          input.value = "";
        }
      });
      $('[data-remove-image]', control)?.addEventListener("click", () => {
        hidden.value = "";
        input.value = "";
        preview.innerHTML = "<span>Sem imagem</span>";
        status.textContent = "Imagem removida. Salve para confirmar.";
      });
    });
    $$('[data-color-text]', root).forEach(text => {
      const color = $(`[name="${text.dataset.colorText}"]`, root);
      color?.addEventListener("input", () => text.value = color.value);
      text.addEventListener("change", () => { if (/^#[0-9a-f]{6}$/i.test(text.value)) color.value = text.value; });
    });
  }

  async function processImage(file, profileId, fieldName = "imagem") {
    const workerProfile = resolveWorkerProfile(profileId, fieldName);
    const profile = workerImageSpecs[workerProfile] || imageProfiles[profileId] || imageProfiles.news;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Use uma imagem JPG, PNG ou WEBP.");
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = profile.width; canvas.height = profile.height;
    const ctx = canvas.getContext("2d", { alpha: true });
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    if (profile.fit === "contain") {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const scale = Math.min(canvas.width / bitmap.width, canvas.height / bitmap.height);
      const w = bitmap.width * scale, h = bitmap.height * scale;
      ctx.drawImage(bitmap, (canvas.width-w)/2, (canvas.height-h)/2, w, h);
    } else {
      const scale = Math.max(canvas.width / bitmap.width, canvas.height / bitmap.height);
      const sourceW = canvas.width / scale, sourceH = canvas.height / scale;
      ctx.drawImage(bitmap, (bitmap.width-sourceW)/2, (bitmap.height-sourceH)/2, sourceW, sourceH, 0, 0, canvas.width, canvas.height);
    }
    bitmap.close?.();
    let quality = .9, blob;
    do { blob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", quality)); quality -= .07; }
    while (blob && blob.size > profile.maxKB * 1024 && quality >= .35);
    if (!blob) throw new Error("Não foi possível processar a imagem.");
    if (blob.size > profile.maxKB * 1024) throw new Error(`A imagem processada ultrapassou ${profile.maxKB} KB.`);
    const dataBase64 = String(await blobToDataURL(blob)).split(",")[1] || "";
    const result = await api("/api/cliente/site/midias", { method: "POST", body: JSON.stringify({ perfil: workerProfile, campo: fieldName, nomeOriginal: file.name, mime: "image/webp", largura: canvas.width, altura: canvas.height, dataBase64 }) });
    if (result?.midia) mediaLibrary.unshift(result.midia);
    return { dataURL: result?.midia?.url || "", bytes: blob.size, width: canvas.width, height: canvas.height };
  }

  function resolveWorkerProfile(profileId, fieldName = "") {
    const field = String(fieldName).toLowerCase();
    if (profileId === "logo") return "logo";
    if (profileId === "hero") return "capa";
    if (profileId === "gallery" || currentPage === "galeria") return "galeria";
    if (currentPage === "seo") return "compartilhamento";
    if (currentPage === "podcasts") return "podcast";
    if (currentPage === "programacao") return "programa";
    if (currentPage === "locutores" || currentPage === "equipe" || field.includes("foto")) return "locutor";
    if (currentPage === "parceiros" || field.includes("logo")) return "parceiro";
    if (currentPage === "videos") return "video";
    if (currentPage === "promocoes") return "promocao";
    if (currentPage === "eventos") return "evento";
    if (field.includes("player")) return "player";
    if (profileId === "news") return "noticia";
    if (profileId === "banner" || profileId === "ad") return "publicidade";
    if (profileId === "popup") return "abertura";
    if (profileId === "app") return field.includes("qr") ? "qrcode" : "favicon";
    return "destaque";
  }

  function blobToDataURL(blob) {
    return new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
  }

  function renderVisualEditor(root) {
    root.innerHTML = `
      ${pageHeader("Editor Visual", "Ative, desative e reorganize blocos. A prévia usa o mesmo conteúdo do painel.", `<button class="button primary" data-preview type="button">Prévia em tela cheia</button>`)}
      <div class="editor-layout">
        <aside class="editor-sidebar">
          <section class="card"><header class="card-header"><div><h3>Blocos da página</h3><p>Arraste para mudar a ordem.</p></div></header><div class="card-body"><div class="module-list" id="module-list"></div></div></section>
          <section class="card"><header class="card-header"><div><h3>Tema ativo</h3><p>Troque sem perder o conteúdo.</p></div></header><div class="card-body"><select id="quick-theme">${themes.map(theme => `<option value="${theme.id}" ${theme.id === state.selectedTheme ? "selected" : ""}>${escapeHTML(theme.name)}</option>`).join("")}</select><button class="button secondary" data-go="themes" type="button" style="width:100%;margin-top:10px">Ver todos os temas</button></div></section>
          <section class="card"><div class="card-body"><div class="notice">O editor usa blocos controlados, mais seguro e fácil que edição livre por código. Nas próximas etapas, cada bloco terá opções próprias de colunas, espaçamentos e estilos.</div></div></section>
        </aside>
        <section>
          <div class="device-toolbar"><strong>Prévia ao vivo</strong><div class="device-switch"><button class="active" data-inline-device="desktop" type="button">Desktop</button><button data-inline-device="tablet" type="button">Tablet</button><button data-inline-device="mobile" type="button">Celular</button></div></div>
          <div class="preview-panel"><div id="inline-preview" class="preview-canvas desktop"></div></div>
        </section>
      </div>`;
    renderModuleList();
    renderSitePreview($("#inline-preview"));
    $("[data-preview]", root).addEventListener("click", openPreview);
    bindGoButtons(root);
    $("#quick-theme").addEventListener("change", event => { state.selectedTheme = event.target.value; persist(false); renderSitePreview($("#inline-preview")); });
    $$('[data-inline-device]', root).forEach(button => button.addEventListener("click", () => {
      $$('[data-inline-device]', root).forEach(item => item.classList.remove("active")); button.classList.add("active");
      $("#inline-preview").className = `preview-canvas ${button.dataset.inlineDevice}`;
    }));
  }

  function renderModuleList() {
    const list = $("#module-list");
    if (!list) return;
    state.modules.sort((a,b) => a.order - b.order);
    list.innerHTML = state.modules.map(module => `<div class="module-item ${module.enabled ? "" : "disabled"}" draggable="true" data-module-id="${module.id}"><span class="drag-handle">☷</span><div><strong>${escapeHTML(module.label)}</strong><small>${escapeHTML(module.description)}</small></div><div class="module-actions"><label class="switch"><input type="checkbox" ${module.enabled ? "checked" : ""} data-module-toggle="${module.id}"><span></span></label></div></div>`).join("");
    $$('[data-module-toggle]', list).forEach(input => input.addEventListener("change", () => {
      const module = state.modules.find(item => item.id === input.dataset.moduleToggle);
      module.enabled = input.checked;
      persist(false); renderModuleList(); renderSitePreview($("#inline-preview"));
    }));
    let dragging = null;
    $$('.module-item', list).forEach(item => {
      item.addEventListener("dragstart", () => { dragging = item; item.classList.add("dragging"); });
      item.addEventListener("dragend", () => { item.classList.remove("dragging"); dragging = null; persist(false); renderSitePreview($("#inline-preview")); });
      item.addEventListener("dragover", event => {
        event.preventDefault(); if (!dragging || dragging === item) return;
        const rect = item.getBoundingClientRect(); const after = event.clientY > rect.top + rect.height/2;
        list.insertBefore(dragging, after ? item.nextSibling : item);
        $$('.module-item', list).forEach((row,index) => { const module = state.modules.find(entry => entry.id === row.dataset.moduleId); module.order = index; });
      });
    });
  }

  function themeLayoutLabel(layout) {
    return ({morada:"rádio completa",music:"música e podcasts",portal:"portal de notícias",community:"comunidade",bento:"jovem em blocos",clean:"institucional limpa"})[layout] || layout;
  }

  function themeShotMarkup(theme) {
    const layout = theme.layout || theme.id;
    if (layout === "music") return `<div class="theme-shot-browser layout-music"><div class="theme-shot-top"></div><div class="theme-shot-music"><span></span><div></div></div><div class="theme-shot-rail"><i></i><i></i><i></i><i></i></div></div>`;
    if (layout === "portal") return `<div class="theme-shot-browser layout-portal"><div class="theme-shot-top"></div><div class="theme-shot-headlines"><b></b><span></span><span></span></div><div class="theme-shot-ticker"></div></div>`;
    if (layout === "community") return `<div class="theme-shot-browser layout-community"><div class="theme-shot-top"></div><div class="theme-shot-community"><b></b><span></span></div><div class="theme-shot-cards"><span></span><span></span><span></span></div></div>`;
    if (layout === "bento") return `<div class="theme-shot-browser layout-bento"><div class="theme-shot-top"></div><div class="theme-shot-bento"><b></b><span></span><i></i><em></em></div></div>`;
    if (layout === "clean") return `<div class="theme-shot-browser layout-clean"><div class="theme-shot-top"></div><div class="theme-shot-clean"><b></b><span></span></div><div class="theme-shot-cards"><span></span><span></span><span></span></div></div>`;
    return `<div class="theme-shot-browser layout-morada"><div class="theme-shot-top"></div><div class="theme-shot-hero"></div><div class="theme-shot-cards"><span></span><span></span><span></span></div></div>`;
  }

  function renderThemes(root) {
    root.innerHTML = `${pageHeader("Temas", "Todos usam o mesmo conteúdo. Cada tema possui composição, hierarquia e identidade visual próprias.")}
      <div class="theme-grid">${themes.map(theme => {
        const [accent,dark,highlight,bg] = theme.colors;
        return `<article class="theme-card ${theme.id === state.selectedTheme ? "selected" : ""}" data-theme-card="${theme.id}">${theme.id === state.selectedTheme ? `<span class="theme-selected-tag">Tema ativo</span>` : ""}<div class="theme-shot" style="--shot-bg:${bg};--shot-dark:${dark};--shot-accent:${accent};--shot-highlight:${highlight};--shot-muted:${highlight}22">${themeShotMarkup(theme)}</div><div class="theme-meta"><span class="theme-layout-label">Composição ${escapeHTML(themeLayoutLabel(theme.layout))}</span><h3>${escapeHTML(theme.name)}</h3><p>${escapeHTML(theme.description)}</p><button class="button ${theme.id === state.selectedTheme ? "secondary" : "primary"} small" data-select-theme="${theme.id}" type="button">${theme.id === state.selectedTheme ? "Selecionado" : "Usar este tema"}</button> <button class="button ghost small" data-theme-preview="${theme.id}" type="button">Visualizar</button></div></article>`;
      }).join("")}</div>`;
    $$('[data-select-theme]', root).forEach(button => button.addEventListener("click", () => { state.selectedTheme = button.dataset.selectTheme; persist(); renderPage(); }));
    $$('[data-theme-preview]', root).forEach(button => button.addEventListener("click", () => openPreview(button.dataset.themePreview)));
  }

  function editorialStats(key, items) {
    const active = items.filter(item => item.ativo !== false).length;
    if (key === "noticias") {
      const scheduled = items.filter(item => newsStatusValue(item) === "agendada").length;
      const featured = items.filter(item => item.destaque && item.ativo !== false).length;
      return [["Total",items.length],["Publicadas",items.filter(isNewsVisible).length],["Agendadas",scheduled],["Destaques",featured]];
    }
    if (key === "programacao") {
      const days = new Set(items.flatMap(item => normalizeDays(item.dias || item.dia)));
      return [["Programas",items.length],["Ativos",active],["Dias cobertos",days.size],["Locutores",new Set(items.map(i=>i.locutor).filter(Boolean)).size]];
    }
    if (key === "locutores") return [["Locutores",items.length],["Ativos",active],["Com foto",items.filter(i=>i.foto).length],["Na programação",new Set(state.content.programacao.map(i=>i.locutor).filter(Boolean)).size]];
    if (key === "podcasts") return [["Episódios",items.length],["Publicados",active],["Destaques",items.filter(i=>i.destaque&&i.ativo!==false).length],["Programas",new Set(items.map(i=>i.programa).filter(Boolean)).size]];
    if (key === "videos") return [["Vídeos",items.length],["Publicados",active],["Destaques",items.filter(i=>i.destaque&&i.ativo!==false).length],["Categorias",new Set(items.map(i=>i.categoria).filter(Boolean)).size]];
    return [];
  }

  function selectOptions(values,prefix) {
    return [...new Set(values.map(value=>String(value||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR")).map(value=>`<option value="${prefix}:${escapeHTML(value)}" ${collectionContextFilter === `${prefix}:${value}` ? "selected" : ""}>${escapeHTML(value)}</option>`).join("");
  }

  function sortOptions(key) {
    const options = key === "podcasts" ? [["padrao","Mais recentes"],["destaques","Destaques primeiro"],["programa","Programa e episódio"],["titulo","Título A–Z"],["antigos","Mais antigos"]]
      : key === "videos" ? [["padrao","Mais recentes"],["destaques","Destaques primeiro"],["categoria","Categoria"],["titulo","Título A–Z"],["antigos","Mais antigos"]]
      : key === "noticias" ? [["padrao","Destaques e recentes"],["recentes","Mais recentes"],["titulo","Título A–Z"],["antigos","Mais antigas"]]
      : [];
    return options.length ? `<select id="collection-sort" aria-label="Ordenar conteúdos">${options.map(([value,label])=>`<option value="${value}" ${collectionSort===value?"selected":""}>${label}</option>`).join("")}</select>` : "";
  }

  function collectionFilters(key, allItems) {
    const base = `<select id="collection-filter" aria-label="Filtrar por publicação"><option value="todos" ${collectionFilter === "todos" ? "selected" : ""}>Todos os status</option><option value="ativos" ${collectionFilter === "ativos" ? "selected" : ""}>Publicados</option><option value="inativos" ${collectionFilter === "inativos" ? "selected" : ""}>Não publicados</option></select>`;
    if (key === "programacao") return `${base}<select id="collection-context-filter" aria-label="Filtrar por dia"><option value="todos" ${collectionContextFilter === "todos" ? "selected" : ""}>Todos os dias</option>${weekOrder.map(day=>`<option value="dia:${day}" ${collectionContextFilter === `dia:${day}` ? "selected" : ""}>${day}</option>`).join("")}</select>`;
    if (key === "noticias") return `<select id="collection-filter" aria-label="Filtrar situação editorial"><option value="todos" ${collectionFilter === "todos" ? "selected" : ""}>Todas as situações</option>${["publicada","agendada","rascunho","arquivada"].map(value=>`<option value="news:${value}" ${collectionFilter === `news:${value}` ? "selected" : ""}>${value[0].toUpperCase()+value.slice(1)}</option>`).join("")}</select><select id="collection-context-filter" aria-label="Filtrar categoria"><option value="todos" ${collectionContextFilter === "todos" ? "selected" : ""}>Todas as categorias</option>${selectOptions(allItems.map(i=>i.categoria),"categoria")}</select>${sortOptions(key)}`;
    if (key === "podcasts") return `${base}<select id="collection-context-filter" aria-label="Filtrar podcast"><option value="todos" ${collectionContextFilter === "todos" ? "selected" : ""}>Todos os programas</option>${selectOptions(allItems.map(i=>i.programa),"programa")}</select>${sortOptions(key)}`;
    if (key === "videos") return `${base}<select id="collection-context-filter" aria-label="Filtrar categoria"><option value="todos" ${collectionContextFilter === "todos" ? "selected" : ""}>Todas as categorias</option>${selectOptions(allItems.map(i=>i.categoria),"categoria")}</select>${sortOptions(key)}`;
    return base;
  }

  function contentTimestamp(item) {
    const raw = item.data ? `${item.data}T${item.hora||"12:00"}:00` : (item.atualizadoEm || item.criadoEm || "");
    const time=Date.parse(raw); return Number.isFinite(time)?time:0;
  }

  function filterAndSortCollection(key, source) {
    let items = source.filter(item => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()));
    if (collectionFilter === "ativos") items = items.filter(item => item.ativo !== false);
    else if (collectionFilter === "inativos") items = items.filter(item => item.ativo === false);
    else if (collectionFilter.startsWith("news:")) items = items.filter(item => newsStatusValue(item) === collectionFilter.slice(5));
    if (collectionContextFilter.startsWith("dia:")) items = items.filter(item => normalizeDays(item.dias || item.dia).includes(collectionContextFilter.slice(4)));
    else if (collectionContextFilter.startsWith("programa:")) items = items.filter(item => String(item.programa||"") === collectionContextFilter.slice(9));
    else if (collectionContextFilter.startsWith("categoria:")) items = items.filter(item => String(item.categoria||"") === collectionContextFilter.slice(10));
    items = [...items];
    if (key === "programacao") items.sort((a,b)=>Math.min(...normalizeDays(a.dias||a.dia).map(d=>weekOrder.indexOf(d)).filter(i=>i>=0),99)-Math.min(...normalizeDays(b.dias||b.dia).map(d=>weekOrder.indexOf(d)).filter(i=>i>=0),99) || compareTime(a.inicio,b.inicio));
    else if (key === "locutores") items.sort((a,b)=>Number(a.ordem||999)-Number(b.ordem||999) || String(a.nome||"").localeCompare(String(b.nome||"")));
    else if (collectionSort === "titulo") items.sort((a,b)=>String(a.titulo||a.nome||"").localeCompare(String(b.titulo||b.nome||""),"pt-BR"));
    else if (collectionSort === "antigos") items.sort((a,b)=>contentTimestamp(a)-contentTimestamp(b));
    else if (collectionSort === "destaques") items.sort((a,b)=>Number(Boolean(b.destaque))-Number(Boolean(a.destaque)) || contentTimestamp(b)-contentTimestamp(a));
    else if (collectionSort === "programa") items.sort((a,b)=>String(a.programa||"").localeCompare(String(b.programa||""),"pt-BR") || Number(a.temporada||0)-Number(b.temporada||0) || Number(a.episodio||0)-Number(b.episodio||0));
    else if (collectionSort === "categoria") items.sort((a,b)=>String(a.categoria||"").localeCompare(String(b.categoria||""),"pt-BR") || contentTimestamp(b)-contentTimestamp(a));
    else if (key === "noticias") items.sort((a,b)=>Number(Boolean(b.destaque))-Number(Boolean(a.destaque)) || contentTimestamp(b)-contentTimestamp(a));
    else if (["podcasts","videos"].includes(key)) items.sort((a,b)=>Number(Boolean(b.destaque))-Number(Boolean(a.destaque)) || contentTimestamp(b)-contentTimestamp(a));
    return items;
  }

  function renderCollection(root,key) {
    const schema = schemas[key];
    const source = state.content[key] || [];
    const items = filterAndSortCollection(key, source);
    const stats = editorialStats(key, source);
    const newItemLabel = key === "noticias" ? "+ Nova notícia" : `+ Novo ${schema.singular}`;
    root.innerHTML = `${pageHeader(schema.title, schema.description, `<button class="button secondary" data-preview type="button">Ver no site</button><button class="button primary" id="new-item" type="button">${newItemLabel}</button>`)}
      ${stats.length ? `<div class="editorial-kpis">${stats.map(([label,value])=>`<article><span>${escapeHTML(label)}</span><strong>${value}</strong></article>`).join("")}</div>` : ""}
      <section class="table-card"><div class="table-toolbar editorial-toolbar"><div class="search-input"><input id="collection-search" type="search" placeholder="Buscar em ${schema.title.toLowerCase()}" value="${escapeHTML(searchTerm)}"></div><div class="collection-filters">${collectionFilters(key,source)}</div><span class="badge info">${items.length} de ${source.length}</span></div>
      ${items.length ? `<div class="table-scroll"><table class="data-table"><thead><tr><th>${schema.singular}</th><th>Resumo</th><th>Status</th><th style="text-align:right">Ações</th></tr></thead><tbody>${items.map(item => collectionRow(schema,key,item)).join("")}</tbody></table></div>` : `<div class="empty-state"><strong>Nenhum registro encontrado</strong><span>Ajuste os filtros ou use o botão “Novo”.</span></div>`}</section>`;
    $("#new-item").addEventListener("click", () => openItemModal(key));
    $$('[data-preview]',root).forEach(button=>button.addEventListener("click",openPreview));
    $("#collection-search").addEventListener("input", event => { searchTerm = event.target.value; renderCollection(root,key); $("#collection-search")?.focus(); });
    $("#collection-filter")?.addEventListener("change", event => { collectionFilter=event.target.value; renderCollection(root,key); });
    $("#collection-context-filter")?.addEventListener("change", event => { collectionContextFilter=event.target.value; renderCollection(root,key); });
    $("#collection-sort")?.addEventListener("change", event => { collectionSort=event.target.value; renderCollection(root,key); });
    $$('[data-view-item]', root).forEach(button => button.addEventListener("click", () => openSiteDetail(key,button.dataset.viewItem)));
    $$('[data-edit-item]', root).forEach(button => button.addEventListener("click", () => openItemModal(key,button.dataset.editItem)));
    $$('[data-duplicate-item]', root).forEach(button => button.addEventListener("click", () => duplicateItem(key,button.dataset.duplicateItem)));
    $$('[data-delete-item]', root).forEach(button => button.addEventListener("click", () => deleteItem(key,button.dataset.deleteItem)));
    $$('[data-toggle-item]', root).forEach(button => button.addEventListener("click", () => toggleItem(key,button.dataset.toggleItem)));
  }

  function collectionStatus(key,item) {
    if (key === "noticias") {
      const status = newsStatusValue(item);
      return `<span class="badge status-${status}">${escapeHTML(statusNewsLabel(item))}</span>`;
    }
    return `<div class="collection-status-stack"><button class="badge ${item.ativo === false ? "inactive" : "active"}" data-toggle-item="${item.id}" type="button">${item.ativo === false ? "Não publicado" : "Publicado"}</button>${item.destaque ? `<span class="badge featured">Destaque</span>` : ""}</div>`;
  }

  function collectionRow(schema,key,item) {
    const imageKey = ["imagem","foto","logo"].find(name => item[name]);
    const description = item.descricao || item.resumo || item.bio || (key === "noticias" ? item.tags : "") || "Sem descrição";
    return `<tr><td><div class="row-main">${imageKey ? `<img class="row-thumb" src="${item[imageKey]}" alt="">` : `<span class="row-thumb row-thumb-placeholder">${escapeHTML((item.titulo || item.nome || "CR").slice(0,2).toUpperCase())}</span>`}<div><strong>${escapeHTML(item.titulo || item.nome || "Sem título")}</strong><small>${escapeHTML(description)}</small></div></div></td><td>${escapeHTML(schema.summary ? schema.summary(item) : "—")}</td><td>${collectionStatus(key,item)}</td><td><div class="row-actions"><button class="button small ghost" data-view-item="${item.id}" type="button">Visualizar</button><button class="button small secondary" data-edit-item="${item.id}" type="button">Editar</button><button class="button small ghost" data-duplicate-item="${item.id}" type="button">Duplicar</button><button class="button small danger" data-delete-item="${item.id}" type="button">Excluir</button></div></td></tr>`;
  }

  function openItemModal(key,id=null) {
    const schema = schemas[key];
    const today=new Date().toISOString().slice(0,10);
    const base = key === "noticias" ? { ativo:true, status:"Rascunho", data:today }
      : key === "programacao" ? { ativo:true, dias:["Segunda","Terça","Quarta","Quinta","Sexta"], cor:"#e31c45" }
      : key === "podcasts" ? { ativo:true, destaque:false, data:today, temporada:1, episodio:0, duracaoMinutos:0 }
      : key === "videos" ? { ativo:true, destaque:false, data:today, tipo:"Automático", duracaoMinutos:0 }
      : { ativo:true };
    const item = id ? state.content[key].find(entry => entry.id === id) : base;
    editing = { key, id };
    $("#modal-eyebrow").textContent = schema.title;
    $("#modal-title").textContent = id ? `Editar ${schema.singular}` : (key === "noticias" ? "Nova notícia" : `Novo ${schema.singular}`);
    $("#modal-fields").innerHTML = `<div class="form-grid">${schema.fields.map(field => modalFieldHTML(field,item)).join("")}</div>`;
    bindImageInputs($("#modal-fields"));
    $("#editor-modal").showModal();
  }

  function modalFieldHTML(field,item) {
    const [name,label,type,required,extra] = field;
    const value = item[name] ?? "";
    const inputId = `modal-field-${name}`;
    if (type === "textarea" || type === "richtext") return `<div class="field full"><label for="${inputId}">${escapeHTML(label)}</label><textarea id="${inputId}" class="${type === "richtext" ? "rich-editor" : ""}" name="${name}" ${required ? "required" : ""}>${escapeHTML(value)}</textarea>${type === "richtext" ? `<small class="field-help">Use parágrafos curtos. A formatação avançada será incorporada na etapa do editor editorial.</small>` : ""}</div>`;
    if (type === "select") return `<div class="field"><label for="${inputId}">${escapeHTML(label)}</label><select id="${inputId}" name="${name}" ${required ? "required" : ""}><option value="">Selecione</option>${extra.map(option => `<option value="${escapeHTML(option)}" ${String(option).toLowerCase() === String(value).toLowerCase() ? "selected" : ""}>${escapeHTML(option)}</option>`).join("")}</select></div>`;
    if (type === "locutor-select") { const options=state.content.locutores.filter(i=>i.ativo!==false); return `<div class="field"><label for="${inputId}">${escapeHTML(label)}</label><select id="${inputId}" name="${name}"><option value="">Sem vínculo</option>${options.map(loc=>`<option value="${escapeHTML(loc.nome)}" ${loc.nome === value ? "selected" : ""}>${escapeHTML(loc.nome)}${loc.cargo?` — ${escapeHTML(loc.cargo)}`:""}</option>`).join("")}</select></div>`; }
    if (type === "multicheck") { const selected=normalizeDays(value); return `<fieldset class="field full checkbox-fieldset"><legend>${escapeHTML(label)}${required?" *":""}</legend><div class="checkbox-grid">${extra.map(option=>`<label><input type="checkbox" name="${name}" value="${escapeHTML(option)}" ${selected.includes(option)?"checked":""}><span>${escapeHTML(option)}</span></label>`).join("")}</div></fieldset>`; }
    if (type === "checkbox") return `<div class="field"><span class="field-label">${escapeHTML(label)}</span><div class="toggle-row"><div><strong>${value === false ? "Desativado" : "Ativado"}</strong><small>Altere o status deste registro.</small></div><label class="switch"><input aria-label="${escapeHTML(label)}" type="checkbox" name="${name}" ${value === false ? "" : "checked"}><span></span></label></div></div>`;
    if (type === "image") return mediaFieldHTML(name,label,extra || "news",value);
    const numeric = type === "number" ? ` min="0" step="1" inputmode="numeric"` : "";
    const help = name === "audio" ? `<small class="field-help">Use uma URL pública HTTPS de MP3, AAC, M4A, OGG, WAV, Opus ou outro áudio reproduzível pelo navegador.</small>`
      : name === "url" ? `<small class="field-help">Aceita YouTube, Vimeo, MP4/WebM/Ogg, transmissão HLS ou outro link público HTTPS.</small>` : "";
    return `<div class="field"><label for="${inputId}">${escapeHTML(label)}</label><input id="${inputId}" name="${name}" type="${type}" value="${escapeHTML(value)}" ${required ? "required" : ""}${numeric}>${help}</div>`;
  }

  function validateEditorialItem(key,item,id) {
    if (key === "programacao") {
      const days=normalizeDays(item.dias);
      if (!days.length) return "Selecione ao menos um dia da semana.";
      if (!item.inicio || !item.fim || item.inicio >= item.fim) return "O horário final deve ser posterior ao horário inicial.";
      const conflict=state.content.programacao.find(other=>other.id!==id && other.ativo!==false && item.ativo!==false && normalizeDays(other.dias||other.dia).some(day=>days.includes(day)) && item.inicio < other.fim && item.fim > other.inicio);
      if (conflict) return `Conflito com “${conflict.titulo}” (${formatDays(conflict.dias||conflict.dia)}, ${conflict.inicio}–${conflict.fim}).`;
    }
    if (key === "noticias") {
      item.slug=slugify(item.slug || item.titulo);
      const duplicate=state.content.noticias.find(other=>other.id!==id && slugify(other.slug||other.titulo)===item.slug);
      if (duplicate) return "Já existe uma notícia com o mesmo endereço amigável.";
      item.status=statusNewsLabel(item);
      if (item.status === "Agendada" && (!item.data || !item.hora)) return "Informe data e horário para uma notícia agendada.";
      item.ativo = item.status === "Publicada" ? item.ativo !== false : item.ativo !== false;
    }
    if (key === "podcasts") {
      item.temporada=Math.max(0,Math.trunc(Number(item.temporada||0)));
      item.episodio=Math.max(0,Math.trunc(Number(item.episodio||0)));
      item.duracaoMinutos=Math.max(0,Math.trunc(Number(item.duracaoMinutos||0)));
      if (!absoluteHttpURL(item.audio)) return "Informe um endereço público válido de áudio começando com https:// ou http://.";
      const duplicate=item.episodio>0 && state.content.podcasts.find(other=>other.id!==id && String(other.programa||"").trim().toLowerCase()===String(item.programa||"").trim().toLowerCase() && Number(other.temporada||0)===item.temporada && Number(other.episodio||0)===item.episodio);
      if (duplicate) return `Já existe o episódio ${item.episodio} da temporada ${item.temporada || 1} em “${item.programa}”.`;
    }
    if (key === "videos") {
      item.duracaoMinutos=Math.max(0,Math.trunc(Number(item.duracaoMinutos||0)));
      if (!absoluteHttpURL(item.url)) return "Informe um endereço público válido de vídeo começando com https:// ou http://.";
      const detected=detectVideoType(item.url);
      item.tipoDetectado=detected;
      if (item.tipo === "YouTube" && detected !== "YouTube") return "O endereço informado não foi reconhecido como vídeo do YouTube.";
      if (item.tipo === "Vimeo" && detected !== "Vimeo") return "O endereço informado não foi reconhecido como vídeo do Vimeo.";
      if (item.tipo === "Arquivo de vídeo" && detected !== "Arquivo de vídeo") return "Para Arquivo de vídeo, use um endereço direto terminado em MP4, WebM, OGG, MOV ou M4V.";
      if (item.tipo === "Transmissão ao vivo" && !["Transmissão ao vivo","Link externo"].includes(detected)) return "Informe o endereço público da transmissão ao vivo.";
      const duplicate=state.content.videos.find(other=>other.id!==id && normalizeComparableURL(other.url)===normalizeComparableURL(item.url));
      if (duplicate) return `Este endereço de vídeo já está cadastrado em “${duplicate.titulo}”.`;
    }
    if (key === "locutores") item.ordem=Number(item.ordem||0);
    return "";
  }

  function saveModal(event) {
    event.preventDefault();
    if (event.submitter?.value === "cancel") { $("#editor-modal").close(); return; }
    if (!editing) return;
    const { key,id } = editing, schema = schemas[key], form = new FormData($("#editor-form"));
    if (!$("#editor-form").checkValidity()) { $("#editor-form").reportValidity(); return; }
    const item = id ? state.content[key].find(entry => entry.id === id) : { id: uid(key), criadoEm:new Date().toISOString() };
    schema.fields.forEach(([name,,type]) => {
      if (type === "checkbox") item[name]=form.has(name);
      else if (type === "multicheck") item[name]=form.getAll(name).map(value=>String(value));
      else if (type === "number") item[name]=Number(form.get(name)||0);
      else item[name]=String(form.get(name)||"").trim();
    });
    item.atualizadoEm=new Date().toISOString();
    const validation=validateEditorialItem(key,item,id);
    if (validation) return notify(validation,"error");
    if (!id) state.content[key].unshift(item);
    persist(false);
    $("#editor-modal").close(); editing=null; renderPage();
    notify(id ? "Registro atualizado." : "Registro criado.", "success");
  }

  function duplicateItem(key,id) {
    const source=state.content[key].find(entry=>entry.id===id); if(!source)return;
    const clone=JSON.parse(JSON.stringify(source)); clone.id=uid(key); clone.criadoEm=new Date().toISOString(); clone.atualizadoEm=clone.criadoEm;
    if (clone.titulo) clone.titulo=`${clone.titulo} — cópia`;
    if (clone.nome) clone.nome=`${clone.nome} — cópia`;
    if (key === "noticias") { clone.slug=slugify(`${clone.slug||clone.titulo}-copia`); clone.status="Rascunho"; clone.destaque=false; }
    if (key === "programacao") { clone.ativo=false; }
    if (["podcasts","videos"].includes(key)) { clone.ativo=false; clone.destaque=false; }
    state.content[key].unshift(clone); persist(false); renderPage(); notify("Cópia criada para revisão.","success");
  }

  function deleteItem(key,id) {
    const item = state.content[key].find(entry => entry.id === id);
    if (!item || !confirm(`Excluir “${item.titulo || item.nome || "este registro"}”?`)) return;
    state.content[key] = state.content[key].filter(entry => entry.id !== id);
    persist(false); renderPage(); notify("Registro excluído.", "success");
  }

  function toggleItem(key,id) {
    const item = state.content[key].find(entry => entry.id === id); if (!item) return;
    item.ativo = item.ativo === false; persist(false); renderPage();
  }

  function renderUsers(root) {
    const client = dashboardData?.cliente || {};
    root.innerHTML = `${pageHeader("Usuários e acesso","Conta atual e segurança do Portal do Cliente.")}
      <div class="grid-2">
        <section class="card"><header class="card-header"><div><h3>Acesso atual</h3><p>Identidade vinculada ao cliente.</p></div></header><div class="card-body"><div class="status-list">
          <div class="health-row"><div><strong>${escapeHTML(client.nome || client.nome_radio || "Cliente")}</strong><span>${escapeHTML(client.email || "E-mail do acesso")}</span></div><span class="badge active">Ativo</span></div>
          <div class="notice">A criação de acessos adicionais é controlada pela Central. Nenhum usuário fictício é criado pelo painel.</div>
        </div></div></section>
        <form class="card" id="password-form"><header class="card-header"><div><h3>Alterar senha</h3><p>Use ao menos 8 caracteres.</p></div></header><div class="card-body"><div class="form-grid">
          ${fieldHTML("senhaAtual","Senha atual","password","",true)}${fieldHTML("novaSenha","Nova senha","password","",true)}${fieldHTML("confirmacao","Confirmar nova senha","password","",true)}
        </div></div><footer class="card-footer"><button class="button primary" type="submit">Atualizar senha</button></footer></form>
      </div>`;
    $("#password-form").addEventListener("submit", changePassword);
  }

  async function changePassword(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const nova = String(form.get("novaSenha") || ""), confirmacao = String(form.get("confirmacao") || "");
    if (nova.length < 8) return notify("A nova senha deve ter ao menos 8 caracteres.", "error");
    if (nova !== confirmacao) return notify("A confirmação não corresponde à nova senha.", "error");
    try { const result = await api("/api/cliente/trocar-senha", { method: "POST", body: JSON.stringify({ senhaAtual: form.get("senhaAtual"), novaSenha: nova }) }); event.currentTarget.reset(); notify(result.mensagem || "Senha atualizada.", "success"); }
    catch (error) { notify(error.message, "error"); }
  }

  function renderPublication(root) {
    const status = remoteSite?.status_publicacao || state.status;
    root.innerHTML = `${pageHeader("Publicação","Revise a prévia e envie o rascunho para aprovação da Central.", `<button class="button secondary" data-preview type="button">Abrir prévia</button>`)}
      <div class="grid-2">
        <section class="card"><header class="card-header"><div><h3>Situação atual</h3><p>Fluxo real de publicação.</p></div></header><div class="card-body"><div class="status-list">
          <div class="health-row"><div><strong>${escapeHTML(statusLabel(status))}</strong><span>${remoteSite?.solicitacao_publicacao_em ? `Solicitado em ${formatDateTime(remoteSite.solicitacao_publicacao_em)}` : remoteSite?.ultima_publicacao_em ? `Publicado em ${formatDateTime(remoteSite.ultima_publicacao_em)}` : "Ainda não publicado"}</span></div><span class="badge ${status === "publicado" ? "active" : "info"}">${escapeHTML(statusLabel(status))}</span></div>
          <div class="notice">Salvar o rascunho não altera o site público. A publicação é revisada pela Central Rádios Brasil.</div>
        </div></div><footer class="card-footer"><div class="page-actions"><button class="button secondary" id="publication-save" type="button">Salvar rascunho</button><button class="button primary" id="publication-request" type="button" ${status === "aguardando_publicacao" ? "disabled" : ""}>Solicitar publicação</button></div></footer></section>
        <section class="card"><header class="card-header"><div><h3>Histórico de versões</h3><p>Últimas versões registradas no D1.</p></div></header><div class="card-body"><div class="activity-list">${versions.slice(0,12).map(v => `<div class="activity-item"><span class="activity-dot"></span><div><strong>Versão ${Number(v.numero)}</strong><p>${escapeHTML(statusLabel(v.status))} • ${escapeHTML(statusLabel(v.autor_tipo))}</p></div><span class="activity-time">${formatDateTime(v.criado_em)}</span></div>`).join("") || `<div class="empty-state"><strong>Nenhuma versão registrada</strong></div>`}</div></div></section>
      </div>`;
    $$('[data-preview]',root).forEach(button=>button.addEventListener("click",openPreview));
    $("#publication-save").addEventListener("click",()=>persist(true));
    $("#publication-request").addEventListener("click",requestPublication);
  }

  async function requestPublication() {
    if (!remoteSite) return;
    if (!confirm("Enviar o rascunho atual para revisão e publicação pela Central Rádios Brasil?")) return;
    try { await queueRemoteSave(false); const result = await api("/api/cliente/site/solicitar-publicacao", { method: "POST", body: "{}" }); remoteSite.status_publicacao = result.statusPublicacao || "aguardando_publicacao"; remoteSite.solicitacao_publicacao_em = new Date().toISOString(); state.status = remoteSite.status_publicacao; renderPage(); updateChrome(); notify(result.mensagem || "Solicitação enviada.", "success"); }
    catch (error) { notify(error.message, "error"); }
  }

  function renderInvoices(root) {
    const invoices = dashboardData?.faturas || [];
    root.innerHTML = `${pageHeader("Faturas","Cobranças vinculadas ao contrato do cliente.")}
      <section class="table-card">${invoices.length ? `<table class="data-table"><thead><tr><th>Número</th><th>Competência</th><th>Vencimento</th><th>Valor</th><th>Status</th></tr></thead><tbody>${invoices.map(f => `<tr><td><strong>${escapeHTML(f.numero || "—")}</strong><small>${escapeHTML(statusLabel(f.tipo_cobranca))}</small></td><td>${escapeHTML(f.competencia || "—")}</td><td>${formatDate(f.vencimento)}</td><td>${money(f.valor_total_centavos)}</td><td><span class="badge ${f.status === "paga" ? "active" : "info"}">${escapeHTML(statusLabel(f.status))}</span></td></tr>`).join("")}</tbody></table>` : `<div class="empty-state"><strong>Nenhuma fatura registrada</strong></div>`}</section>`;
  }

  function renderContract(root) {
    const contracts = dashboardData?.contratos || [];
    root.innerHTML = `${pageHeader("Contrato","Plano, serviços e situação contratual.")}<div class="grid-2">${contracts.map(c => `<section class="card"><header class="card-header"><div><h3>${escapeHTML(c.numero || "Contrato")}</h3><p>${escapeHTML(c.plano_nome || "Plano personalizado")}</p></div><span class="badge ${c.status === "ativo" ? "active" : "info"}">${escapeHTML(statusLabel(c.status))}</span></header><div class="card-body"><div class="status-list">
      <div class="health-row"><div><strong>Mensalidade</strong><span>Vencimento no dia ${Number(c.dia_vencimento || 10)}</span></div><strong>${money(c.valor_centavos)}</strong></div>
      <div class="health-row"><div><strong>Streaming</strong><span>Serviço contratado</span></div><span class="badge info">${escapeHTML(statusLabel(c.streaming_status))}</span></div>
      <div class="health-row"><div><strong>Site</strong><span>CMS Multitema</span></div><span class="badge info">${escapeHTML(statusLabel(c.site_status))}</span></div>
    </div></div></section>`).join("") || `<section class="card"><div class="card-body"><div class="empty-state"><strong>Nenhum contrato registrado</strong></div></div></section>`}</div>`;
  }

  function renderIntegration(root,page) {
    const renderers = { whatsapp: renderWhatsapp, redes: renderSocial, seo: renderSEO, dominio: renderDomain, aplicativo: renderApp, configuracoes: renderSettings, backup: renderBackup };
    if (renderers[page]) return renderers[page](root);
    root.innerHTML = pageHeader("Área em preparação", "Esta função ainda não possui endpoint próprio no Worker atual.") + `<section class="card"><div class="card-body"><div class="notice warning">Esta área depende de uma ampliação futura do Worker. Nenhum dado fictício será salvo.</div></div></section>`;
  }

  function simpleForm(root,title,description,fieldsHTML,onSubmit,extra="") {
    root.innerHTML = `${pageHeader(title,description)}<form class="form-card" id="simple-form"><section class="form-section"><div class="form-grid">${fieldsHTML}</div></section>${extra}<footer class="card-footer"><button class="button primary" type="submit">Salvar configurações</button></footer></form>`;
    bindImageInputs(root); $("#simple-form").addEventListener("submit",onSubmit);
  }

  function renderWhatsapp(root) {
    const data = state.integrations.whatsapp;
    simpleForm(root,"WhatsApp","Configure o botão flutuante, atendimento e pedidos de música.",`${fieldHTML("numero","Número com DDI e DDD","text",data.numero,true)}${fieldHTML("mensagem","Mensagem inicial","textarea",data.mensagem,false,"full")}<div class="field full"><div class="toggle-row"><div><strong>Botão flutuante</strong><small>Exibir em todas as páginas.</small></div><label class="switch"><input type="checkbox" name="flutuante" ${data.flutuante ? "checked" : ""}><span></span></label></div><div class="toggle-row"><div><strong>Pedidos pelo WhatsApp</strong><small>Atalho na área do player e programação.</small></div><label class="switch"><input type="checkbox" name="pedidos" ${data.pedidos ? "checked" : ""}><span></span></label></div></div>`,event=>{event.preventDefault();const form=new FormData(event.currentTarget);data.numero=form.get("numero");data.mensagem=form.get("mensagem");data.flutuante=form.has("flutuante");data.pedidos=form.has("pedidos");persist();});
  }

  function renderSocial(root) {
    const d=state.integrations.redes;
    simpleForm(root,"Redes Sociais","Links oficiais exibidos no cabeçalho, rodapé e módulos de compartilhamento.",["instagram","facebook","youtube","tiktok","x","spotify"].map(key=>fieldHTML(key,key.charAt(0).toUpperCase()+key.slice(1),"url",d[key])).join(""),event=>{event.preventDefault();const f=new FormData(event.currentTarget);Object.keys(d).forEach(k=>d[k]=String(f.get(k)||""));persist();});
  }

  function renderSEO(root) {
    const d=state.integrations.seo;
    simpleForm(root,"SEO","Título, descrição e imagem para buscadores e compartilhamento.",`${fieldHTML("titulo","Título do site","text",d.titulo,true)}${fieldHTML("palavras","Palavras-chave","text",d.palavras)}${fieldHTML("descricao","Descrição para busca","textarea",d.descricao,false,"full")}${mediaFieldHTML("imagem","Imagem de compartilhamento","news",d.imagem)}`,event=>{event.preventDefault();const f=new FormData(event.currentTarget);["titulo","palavras","descricao","imagem"].forEach(k=>d[k]=String(f.get(k)||""));persist();});
  }

  function renderDomain(root) {
    const d=state.integrations.dominio;
    root.innerHTML = `${pageHeader("Domínio","Endereços públicos do site, controlados e validados pela Central Rádios Brasil.")}
      <section class="card"><div class="card-body"><div class="form-grid">
        <div class="field"><label>Subdomínio Central</label><input value="${escapeHTML(d.atual || "Ainda não configurado")}" readonly></div>
        <div class="field"><label>Domínio próprio</label><input value="${escapeHTML(d.proprio || "Não configurado")}" readonly></div>
        <div class="field full"><div class="notice">Alterações de DNS, certificado e domínio são realizadas pela Central para evitar indisponibilidade ou configuração incorreta.</div></div>
      </div></div></section>`;
  }

  function renderApp(root) {
    const d=state.integrations.aplicativo;
    simpleForm(root,"Aplicativo","Links para lojas, PWA e identidade do aplicativo.",`${fieldHTML("android","Google Play","url",d.android)}${fieldHTML("ios","App Store","url",d.ios)}${mediaFieldHTML("icone","Ícone do aplicativo","app",d.icone)}${mediaFieldHTML("qrcode","QR Code","square",d.qrcode)}<div class="field full"><div class="toggle-row"><div><strong>Aplicativo instalável (PWA)</strong><small>Oferecer instalação pelo navegador.</small></div><label class="switch"><input type="checkbox" name="pwa" ${d.pwa?"checked":""}><span></span></label></div></div>`,event=>{event.preventDefault();const f=new FormData(event.currentTarget);["android","ios","icone","qrcode"].forEach(k=>d[k]=String(f.get(k)||""));d.pwa=f.has("pwa");persist();});
  }

  function renderSettings(root) {
    const d=state.integrations.configuracoes;
    simpleForm(root,"Configurações","Preferências gerais, acessibilidade, moderação e privacidade.",`<div class="field"><label>Idioma</label><select name="idioma"><option value="pt-BR" selected>Português (Brasil)</option></select></div>${fieldHTML("timezone","Fuso horário","text",d.timezone)}<div class="field full"><div class="toggle-row"><div><strong>Moderação de conteúdo</strong><small>Recados e participações passam por aprovação.</small></div><label class="switch"><input type="checkbox" name="moderacao" ${d.moderacao?"checked":""}><span></span></label></div><div class="toggle-row"><div><strong>Recursos de acessibilidade</strong><small>Contraste, foco, textos alternativos e navegação por teclado.</small></div><label class="switch"><input type="checkbox" name="acessibilidade" ${d.acessibilidade?"checked":""}><span></span></label></div><div class="toggle-row"><div><strong>Aviso de cookies e privacidade</strong><small>Exibir consentimento quando necessário.</small></div><label class="switch"><input type="checkbox" name="cookies" ${d.cookies?"checked":""}><span></span></label></div></div>`,event=>{event.preventDefault();const f=new FormData(event.currentTarget);d.timezone=String(f.get("timezone")||"");d.moderacao=f.has("moderacao");d.acessibilidade=f.has("acessibilidade");d.cookies=f.has("cookies");persist();});
  }

  function renderBackup(root) {
    root.innerHTML = `${pageHeader("Backup","Exporte uma cópia do conteúdo atual ou importe um arquivo para revisão antes de salvar.")}
      <div class="grid-3">
        <section class="card"><div class="card-body"><h3>Exportar JSON</h3><p class="field-help">Baixa configurações, módulos, temas e conteúdos.</p><button class="button primary" id="export-backup" type="button">Baixar backup</button></div></section>
        <section class="card"><div class="card-body"><h3>Importar JSON</h3><p class="field-help">Carrega o arquivo no editor; clique em Salvar rascunho para gravar no D1.</p><button class="button secondary" id="import-backup" type="button">Selecionar arquivo</button></div></section>
        <section class="card"><div class="card-body"><h3>Recarregar do servidor</h3><p class="field-help">Descarta alterações ainda não salvas e recarrega o último rascunho do servidor.</p><button class="button danger" id="reset-demo" type="button">Recarregar dados</button></div></section>
      </div><section class="card" style="margin-top:18px"><header class="card-header"><div><h3>Sobre esta instalação</h3><p>Informações técnicas.</p></div></header><div class="card-body"><div class="code-box">Modo: produção integrada\nVersão: ${CONFIG.VERSION || "2.3.0-etapa1"}\nPersistência: Cloudflare D1\nAPI: ${CONFIG.WORKER_URL || "não configurada"}\nÚltima alteração: ${formatDateTime(state.updatedAt)}</div></div></section>`;
    $("#export-backup").addEventListener("click",exportBackup);
    $("#import-backup").addEventListener("click",()=>$("#backup-import").click());
    $("#reset-demo").addEventListener("click",()=>{if(confirm("Descartar alterações não salvas e recarregar o rascunho do servidor?")) loadAll();});
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`crb-cms-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);
  }

  function importBackup(file) {
    const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(reader.result);if(!parsed.radio||!parsed.modules||!parsed.content)throw new Error("Estrutura inválida");if(confirm("Importar este backup e substituir o conteúdo atual no editor?")){state=deepMerge(defaultState(),parsed);persist(false);renderPage();notify("Backup importado.","success");}}catch(error){notify("Arquivo de backup inválido.","error");}};reader.readAsText(file);
  }

  function statusLabel(value) {
    const labels = { ativo:"Ativo", prospect:"Prospect", suspenso:"Suspenso", cancelado:"Cancelado", rascunho:"Rascunho", publicado:"Publicado", sem_rascunho:"Sem rascunho", aguardando_publicacao:"Aguardando publicação", planejamento:"Planejamento", configurando:"Configurando", nao_incluido:"Não incluído", aberta:"Aberta", parcial:"Parcial", paga:"Paga", vencida:"Vencida", cancelada:"Cancelada", estornada:"Estornada", mensalidade:"Mensalidade", implantacao:"Implantação", servico_adicional:"Serviço adicional", ajuste:"Ajuste", outro:"Outro", cliente:"Cliente", admin:"Admin", publicada:"Publicada" };
    return labels[value] || String(value || "—").replaceAll("_"," ");
  }
  function money(cents) { return new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(Number(cents || 0) / 100); }
  function safeArray(value) { return Array.isArray(value) ? value : []; }
  function ensureIds(items, prefix) { return safeArray(items).map(item => ({ id: item.id || uid(prefix), ...item })); }
  function initials(value) { return String(value || "CR").trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase(); }

  function themeById(id) { return themes.find(theme=>theme.id===id) || themes[0]; }

  const weekOrder = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  function normalizeDays(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (!value) return [];
    return String(value).split(",").map(item => item.trim()).filter(Boolean);
  }
  function formatDays(value) {
    const days = normalizeDays(value);
    if (!days.length) return "Sem dia definido";
    if (days.length === 7) return "Todos os dias";
    if (days.length === 5 && ["Segunda","Terça","Quarta","Quinta","Sexta"].every(day => days.includes(day))) return "Segunda a sexta";
    return days.join(", ");
  }
  function slugify(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function newsStatusValue(item) {
    return String(item.status || (item.ativo === false ? "Rascunho" : "Publicada")).toLowerCase();
  }
  function statusNewsLabel(item) {
    const value = newsStatusValue(item);
    return ({rascunho:"Rascunho",agendada:"Agendada",publicada:"Publicada",arquivada:"Arquivada"})[value] || "Publicada";
  }
  function isNewsVisible(item) {
    if (item.ativo === false) return false;
    const status = newsStatusValue(item);
    if (["rascunho","arquivada"].includes(status)) return false;
    const date = item.data ? new Date(`${item.data}T${item.hora || "00:00"}:00`) : null;
    if (status === "agendada") return Boolean(date && !Number.isNaN(date.getTime()) && date.getTime() <= Date.now());
    return status === "publicada";
  }
  function compareTime(a,b) { return String(a || "99:99").localeCompare(String(b || "99:99")); }

  function renderSitePreview(container) {
    if (!container) return;
    const r = state.radio;
    const customStyle = state.selectedTheme === "custom" ? `--site-primary:${r.cores.primaria};--site-secondary:${r.cores.secundaria};--site-accent:${r.cores.destaque};--site-bg:${r.cores.fundo};` : "";
    const enabled = new Set(activeModules().map(m=>m.id));
    const ordered = activeModules().map(m=>m.id);
    const sections = {
      hero: () => siteHero(r), player: () => sitePlayer(r), programacao: () => siteProgramming(), noticias: () => siteNews(), promocoes: () => sitePromotions(), podcasts: () => sitePodcasts(), videos: () => siteVideos(), equipe: () => siteTeam(), galeria: () => siteGallery(), eventos: () => siteEvents(), publicidade: () => siteAdvertising(), parceiros: () => sitePartners(), aplicativo: () => siteApp(), contato: () => siteContact()
    };
    const section=(id)=>enabled.has(id)&&sections[id]?sections[id]():"";
    const rest=(skip)=>ordered.filter(id=>!skip.has(id)&&enabled.has(id)&&sections[id]).map(id=>sections[id]()).join("");
    let body="";
    if (state.selectedTheme === "spotify") body=`${siteHeader(r)}<div class="theme-stage theme-stage-music">${section("player")}${section("hero")}</div>${section("podcasts")}${rest(new Set(["hero","player","podcasts"]))}`;
    else if (state.selectedTheme === "news") body=`${siteHeader(r)}<div class="theme-stage theme-stage-news">${section("hero")}${section("noticias")}</div>${section("player")}${rest(new Set(["hero","noticias","player"]))}`;
    else if (state.selectedTheme === "gospel") body=`${siteHeader(r)}${section("hero")}<div class="theme-stage theme-stage-community">${section("player")}${section("programacao")}</div>${rest(new Set(["hero","player","programacao"]))}`;
    else if (state.selectedTheme === "young") body=`${siteHeader(r)}<div class="theme-stage theme-stage-young">${section("player")}${section("hero")}</div><div class="theme-young-featured">${section("promocoes")}${section("videos")}</div>${rest(new Set(["hero","player","promocoes","videos"]))}`;
    else if (state.selectedTheme === "custom") body=`${siteHeader(r)}<div class="theme-stage theme-stage-clean">${section("hero")}${section("player")}</div>${rest(new Set(["hero","player"]))}`;
    else body=`${siteHeader(r)}${ordered.filter(id=>enabled.has(id)&&sections[id]).map(id=>sections[id]()).join("")}`;
    container.innerHTML = `<div class="site-preview theme-${state.selectedTheme}" data-site-section="inicio" style="${customStyle}${r.hero ? `--hero-image:url('${r.hero}')` : ""}">${body}${siteFooter(r)}</div>`;
    bindSitePreviewInteractions(container);
  }

  function socialEntries() {
    const d=state.integrations.redes || {};
    return [
      ["facebook","f","Facebook"], ["instagram","in","Instagram"], ["youtube","▶","YouTube"],
      ["tiktok","♪","TikTok"], ["x","X","X"], ["spotify","●","Spotify"]
    ].filter(([key])=>safeExternalURL(d[key])).map(([key,icon,label])=>({key,icon,label,url:safeExternalURL(d[key])}));
  }

  function siteHeader(r) {
    const socials=socialEntries();
    return `<div class="site-topline"><span>${escapeHTML(r.cidade)} • ${escapeHTML(r.estado)} — Informação e música ao vivo</span>${socials.length?`<div class="site-social">${socials.map(item=>`<a href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir ${escapeHTML(item.label)}" title="${escapeHTML(item.label)}">${escapeHTML(item.icon)}</a>`).join("")}</div>`:""}</div><header class="site-header"><button class="site-logo site-logo-button" data-site-scroll="inicio" type="button" aria-label="Voltar ao início">${r.logo?`<img src="${r.logo}" alt="Logomarca">`:`<span class="site-logo-placeholder">CRB</span>`}<span><strong>${escapeHTML(r.nome)}</strong><small>${escapeHTML(r.slogan)}</small></span></button><nav class="site-nav" aria-label="Navegação da prévia"><a href="#" data-site-scroll="inicio">Início</a><a href="#" data-site-scroll="noticias">Notícias</a><a href="#" data-site-scroll="programacao">Programação</a><a href="#" data-site-scroll="promocoes">Promoções</a><a href="#" data-site-scroll="equipe">Equipe</a><a href="#" data-site-scroll="contato">Contato</a></nav><div class="site-header-actions"><button class="site-wa-button" data-site-action="whatsapp" type="button">WhatsApp</button><button class="site-live-button" data-site-play type="button"><span class="site-live-dot"></span>OUVIR AO VIVO</button></div></header>`;
  }

  function siteHero(r) { return `<section class="site-hero" data-site-section="hero"><div class="site-hero-content"><span class="site-kicker">● Rádio e notícias de ${escapeHTML(r.cidade)}</span><h1>${escapeHTML(r.slogan || r.nome)}</h1><p>${escapeHTML(r.descricao)}</p><div class="site-hero-actions"><button class="primary" data-site-play type="button">▶ Ouvir agora</button><button class="secondary" data-site-scroll="programacao" type="button">Conheça a programação</button></div></div></section>`; }
  function sitePlayer(r) { return `<div class="site-player-wrap" data-site-section="player"><section class="site-player"><div class="site-cover">${r.playerImage?`<img src="${r.playerImage}" alt="Capa do player">`:`♫`}</div><div class="site-track"><span>Ao vivo agora</span><strong>${escapeHTML(r.musicaAtual||"Transmissão ao vivo")}</strong><small>${escapeHTML(r.locutorAtual||"Programação da rádio")}</small></div><div class="site-player-controls"><button class="site-app" data-site-action="app" type="button">Baixar app</button><button class="site-play" data-site-play type="button" aria-label="Reproduzir ou pausar transmissão">▶</button></div></section></div>`; }
  function siteProgramming() { const items=[...state.content.programacao].filter(i=>i.ativo!==false).sort((a,b)=>compareTime(a.inicio,b.inicio)).slice(0,4); return `<section class="site-section" data-site-section="programacao"><div class="site-section-head"><div><span>No ar e próximos</span><h2>Programação</h2><p>Conteúdo organizado por dia e horário.</p></div><button class="site-section-link" data-site-list="programacao" type="button">Ver grade completa →</button></div><div class="site-program-grid">${items.map((i,index)=>`<article class="site-program-card ${index===0?"live":""}" data-site-open="programacao" data-site-id="${escapeHTML(i.id)}" role="button" tabindex="0" aria-label="Abrir programa ${escapeHTML(i.titulo)}" style="${i.cor?`--program-color:${i.cor}`:""}"><div class="site-program-time">${index===0?"AGORA":escapeHTML(i.inicio||"")}</div><strong>${escapeHTML(i.titulo)}</strong><small>${escapeHTML(i.locutor||formatDays(i.dias||i.dia))}</small></article>`).join("")}</div></section>`; }
  function siteNews() { const items=[...state.content.noticias].filter(isNewsVisible).sort((a,b)=>Number(Boolean(b.destaque))-Number(Boolean(a.destaque)) || String(`${b.data||""}${b.hora||""}`).localeCompare(String(`${a.data||""}${a.hora||""}`))).slice(0,4); return `<section class="site-section alt" data-site-section="noticias"><div class="site-section-head"><div><span>Informação</span><h2>Últimas notícias</h2><p>Cidade, esporte, agronegócio e os assuntos do dia.</p></div><button class="site-section-link" data-site-list="noticias" type="button">Todas as notícias →</button></div><div class="site-news-grid">${items.map((i,index)=>`<article class="site-news-card ${index===0?"featured":""}" data-site-open="noticias" data-site-id="${escapeHTML(i.id)}" role="button" tabindex="0" aria-label="Abrir notícia ${escapeHTML(i.titulo)}"><div class="site-news-image">${i.imagem?`<img src="${i.imagem}" alt="Capa da notícia ${escapeHTML(i.titulo)}">`:""}</div><div class="site-news-body"><span>${escapeHTML(i.categoria||"Notícias")}</span><h3>${escapeHTML(i.titulo)}</h3><p>${escapeHTML(i.resumo||"")}</p><small class="site-news-meta">${escapeHTML(i.autor||"")} ${i.data?`• ${formatDate(i.data)}`:""}</small></div></article>`).join("")}</div></section>`; }
  function sitePromotions() { const items=state.content.promocoes.filter(i=>i.ativo!==false).slice(0,3); if(!items.length)return ""; return `<section class="site-section" data-site-section="promocoes"><div class="site-section-head"><div><span>Participe</span><h2>Promoções</h2><p>Ações para aproximar a rádio e seus ouvintes.</p></div><button class="site-section-link" data-site-list="promocoes" type="button">Ver todas →</button></div><div class="site-promo-grid">${items.map(i=>`<article class="site-promo-card" data-site-open="promocoes" data-site-id="${escapeHTML(i.id)}" role="button" tabindex="0" aria-label="Abrir promoção ${escapeHTML(i.titulo)}" style="${i.imagem?`--card-image:url('${i.imagem}')`:""}"><span>Promoção</span><strong>${escapeHTML(i.titulo)}</strong><small>${escapeHTML(i.descricao||"")}</small></article>`).join("")}</div></section>`; }
  function sitePodcasts() { const items=sortMediaItems("podcasts",state.content.podcasts.filter(i=>i.ativo!==false)).slice(0,4); if(!items.length)return ""; return `<section class="site-section dark" data-site-section="podcasts"><div class="site-section-head"><div><span>Ouça quando quiser</span><h2>Podcasts</h2><p>Programas, entrevistas e episódios sob demanda.</p></div><button class="site-section-link" data-site-list="podcasts" type="button">Todos os episódios →</button></div><div class="site-podcast-grid">${items.map(i=>`<article class="site-podcast-card ${i.destaque?"media-featured":""}" data-site-open="podcasts" data-site-id="${escapeHTML(i.id)}" role="button" tabindex="0" aria-label="Ouvir podcast ${escapeHTML(i.titulo)}"><div class="site-podcast-cover">${i.imagem?`<img src="${i.imagem}" alt="Capa de ${escapeHTML(i.titulo)}">`:`<span aria-hidden="true">◉</span>`}<i class="site-media-play" aria-hidden="true">▶</i></div><div class="site-podcast-copy"><div class="site-media-labels">${i.destaque?`<span>Destaque</span>`:""}<span>${escapeHTML(episodeLabel(i))}</span></div><strong>${escapeHTML(i.titulo)}</strong><small>${escapeHTML(i.programa||"Podcast")}</small><em>${[i.data?formatDate(i.data):"",i.duracaoMinutos?formatDuration(i.duracaoMinutos):""].filter(Boolean).map(escapeHTML).join(" • ")}</em></div></article>`).join("")}</div></section>`; }
  function siteVideos() { const items=sortMediaItems("videos",state.content.videos.filter(i=>i.ativo!==false)).slice(0,4); if(!items.length)return ""; return `<section class="site-section alt" data-site-section="videos"><div class="site-section-head"><div><span>Assista</span><h2>Vídeos</h2><p>Entrevistas, música, transmissões e bastidores.</p></div><button class="site-section-link" data-site-list="videos" type="button">Todos os vídeos →</button></div><div class="site-news-grid">${items.map((i,index)=>{const thumb=videoThumbnailURL(i);return `<article class="site-news-card ${(i.destaque||index===0)?"featured":""}" data-site-open="videos" data-site-id="${escapeHTML(i.id)}" role="button" tabindex="0" aria-label="Assistir vídeo ${escapeHTML(i.titulo)}"><div class="site-news-image site-video-thumb">${thumb?`<img src="${escapeHTML(thumb)}" alt="Miniatura de ${escapeHTML(i.titulo)}">`:""}<span class="site-video-play" aria-hidden="true">▶</span>${i.destaque?`<b class="site-media-corner">Destaque</b>`:""}</div><div class="site-news-body"><span>${escapeHTML(i.categoria||"Vídeo")} • ${escapeHTML(videoTypeLabel(i))}</span><h3>${escapeHTML(i.titulo)}</h3><p>${escapeHTML(i.descricao||"")}</p><small class="site-news-meta">${[i.data?formatDate(i.data):"",i.duracaoMinutos?formatDuration(i.duracaoMinutos):""].filter(Boolean).map(escapeHTML).join(" • ")}</small></div></article>`;}).join("")}</div></section>`; }
  function siteTeam() { const items=[...state.content.locutores].sort((a,b)=>Number(a.ordem||999)-Number(b.ordem||999)).concat(state.content.equipe).filter(i=>i.ativo!==false).slice(0,5); if(!items.length)return ""; return `<section class="site-section" data-site-section="equipe"><div class="site-section-head"><div><span>Quem faz</span><h2>Nossa equipe</h2><p>As vozes e profissionais da emissora.</p></div><button class="site-section-link" data-site-list="equipe" type="button">Conheça a equipe →</button></div><div class="site-team-grid">${items.map(i=>`<article class="site-team-card" data-site-open="${state.content.locutores.some(loc=>loc.id===i.id)?"locutores":"equipe"}" data-site-id="${escapeHTML(i.id)}" role="button" tabindex="0" aria-label="Abrir perfil de ${escapeHTML(i.nome)}"><div class="site-team-photo">${i.foto?`<img src="${i.foto}" alt="Foto de ${escapeHTML(i.nome)}">`:""}</div><strong>${escapeHTML(i.nome)}</strong><small>${escapeHTML(i.cargo||"")}</small></article>`).join("")}</div></section>`; }
  function siteGallery() { const items=state.content.galeria.filter(i=>i.ativo!==false).slice(0,5); if(!items.length)return ""; return `<section class="site-section alt" data-site-section="galeria"><div class="site-section-head"><div><span>Imagens</span><h2>Galeria</h2><p>Eventos, bastidores e momentos da rádio.</p></div><button class="site-section-link" data-site-list="galeria" type="button">Ver galeria →</button></div><div class="site-gallery-grid">${items.map(i=>`<div data-site-open="galeria" data-site-id="${escapeHTML(i.id)}" role="button" tabindex="0" aria-label="Ampliar foto ${escapeHTML(i.titulo)}">${i.imagem?`<img src="${i.imagem}" alt="${escapeHTML(i.titulo)}">`:`<span class="site-gallery-placeholder">${escapeHTML(i.titulo||"Foto")}</span>`}</div>`).join("")}</div></section>`; }
  function siteEvents() { const items=state.content.eventos.filter(i=>i.ativo!==false).slice(0,3); if(!items.length)return ""; return `<section class="site-section" data-site-section="eventos"><div class="site-section-head"><div><span>Agenda</span><h2>Próximos eventos</h2></div><button class="site-section-link" data-site-list="eventos" type="button">Agenda completa →</button></div><div class="site-promo-grid">${items.map(i=>`<article class="site-promo-card" data-site-open="eventos" data-site-id="${escapeHTML(i.id)}" role="button" tabindex="0" aria-label="Abrir evento ${escapeHTML(i.titulo)}" style="${i.imagem?`--card-image:url('${i.imagem}')`:""}"><span>${formatDate(i.data)}</span><strong>${escapeHTML(i.titulo)}</strong><small>${escapeHTML(i.local||"")}</small></article>`).join("")}</div></section>`; }
  function siteAdvertising() { const item=state.content.publicidade.find(i=>i.ativo!==false); if(!item)return ""; const link=safeExternalURL(item.link); return `<section class="site-section" data-site-section="publicidade"><${link?"a":"button"} class="site-sponsor site-ad-link" ${link?`href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer"`:`data-site-open="publicidade" data-site-id="${escapeHTML(item.id)}" type="button"`} style="height:80px" aria-label="Abrir publicidade ${escapeHTML(item.titulo||item.anunciante||"")}">${item.imagem?`<img src="${item.imagem}" alt="Publicidade ${escapeHTML(item.titulo||"")}">`:`ESPAÇO PUBLICITÁRIO`}</${link?"a":"button"}></section>`; }
  function sitePartners() { const items=state.content.parceiros.filter(i=>i.ativo!==false).slice(0,6); if(!items.length)return ""; return `<section class="site-section alt" data-site-section="parceiros"><div class="site-section-head"><div><span>Apoio</span><h2>Patrocinadores</h2></div></div><div class="site-sponsor-grid">${items.map(i=>{const link=safeExternalURL(i.link);return `<${link?"a":"button"} class="site-sponsor" ${link?`href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer"`:`data-site-open="parceiros" data-site-id="${escapeHTML(i.id)}" type="button"`} aria-label="Abrir parceiro ${escapeHTML(i.nome)}">${i.logo?`<img src="${i.logo}" alt="${escapeHTML(i.nome)}">`:escapeHTML(i.nome)}</${link?"a":"button"}>`;}).join("")}</div></section>`; }
  function siteApp() { return `<section class="site-section dark" data-site-section="aplicativo"><div class="site-section-head"><div><span>Leve a rádio com você</span><h2>Baixe nosso aplicativo</h2><p>Ouça a programação no celular e receba novidades.</p></div><button class="site-live-button" data-site-action="app" type="button">Baixar aplicativo</button></div></section>`; }
  function siteContact() { return `<section class="site-section" data-site-section="contato"><div class="site-section-head"><div><span>Fale com a rádio</span><h2>Contato e participação</h2><p>WhatsApp, pedidos de música, comercial e jornalismo.</p></div><button class="site-wa-button" data-site-action="whatsapp" type="button">Abrir WhatsApp</button></div></section>`; }
  function siteFooter(r) { return `<footer class="site-footer"><div class="site-footer-grid"><div><h3>${escapeHTML(r.nome)}</h3><p>${escapeHTML(r.descricao)}</p></div><div><h3>Navegação</h3><p><a href="#" data-site-scroll="inicio">Início</a><br><a href="#" data-site-scroll="noticias">Notícias</a><br><a href="#" data-site-scroll="programacao">Programação</a><br><a href="#" data-site-scroll="promocoes">Promoções</a></p></div><div><h3>Contato</h3><p>${escapeHTML(r.email)}<br>${escapeHTML(r.telefone)}<br>${escapeHTML(r.endereco)}</p></div><div><h3>Anuncie</h3><p>Apresente sua marca aos ouvintes da rádio.</p><button class="site-footer-action" data-site-action="whatsapp" type="button">Falar com o comercial</button></div></div><div class="site-footer-bottom"><span>© ${new Date().getFullYear()} ${escapeHTML(r.nome)}</span><span>Site administrado pela Central Rádios Brasil</span></div></footer>`; }

  function bindSitePreviewInteractions(container) {
    if (container.dataset.siteInteractionsBound === "true") return;
    container.dataset.siteInteractionsBound = "true";
    container.addEventListener("click", event => {
      const target=event.target.closest("[data-site-play],[data-site-scroll],[data-site-open],[data-site-list],[data-site-action]");
      if (!target || !container.contains(target)) return;
      if (target.matches("a")) event.preventDefault();
      if (target.hasAttribute("data-site-play")) return toggleAudio(target);
      if (target.dataset.siteScroll) return scrollPreviewTo(container,target.dataset.siteScroll);
      if (target.dataset.siteOpen) return openSiteDetail(target.dataset.siteOpen,target.dataset.siteId);
      if (target.dataset.siteList) return openSiteCollection(target.dataset.siteList);
      if (target.dataset.siteAction) return runSiteAction(target.dataset.siteAction);
    });
    container.addEventListener("keydown", event => {
      if (!["Enter"," "].includes(event.key)) return;
      const target=event.target.closest("[data-site-open],[data-site-scroll],[data-site-list],[data-site-action]");
      if (!target || !container.contains(target)) return;
      event.preventDefault(); target.click();
    });
  }

  function scrollPreviewTo(container,section) {
    const target=$(`[data-site-section="${CSS.escape(section)}"]`,container);
    if (!target) { notify(`A seção ${section} não está ativa nesta prévia.`,"error"); return; }
    target.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function absoluteHttpURL(value) {
    const raw=String(value||"").trim();
    if (!/^https?:\/\//i.test(raw)) return "";
    try { const url=new URL(raw); return ["http:","https:"].includes(url.protocol)?url.href:""; } catch { return ""; }
  }

  function normalizeComparableURL(value) {
    const valid=absoluteHttpURL(value); if(!valid)return "";
    const youtubeId=youtubeVideoId(valid); if(youtubeId)return `youtube:${youtubeId.toLowerCase()}`;
    const vimeoId=vimeoVideoId(valid); if(vimeoId)return `vimeo:${vimeoId}`;
    try { const url=new URL(valid); url.hash=""; return url.href.replace(/\/$/,"").toLowerCase(); } catch { return valid.toLowerCase(); }
  }

  function youtubeVideoId(value) {
    const valid=absoluteHttpURL(value); if(!valid)return "";
    try {
      const url=new URL(valid), host=url.hostname.toLowerCase().replace(/^www\./,"");
      if(host==="youtu.be")return url.pathname.split("/").filter(Boolean)[0]||"";
      if(!["youtube.com","m.youtube.com","music.youtube.com","youtube-nocookie.com"].includes(host))return "";
      if(url.searchParams.get("v"))return url.searchParams.get("v");
      const parts=url.pathname.split("/").filter(Boolean);
      if(["embed","shorts","live"].includes(parts[0]))return parts[1]||"";
    } catch {}
    return "";
  }

  function vimeoVideoId(value) {
    const valid=absoluteHttpURL(value); if(!valid)return "";
    try { const url=new URL(valid); if(!/(^|\.)vimeo\.com$/i.test(url.hostname))return ""; return url.pathname.split("/").filter(Boolean).find(part=>/^\d+$/.test(part))||""; } catch { return ""; }
  }

  function detectVideoType(value) {
    const url=absoluteHttpURL(value); if(!url)return "Link inválido";
    if(youtubeVideoId(url))return "YouTube";
    if(vimeoVideoId(url))return "Vimeo";
    if(/\.(mp4|webm|ogg|mov|m4v)(?:$|[?#])/i.test(url))return "Arquivo de vídeo";
    if(/\.(m3u8)(?:$|[?#])/i.test(url)||/[?&](live|stream)=/i.test(url))return "Transmissão ao vivo";
    return "Link externo";
  }

  function videoTypeLabel(item) {
    return item?.tipo && item.tipo !== "Automático" ? item.tipo : (item?.tipoDetectado || detectVideoType(item?.url));
  }

  function videoThumbnailURL(item) {
    if(item?.imagem)return item.imagem;
    const id=youtubeVideoId(item?.url); return id?`https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`:"";
  }

  function formatDuration(value) {
    const minutes=Math.max(0,Math.trunc(Number(value||0))); if(!minutes)return "";
    const hours=Math.floor(minutes/60), rest=minutes%60; return hours?`${hours}h${rest?` ${String(rest).padStart(2,"0")}min`:""}`:`${minutes} min`;
  }

  function episodeLabel(item) {
    const season=Math.max(0,Math.trunc(Number(item?.temporada||0))), episode=Math.max(0,Math.trunc(Number(item?.episodio||0)));
    if(season&&episode)return `T${season} • E${episode}`;
    if(episode)return `Episódio ${episode}`;
    if(season)return `Temporada ${season}`;
    return "Episódio";
  }

  function sortMediaItems(key,items) {
    return [...items].sort((a,b)=>Number(Boolean(b.destaque))-Number(Boolean(a.destaque)) || contentTimestamp(b)-contentTimestamp(a) || (key==="podcasts"?Number(b.episodio||0)-Number(a.episodio||0):0));
  }

  function safeExternalURL(value) {
    if (!value) return "";
    try { const url=new URL(String(value),window.location.href); return ["http:","https:"].includes(url.protocol)?url.href:""; }
    catch { return ""; }
  }

  function runSiteAction(action) {
    if (action === "whatsapp") {
      const number=String(state.integrations.whatsapp?.numero || state.radio.whatsapp || "").replace(/\D/g,"");
      if (!number) { notify("Configure o número do WhatsApp antes de testar este botão.","error"); return; }
      const message=encodeURIComponent(state.integrations.whatsapp?.mensagem || "Olá! Vim pelo site da rádio.");
      window.open(`https://wa.me/${number}?text=${message}`,"_blank","noopener"); return;
    }
    if (action === "app") {
      const app=state.integrations.aplicativo || {};
      const preferred=/iPhone|iPad|iPod/i.test(navigator.userAgent)?app.ios:app.android;
      const url=safeExternalURL(preferred)||safeExternalURL(app.android)||safeExternalURL(app.ios);
      if (url) { window.open(url,"_blank","noopener"); return; }
      if (app.pwa) { notify("O PWA está ativo. No site publicado, a instalação será oferecida pelo navegador.","success"); return; }
      notify("Cadastre um link da Google Play, App Store ou ative o PWA.","error");
    }
  }

  function contentItem(key,id) { return (state.content[key] || []).find(item=>String(item.id)===String(id)); }
  function multilineHTML(value) { const text=escapeHTML(value || "").trim(); return text?`<p>${text.replace(/\n{2,}/g,"</p><p>").replace(/\n/g,"<br>")}</p>`:"<p>Sem conteúdo adicional cadastrado.</p>"; }
  function detailImage(item,key="imagem") { return item?.[key]?`<img class="site-detail-cover" src="${item[key]}" alt="${escapeHTML(item.titulo||item.nome||"Conteúdo")}">`:""; }
  function detailMeta(parts) { const values=parts.filter(Boolean); return values.length?`<div class="site-detail-meta">${values.map(value=>`<span>${escapeHTML(value)}</span>`).join("")}</div>`:""; }

  function videoPlayerHTML(urlValue,title) {
    const url=absoluteHttpURL(urlValue);
    if (!url) return `<div class="site-detail-notice">Este vídeo foi salvo sem um endereço público válido. Edite o cadastro e informe uma URL iniciada por HTTPS.</div>`;
    const youtubeId=youtubeVideoId(url), vimeoId=vimeoVideoId(url);
    if (youtubeId) return `<div class="site-video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}" title="${escapeHTML(title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
    if (vimeoId) return `<div class="site-video-frame"><iframe src="https://player.vimeo.com/video/${encodeURIComponent(vimeoId)}" title="${escapeHTML(title)}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
    if (/\.(mp4|webm|ogg|mov|m4v)(?:$|[?#])/i.test(url)) return `<video class="site-native-video" src="${escapeHTML(url)}" controls preload="metadata" playsinline>Seu navegador não suporta vídeo.</video>`;
    if (/\.m3u8(?:$|[?#])/i.test(url)) return `<div class="site-detail-notice">Esta transmissão usa HLS. A reprodução direta depende do navegador; use o botão abaixo caso o player não seja iniciado.</div><video class="site-native-video" src="${escapeHTML(url)}" controls preload="metadata" playsinline></video><a class="button secondary site-detail-external" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">Abrir transmissão</a>`;
    return `<div class="site-detail-notice">Este endereço não oferece incorporação direta na prévia.</div><a class="button primary site-detail-external" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">Abrir vídeo original</a>`;
  }

  function podcastPlayerHTML(item) {
    const url=absoluteHttpURL(item.audio);
    if(!url)return `<div class="site-detail-notice">Este episódio foi salvo sem um endereço público válido de áudio.</div>`;
    return `<div class="site-audio-box">${item.imagem?`<img src="${escapeHTML(item.imagem)}" alt="Capa de ${escapeHTML(item.titulo||"Podcast")}">`:""}<div><strong>${escapeHTML(item.titulo||"Episódio")}</strong><span>${escapeHTML(item.programa||"Podcast")} • ${escapeHTML(episodeLabel(item))}</span><audio class="site-audio-player" src="${escapeHTML(url)}" controls preload="metadata"></audio><a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">Abrir áudio em nova guia</a></div></div>`;
  }

  function genericDetailHTML(key,item) {
    const schema=schemas[key];
    if (!schema) return multilineHTML(item?.descricao || item?.resumo || "");
    const rows=schema.fields.filter(([name])=>!['imagem','foto','logo'].includes(name)).map(([name,label,type])=>{
      const value=item[name];
      if (value === undefined || value === null || value === "" || (Array.isArray(value)&&!value.length)) return "";
      const shown=type === "checkbox" ? (value?"Sim":"Não") : Array.isArray(value)?value.join(", "):String(value);
      return `<div><dt>${escapeHTML(label)}</dt><dd>${escapeHTML(shown)}</dd></div>`;
    }).join("");
    return `<dl class="site-detail-list">${rows || "<div><dt>Informações</dt><dd>Sem detalhes adicionais.</dd></div>"}</dl>`;
  }

  function siteDetailContent(key,item) {
    if (key === "noticias") return `${detailImage(item)}${detailMeta([item.categoria,item.autor,item.data?formatDate(item.data):"",item.hora])}<div class="site-detail-text">${multilineHTML(item.conteudo || item.resumo)}</div>`;
    if (key === "videos") return `${videoPlayerHTML(item.url,item.titulo)}${detailMeta([item.categoria,videoTypeLabel(item),item.data?formatDate(item.data):"",item.duracaoMinutos?formatDuration(item.duracaoMinutos):"",item.destaque?"Destaque":""])}<div class="site-detail-text">${multilineHTML(item.descricao)}</div>`;
    if (key === "podcasts") return `${podcastPlayerHTML(item)}${detailMeta([item.programa,episodeLabel(item),item.categoria,item.data?formatDate(item.data):"",item.duracaoMinutos?formatDuration(item.duracaoMinutos):"",item.destaque?"Destaque":""])}<div class="site-detail-text">${multilineHTML(item.descricao)}</div>`;
    if (key === "programacao") return `${detailImage(item)}${detailMeta([item.categoria,formatDays(item.dias||item.dia),item.inicio&&item.fim?`${item.inicio} às ${item.fim}`:"",item.locutor])}<div class="site-detail-text">${multilineHTML(item.descricao)}</div>`;
    if (key === "promocoes") return `${detailImage(item)}${detailMeta([item.inicio?`Início: ${formatDate(item.inicio)}`:"",item.fim?`Encerramento: ${formatDate(item.fim)}`:""])}<div class="site-detail-text">${multilineHTML(item.descricao)}${item.regulamento?`<h3>Regulamento</h3>${multilineHTML(item.regulamento)}`:""}</div><button class="button primary" data-site-action="whatsapp" type="button">Participar pelo WhatsApp</button>`;
    if (key === "eventos") return `${detailImage(item)}${detailMeta([item.data?formatDate(item.data):"",item.hora,item.local])}<div class="site-detail-text">${multilineHTML(item.descricao)}</div>`;
    if (key === "galeria") return `${detailImage(item)}${detailMeta([item.album,item.data?formatDate(item.data):""])}<div class="site-detail-text">${multilineHTML(item.descricao)}</div>`;
    if (["locutores","equipe"].includes(key)) return `${detailImage(item,"foto")}${detailMeta([item.cargo,item.email,item.telefone])}<div class="site-detail-text">${multilineHTML(item.bio || item.descricao)}</div>`;
    if (key === "parceiros") { const url=safeExternalURL(item.link); return `${detailImage(item,"logo")}${detailMeta([item.categoria])}${url?`<a class="button primary site-detail-external" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">Abrir site do parceiro</a>`:"<div class=\"site-detail-notice\">Parceiro sem link cadastrado.</div>"}`; }
    if (key === "publicidade") { const url=safeExternalURL(item.link); return `${detailImage(item)}${detailMeta([item.anunciante,item.posicao,item.inicio?formatDate(item.inicio):"",item.fim?formatDate(item.fim):""])}${url?`<a class="button primary site-detail-external" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">Abrir anúncio</a>`:""}`; }
    return `${detailImage(item,item.foto?"foto":item.logo?"logo":"imagem")}${genericDetailHTML(key,item)}`;
  }

  function openSiteDetail(key,id) {
    const item=contentItem(key,id);
    if (!item) { notify("O conteúdo selecionado não foi encontrado.","error"); return; }
    const title=item.titulo || item.nome || schemas[key]?.singular || "Conteúdo";
    $("#site-content-eyebrow").textContent=schemas[key]?.title || "Conteúdo";
    $("#site-content-title").textContent=title;
    $("#site-content-body").innerHTML=siteDetailContent(key,item);
    $("#site-content-dialog").showModal();
  }

  function collectionVisibleItems(key) {
    if (key === "noticias") return state.content.noticias.filter(isNewsVisible);
    if (key === "equipe") return [...state.content.locutores.map(i=>({...i,_collection:"locutores"})),...state.content.equipe.map(i=>({...i,_collection:"equipe"}))].filter(i=>i.ativo!==false);
    if (["podcasts","videos"].includes(key)) return sortMediaItems(key,(state.content[key] || []).filter(i=>i.ativo!==false));
    return (state.content[key] || []).filter(i=>i.ativo!==false);
  }

  function openSiteCollection(key) {
    const items=collectionVisibleItems(key);
    const title=key === "programacao"?"Grade completa":schemas[key]?.title || "Conteúdos";
    $("#site-content-eyebrow").textContent="Visualização completa";
    $("#site-content-title").textContent=title;
    $("#site-content-body").innerHTML=items.length?`<div class="site-detail-collection">${items.map(item=>`<button class="site-detail-item" data-site-open="${escapeHTML(item._collection||key)}" data-site-id="${escapeHTML(item.id)}" type="button"><strong>${escapeHTML(item.titulo||item.nome||"Sem título")}</strong><span>${escapeHTML(schemas[item._collection||key]?.summary?.(item) || item.descricao || item.resumo || "Abrir conteúdo")}</span></button>`).join("")}</div>`:`<div class="site-detail-notice">Nenhum conteúdo publicado nesta seção.</div>`;
    $("#site-content-dialog").showModal();
  }

  let audio = null;
  let previewThemeOverride = null;
  function toggleAudio(button) {
    if (!state.radio.streamUrl) { notify("Informe uma URL de stream em Minha Rádio para testar o áudio.","error"); return; }
    if (!audio) audio = new Audio(state.radio.streamUrl);
    if (audio.paused) { audio.play().then(()=>button.textContent="❚❚").catch(()=>notify("O navegador não conseguiu reproduzir este stream.","error")); }
    else { audio.pause(); button.textContent="▶"; }
  }

  function renderPreviewDialog() {
    const originalTheme=state.selectedTheme;
    if (previewThemeOverride) state.selectedTheme=previewThemeOverride;
    $("#preview-theme-name").textContent = themeById(state.selectedTheme).name;
    renderSitePreview($("#preview-canvas"));
    state.selectedTheme=originalTheme;
  }

  function openPreview(themeId=null) {
    previewThemeOverride=themeId || null;
    renderPreviewDialog();
    $("#preview-dialog").showModal();
  }

  function bindGoButtons(root=document) {
    $$('[data-go]',root).forEach(button=>button.addEventListener("click",()=>navigate(button.dataset.go)));
  }

  async function api(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS || 20000);
    const headers = { "Content-Type":"application/json", ...(options.headers || {}) };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    try {
      const response = await fetch(`${CONFIG.WORKER_URL}${path}`, { ...options, headers, signal: controller.signal, cache:"no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { const error = new Error(data.erro || data.mensagem || `Falha ${response.status}`); error.status = response.status; throw error; }
      return data;
    } catch (error) {
      if (error.name === "AbortError") throw new Error("A comunicação demorou demais. Tente novamente.");
      if (error.status === 401 && path !== "/api/cliente/login") showLogin("Sua sessão terminou. Entre novamente.");
      throw error;
    } finally { clearTimeout(timeout); }
  }

  async function login(event) {
    event.preventDefault(); const button=$("#login-button"); button.disabled=true; button.textContent="Entrando…"; showLoginMessage("");
    try { const result=await api("/api/cliente/login",{method:"POST",body:JSON.stringify({email:$("#login-email").value.trim(),senha:$("#login-password").value})}); authToken=result.token; sessionStorage.setItem(CONFIG.TOKEN_KEY,authToken); await loadAll(); showApp(); }
    catch(error){showLoginMessage(error.message,"error");}
    finally{button.disabled=false;button.textContent="Entrar";}
  }

  async function resumeSession() {
    if (!authToken) return showLogin();
    try { await api("/api/cliente/sessao"); await loadAll(); showApp(); }
    catch { showLogin(); }
  }

  async function logout() { try { await api("/api/cliente/logout",{method:"POST"}); } catch {} authToken=""; sessionStorage.removeItem(CONFIG.TOKEN_KEY); showLogin(); }
  function showLogin(message="") { $("#app-shell").classList.add("hidden"); $("#login-view").classList.remove("hidden"); if(message)showLoginMessage(message,"error"); }
  function showApp() { $("#login-view").classList.add("hidden"); $("#app-shell").classList.remove("hidden"); renderNav(); updateChrome(); renderPage(); }
  function showLoginMessage(message,type="") { const box=$("#login-message"); box.textContent=message; box.className=`global-message ${type} ${message?"":"hidden"}`; }

  async function loadAll() {
    if (isLoading) return; isLoading=true;
    try {
      const [dash, siteResult] = await Promise.all([api("/api/cliente/dashboard"), api("/api/cliente/site").catch(error => error.status===404 ? null : Promise.reject(error))]);
      dashboardData=dash; remoteSite=siteResult?.site || null; versions=siteResult?.versoes || [];
      if (remoteSite) {
        const media = await api("/api/cliente/site/midias").catch(()=>({midias:[]})); mediaLibrary=media.midias || [];
        state=mapRemoteToState(remoteSite,dashboardData);
      } else { state=defaultState(); state.radio.nome=dash?.cliente?.nome_radio || dash?.cliente?.nome || "Minha rádio"; }
      currentPage="dashboard"; searchTerm="";
      updateAccount();
      if (!$("#app-shell").classList.contains("hidden")) { renderNav(); updateChrome(); renderPage(); }
    } finally { isLoading=false; }
  }

  function updateAccount() {
    const client=dashboardData?.cliente || {}; const name=client.nome_radio || client.nome || "Cliente";
    $("#account-name").textContent=name; $("#account-avatar").textContent=initials(name); $("#account-role").textContent="Cliente autorizado";
  }

  function mapRemoteToState(site,dashboard) {
    const fresh=defaultState(), content=site.conteudoRascunho || site.conteudoPublicado || {}, texts=content.textos_institucionais || {}, cms=texts.cms_v2 || {}, contacts=content.contatos || {}, whats=typeof content.whatsapp === "string" ? {numero:content.whatsapp} : (content.whatsapp || {}), colors=content.cores || {}, apps=content.links_aplicativos || {}, banners=content.banners || {};
    fresh.version="2.3.0-etapa1"; fresh.updatedAt=versions[0]?.criado_em || new Date().toISOString(); fresh.status=site.status_publicacao || "sem_rascunho"; fresh.selectedTheme=cms.selectedTheme || "morada";
    fresh.radio={...fresh.radio,nome:content.nome || site.nome_site || dashboard?.cliente?.nome_radio || "Minha rádio",slogan:content.slogan || "",descricao:content.descricao || texts.sobre || "",cidade:contacts.cidade || dashboard?.cliente?.cidade || "",estado:contacts.estado || dashboard?.cliente?.estado || "",email:contacts.email || dashboard?.cliente?.email || "",telefone:contacts.telefone || "",whatsapp:whats.numero || "",endereco:contacts.endereco || "",streamUrl:site.stream_url || "",musicaAtual:texts.player?.titulo || "Transmissão ao vivo",locutorAtual:texts.player?.subtitulo || "Programação da rádio",logo:content.logo || "",hero:content.capa || "",playerImage:texts.player?.imagem || "",cores:{primaria:colors.primaria || "#e31c45",secundaria:colors.secundaria || "#121d31",destaque:colors.destaque || "#f1a11a",fundo:colors.fundo || "#f4f6f9"},listenersEnabled:false};
    const moduleValues=texts.modulos || {}; const savedModules=safeArray(cms.modules);
    fresh.modules=modulesCatalog.map(([id,label,description],index)=>{const saved=savedModules.find(m=>m.id===id);return{id,label,description,enabled:saved? saved.enabled!==false : moduleValues[id]!==false,order:Number(saved?.order ?? index)};});
    fresh.content={
      programacao:ensureIds(safeArray(content.programacao).map(i=>({...i,titulo:i.titulo||i.programa||"",locutor:i.locutor||i.apresentador||"",dias:normalizeDays(i.dias||i.dia),categoria:i.categoria||"Variedades",cor:i.cor||"#e31c45",ativo:i.ativo!==false})),"prog"),
      locutores:ensureIds(safeArray(content.locutores).map((i,index)=>({...i,cargo:i.cargo||i.funcao||"",bio:i.bio||i.descricao||"",ordem:Number(i.ordem||index+1),ativo:i.ativo!==false})),"loc"),
      noticias:ensureIds(safeArray(content.noticias).map(i=>({...i,slug:i.slug||slugify(i.titulo),status:i.status|| (i.ativo===false?"Rascunho":"Publicada"),hora:i.hora||"",ativo:i.ativo!==false})),"news"),
      podcasts:ensureIds(safeArray(texts.podcasts).map(i=>({...i,temporada:Number(i.temporada||0),episodio:Number(i.episodio||0),duracaoMinutos:Number(i.duracaoMinutos||0),destaque:Boolean(i.destaque),ativo:i.ativo!==false})),"pod"),
      videos:ensureIds(safeArray(texts.videos).map(i=>({...i,tipo:i.tipo||"Automático",tipoDetectado:i.tipoDetectado||detectVideoType(i.url),duracaoMinutos:Number(i.duracaoMinutos||0),destaque:Boolean(i.destaque),ativo:i.ativo!==false})),"vid"), promocoes:ensureIds(texts.promocoes,"promo"), galeria:ensureIds(texts.galeria,"foto"), eventos:ensureIds(texts.eventos,"evento"),
      equipe:ensureIds(cms.content?.equipe,"team"), publicidade:ensureIds(banners.publicidades,"ad"),
      parceiros:ensureIds(safeArray(content.patrocinadores).map(i=>({...i,link:i.link||i.site||"",ativo:i.ativo!==false})),"part"),
      banners:ensureIds(banners.destaques,"banner"), popups:ensureIds(cms.content?.popups,"popup"), usuarios:[]
    };
    fresh.integrations={
      whatsapp:{numero:whats.numero||"",mensagem:whats.mensagem||"Olá! Vim pelo site da rádio.",flutuante:whats.flutuante!==false,pedidos:texts.pedidosMusica?.ativo!==false},
      redes:{instagram:content.redes_sociais?.instagram||"",facebook:content.redes_sociais?.facebook||"",youtube:content.redes_sociais?.youtube||"",tiktok:content.redes_sociais?.tiktok||"",x:content.redes_sociais?.xTwitter||"",spotify:content.redes_sociais?.spotify||""},
      seo:{titulo:texts.seo?.titulo||"",descricao:texts.seo?.descricao||"",palavras:texts.seo?.palavras||"",imagem:texts.seo?.imagem||""},
      dominio:{atual:site.subdominio||"",proprio:site.dominio_personalizado||"",ssl:true},
      aplicativo:{android:apps.android||"",ios:apps.ios||"",pwa:Boolean(apps.pwa),icone:cms.aplicativo?.icone||"",qrcode:apps.qr||""},
      configuracoes:{idioma:cms.configuracoes?.idioma||"pt-BR",timezone:cms.configuracoes?.timezone||"America/Sao_Paulo",moderacao:cms.configuracoes?.moderacao!==false,acessibilidade:texts.acessibilidade?.leitorTela!==false,cookies:cms.configuracoes?.cookies!==false}
    };
    return fresh;
  }

  function mapStateToSiteContent() {
    const content=deepMerge({},remoteSite?.conteudoRascunho || {}), allowed=new Set(remoteSite?.camposPermitidos || []), can=key=>!allowed.size||allowed.has(key), texts=content.textos_institucionais || {}, cms=texts.cms_v2 || {};
    if(can("nome"))content.nome=state.radio.nome;if(can("slogan"))content.slogan=state.radio.slogan;if(can("descricao"))content.descricao=state.radio.descricao;if(can("logo"))content.logo=state.radio.logo;if(can("capa"))content.capa=state.radio.hero;
    if(can("cores"))content.cores={...(content.cores||{}),primaria:state.radio.cores.primaria,secundaria:state.radio.cores.secundaria,destaque:state.radio.cores.destaque,fundo:state.radio.cores.fundo};
    if(can("contatos"))content.contatos={...(content.contatos||{}),email:state.radio.email,telefone:state.radio.telefone,endereco:state.radio.endereco,cidade:state.radio.cidade,estado:state.radio.estado};
    if(can("whatsapp"))content.whatsapp={...(typeof content.whatsapp==="object"?content.whatsapp:{}),numero:state.integrations.whatsapp.numero||state.radio.whatsapp,mensagem:state.integrations.whatsapp.mensagem,flutuante:state.integrations.whatsapp.flutuante};
    if(can("redes_sociais"))content.redes_sociais={instagram:state.integrations.redes.instagram,facebook:state.integrations.redes.facebook,youtube:state.integrations.redes.youtube,tiktok:state.integrations.redes.tiktok,xTwitter:state.integrations.redes.x,spotify:state.integrations.redes.spotify};
    if(can("programacao"))content.programacao=state.content.programacao.map(i=>({...i,dia:normalizeDays(i.dias||i.dia)[0]||"",programa:i.titulo,apresentador:i.locutor}));
    if(can("locutores"))content.locutores=state.content.locutores.map(i=>({...i,funcao:i.cargo,descricao:i.bio}));
    if(can("noticias"))content.noticias=state.content.noticias;
    if(can("patrocinadores"))content.patrocinadores=state.content.parceiros.map(i=>({...i,site:i.link}));
    if(can("banners"))content.banners={...(content.banners||{}),destaques:state.content.banners,publicidades:state.content.publicidade};
    if(can("links_aplicativos"))content.links_aplicativos={...(content.links_aplicativos||{}),android:state.integrations.aplicativo.android,ios:state.integrations.aplicativo.ios,pwa:state.integrations.aplicativo.pwa,qr:state.integrations.aplicativo.qrcode};
    if(can("textos_institucionais"))content.textos_institucionais={...texts,sobre:state.radio.descricao,player:{...(texts.player||{}),titulo:state.radio.musicaAtual,subtitulo:state.radio.locutorAtual,imagem:state.radio.playerImage},seo:state.integrations.seo,podcasts:state.content.podcasts,videos:state.content.videos,promocoes:state.content.promocoes,galeria:state.content.galeria,eventos:state.content.eventos,modulos:Object.fromEntries(state.modules.map(m=>[m.id,m.enabled])),pedidosMusica:{...(texts.pedidosMusica||{}),ativo:state.integrations.whatsapp.pedidos},acessibilidade:{...(texts.acessibilidade||{}),leitorTela:state.integrations.configuracoes.acessibilidade},cms_v2:{...cms,schemaVersion:3,selectedTheme:state.selectedTheme,modules:state.modules,content:{equipe:state.content.equipe,popups:state.content.popups},aplicativo:{icone:state.integrations.aplicativo.icone},configuracoes:state.integrations.configuracoes,updatedAt:new Date().toISOString()}};
    return content;
  }

  function setup() {
    $("#login-form").addEventListener("submit",login);
    $("#logout-button").addEventListener("click",logout);
    $("#save-button").addEventListener("click",()=>persist(true));
    $("#preview-top-button").addEventListener("click",openPreview);
    $("#preview-close").addEventListener("click",()=>{previewThemeOverride=null;$("#preview-dialog").close();});
    $("#site-content-close").addEventListener("click",()=>$("#site-content-dialog").close());
    $("#site-content-dialog").addEventListener("click",event=>{if(event.target===$("#site-content-dialog"))$("#site-content-dialog").close();});
    $("#site-content-body").addEventListener("click",event=>{const open=event.target.closest("[data-site-open]");if(open)return openSiteDetail(open.dataset.siteOpen,open.dataset.siteId);const action=event.target.closest("[data-site-action]");if(action)return runSiteAction(action.dataset.siteAction);});
    $("#preview-refresh").addEventListener("click",renderPreviewDialog);
    $$('[data-preview-device]').forEach(button=>button.addEventListener("click",()=>{ $$('[data-preview-device]').forEach(i=>i.classList.remove("active"));button.classList.add("active");$("#preview-canvas").className=`preview-canvas ${button.dataset.previewDevice}`;}));
    $("#menu-toggle").addEventListener("click",()=>{const sidebar=$("#sidebar");sidebar.classList.toggle("open");$("#menu-toggle").setAttribute("aria-expanded",String(sidebar.classList.contains("open")));});
    $("#editor-form").addEventListener("submit",saveModal);
    $$('#editor-modal [value="cancel"]').forEach(button=>button.addEventListener("click",event=>{event.preventDefault();editing=null;$("#editor-modal").close();}));
    $("#backup-import").addEventListener("change",event=>{const file=event.target.files?.[0];if(file)importBackup(file);event.target.value="";});
    document.addEventListener("keydown",event=>{if(event.key!=="Escape")return;if($("#site-content-dialog").open)$("#site-content-dialog").close();else if($("#preview-dialog").open){previewThemeOverride=null;$("#preview-dialog").close();}});
    resumeSession();
  }

  setup();
})();
