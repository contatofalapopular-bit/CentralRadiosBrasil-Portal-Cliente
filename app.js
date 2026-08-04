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
  let previewPopupTimer = null;
  let previewPopupReturnFocus = null;
  let saveQueue = Promise.resolve();
  let isLoading = false;
  let workerReachable = null;
  const activeImageProcesses = new Set();

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
    { id: "anunciantes", label: "Anunciantes", icon: "▥" },
    { id: "publicidade", label: "Campanhas", icon: "▰" },
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
    { id: "auditoria", label: "Auditoria", icon: "◫" },
    { id: "producao", label: "Pré-produção", icon: "◆", badge: "v3" },
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
    { id: "morada", layout: "regional", name: "Portal Regional & TV", audience: "Rádio regional • jornalismo local • webTV", description: "Portal audiovisual robusto, com central ao vivo, manchetes locais, vídeos e programação em composição editorial própria.", colors: ["#1457d9", "#071b33", "#ff8a1f", "#eef5ff"] },
    { id: "spotify", layout: "popular", name: "Rádio Popular & Musical", audience: "Sertanejo • popular • romântica • comercial", description: "Experiência calorosa e participativa, com player protagonista, pedido musical, promoções e programação por destaque.", colors: ["#ff4d2e", "#1b1430", "#ffd166", "#fff7ed"] },
    { id: "news", layout: "news24", name: "News 24h", audience: "Jornalismo • esportes • opinião • notícias", description: "Redação digital com faixa de últimas notícias, manchetes hierarquizadas, colunistas, podcasts e transmissão contínua.", colors: ["#0047ab", "#0b1728", "#e11d48", "#f3f6fa"] },
    { id: "gospel", layout: "faith", name: "Gospel Inspira", audience: "Rádio gospel • igreja • ministério • comunidade", description: "Ambiente acolhedor e elegante, com louvores, programação do dia, mensagens, eventos e participação da comunidade.", colors: ["#0f766e", "#123c3a", "#d4a72c", "#fffaf0"] },
    { id: "young", layout: "bento", name: "Rádio Jovem", audience: "Pop • jovem • entretenimento", description: "Modelo preservado: composição vibrante em blocos, player flutuante, vídeos e promoções com forte impacto visual.", colors: ["#ff3d8d", "#241342", "#45e3ff", "#fff4fb"] },
    { id: "custom", layout: "studio", name: "Estúdio Personalizado", audience: "Projetos premium • identidade própria", description: "Base flexível e institucional que utiliza as cores da emissora e mantém liberdade para uma identidade exclusiva.", colors: ["#138a7e", "#111827", "#f59e0b", "#f5f7fb"] }
  ];

  const editorThemeSchemas = Object.freeze({
    morada: {
      title: "Portal Regional & TV",
      description: "Ajustes para portal local, rádio com notícias e webTV.",
      fields: [
        ["headerStyle","Cabeçalho","select",["Portal compacto","Institucional amplo","TV ao vivo"]],
        ["headlineLayout","Manchetes","select",["Mosaico editorial","Lista de notícias","Grade equilibrada"]],
        ["liveHub","Central ao vivo","checkbox"],
        ["videoEmphasis","Destaque audiovisual","checkbox"],
        ["density","Densidade","select",["Confortável","Compacta","Espaçosa"]]
      ]
    },
    spotify: {
      title: "Rádio Popular & Musical",
      description: "Ajustes para participação, promoções e música em destaque.",
      fields: [
        ["headerStyle","Cabeçalho","select",["Noturno compacto","Colorido promocional","Logo central"]],
        ["playerStyle","Player principal","select",["Painel lateral","Centralizado","Faixa horizontal"]],
        ["quickActions","Atalhos de participação","checkbox"],
        ["roundedCards","Cards bem arredondados","checkbox"],
        ["density","Densidade","select",["Confortável","Compacta","Espaçosa"]]
      ]
    },
    news: {
      title: "News 24h",
      description: "Ajustes editoriais para rádio jornal, esportes e opinião.",
      fields: [
        ["headerStyle","Cabeçalho","select",["Redação compacta","Portal clássico","Plantão ao vivo"]],
        ["headlineLayout","Manchetes","select",["Principal + laterais","Grade editorial","Lista cronológica"]],
        ["ticker","Faixa de últimas notícias","checkbox"],
        ["sectionRules","Divisórias editoriais","checkbox"],
        ["density","Densidade","select",["Compacta","Confortável","Espaçosa"]]
      ]
    },
    gospel: {
      title: "Gospel Inspira",
      description: "Ajustes para acolhimento, louvores, mensagens e comunidade.",
      fields: [
        ["headerStyle","Cabeçalho","select",["Logo central","Clássico elegante","Comunidade"]],
        ["heroShape","Formato do banner","select",["Curva suave","Reto elegante","Cartão central"]],
        ["welcome","Painel de acolhimento","checkbox"],
        ["softCards","Cards suaves","checkbox"],
        ["density","Densidade","select",["Espaçosa","Confortável","Compacta"]]
      ]
    },
    young: {
      title: "Rádio Jovem",
      description: "Identidade original preservada. Apenas o movimento pode ser reduzido.",
      fields: [["motion","Movimento suave","checkbox"]],
      locked: true
    },
    custom: {
      title: "Estúdio Personalizado",
      description: "Base flexível que respeita as cores definidas em Minha Rádio.",
      fields: [
        ["headerStyle","Cabeçalho","select",["Institucional","Minimalista","Logo central"]],
        ["heroStyle","Banner principal","select",["Destaque amplo","Cartão contido","Texto central"]],
        ["surfaceStyle","Superfícies","select",["Claras","Contorno","Contraste"]],
        ["roundedCards","Cards arredondados","checkbox"],
        ["density","Densidade","select",["Confortável","Compacta","Espaçosa"]]
      ]
    }
  });

  const editorThemeDefaults = Object.freeze({
    morada:{headerStyle:"Portal compacto",headlineLayout:"Mosaico editorial",liveHub:true,videoEmphasis:true,density:"Confortável"},
    spotify:{headerStyle:"Noturno compacto",playerStyle:"Painel lateral",quickActions:true,roundedCards:true,density:"Confortável"},
    news:{headerStyle:"Redação compacta",headlineLayout:"Principal + laterais",ticker:true,sectionRules:true,density:"Compacta"},
    gospel:{headerStyle:"Logo central",heroShape:"Curva suave",welcome:true,softCards:true,density:"Espaçosa"},
    young:{motion:true},
    custom:{headerStyle:"Institucional",heroStyle:"Destaque amplo",surfaceStyle:"Claras",roundedCards:false,density:"Confortável"}
  });

  const editorBlockDefaults = Object.freeze({
    hero:{layout:"Destaque",width:"Total",background:"Automático",alignment:"Esquerda",limit:1,showDescription:true,showAction:true,title:"",eyebrow:""},
    player:{layout:"Destaque",width:"Amplo",background:"Contraste",alignment:"Esquerda",limit:1,showDescription:true,showAction:true,title:"",eyebrow:""},
    programacao:{layout:"Grade",width:"Amplo",background:"Automático",alignment:"Esquerda",limit:4,showDescription:true,showAction:true,title:"",eyebrow:""},
    noticias:{layout:"Editorial",width:"Amplo",background:"Automático",alignment:"Esquerda",limit:4,showDescription:true,showAction:true,title:"",eyebrow:""},
    promocoes:{layout:"Cards",width:"Amplo",background:"Automático",alignment:"Esquerda",limit:3,showDescription:true,showAction:true,title:"",eyebrow:""},
    podcasts:{layout:"Cards",width:"Amplo",background:"Contraste",alignment:"Esquerda",limit:4,showDescription:true,showAction:true,title:"",eyebrow:""},
    videos:{layout:"Editorial",width:"Amplo",background:"Automático",alignment:"Esquerda",limit:4,showDescription:true,showAction:true,title:"",eyebrow:""},
    equipe:{layout:"Cards",width:"Amplo",background:"Automático",alignment:"Esquerda",limit:5,showDescription:true,showAction:true,title:"",eyebrow:""},
    galeria:{layout:"Mosaico",width:"Amplo",background:"Automático",alignment:"Esquerda",limit:5,showDescription:true,showAction:true,title:"",eyebrow:""},
    eventos:{layout:"Cards",width:"Amplo",background:"Automático",alignment:"Esquerda",limit:3,showDescription:true,showAction:true,title:"",eyebrow:""},
    publicidade:{layout:"Faixa",width:"Total",background:"Automático",alignment:"Centro",limit:1,showDescription:true,showAction:true,title:"",eyebrow:""},
    parceiros:{layout:"Logotipos",width:"Amplo",background:"Automático",alignment:"Centro",limit:8,showDescription:true,showAction:true,title:"",eyebrow:""},
    aplicativo:{layout:"Faixa",width:"Amplo",background:"Contraste",alignment:"Esquerda",limit:1,showDescription:true,showAction:true,title:"",eyebrow:""},
    contato:{layout:"Faixa",width:"Amplo",background:"Automático",alignment:"Esquerda",limit:1,showDescription:true,showAction:true,title:"",eyebrow:""}
  });

  const editorBlockColorKeys = Object.freeze(["backgroundColor","titleColor","textColor","eyebrowColor","buttonColor","buttonTextColor"]);
  const editorBlockColorLabels = Object.freeze({
    backgroundColor:["Fundo do bloco","Define a superfície completa desta seção."],
    titleColor:["Títulos","Títulos principais, nomes e destaques do bloco."],
    textColor:["Textos","Descrições, resumos e informações secundárias."],
    eyebrowColor:["Chamadas","Categoria, chamada superior, horário e metadados."],
    buttonColor:["Botões","Fundo dos botões e acessos principais do bloco."],
    buttonTextColor:["Texto dos botões","Cor usada nos rótulos dos botões."]
  });

  function cloneJSON(value) { return JSON.parse(JSON.stringify(value)); }
  function normalizeHexColor(value,fallback="#ffffff") {
    const raw=String(value||"").trim();
    const short=/^#([0-9a-f]{3})$/i.exec(raw);
    if(short)return `#${short[1].split("").map(char=>char+char).join("")}`.toLowerCase();
    return /^#[0-9a-f]{6}$/i.test(raw)?raw.toLowerCase():fallback;
  }
  function editorColorDefaults(themeId="morada") {
    const theme=themes.find(item=>item.id===themeId)||themes[0];
    const textByTheme={morada:"#334155",spotify:"#49354f",news:"#334155",gospel:"#405552",young:"#513653",custom:"#374151"};
    return {
      useThemeColors:true,
      backgroundColor:normalizeHexColor(theme.colors[3],"#ffffff"),
      titleColor:normalizeHexColor(theme.colors[1],"#172033"),
      textColor:normalizeHexColor(textByTheme[theme.id],"#52657a"),
      eyebrowColor:normalizeHexColor(theme.colors[0],"#1457d9"),
      buttonColor:normalizeHexColor(theme.colors[0],"#1457d9"),
      buttonTextColor:"#ffffff"
    };
  }
  function freshEditorBlockOptions(id,themeId="morada") {
    return {...cloneJSON(editorBlockDefaults[id]||editorBlockDefaults.programacao),...editorColorDefaults(themeId)};
  }
  function normalizeEditorBlockOptions(id,themeId,value={}) {
    const fresh=freshEditorBlockOptions(id,themeId), source=value&&typeof value==="object"?value:{};
    const merged={...fresh,...source};
    merged.useThemeColors=source.useThemeColors!==false;
    editorBlockColorKeys.forEach(key=>{merged[key]=normalizeHexColor(merged[key],fresh[key]);});
    return merged;
  }
  function defaultEditorState() {
    const blocks={};
    themes.forEach(theme=>{blocks[theme.id]={};modulesCatalog.forEach(([id])=>{blocks[theme.id][id]=freshEditorBlockOptions(id,theme.id);});});
    return {version:3,themeOptions:cloneJSON(editorThemeDefaults),blocks,selectedBlock:"hero"};
  }

  function normalizeEditorState(value={}) {
    const fresh=defaultEditorState(), source=value&&typeof value==="object"?value:{};
    themes.forEach(theme=>{
      fresh.themeOptions[theme.id]={...fresh.themeOptions[theme.id],...(source.themeOptions?.[theme.id]||{})};
      modulesCatalog.forEach(([id])=>{fresh.blocks[theme.id][id]=normalizeEditorBlockOptions(id,theme.id,source.blocks?.[theme.id]?.[id]);});
    });
    fresh.version=3;
    fresh.selectedBlock=modulesCatalog.some(([id])=>id===source.selectedBlock)?source.selectedBlock:"hero";
    return fresh;
  }

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
      title: "Promoções", singular: "promoção", imageProfile: "news", description: "Crie campanhas com período automático, participação, regulamento, resultado e destaque.",
      fields: [
        ["titulo","Título da promoção","text",true], ["categoria","Categoria","text"], ["premio","Prêmio ou benefício","text"],
        ["inicio","Início","date",true], ["fim","Encerramento","date"],
        ["situacao","Controle da situação","select",true,["Automático pelas datas","Cancelada"]],
        ["participacao","Forma de participação","select",true,["WhatsApp","Link externo","Somente informativa"]],
        ["linkParticipacao","Link para participar","url"], ["mensagemWhatsApp","Mensagem para o WhatsApp","textarea"],
        ["descricao","Descrição e chamada","textarea",true], ["regulamento","Regulamento","richtext"], ["resultado","Resultado ou ganhador","textarea"],
        ["imagem","Imagem da promoção","image",false,"news"], ["destaque","Promoção em destaque","checkbox"], ["ativo","Publicada","checkbox"]
      ],
      summary: item => `${promotionStatusLabel(item)}${item.fim ? ` • até ${formatDate(item.fim)}` : " • sem encerramento"}${item.premio ? ` • ${item.premio}` : ""}`
    },
    galeria: {
      title: "Galeria", singular: "foto", imageProfile: "gallery", description: "Cadastre fotos e organize álbuns.",
      fields: [["titulo","Título da foto","text",true],["album","Álbum","text"],["data","Data","date"],["descricao","Descrição","textarea"],["imagem","Fotografia","image",true,"gallery"],["ativo","Publicada","checkbox"]],
      summary: item => item.album || "Galeria"
    },
    eventos: {
      title: "Eventos", singular: "evento", imageProfile: "news", description: "Organize agenda futura e histórica com situação, endereço, mapa, informações e destaque.",
      fields: [
        ["titulo","Nome do evento","text",true], ["tipo","Tipo","select",true,["Show","Evento da rádio","Transmissão externa","Ação promocional","Festival","Outro"]],
        ["categoria","Categoria","text"], ["data","Data inicial","date",true], ["hora","Horário inicial","time"],
        ["dataFim","Data final","date"], ["horaFim","Horário final","time"],
        ["situacao","Controle da situação","select",true,["Automático pela data","Adiado","Cancelado"]],
        ["local","Nome do local","text"], ["endereco","Endereço","text"], ["cidade","Cidade/UF","text"],
        ["linkMapa","Link do mapa","url"], ["linkInformacoes","Link de informações ou ingressos","url"],
        ["descricao","Descrição","textarea",true], ["imagem","Imagem do evento","image",false,"news"],
        ["destaque","Evento em destaque","checkbox"], ["ativo","Publicado","checkbox"]
      ],
      summary: item => `${eventStatusLabel(item)} • ${formatEventPeriod(item)}${item.local ? ` • ${item.local}` : ""}`
    },
    equipe: {
      title: "Equipe", singular: "profissional", imageProfile: "square", description: "Equipe administrativa, jornalismo, comercial e técnica.",
      fields: [["nome","Nome","text",true],["cargo","Cargo","text",true],["bio","Apresentação","textarea"],["foto","Foto","image",false,"square"],["email","E-mail público","email"],["ativo","Exibir no site","checkbox"]],
      summary: item => item.cargo || "Equipe"
    },
    anunciantes: {
      title: "Anunciantes", singular: "anunciante", imageProfile: "logo", description: "Cadastre empresas e contatos comerciais para reutilizar em campanhas publicitárias.",
      fields: [
        ["nome","Nome fantasia","text",true], ["razaoSocial","Razão social","text"], ["documento","CPF ou CNPJ","text"],
        ["responsavel","Responsável","text"], ["email","E-mail comercial","email"], ["telefone","Telefone","text"],
        ["whatsapp","WhatsApp","text"], ["site","Site","url"], ["categoria","Segmento","text"],
        ["observacoes","Observações internas","textarea"], ["logo","Logomarca","image",false,"logo"], ["ativo","Cadastro ativo","checkbox"]
      ],
      summary: item => `${item.categoria || "Anunciante"}${item.responsavel ? ` • ${item.responsavel}` : ""}`
    },
    publicidade: {
      title: "Campanhas publicitárias", singular: "campanha", imageProfile: "ad", description: "Gerencie campanhas, posições, períodos, peças responsivas, prioridade e métricas reais.",
      fields: [
        ["titulo","Nome interno da campanha","text",true], ["anuncianteId","Anunciante","advertiser-select",true],
        ["posicao","Posição no site","select",true,["Topo do site","Após o player","Entre programação e notícias","Entre seções","Antes do rodapé","Player"]],
        ["formato","Formato","select",true,["Banner horizontal","Retângulo médio","Faixa do player","Banner de rodapé"]],
        ["inicio","Data inicial","date",true], ["horaInicio","Horário inicial","time"], ["fim","Data final","date"], ["horaFim","Horário final","time"],
        ["situacao","Controle da situação","select",true,["Automático pelo período","Pausada","Cancelada"]],
        ["prioridade","Prioridade","number"], ["link","Link de destino","url"], ["textoBotao","Texto do botão","text"],
        ["imagemDesktop","Peça para desktop","image",true,"ad"], ["imagemMobile","Peça para celular","image",false,"ad"],
        ["descricao","Observações internas","textarea"], ["ativo","Publicada","checkbox"]
      ],
      summary: item => `${advertiserName(item)} • ${item.posicao || "Posição"} • ${campaignStatusLabel(item)}`
    },
    parceiros: {
      title: "Parceiros", singular: "parceiro", imageProfile: "logo", description: "Cadastre marcas parceiras, organize destaques e publique contatos e redes sociais com segurança.",
      fields: [
        ["nome","Nome da marca","text",true], ["categoria","Categoria","select",true,["Patrocinador","Apoio","Parceiro institucional","Fornecedor","Mídia parceira","Outro"]],
        ["descricao","Descrição pública","textarea"], ["link","Site principal","url"], ["whatsapp","WhatsApp","text"],
        ["instagram","Instagram","url"], ["facebook","Facebook","url"], ["youtube","YouTube","url"],
        ["logo","Logomarca","image",true,"logo"], ["ordem","Ordem de exibição","number"],
        ["destaque","Parceiro em destaque","checkbox"], ["ativo","Exibir no site","checkbox"]
      ],
      summary: item => `${item.categoria || "Parceiro"}${item.destaque ? " • Destaque" : ""}${item.ordem ? ` • Ordem ${item.ordem}` : ""}`
    },
    banners: {
      title: "Banners", singular: "banner", imageProfile: "banner", description: "Banners editoriais ou comerciais com peças responsivas, posição, período e prioridade.",
      fields: [
        ["titulo","Título interno","text",true], ["tipo","Tipo","select",true,["Editorial","Comercial","Institucional"]],
        ["posicao","Posição","select",true,["Após o cabeçalho","Antes de notícias","Entre seções","Antes do rodapé","Página interna"]],
        ["inicio","Data inicial","date"], ["horaInicio","Horário inicial","time"], ["fim","Data final","date"], ["horaFim","Horário final","time"],
        ["situacao","Controle da situação","select",true,["Automático pelo período","Pausado","Cancelado"]],
        ["prioridade","Prioridade","number"], ["link","Link de destino","url"], ["textoBotao","Texto do botão","text"],
        ["imagemDesktop","Imagem para desktop","image",true,"banner"], ["imagemMobile","Imagem para celular","image",false,"banner"],
        ["descricao","Descrição interna","textarea"], ["ativo","Publicado","checkbox"]
      ],
      summary: item => `${item.tipo || "Banner"} • ${item.posicao || "Posição"} • ${bannerStatusLabel(item)}`
    },
    popups: {
      title: "Popups", singular: "popup", imageProfile: "popup", description: "Crie avisos com período, prioridade, dispositivo, atraso e frequência controlada.",
      fields: [
        ["titulo","Título interno","text",true], ["mensagem","Mensagem pública","textarea",true],
        ["inicio","Data inicial","date"], ["horaInicio","Horário inicial","time"], ["fim","Data final","date"], ["horaFim","Horário final","time"],
        ["situacao","Controle da situação","select",true,["Automático pelo período","Pausado","Cancelado"]],
        ["dispositivo","Exibir em","select",true,["Desktop e celular","Somente desktop","Somente celular"]],
        ["frequencia","Frequência","select",true,["Uma única vez","Uma vez por sessão","Uma vez por dia","Sempre"]],
        ["atrasoSegundos","Atraso para abrir (segundos)","number"], ["prioridade","Prioridade","number"],
        ["textoBotao","Texto do botão","text"], ["link","Link do botão","url"],
        ["imagem","Imagem do popup","image",false,"popup"], ["ativo","Publicado","checkbox"]
      ],
      summary: item => `${popupStatusLabel(item)} • ${item.dispositivo || "Todos os dispositivos"} • ${item.frequencia || "Frequência"}`
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
      version: "3.0.0-stage1",
      updatedAt: new Date().toISOString(),
      status: "rascunho",
      selectedTheme: "morada",
      editor: defaultEditorState(),
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
          { id: uid("promo"), titulo: "Promoção Ouvinte Premiado", categoria: "Sorteio", premio: "Prêmios especiais", inicio: today, fim: "", situacao: "Automático pelas datas", participacao: "WhatsApp", mensagemWhatsApp: "Olá! Quero participar da promoção Ouvinte Premiado.", linkParticipacao: "", descricao: "Participe pelo WhatsApp e concorra a prêmios.", regulamento: "Consulte as regras completas divulgadas pela emissora.", resultado: "", imagem: "", destaque: true, ativo: true },
          { id: uid("promo"), titulo: "Sua música na programação", categoria: "Participação", premio: "Pedido musical", inicio: today, fim: "", situacao: "Automático pelas datas", participacao: "WhatsApp", mensagemWhatsApp: "Olá! Quero enviar meu pedido musical.", linkParticipacao: "", descricao: "Envie seu pedido e participe.", regulamento: "", resultado: "", imagem: "", destaque: false, ativo: true }
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
        anunciantes: [],
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
  let editorSelectedBlock = "hero";

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
    if (["anunciantes","publicidade","parceiros","banners","popups"].includes(page)) return "Comercial e monetização";
    if (["whatsapp","redes","seo","dominio","aplicativo"].includes(page)) return "Integrações";
    return "Configuração do sistema";
  }

  function activeModules() { return state.modules.filter(item => item.enabled).sort((a,b) => a.order - b.order); }
  function isModuleEnabled(id) { return state.modules.some(item => item.id === id && item.enabled !== false); }
  function previewSectionAvailable(id) {
    if (!isModuleEnabled(id)) return false;
    if (id === "programacao") return state.content.programacao.some(item => item.ativo !== false);
    if (id === "noticias") return state.content.noticias.some(isNewsVisible);
    if (id === "promocoes") return state.content.promocoes.some(item => item.ativo !== false && ["ativa","agendada"].includes(promotionStatusValue(item)));
    if (id === "podcasts" || id === "videos" || id === "galeria") return (state.content[id] || []).some(item => item.ativo !== false);
    if (id === "eventos") return state.content.eventos.some(item => item.ativo !== false && ["hoje","futuro","adiado"].includes(eventStatusValue(item)));
    if (id === "equipe") return [...state.content.locutores,...state.content.equipe].some(item => item.ativo !== false);
    if (id === "publicidade") return (state.content.publicidade || []).some(item => item.ativo !== false && campaignStatusValue(item) === "ativa") || (state.content.banners || []).some(item => item.ativo !== false && bannerStatusValue(item) === "ativo");
    if (id === "parceiros") return (state.content.parceiros || []).some(item => item.ativo !== false);
    return true;
  }
  function countContent() { return Object.values(state.content).reduce((total, list) => total + (Array.isArray(list) ? list.length : 0), 0); }

  function commercialAuditIssues() {
    const issues=[];
    const activeCampaigns=(state.content.publicidade||[]).filter(item=>item.ativo!==false && campaignStatusValue(item)==="ativa");
    activeCampaigns.forEach(item=>{
      const advertiser=(state.content.anunciantes||[]).find(ad=>String(ad.id)===String(item.anuncianteId));
      if (!advertiser && !String(item.anuncianteId||"").startsWith("legacy:")) issues.push(`A campanha “${item.titulo||"Sem título"}” está sem anunciante cadastrado.`);
      else if (advertiser?.ativo===false) issues.push(`A campanha “${item.titulo||"Sem título"}” usa um anunciante desativado.`);
      if (!item.imagemDesktop) issues.push(`A campanha “${item.titulo||"Sem título"}” não possui peça desktop.`);
    });
    const activeBanners=(state.content.banners||[]).filter(item=>item.ativo!==false && bannerStatusValue(item)==="ativo");
    activeBanners.filter(item=>!item.imagemDesktop).forEach(item=>issues.push(`O banner “${item.titulo||"Sem título"}” não possui imagem desktop.`));
    ["Após o cabeçalho","Após o player","Antes de notícias","Entre seções","Antes do rodapé"].forEach(position=>{
      const total=commercialSlotItems(position).length;
      if (total>2) issues.push(`${total} peças concorrem na posição “${position}”; a prévia mostra as 2 de maior prioridade.`);
    });
    const internal=activeBanners.filter(item=>normalizedBannerPosition(item.posicao)==="Página interna").length;
    if (internal>1) issues.push(`${internal} banners concorrem em “Página interna”; a prévia mostra o de maior prioridade.`);
    const activePopups=(state.content.popups||[]).filter(item=>item.ativo!==false && popupStatusValue(item)==="ativo");
    const desktop=activePopups.filter(item=>popupMatchesDevice(item,"desktop")).length;
    const mobile=activePopups.filter(item=>popupMatchesDevice(item,"mobile")).length;
    if (desktop>1) issues.push(`${desktop} popups estão elegíveis no desktop; será exibido o de maior prioridade.`);
    if (mobile>1) issues.push(`${mobile} popups estão elegíveis no celular; será exibido o de maior prioridade.`);
    return issues;
  }

  function commercialAuditHTML() {
    const issues=commercialAuditIssues();
    if (!issues.length) return `<div class="commercial-audit ok"><strong>Auditoria comercial integrada</strong><span>Nenhum conflito ativo encontrado entre campanhas, banners e popups.</span></div>`;
    return `<div class="commercial-audit warning"><strong>Auditoria comercial integrada</strong><span>${issues.length} ponto${issues.length===1?"":"s"} para revisão:</span><ul>${issues.slice(0,6).map(issue=>`<li>${escapeHTML(issue)}</li>`).join("")}</ul>${issues.length>6?`<small>Mais ${issues.length-6} ocorrência${issues.length-6===1?"":"s"} não exibida${issues.length-6===1?"":"s"}.</small>`:""}</div>`;
  }

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
      <section class="card" style="margin-bottom:18px"><header class="card-header"><div><h3>Sistema v2.5.0 — Segurança e rastreabilidade</h3><p>Usuários, permissões, auditoria integrada e recuperação com pontos de restauração.</p></div><span class="badge active">Consolidada</span></header><div class="card-body"><div class="module-health"><div class="health-row"><div><strong><span class="health-dot"></span>Usuários e permissões</strong><span>${state.security?.users?.length||1} acesso(s) configurado(s)</span></div><button class="button small secondary" data-go="usuarios" type="button">Gerenciar</button></div><div class="health-row"><div><strong><span class="health-dot"></span>Auditoria integrada</strong><span>${state.audit?.entries?.length||0} evento(s) registrado(s)</span></div><button class="button small secondary" data-go="auditoria" type="button">Auditar</button></div><div class="health-row"><div><strong><span class="health-dot"></span>Backup e recuperação</strong><span>${state.backup?.snapshots?.length||0} ponto(s) disponível(is)</span></div><button class="button small secondary" data-go="backup" type="button">Proteger</button></div></div></div></section>
      <section class="card" style="margin-bottom:18px"><header class="card-header"><div><h3>Comercial v2.4.0 — Final Consolidada</h3><p>Publicidade, banners, parceiros e popups integrados, com posições reais, prioridades e auditoria de conflitos.</p></div><span class="badge active">Consolidada</span></header><div class="card-body"><div class="module-health">${[["anunciantes","Anunciantes",state.content.anunciantes.length],["publicidade","Campanhas",state.content.publicidade.length],["banners","Banners",state.content.banners.length],["parceiros","Parceiros",state.content.parceiros.length],["popups","Popups",state.content.popups.length]].map(([id,label,total])=>`<div class="health-row"><div><strong><span class="health-dot"></span>${label}</strong><span>${total} registro${total===1?"":"s"} no rascunho</span></div><button class="button small secondary" data-go="${id}" type="button">Revisar</button></div>`).join("")}</div>${commercialAuditHTML()}<div class="notice" style="margin-top:14px">A prévia respeita posições e prioridades, mas não registra impressão, clique ou frequência real. A coleta e a frequência pública permanecem sob responsabilidade do Portal Público/Worker.</div></div></section>
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
        <section class="card"><header class="card-header"><div><h3>Integração ativa</h3><p>Ambiente utilizado nesta instalação.</p></div></header><div class="card-body"><div class="code-box">Portal: ${escapeHTML(CONFIG.VERSION || "3.0.0-stage1")}\nWorker: ${escapeHTML(CONFIG.WORKER_URL || "—")}\nPersistência: Cloudflare D1\nMídias: API do site\nPublicação: supervisionada pela Central</div></div></section>
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
      const imageValidation=validateImageControls(event.currentTarget);
      if(!imageValidation.ok)return notify(imageValidation.message,"error");
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

  function imageRatioLabel(width,height) {
    const gcd=(a,b)=>b?gcd(b,a%b):a, divisor=gcd(Number(width)||1,Number(height)||1);
    return `${Math.round(width/divisor)}:${Math.round(height/divisor)}`;
  }

  function mediaFieldHTML(name,label,profileId,value="",required=false) {
    const profile = resolvedImageSpec(profileId,name);
    const requiredText=required?`<span class="media-required">Obrigatória</span>`:"";
    return `<div class="field full"><span class="field-label">${escapeHTML(label)} ${requiredText}</span><div class="media-uploader" data-media-field="${name}" data-profile="${profileId}" data-required="${required?"true":"false"}" data-required-width="${profile.width}" data-required-height="${profile.height}" data-max-kb="${profile.maxKB}" data-validation-state="${value?"existing":"empty"}">
      <div class="media-preview ${profile.width === profile.height ? "square" : ""}" data-media-preview>${value ? `<img src="${escapeHTML(value)}" alt="Prévia de ${escapeHTML(label)}">` : `<span>Sem imagem</span>`}</div>
      <div class="media-copy"><strong>${profile.width} × ${profile.height} px • proporção ${imageRatioLabel(profile.width,profile.height)}</strong><p><b>Tamanho obrigatório.</b> JPG, PNG ou WEBP, com no máximo ${profile.maxKB} KB. Imagens fora do padrão são rejeitadas; o Portal não recorta nem redimensiona.</p>
      <input type="hidden" name="${name}" value="${value}" data-image-value><label class="file-button">Selecionar imagem<input type="file" accept="image/jpeg,image/png,image/webp" data-image-input></label> <button class="button small ghost" type="button" data-remove-image>Remover</button><div class="media-status ${value?"info":""}" data-media-status aria-live="polite">${value?"Imagem existente. Uma nova seleção será validada antes do envio.":"Aguardando uma imagem no padrão informado."}</div></div>
    </div></div>`;
  }

  function setMediaValidationState(control,stateName,message="") {
    control.dataset.validationState=stateName;
    control.classList.toggle("media-valid",stateName==="valid");
    control.classList.toggle("media-invalid",stateName==="invalid");
    control.classList.toggle("media-processing",stateName==="processing");
    const status=$('[data-media-status]',control);
    if(status){status.className=`media-status ${stateName}`;status.textContent=message;}
  }

  function validateImageControls(root=document,{focus=true}={}) {
    const controls=$$('[data-media-field]',root);
    for(const control of controls){
      const hidden=$('[data-image-value]',control), stateName=control.dataset.validationState||"empty";
      if(stateName==="processing"){
        setMediaValidationState(control,"invalid","Aguarde o término da validação da imagem antes de salvar.");
        if(focus) $('[data-image-input]',control)?.focus();
        return {ok:false,message:"Há uma imagem ainda em validação."};
      }
      if(control.dataset.required==="true" && !String(hidden?.value||"").trim()){
        setMediaValidationState(control,"invalid",`Imagem obrigatória. Envie exatamente ${control.dataset.requiredWidth} × ${control.dataset.requiredHeight} px.`);
        if(focus) $('[data-image-input]',control)?.focus();
        return {ok:false,message:"Preencha a imagem obrigatória no tamanho exigido."};
      }
    }
    return {ok:true,message:""};
  }

  function bindImageInputs(root) {
    $$('[data-media-field]', root).forEach(control => {
      const input = $('[data-image-input]', control);
      const hidden = $('[data-image-value]', control);
      const preview = $('[data-media-preview]', control);
      input?.addEventListener("change", async () => {
        const file = input.files?.[0];
        if (!file) return;
        const token=`${Date.now()}-${Math.random()}`;
        activeImageProcesses.add(token);
        setMediaValidationState(control,"processing","Validando formato, peso e dimensões reais…");
        try {
          const result = await processImage(file, control.dataset.profile, control.dataset.mediaField || "imagem");
          if(!result.dataURL) throw new Error("O servidor não retornou a imagem armazenada.");
          hidden.value = result.dataURL;
          preview.innerHTML = `<img src="${escapeHTML(result.dataURL)}" alt="Prévia da imagem validada">`;
          setMediaValidationState(control,"valid",`Imagem aceita: ${result.width} × ${result.height} px • ${Math.ceil(result.bytes / 1024)} KB • ${result.format}.`);
        } catch (error) {
          input.value = "";
          const oldValue=String(hidden.value||"").trim();
          setMediaValidationState(control,"invalid",error.message||"Imagem rejeitada.");
          if(!oldValue) preview.innerHTML = "<span>Sem imagem</span>";
        } finally {
          activeImageProcesses.delete(token);
        }
      });
      $('[data-remove-image]', control)?.addEventListener("click", () => {
        hidden.value = "";
        input.value = "";
        preview.innerHTML = "<span>Sem imagem</span>";
        setMediaValidationState(control,control.dataset.required==="true"?"invalid":"empty",control.dataset.required==="true"?`Imagem obrigatória. Envie exatamente ${control.dataset.requiredWidth} × ${control.dataset.requiredHeight} px.`:"Imagem removida. Salve para confirmar.");
      });
    });
    $$('[data-color-text]', root).forEach(text => {
      const color = $(`[name="${text.dataset.colorText}"]`, root);
      color?.addEventListener("input", () => text.value = color.value);
      text.addEventListener("change", () => { if (/^#[0-9a-f]{6}$/i.test(text.value)) color.value = text.value; });
    });
  }

  async function readImageDimensions(file) {
    if(typeof createImageBitmap==="function"){
      const bitmap=await createImageBitmap(file);
      const dimensions={width:bitmap.width,height:bitmap.height};
      bitmap.close?.();
      return dimensions;
    }
    const url=URL.createObjectURL(file);
    try{return await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve({width:image.naturalWidth,height:image.naturalHeight});image.onerror=()=>reject(new Error("Não foi possível ler as dimensões da imagem."));image.src=url;});}
    finally{URL.revokeObjectURL(url);}
  }

  async function processImage(file, profileId, fieldName = "imagem") {
    const workerProfile = resolveWorkerProfile(profileId, fieldName);
    const profile = workerImageSpecs[workerProfile] || imageProfiles[profileId] || imageProfiles.news;
    const allowed={"image/jpeg":"JPG","image/png":"PNG","image/webp":"WEBP"};
    if (!allowed[file.type]) throw new Error(`Imagem rejeitada. Formato recebido: ${file.type||"desconhecido"}. Formatos permitidos: JPG, PNG ou WEBP.`);
    const receivedKB=Math.ceil(file.size/1024);
    if(file.size>profile.maxKB*1024) throw new Error(`Imagem rejeitada. Peso recebido: ${receivedKB} KB. Peso máximo: ${profile.maxKB} KB.`);
    const dimensions=await readImageDimensions(file);
    if(dimensions.width!==profile.width || dimensions.height!==profile.height) throw new Error(`Imagem rejeitada. Tamanho recebido: ${dimensions.width} × ${dimensions.height} px. Tamanho obrigatório: ${profile.width} × ${profile.height} px.`);
    const dataURL=String(await blobToDataURL(file));
    const dataBase64=dataURL.split(",")[1]||"";
    const result=await api("/api/cliente/site/midias",{method:"POST",body:JSON.stringify({perfil:workerProfile,campo:fieldName,nomeOriginal:file.name,mime:file.type,largura:dimensions.width,altura:dimensions.height,dataBase64})});
    if(result?.midia)mediaLibrary.unshift(result.midia);
    return{dataURL:result?.midia?.url||"",bytes:file.size,width:dimensions.width,height:dimensions.height,format:allowed[file.type]};
  }

  function resolveWorkerProfile(profileId, fieldName = "") {
    const field = String(fieldName).toLowerCase();
    if (field.includes("qrcode") || field.includes("qr_code")) return "qrcode";
    if ((currentPage === "anunciantes" || currentPage === "parceiros") && field.includes("logo")) return "parceiro";
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

  function editorThemeOptions(themeId=state.selectedTheme) {
    ensureV260EditorState();
    return state.editor.themeOptions[themeId];
  }

  function editorBlockOptions(blockId,themeId=state.selectedTheme) {
    ensureV260EditorState();
    return state.editor.blocks[themeId][blockId] || freshEditorBlockOptions(blockId,themeId);
  }

  function ensureV260EditorState() {
    state.editor=normalizeEditorState(state.editor||{});
    editorSelectedBlock=modulesCatalog.some(([id])=>id===editorSelectedBlock)?editorSelectedBlock:(state.editor.selectedBlock||"hero");
    state.editor.selectedBlock=editorSelectedBlock;
    return state.editor;
  }

  function optionSlug(value="") {
    return String(value).replace(/([a-z0-9])([A-Z])/g,"$1-$2").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  }

  function editorFieldMarkup(field,value) {
    const [key,label,type,values]=field;
    if(type==="checkbox") return `<label class="editor-option-check"><input type="checkbox" data-theme-option="${key}" ${value!==false?"checked":""}><span><strong>${escapeHTML(label)}</strong><small>Aplicado somente a este modelo.</small></span></label>`;
    return `<label class="field"><span>${escapeHTML(label)}</span><select data-theme-option="${key}">${values.map(item=>`<option value="${escapeHTML(item)}" ${item===value?"selected":""}>${escapeHTML(item)}</option>`).join("")}</select></label>`;
  }

  function renderThemeEditorControls() {
    const host=$("#theme-editor-controls"); if(!host)return;
    ensureV260EditorState();
    const schema=editorThemeSchemas[state.selectedTheme], values=editorThemeOptions();
    host.innerHTML=`<div class="editor-control-heading"><div><span>Opções do modelo</span><h3>${escapeHTML(schema.title)}</h3><p>${escapeHTML(schema.description)}</p></div><button class="button ghost small" id="reset-theme-options" type="button">Restaurar modelo</button></div>${schema.locked?`<div class="notice editor-locked-note"><strong>Identidade preservada.</strong><br>O modelo Jovem mantém sua composição original, conforme definido.</div>`:""}<div class="editor-options-grid">${schema.fields.map(field=>editorFieldMarkup(field,values[field[0]])).join("")}</div>`;
    $$('[data-theme-option]',host).forEach(input=>input.addEventListener("change",()=>{
      editorThemeOptions()[input.dataset.themeOption]=input.type==="checkbox"?input.checked:input.value;
      persist(false);renderSitePreview($("#inline-preview"));
    }));
    $("#reset-theme-options",host)?.addEventListener("click",()=>{
      state.editor.themeOptions[state.selectedTheme]=cloneJSON(editorThemeDefaults[state.selectedTheme]);
      persist(false);renderThemeEditorControls();renderSitePreview($("#inline-preview"));notify("Opções do modelo restauradas.","success");
    });
  }

  function hexToRgb(value) {
    const hex=normalizeHexColor(value,"#000000").slice(1);
    return [0,2,4].map(index=>parseInt(hex.slice(index,index+2),16));
  }
  function relativeLuminance(value) {
    const channels=hexToRgb(value).map(channel=>{const normalized=channel/255;return normalized<=0.03928?normalized/12.92:Math.pow((normalized+0.055)/1.055,2.4);});
    return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
  }
  function contrastRatio(foreground,background) {
    const a=relativeLuminance(foreground),b=relativeLuminance(background);
    return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
  }
  function blockContrastChecks(values) {
    const background=normalizeHexColor(values.backgroundColor,"#ffffff");
    return [
      ["Título e fundo",contrastRatio(values.titleColor,background),3],
      ["Texto e fundo",contrastRatio(values.textColor,background),4.5],
      ["Chamada e fundo",contrastRatio(values.eyebrowColor,background),4.5],
      ["Texto e botão",contrastRatio(values.buttonTextColor,values.buttonColor),4.5]
    ].map(([label,ratio,minimum])=>({label,ratio,minimum,pass:ratio>=minimum}));
  }
  function contrastReportMarkup(values) {
    if(values.useThemeColors!==false)return `<div class="editor-contrast-report neutral" id="block-contrast-report" role="status"><strong>Cores originais do modelo</strong><span>O contraste permanece sob controle do tema selecionado.</span></div>`;
    const checks=blockContrastChecks(values),failures=checks.filter(item=>!item.pass);
    return `<div class="editor-contrast-report ${failures.length?"warning":"success"}" id="block-contrast-report" role="status"><strong>${failures.length?`Atenção: ${failures.length} combinação(ões) com baixo contraste`:`Contraste aprovado`}</strong><div>${checks.map(item=>`<span class="${item.pass?"pass":"fail"}">${item.pass?"✓":"!"} ${escapeHTML(item.label)} — ${item.ratio.toFixed(2)}:1</span>`).join("")}</div><small>Referência: 3:1 para títulos grandes e 4,5:1 para textos e botões.</small></div>`;
  }
  function editorColorFieldMarkup(key,values) {
    const [label,help]=editorBlockColorLabels[key],value=normalizeHexColor(values[key],editorColorDefaults(state.selectedTheme)[key]),disabled=values.useThemeColors!==false;
    return `<label class="editor-color-field"><span>${escapeHTML(label)}</span><div class="editor-color-control"><input type="color" value="${value}" data-block-color-picker="${key}" ${disabled?"disabled":""} aria-label="Selecionar ${escapeHTML(label.toLowerCase())}"><input type="text" value="${value.toUpperCase()}" maxlength="7" spellcheck="false" data-block-color-text="${key}" ${disabled?"disabled":""} aria-label="Código hexadecimal de ${escapeHTML(label.toLowerCase())}"></div><small>${escapeHTML(help)}</small></label>`;
  }
  function updateContrastReport(host,values) {
    const current=$("#block-contrast-report",host);if(current)current.outerHTML=contrastReportMarkup(values);
  }
  function resetEditorBlockColors(values,themeId=state.selectedTheme) {
    const defaults=editorColorDefaults(themeId);Object.assign(values,defaults);
  }

  function blockSupportsLimit(id) { return ["programacao","noticias","promocoes","podcasts","videos","equipe","galeria","eventos","parceiros"].includes(id); }
  function blockLayoutChoices(id) {
    if(id==="hero")return["Destaque","Cartão","Minimalista"];
    if(id==="player")return["Destaque","Compacto","Faixa"];
    if(["noticias","videos"].includes(id))return["Editorial","Grade","Lista"];
    if(id==="galeria")return["Mosaico","Grade","Faixa"];
    if(id==="parceiros")return["Logotipos","Cards","Faixa"];
    if(["aplicativo","contato","publicidade"].includes(id))return["Faixa","Cartão","Minimalista"];
    return["Cards","Grade","Lista"];
  }

  function renderBlockEditorControls() {
    const host=$("#block-editor-controls"); if(!host)return;
    ensureV260EditorState();
    const module=state.modules.find(item=>item.id===editorSelectedBlock)||state.modules[0], values=editorBlockOptions(module.id);
    const layouts=blockLayoutChoices(module.id);
    host.innerHTML=`<div class="editor-control-heading"><div><span>Bloco selecionado</span><h3>${escapeHTML(module.label)}</h3><p>${escapeHTML(module.description)}</p></div><button class="button ghost small" id="reset-block-options" type="button">Restaurar bloco</button></div>
      <div class="editor-options-grid block-options-grid">
        <label class="field"><span>Composição</span><select data-block-option="layout">${layouts.map(item=>`<option ${item===values.layout?"selected":""}>${item}</option>`).join("")}</select></label>
        <label class="field"><span>Largura</span><select data-block-option="width">${["Total","Amplo","Contido"].map(item=>`<option ${item===values.width?"selected":""}>${item}</option>`).join("")}</select></label>
        <label class="field"><span>Estilo de fundo</span><select data-block-option="background">${["Automático","Claro","Contraste","Cor do tema"].map(item=>`<option ${item===values.background?"selected":""}>${item}</option>`).join("")}</select></label>
        <label class="field"><span>Alinhamento</span><select data-block-option="alignment">${["Esquerda","Centro"].map(item=>`<option ${item===values.alignment?"selected":""}>${item}</option>`).join("")}</select></label>
        ${blockSupportsLimit(module.id)?`<label class="field"><span>Itens na página</span><input type="number" min="1" max="12" value="${Number(values.limit||4)}" data-block-option="limit"></label>`:""}
        <label class="field editor-span-2"><span>Título personalizado</span><input type="text" maxlength="80" value="${escapeHTML(values.title||"")}" placeholder="Deixe vazio para usar o título padrão" data-block-option="title"></label>
        <label class="field editor-span-2"><span>Chamada superior</span><input type="text" maxlength="60" value="${escapeHTML(values.eyebrow||"")}" placeholder="Deixe vazio para usar a chamada padrão" data-block-option="eyebrow"></label>
        <label class="editor-option-check"><input type="checkbox" data-block-option="showDescription" ${values.showDescription!==false?"checked":""}><span><strong>Mostrar descrição</strong><small>Texto explicativo abaixo do título.</small></span></label>
        <label class="editor-option-check"><input type="checkbox" data-block-option="showAction" ${values.showAction!==false?"checked":""}><span><strong>Mostrar acesso completo</strong><small>Botão para lista, grade ou conteúdo completo.</small></span></label>
        <section class="editor-color-panel editor-span-2">
          <header><div><span>Personalização de cores</span><h4>Cores exclusivas deste bloco</h4><p>As escolhas ficam separadas por modelo e não alteram os outros temas.</p></div><button class="button ghost small" id="reset-block-colors" type="button">Restaurar cores</button></header>
          <label class="editor-option-check editor-color-toggle"><input type="checkbox" data-block-option="useThemeColors" ${values.useThemeColors!==false?"checked":""}><span><strong>Usar cores originais do modelo</strong><small>Desative para liberar fundo, fontes, chamadas e botões personalizados.</small></span></label>
          <div class="editor-color-grid ${values.useThemeColors!==false?"disabled":""}" aria-disabled="${values.useThemeColors!==false?"true":"false"}">${editorBlockColorKeys.map(key=>editorColorFieldMarkup(key,values)).join("")}</div>
          ${contrastReportMarkup(values)}
        </section>
      </div>`;
    $$('[data-block-option]',host).forEach(input=>{
      const eventName=input.tagName==="INPUT"&&input.type==="text"?"input":"change";
      input.addEventListener(eventName,()=>{
        let value=input.type==="checkbox"?input.checked:input.value;
        if(input.type==="number")value=Math.max(1,Math.min(12,Number(value||1)));
        editorBlockOptions(module.id)[input.dataset.blockOption]=value;
        persist(false);renderModuleList();renderSitePreview($("#inline-preview"));
        if(input.dataset.blockOption==="useThemeColors")renderBlockEditorControls();
      });
    });
    $$('[data-block-color-picker]',host).forEach(input=>input.addEventListener("input",()=>{
      const key=input.dataset.blockColorPicker,current=editorBlockOptions(module.id),value=normalizeHexColor(input.value,current[key]);
      current[key]=value;const text=$(`[data-block-color-text="${key}"]`,host);if(text)text.value=value.toUpperCase();
      persist(false);renderSitePreview($("#inline-preview"));updateContrastReport(host,current);
    }));
    $$('[data-block-color-text]',host).forEach(input=>{
      const apply=()=>{const key=input.dataset.blockColorText,current=editorBlockOptions(module.id),raw=String(input.value||"").trim();if(!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)){input.value=normalizeHexColor(current[key],"#ffffff").toUpperCase();notify("Use uma cor hexadecimal válida, como #1457D9.","warning");return;}const value=normalizeHexColor(raw,current[key]);current[key]=value;input.value=value.toUpperCase();const picker=$(`[data-block-color-picker="${key}"]`,host);if(picker)picker.value=value;persist(false);renderSitePreview($("#inline-preview"));updateContrastReport(host,current);};
      input.addEventListener("input",()=>{if(/^#[0-9a-f]{6}$/i.test(input.value.trim()))apply();});input.addEventListener("change",apply);
    });
    $("#reset-block-colors",host)?.addEventListener("click",()=>{const current=editorBlockOptions(module.id);resetEditorBlockColors(current);persist(false);renderBlockEditorControls();renderModuleList();renderSitePreview($("#inline-preview"));notify("Cores originais do bloco restauradas.","success");});
    $("#reset-block-options",host)?.addEventListener("click",()=>{
      state.editor.blocks[state.selectedTheme][module.id]=freshEditorBlockOptions(module.id,state.selectedTheme);
      persist(false);renderBlockEditorControls();renderModuleList();renderSitePreview($("#inline-preview"));notify("Configuração do bloco restaurada.","success");
    });
  }

  function renderVisualEditor(root) {
    ensureV260EditorState();
    root.innerHTML = `
      <section class="editor-stage-note editor-stage-toolbar"><div><span>v3.0.0 • Etapa 1 — Pré-produção</span><h3>Editor visual pronto para validação final</h3><p>Modelos, blocos, cores, imagens e prévia em tempo real reunidos em uma única base estável.</p></div><div class="editor-stage-actions"><strong>Mesmo rascunho atual<br>Sem mudança no Worker</strong><button class="button primary" data-preview type="button">Prévia em tela cheia</button></div></section>
      <div class="editor-layout editor-layout-v260">
        <aside class="editor-sidebar">
          <section class="card"><header class="card-header"><div><h3>Modelo ativo</h3><p>As opções abaixo pertencem somente a ele.</p></div></header><div class="card-body"><select id="quick-theme">${themes.map(theme => `<option value="${theme.id}" ${theme.id === state.selectedTheme ? "selected" : ""}>${escapeHTML(theme.name)}</option>`).join("")}</select><button class="button secondary" data-go="themes" type="button" style="width:100%;margin-top:10px">Ver todos os modelos</button></div></section>
          <section class="card"><header class="card-header"><div><h3>Blocos da página</h3><p>Arraste ou use as setas. Clique no bloco para editar.</p></div></header><div class="card-body"><div class="module-list" id="module-list"></div></div></section>
        </aside>
        <section class="editor-workspace">
          <div class="editor-controls-stack">
            <section class="card editor-control-card"><div class="card-body" id="theme-editor-controls"></div></section>
            <section class="card editor-control-card"><div class="card-body" id="block-editor-controls"></div></section>
          </div>
          <div class="editor-preview-column">
            <div class="device-toolbar"><div class="editor-preview-title"><strong>Prévia ao vivo</strong><small>Atualização automática</small></div><div class="device-switch"><button class="active" data-inline-device="desktop" type="button">Desktop</button><button data-inline-device="tablet" type="button">Tablet</button><button data-inline-device="mobile" type="button">Celular</button></div></div>
            <div class="preview-panel"><div id="inline-preview" class="preview-canvas desktop"></div></div>
          </div>
        </section>
      </div>`;
    renderModuleList();renderThemeEditorControls();renderBlockEditorControls();renderSitePreview($("#inline-preview"));
    $("[data-preview]", root).addEventListener("click", openPreview);bindGoButtons(root);
    $("#quick-theme").addEventListener("change", event => { state.selectedTheme = event.target.value;ensureV260EditorState();persist(false);renderModuleList();renderThemeEditorControls();renderBlockEditorControls();renderSitePreview($("#inline-preview")); });
    $$('[data-inline-device]', root).forEach(button => button.addEventListener("click", () => {$$('[data-inline-device]', root).forEach(item => item.classList.remove("active"));button.classList.add("active");$("#inline-preview").className = `preview-canvas ${button.dataset.inlineDevice}`;renderSitePreview($("#inline-preview"));}));
  }

  function renderModuleList() {
    const list = $("#module-list"); if (!list) return;
    ensureV260EditorState();
    state.modules.sort((a,b) => a.order - b.order);
    list.innerHTML = state.modules.map(module => `<div class="module-item ${module.enabled ? "" : "disabled"} ${module.id===editorSelectedBlock?"selected":""}" draggable="true" data-module-id="${module.id}" role="button" tabindex="0" aria-label="Configurar bloco ${escapeHTML(module.label)}"><span class="drag-handle" aria-hidden="true">☷</span><div class="module-copy"><strong>${escapeHTML(module.label)}</strong><small>${escapeHTML(editorBlockOptions(module.id).layout)} • ${escapeHTML(editorBlockOptions(module.id).width)}</small></div><div class="module-actions"><button class="module-move" data-module-up="${module.id}" type="button" aria-label="Mover ${escapeHTML(module.label)} para cima">↑</button><button class="module-move" data-module-down="${module.id}" type="button" aria-label="Mover ${escapeHTML(module.label)} para baixo">↓</button><label class="switch" title="Ativar ou desativar"><input type="checkbox" ${module.enabled ? "checked" : ""} data-module-toggle="${module.id}" aria-label="Ativar bloco ${escapeHTML(module.label)}"><span></span></label></div></div>`).join("");
    $$('.module-item',list).forEach(item=>{
      const select=()=>{editorSelectedBlock=item.dataset.moduleId;state.editor.selectedBlock=editorSelectedBlock;renderModuleList();renderBlockEditorControls();const stack=$(".editor-controls-stack"),card=$("#block-editor-controls")?.closest(".editor-control-card");if(stack&&card){const target=Math.max(0,card.offsetTop-8);stack.scrollTo({top:target,behavior:"smooth"});}};
      item.addEventListener("click",event=>{if(!event.target.closest("input,label"))select();});
      item.addEventListener("keydown",event=>{if(event.target===item&&(event.key==="Enter"||event.key===" ")){event.preventDefault();select();}});
    });
    $$('[data-module-toggle]', list).forEach(input => input.addEventListener("change", () => {const module = state.modules.find(item => item.id === input.dataset.moduleToggle);module.enabled = input.checked;persist(false);renderModuleList();renderSitePreview($("#inline-preview"));}));
    const move=(id,delta)=>{const ordered=[...state.modules].sort((a,b)=>a.order-b.order),index=ordered.findIndex(item=>item.id===id),target=index+delta;if(index<0||target<0||target>=ordered.length)return;[ordered[index],ordered[target]]=[ordered[target],ordered[index]];ordered.forEach((item,i)=>item.order=i);persist(false);renderModuleList();renderSitePreview($("#inline-preview"));};
    $$('[data-module-up]',list).forEach(button=>button.addEventListener("click",()=>move(button.dataset.moduleUp,-1)));
    $$('[data-module-down]',list).forEach(button=>button.addEventListener("click",()=>move(button.dataset.moduleDown,1)));
    let dragging = null;
    $$('.module-item', list).forEach(item => {item.addEventListener("dragstart", () => { dragging = item; item.classList.add("dragging"); });item.addEventListener("dragend", () => { item.classList.remove("dragging"); dragging = null; persist(false);renderModuleList();renderSitePreview($("#inline-preview")); });item.addEventListener("dragover", event => {event.preventDefault(); if (!dragging || dragging === item) return;const rect = item.getBoundingClientRect(); const after = event.clientY > rect.top + rect.height/2;list.insertBefore(dragging, after ? item.nextSibling : item);$$('.module-item', list).forEach((row,index) => { const module = state.modules.find(entry => entry.id === row.dataset.moduleId); module.order = index; });});});
  }

  function themeLayoutLabel(layout) {
    return ({regional:"portal regional e TV",popular:"popular e participativa",news24:"redação 24 horas",faith:"gospel e comunidade",bento:"jovem em blocos",studio:"estúdio flexível"})[layout] || layout;
  }

  function themeShotMarkup(theme) {
    const layout = theme.layout || theme.id;
    if (layout === "popular") return `<div class="theme-shot-browser layout-popular"><div class="theme-shot-top"></div><div class="theme-shot-popular"><b></b><span></span><i></i></div><div class="theme-shot-pills"><em></em><em></em><em></em></div></div>`;
    if (layout === "news24") return `<div class="theme-shot-browser layout-news24"><div class="theme-shot-top"></div><div class="theme-shot-breaking"></div><div class="theme-shot-headlines"><b></b><span></span><span></span></div></div>`;
    if (layout === "faith") return `<div class="theme-shot-browser layout-faith"><div class="theme-shot-top"></div><div class="theme-shot-faith"><b></b><span></span></div><div class="theme-shot-cards"><span></span><span></span><span></span></div></div>`;
    if (layout === "bento") return `<div class="theme-shot-browser layout-bento"><div class="theme-shot-top"></div><div class="theme-shot-bento"><b></b><span></span><i></i><em></em></div></div>`;
    if (layout === "studio") return `<div class="theme-shot-browser layout-studio"><div class="theme-shot-top"></div><div class="theme-shot-studio"><b></b><span></span></div><div class="theme-shot-cards"><span></span><span></span><span></span></div></div>`;
    return `<div class="theme-shot-browser layout-regional"><div class="theme-shot-top"></div><div class="theme-shot-live"></div><div class="theme-shot-regional"><b></b><span></span><i></i></div></div>`;
  }

  function renderThemes(root) {
    root.innerHTML = `${pageHeader("Temas", "Modelos construídos em HTML, CSS e JavaScript. O conteúdo é compartilhado, mas a experiência visual muda de verdade.")}
      <section class="theme-release-note"><div><span>v3.0.0 • Etapa 1 — Pré-produção</span><h3>Seis modelos e editor visual consolidados</h3><p>Layouts distintos, opções por bloco, cores independentes, validação obrigatória de imagens e prévias responsivas reunidos na versão final.</p></div><strong>Mesmo rascunho do Portal<br>Sem mudanças no Worker</strong></section>
      <div class="theme-grid">${themes.map(theme => {
        const [accent,dark,highlight,bg] = theme.colors;
        return `<article class="theme-card ${theme.id === state.selectedTheme ? "selected" : ""}" data-theme-card="${theme.id}">${theme.id === state.selectedTheme ? `<span class="theme-selected-tag">Tema ativo</span>` : ""}<div class="theme-shot" style="--shot-bg:${bg};--shot-dark:${dark};--shot-accent:${accent};--shot-highlight:${highlight};--shot-muted:${highlight}22">${themeShotMarkup(theme)}</div><div class="theme-meta"><span class="theme-layout-label">Composição ${escapeHTML(themeLayoutLabel(theme.layout))}</span><h3>${escapeHTML(theme.name)}</h3><small class="theme-audience">${escapeHTML(theme.audience || "")}</small><p>${escapeHTML(theme.description)}</p><button class="button ${theme.id === state.selectedTheme ? "secondary" : "primary"} small" data-select-theme="${theme.id}" type="button">${theme.id === state.selectedTheme ? "Selecionado" : "Usar este tema"}</button> <button class="button ghost small" data-theme-preview="${theme.id}" type="button">Visualizar</button></div></article>`;
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
    if (key === "promocoes") return [["Promoções",items.length],["Ativas",items.filter(i=>i.ativo!==false&&promotionStatusValue(i)==="ativa").length],["Agendadas",items.filter(i=>i.ativo!==false&&promotionStatusValue(i)==="agendada").length],["Encerradas",items.filter(i=>promotionStatusValue(i)==="encerrada").length]];
    if (key === "eventos") return [["Eventos",items.length],["Próximos",items.filter(i=>i.ativo!==false&&eventStatusValue(i)==="futuro").length],["Hoje",items.filter(i=>i.ativo!==false&&eventStatusValue(i)==="hoje").length],["Encerrados",items.filter(i=>eventStatusValue(i)==="encerrado").length]];
    if (key === "anunciantes") return [["Anunciantes",items.length],["Ativos",active],["Com campanhas",new Set(state.content.publicidade.map(i=>i.anuncianteId).filter(Boolean)).size],["Com contato",items.filter(i=>i.email||i.telefone||i.whatsapp).length]];
    if (key === "publicidade") return [["Campanhas",items.length],["Ativas",items.filter(i=>i.ativo!==false&&campaignStatusValue(i)==="ativa").length],["Agendadas",items.filter(i=>i.ativo!==false&&campaignStatusValue(i)==="agendada").length],["Encerradas",items.filter(i=>campaignStatusValue(i)==="encerrada").length]];
    if (key === "banners") return [["Banners",items.length],["Ativos",items.filter(i=>i.ativo!==false&&bannerStatusValue(i)==="ativo").length],["Agendados",items.filter(i=>i.ativo!==false&&bannerStatusValue(i)==="agendado").length],["Encerrados",items.filter(i=>bannerStatusValue(i)==="encerrado").length]];
    if (key === "parceiros") return [["Parceiros",items.length],["Ativos",active],["Destaques",items.filter(i=>i.destaque&&i.ativo!==false).length],["Categorias",new Set(items.map(i=>i.categoria).filter(Boolean)).size]];
    if (key === "popups") return [["Popups",items.length],["Ativos",items.filter(i=>i.ativo!==false&&popupStatusValue(i)==="ativo").length],["Agendados",items.filter(i=>i.ativo!==false&&popupStatusValue(i)==="agendado").length],["Encerrados",items.filter(i=>popupStatusValue(i)==="encerrado").length]];
    return [];
  }

  function selectOptions(values,prefix) {
    return [...new Set(values.map(value=>String(value||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR")).map(value=>`<option value="${prefix}:${escapeHTML(value)}" ${collectionContextFilter === `${prefix}:${value}` ? "selected" : ""}>${escapeHTML(value)}</option>`).join("");
  }

  function sortOptions(key) {
    const options = key === "podcasts" ? [["padrao","Mais recentes"],["destaques","Destaques primeiro"],["programa","Programa e episódio"],["titulo","Título A–Z"],["antigos","Mais antigos"]]
      : key === "videos" ? [["padrao","Mais recentes"],["destaques","Destaques primeiro"],["categoria","Categoria"],["titulo","Título A–Z"],["antigos","Mais antigos"]]
      : key === "promocoes" ? [["padrao","Situação e prazo"],["destaques","Destaques primeiro"],["inicio","Início próximo"],["fim","Encerramento próximo"],["titulo","Título A–Z"],["antigos","Mais antigas"]]
      : key === "eventos" ? [["padrao","Próximos eventos"],["destaques","Destaques primeiro"],["recentes","Mais recentes"],["titulo","Título A–Z"],["antigos","Eventos passados"]]
      : key === "noticias" ? [["padrao","Destaques e recentes"],["recentes","Mais recentes"],["titulo","Título A–Z"],["antigos","Mais antigas"]]
      : key === "publicidade" ? [["padrao","Prioridade e período"],["prioridade","Maior prioridade"],["inicio","Início próximo"],["titulo","Título A–Z"],["antigos","Mais antigas"]]
      : key === "banners" ? [["padrao","Prioridade e período"],["prioridade","Maior prioridade"],["inicio","Início próximo"],["titulo","Título A–Z"],["antigos","Mais antigos"]]
      : key === "parceiros" ? [["padrao","Destaque e ordem"],["ordem","Ordem de exibição"],["destaques","Destaques primeiro"],["titulo","Nome A–Z"]]
      : key === "popups" ? [["padrao","Prioridade e período"],["prioridade","Maior prioridade"],["inicio","Início próximo"],["titulo","Título A–Z"],["antigos","Mais antigos"]]
      : key === "anunciantes" ? [["titulo","Nome A–Z"],["recentes","Mais recentes"],["antigos","Mais antigos"]]
      : [];
    return options.length ? `<select id="collection-sort" aria-label="Ordenar conteúdos">${options.map(([value,label])=>`<option value="${value}" ${collectionSort===value?"selected":""}>${label}</option>`).join("")}</select>` : "";
  }

  function collectionFilters(key, allItems) {
    const base = `<select id="collection-filter" aria-label="Filtrar por publicação"><option value="todos" ${collectionFilter === "todos" ? "selected" : ""}>Todos os status</option><option value="ativos" ${collectionFilter === "ativos" ? "selected" : ""}>Publicados</option><option value="inativos" ${collectionFilter === "inativos" ? "selected" : ""}>Não publicados</option></select>`;
    if (key === "programacao") return `${base}<select id="collection-context-filter" aria-label="Filtrar por dia"><option value="todos" ${collectionContextFilter === "todos" ? "selected" : ""}>Todos os dias</option>${weekOrder.map(day=>`<option value="dia:${day}" ${collectionContextFilter === `dia:${day}` ? "selected" : ""}>${day}</option>`).join("")}</select>`;
    if (key === "noticias") return `<select id="collection-filter" aria-label="Filtrar situação editorial"><option value="todos" ${collectionFilter === "todos" ? "selected" : ""}>Todas as situações</option>${["publicada","agendada","rascunho","arquivada"].map(value=>`<option value="news:${value}" ${collectionFilter === `news:${value}` ? "selected" : ""}>${value[0].toUpperCase()+value.slice(1)}</option>`).join("")}</select><select id="collection-context-filter" aria-label="Filtrar categoria"><option value="todos" ${collectionContextFilter === "todos" ? "selected" : ""}>Todas as categorias</option>${selectOptions(allItems.map(i=>i.categoria),"categoria")}</select>${sortOptions(key)}`;
    if (key === "podcasts") return `${base}<select id="collection-context-filter" aria-label="Filtrar podcast"><option value="todos" ${collectionContextFilter === "todos" ? "selected" : ""}>Todos os programas</option>${selectOptions(allItems.map(i=>i.programa),"programa")}</select>${sortOptions(key)}`;
    if (key === "videos") return `${base}<select id="collection-context-filter" aria-label="Filtrar categoria"><option value="todos" ${collectionContextFilter === "todos" ? "selected" : ""}>Todas as categorias</option>${selectOptions(allItems.map(i=>i.categoria),"categoria")}</select>${sortOptions(key)}`;
    if (key === "promocoes") return `<select id="collection-filter" aria-label="Filtrar situação da promoção"><option value="todos" ${collectionFilter === "todos" ? "selected" : ""}>Todas as situações</option>${[["ativa","Ativas"],["agendada","Agendadas"],["encerrada","Encerradas"],["cancelada","Canceladas"]].map(([value,label])=>`<option value="promo:${value}" ${collectionFilter === `promo:${value}` ? "selected" : ""}>${label}</option>`).join("")}</select><select id="collection-context-filter" aria-label="Filtrar categoria"><option value="todos" ${collectionContextFilter === "todos" ? "selected" : ""}>Todas as categorias</option>${selectOptions(allItems.map(i=>i.categoria),"categoria")}</select>${sortOptions(key)}`;
    if (key === "eventos") return `<select id="collection-filter" aria-label="Filtrar situação do evento"><option value="todos" ${collectionFilter === "todos" ? "selected" : ""}>Todas as situações</option>${[["futuro","Próximos"],["hoje","Hoje"],["encerrado","Encerrados"],["adiado","Adiados"],["cancelado","Cancelados"]].map(([value,label])=>`<option value="evento:${value}" ${collectionFilter === `evento:${value}` ? "selected" : ""}>${label}</option>`).join("")}</select><select id="collection-context-filter" aria-label="Filtrar categoria"><option value="todos" ${collectionContextFilter === "todos" ? "selected" : ""}>Todas as categorias</option>${selectOptions(allItems.map(i=>i.categoria||i.tipo),"categoria")}</select>${sortOptions(key)}`;
    if (key === "publicidade") return `<select id="collection-filter" aria-label="Filtrar situação da campanha"><option value="todos" ${collectionFilter === "todos" ? "selected" : ""}>Todas as situações</option>${[["ativa","Ativas"],["agendada","Agendadas"],["encerrada","Encerradas"],["pausada","Pausadas"],["cancelada","Canceladas"]].map(([value,label])=>`<option value="campanha:${value}" ${collectionFilter === `campanha:${value}` ? "selected" : ""}>${label}</option>`).join("")}</select><select id="collection-context-filter" aria-label="Filtrar posição"><option value="todos" ${collectionContextFilter === "todos" ? "selected" : ""}>Todas as posições</option>${selectOptions(allItems.map(i=>i.posicao),"posicao")}</select>${sortOptions(key)}`;
    if (key === "banners") return `<select id="collection-filter" aria-label="Filtrar situação do banner"><option value="todos" ${collectionFilter === "todos" ? "selected" : ""}>Todas as situações</option>${[["ativo","Ativos"],["agendado","Agendados"],["encerrado","Encerrados"],["pausado","Pausados"],["cancelado","Cancelados"]].map(([value,label])=>`<option value="banner:${value}" ${collectionFilter === `banner:${value}` ? "selected" : ""}>${label}</option>`).join("")}</select><select id="collection-context-filter" aria-label="Filtrar posição"><option value="todos" ${collectionContextFilter === "todos" ? "selected" : ""}>Todas as posições</option>${selectOptions(allItems.map(i=>i.posicao),"posicao")}</select>${sortOptions(key)}`;
    if (key === "parceiros") return `${base}<select id="collection-context-filter" aria-label="Filtrar categoria"><option value="todos" ${collectionContextFilter === "todos" ? "selected" : ""}>Todas as categorias</option>${selectOptions(allItems.map(i=>i.categoria),"categoria")}</select>${sortOptions(key)}`;
    if (key === "popups") return `<select id="collection-filter" aria-label="Filtrar situação do popup"><option value="todos" ${collectionFilter === "todos" ? "selected" : ""}>Todas as situações</option>${[["ativo","Ativos"],["agendado","Agendados"],["encerrado","Encerrados"],["pausado","Pausados"],["cancelado","Cancelados"]].map(([value,label])=>`<option value="popup:${value}" ${collectionFilter === `popup:${value}` ? "selected" : ""}>${label}</option>`).join("")}</select><select id="collection-context-filter" aria-label="Filtrar dispositivo"><option value="todos" ${collectionContextFilter === "todos" ? "selected" : ""}>Todos os dispositivos</option>${selectOptions(allItems.map(i=>i.dispositivo),"dispositivo")}</select>${sortOptions(key)}`;
    if (key === "anunciantes") return `${base}${sortOptions(key)}`;
    return base;
  }

  function contentTimestamp(item) {
    const date=item.data || item.inicio || item.dataFim || item.fim;
    const raw = date ? `${date}T${item.hora||"12:00"}:00` : (item.atualizadoEm || item.criadoEm || "");
    const time=Date.parse(raw); return Number.isFinite(time)?time:0;
  }

  function filterAndSortCollection(key, source) {
    let items = source.filter(item => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()));
    if (collectionFilter === "ativos") items = items.filter(item => item.ativo !== false);
    else if (collectionFilter === "inativos") items = items.filter(item => item.ativo === false);
    else if (collectionFilter.startsWith("news:")) items = items.filter(item => newsStatusValue(item) === collectionFilter.slice(5));
    else if (collectionFilter.startsWith("promo:")) items = items.filter(item => promotionStatusValue(item) === collectionFilter.slice(6));
    else if (collectionFilter.startsWith("evento:")) items = items.filter(item => eventStatusValue(item) === collectionFilter.slice(7));
    else if (collectionFilter.startsWith("campanha:")) items = items.filter(item => campaignStatusValue(item) === collectionFilter.slice(9));
    else if (collectionFilter.startsWith("banner:")) items = items.filter(item => bannerStatusValue(item) === collectionFilter.slice(7));
    else if (collectionFilter.startsWith("popup:")) items = items.filter(item => popupStatusValue(item) === collectionFilter.slice(6));
    if (collectionContextFilter.startsWith("dia:")) items = items.filter(item => normalizeDays(item.dias || item.dia).includes(collectionContextFilter.slice(4)));
    else if (collectionContextFilter.startsWith("programa:")) items = items.filter(item => String(item.programa||"") === collectionContextFilter.slice(9));
    else if (collectionContextFilter.startsWith("categoria:")) items = items.filter(item => String(item.categoria||item.tipo||"") === collectionContextFilter.slice(10));
    else if (collectionContextFilter.startsWith("posicao:")) items = items.filter(item => String(item.posicao||"") === collectionContextFilter.slice(8));
    else if (collectionContextFilter.startsWith("dispositivo:")) items = items.filter(item => String(item.dispositivo||"") === collectionContextFilter.slice(12));
    items = [...items];
    if (key === "programacao") items.sort((a,b)=>Math.min(...normalizeDays(a.dias||a.dia).map(d=>weekOrder.indexOf(d)).filter(i=>i>=0),99)-Math.min(...normalizeDays(b.dias||b.dia).map(d=>weekOrder.indexOf(d)).filter(i=>i>=0),99) || compareTime(a.inicio,b.inicio));
    else if (key === "locutores") items.sort((a,b)=>Number(a.ordem||999)-Number(b.ordem||999) || String(a.nome||"").localeCompare(String(b.nome||"")));
    else if (collectionSort === "titulo") items.sort((a,b)=>String(a.titulo||a.nome||"").localeCompare(String(b.titulo||b.nome||""),"pt-BR"));
    else if (collectionSort === "antigos") items.sort((a,b)=>contentTimestamp(a)-contentTimestamp(b));
    else if (collectionSort === "destaques") items.sort((a,b)=>Number(Boolean(b.destaque))-Number(Boolean(a.destaque)) || contentTimestamp(b)-contentTimestamp(a));
    else if (collectionSort === "programa") items.sort((a,b)=>String(a.programa||"").localeCompare(String(b.programa||""),"pt-BR") || Number(a.temporada||0)-Number(b.temporada||0) || Number(a.episodio||0)-Number(b.episodio||0));
    else if (collectionSort === "categoria") items.sort((a,b)=>String(a.categoria||"").localeCompare(String(b.categoria||""),"pt-BR") || contentTimestamp(b)-contentTimestamp(a));
    else if (collectionSort === "inicio") items.sort((a,b)=>dateKey(a.inicio).localeCompare(dateKey(b.inicio)));
    else if (collectionSort === "fim") items.sort((a,b)=>(dateKey(a.fim)||"9999-12-31").localeCompare(dateKey(b.fim)||"9999-12-31"));
    else if (collectionSort === "prioridade") items.sort((a,b)=>Number(b.prioridade||0)-Number(a.prioridade||0) || contentTimestamp(b)-contentTimestamp(a));
    else if (collectionSort === "ordem") items.sort((a,b)=>Number(a.ordem||999)-Number(b.ordem||999) || String(a.nome||"").localeCompare(String(b.nome||""),"pt-BR"));
    else if (key === "publicidade") items=sortCampaignItems(items);
    else if (key === "banners") items=sortBannerItems(items);
    else if (key === "parceiros") items=sortPartnerItems(items);
    else if (key === "popups") items=sortPopupItems(items);
    else if (key === "anunciantes") items.sort((a,b)=>String(a.nome||"").localeCompare(String(b.nome||""),"pt-BR"));
    else if (key === "promocoes") items=sortPromotionItems(items);
    else if (key === "eventos") items=sortEventItems(items);
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
    const automatic = key === "promocoes" ? `<span class="badge status-promo-${promotionStatusValue(item)}">${escapeHTML(promotionStatusLabel(item))}</span>` : key === "eventos" ? `<span class="badge status-evento-${eventStatusValue(item)}">${escapeHTML(eventStatusLabel(item))}</span>` : key === "publicidade" ? `<span class="badge status-campaign-${campaignStatusValue(item)}">${escapeHTML(campaignStatusLabel(item))}</span>` : key === "banners" ? `<span class="badge status-banner-${bannerStatusValue(item)}">${escapeHTML(bannerStatusLabel(item))}</span>` : key === "popups" ? `<span class="badge status-popup-${popupStatusValue(item)}">${escapeHTML(popupStatusLabel(item))}</span>` : "";
    const metrics=key === "publicidade" ? `<span class="badge metric-real" title="Somente dados recebidos do site/Worker">${escapeHTML(campaignMetricsLabel(item))}</span>` : "";
    return `<div class="collection-status-stack"><button class="badge ${item.ativo === false ? "inactive" : "active"}" data-toggle-item="${item.id}" type="button">${item.ativo === false ? "Não publicado" : "Publicado"}</button>${automatic}${metrics}${item.destaque ? `<span class="badge featured">Destaque</span>` : ""}</div>`;
  }

  function collectionRow(schema,key,item) {
    const imageKey = ["imagemDesktop","imagemMobile","imagem","foto","logo"].find(name => item[name]);
    const description = item.descricao || item.resumo || item.bio || (key === "noticias" ? item.tags : "") || "Sem descrição";
    return `<tr><td><div class="row-main">${imageKey ? `<img class="row-thumb" src="${escapeHTML(item[imageKey])}" alt="">` : `<span class="row-thumb row-thumb-placeholder">${escapeHTML((item.titulo || item.nome || "CR").slice(0,2).toUpperCase())}</span>`}<div><strong>${escapeHTML(item.titulo || item.nome || "Sem título")}</strong><small>${escapeHTML(description)}</small></div></div></td><td>${escapeHTML(schema.summary ? schema.summary(item) : "—")}</td><td>${collectionStatus(key,item)}</td><td><div class="row-actions"><button class="button small ghost" data-view-item="${item.id}" type="button">Visualizar</button><button class="button small secondary" data-edit-item="${item.id}" type="button">Editar</button><button class="button small ghost" data-duplicate-item="${item.id}" type="button">Duplicar</button><button class="button small danger" data-delete-item="${item.id}" type="button">Excluir</button></div></td></tr>`;
  }

  function openItemModal(key,id=null) {
    const schema = schemas[key];
    const today=new Date().toISOString().slice(0,10);
    const base = key === "noticias" ? { ativo:true, status:"Rascunho", data:today }
      : key === "programacao" ? { ativo:true, dias:["Segunda","Terça","Quarta","Quinta","Sexta"], cor:"#e31c45" }
      : key === "podcasts" ? { ativo:true, destaque:false, data:today, temporada:1, episodio:0, duracaoMinutos:0 }
      : key === "videos" ? { ativo:true, destaque:false, data:today, tipo:"Automático", duracaoMinutos:0 }
      : key === "promocoes" ? { ativo:true, destaque:false, inicio:today, fim:"", situacao:"Automático pelas datas", participacao:"WhatsApp", mensagemWhatsApp:"" }
      : key === "eventos" ? { ativo:true, destaque:false, data:today, dataFim:"", situacao:"Automático pela data", tipo:"Evento da rádio" }
      : key === "publicidade" ? { ativo:true, inicio:today, fim:"", horaInicio:"", horaFim:"", situacao:"Automático pelo período", posicao:"Entre seções", formato:"Banner horizontal", prioridade:10, textoBotao:"Saiba mais", metricas:{impressoes:0,cliques:0,fonte:""} }
      : key === "banners" ? { ativo:true, inicio:today, fim:"", horaInicio:"", horaFim:"", situacao:"Automático pelo período", tipo:"Editorial", posicao:"Após o cabeçalho", prioridade:10, textoBotao:"Saiba mais" }
      : key === "parceiros" ? { ativo:true, categoria:"Patrocinador", ordem:10, destaque:false }
      : key === "popups" ? { ativo:true, inicio:today, fim:"", horaInicio:"", horaFim:"", situacao:"Automático pelo período", dispositivo:"Desktop e celular", frequencia:"Uma vez por sessão", atrasoSegundos:3, prioridade:10, textoBotao:"" }
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
    const hasValue=Object.prototype.hasOwnProperty.call(item,name);
    const value = hasValue ? item[name] : "";
    const inputId = `modal-field-${name}`;
    if (type === "textarea" || type === "richtext") return `<div class="field full"><label for="${inputId}">${escapeHTML(label)}</label><textarea id="${inputId}" class="${type === "richtext" ? "rich-editor" : ""}" name="${name}" ${required ? "required" : ""}>${escapeHTML(value)}</textarea>${type === "richtext" ? `<small class="field-help">Use parágrafos curtos. A formatação avançada será incorporada na etapa do editor editorial.</small>` : ""}</div>`;
    if (type === "select") return `<div class="field"><label for="${inputId}">${escapeHTML(label)}</label><select id="${inputId}" name="${name}" ${required ? "required" : ""}><option value="">Selecione</option>${extra.map(option => `<option value="${escapeHTML(option)}" ${String(option).toLowerCase() === String(value).toLowerCase() ? "selected" : ""}>${escapeHTML(option)}</option>`).join("")}</select></div>`;
    if (type === "locutor-select") { const options=state.content.locutores.filter(i=>i.ativo!==false); return `<div class="field"><label for="${inputId}">${escapeHTML(label)}</label><select id="${inputId}" name="${name}"><option value="">Sem vínculo</option>${options.map(loc=>`<option value="${escapeHTML(loc.nome)}" ${loc.nome === value ? "selected" : ""}>${escapeHTML(loc.nome)}${loc.cargo?` — ${escapeHTML(loc.cargo)}`:""}</option>`).join("")}</select></div>`; }
    if (type === "advertiser-select") { const options=(state.content.anunciantes||[]).filter(i=>i.ativo!==false || String(i.id)===String(value)); const selected=String(value||item.anuncianteId||""); const legacy=item.anunciante && !options.some(i=>String(i.id)===selected) ? `<option value="${escapeHTML(selected||`legacy:${item.anunciante}`)}" selected>${escapeHTML(item.anunciante)} (cadastro legado)</option>` : ""; return `<div class="field"><label for="${inputId}">${escapeHTML(label)}</label><select id="${inputId}" name="${name}" ${required?"required":""}><option value="">Selecione um anunciante</option>${legacy}${options.map(ad=>`<option value="${escapeHTML(ad.id)}" ${String(ad.id)===selected?"selected":""}>${escapeHTML(ad.nome)}${ad.categoria?` — ${escapeHTML(ad.categoria)}`:""}</option>`).join("")}</select><small class="field-help">Cadastre a empresa em Anunciantes antes de criar a campanha.</small></div>`; }
    if (type === "multicheck") { const selected=normalizeDays(value); return `<fieldset class="field full checkbox-fieldset"><legend>${escapeHTML(label)}${required?" *":""}</legend><div class="checkbox-grid">${extra.map(option=>`<label><input type="checkbox" name="${name}" value="${escapeHTML(option)}" ${selected.includes(option)?"checked":""}><span>${escapeHTML(option)}</span></label>`).join("")}</div></fieldset>`; }
    if (type === "checkbox") { const checked=value === true || (!hasValue && name === "ativo"); return `<div class="field"><span class="field-label">${escapeHTML(label)}</span><div class="toggle-row"><div><strong>${checked ? "Ativado" : "Desativado"}</strong><small>Altere o status deste registro.</small></div><label class="switch"><input aria-label="${escapeHTML(label)}" type="checkbox" name="${name}" ${checked ? "checked" : ""}><span></span></label></div></div>`; }
    if (type === "image") return mediaFieldHTML(name,label,extra || "news",value,Boolean(required));
    const numeric = type === "number" ? ` min="0" step="1" inputmode="numeric"` : "";
    const help = name === "audio" ? `<small class="field-help">Use uma URL pública HTTPS de MP3, AAC, M4A, OGG, WAV, Opus ou outro áudio reproduzível pelo navegador.</small>`
      : name === "url" && editing?.key === "videos" ? `<small class="field-help">Aceita YouTube, Vimeo, MP4/WebM/Ogg, transmissão HLS ou outro link público HTTPS.</small>`
      : name === "link" ? `<small class="field-help">Use um endereço público começando com https:// ou http://.</small>` : "";
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
    if (key === "promocoes") {
      item.situacao=item.situacao||"Automático pelas datas";
      item.participacao=item.participacao||"Somente informativa";
      if (item.fim && item.inicio && item.fim < item.inicio) return "A data de encerramento não pode ser anterior ao início.";
      if (item.participacao === "Link externo" && !absoluteHttpURL(item.linkParticipacao)) return "Informe um link público válido para participação.";
      if (item.linkParticipacao && !absoluteHttpURL(item.linkParticipacao)) return "O link de participação deve começar com https:// ou http://.";
      const duplicate=state.content.promocoes.find(other=>other.id!==id && String(other.titulo||"").trim().toLowerCase()===String(item.titulo||"").trim().toLowerCase() && String(other.inicio||"")===String(item.inicio||""));
      if (duplicate) return "Já existe uma promoção com o mesmo título e data de início.";
    }
    if (key === "eventos") {
      item.situacao=item.situacao||"Automático pela data";
      item.tipo=item.tipo||"Evento da rádio";
      if (item.dataFim && item.dataFim < item.data) return "A data final não pode ser anterior à data inicial.";
      if (item.dataFim === item.data && item.hora && item.horaFim && item.horaFim <= item.hora) return "O horário final deve ser posterior ao horário inicial quando o evento termina no mesmo dia.";
      for (const [field,label] of [["linkMapa","mapa"],["linkInformacoes","informações ou ingressos"]]) if (item[field] && !absoluteHttpURL(item[field])) return `O link de ${label} deve começar com https:// ou http://.`;
      const duplicate=state.content.eventos.find(other=>other.id!==id && String(other.titulo||"").trim().toLowerCase()===String(item.titulo||"").trim().toLowerCase() && String(other.data||"")===String(item.data||"") && String(other.hora||"")===String(item.hora||""));
      if (duplicate) return "Já existe um evento com o mesmo título, data e horário.";
    }
    if (key === "anunciantes") {
      if (item.site && !absoluteHttpURL(item.site)) return "O site do anunciante deve começar com https:// ou http://.";
      const normalizedDocument=String(item.documento||"").replace(/\D/g,""); item.documento=item.documento||"";
      const duplicate=(state.content.anunciantes||[]).find(other=>other.id!==id && (String(other.nome||"").trim().toLowerCase()===String(item.nome||"").trim().toLowerCase() || (normalizedDocument && String(other.documento||"").replace(/\D/g,"")===normalizedDocument)));
      if (duplicate) return "Já existe um anunciante com o mesmo nome ou documento.";
    }
    if (key === "publicidade" || key === "banners") {
      item.prioridade=Math.max(0,Math.min(999,Math.trunc(Number(item.prioridade||0))));
      item.situacao=item.situacao||"Automático pelo período";
      if (item.fim && item.inicio && item.fim < item.inicio) return "A data final não pode ser anterior à data inicial.";
      if (item.fim === item.inicio && item.horaInicio && item.horaFim && item.horaFim <= item.horaInicio) return "O horário final deve ser posterior ao horário inicial quando termina no mesmo dia.";
      if (item.link && !absoluteHttpURL(item.link)) return "O link de destino deve começar com https:// ou http://.";
      if (!item.imagemDesktop) return key === "publicidade" ? "Adicione a peça publicitária para desktop." : "Adicione a imagem do banner para desktop.";
      const duplicate=(state.content[key]||[]).find(other=>other.id!==id && String(other.titulo||"").trim().toLowerCase()===String(item.titulo||"").trim().toLowerCase() && String(other.posicao||"")===String(item.posicao||"") && String(other.inicio||"")===String(item.inicio||""));
      if (duplicate) return `Já existe ${key === "publicidade" ? "uma campanha" : "um banner"} com o mesmo título, posição e início.`;
      if (key === "publicidade") {
        const advertiser=(state.content.anunciantes||[]).find(ad=>String(ad.id)===String(item.anuncianteId));
        if (!advertiser && !String(item.anuncianteId||"").startsWith("legacy:")) return "Selecione um anunciante cadastrado e ativo.";
        if (advertiser?.ativo === false && item.ativo !== false && !["Pausada","Cancelada"].includes(item.situacao)) return "Ative o anunciante ou pause a campanha antes de publicá-la.";
        item.anunciante=advertiser?.nome || item.anunciante || String(item.anuncianteId||"").replace(/^legacy:/,"");
        item.metricas=item.metricas && typeof item.metricas === "object" ? item.metricas : {impressoes:0,cliques:0,fonte:""};
      }
    }
    if (key === "parceiros") {
      item.ordem=Math.max(0,Math.min(999,Math.trunc(Number(item.ordem||0))));
      for (const [field,label] of [["link","site"],["instagram","Instagram"],["facebook","Facebook"],["youtube","YouTube"]]) if (item[field] && !absoluteHttpURL(item[field])) return `O link de ${label} deve começar com https:// ou http://.`;
      const comparable=normalizeComparableURL(item.link);
      const duplicate=(state.content.parceiros||[]).find(other=>other.id!==id && (String(other.nome||"").trim().toLowerCase()===String(item.nome||"").trim().toLowerCase() || (comparable && normalizeComparableURL(other.link)===comparable)));
      if (duplicate) return "Já existe um parceiro com o mesmo nome ou site principal.";
      if (!item.logo) return "Adicione a logomarca do parceiro.";
    }
    if (key === "popups") {
      item.prioridade=Math.max(0,Math.min(999,Math.trunc(Number(item.prioridade||0))));
      item.atrasoSegundos=Math.max(0,Math.min(120,Math.trunc(Number(item.atrasoSegundos||0))));
      item.situacao=item.situacao||"Automático pelo período";
      item.dispositivo=item.dispositivo||"Desktop e celular";
      item.frequencia=item.frequencia||"Uma vez por sessão";
      item.textoBotao=item.textoBotao||"";
      if (item.fim && item.inicio && item.fim < item.inicio) return "A data final não pode ser anterior à data inicial.";
      if (item.fim === item.inicio && item.horaInicio && item.horaFim && item.horaFim <= item.horaInicio) return "O horário final deve ser posterior ao horário inicial quando termina no mesmo dia.";
      if (item.link && !absoluteHttpURL(item.link)) return "O link do botão deve começar com https:// ou http://.";
      if (item.textoBotao && !item.link) return "Informe o link do botão ou deixe o texto do botão vazio.";
      const duplicate=(state.content.popups||[]).find(other=>other.id!==id && String(other.titulo||"").trim().toLowerCase()===String(item.titulo||"").trim().toLowerCase() && String(other.inicio||"")===String(item.inicio||"") && String(other.dispositivo||"")===String(item.dispositivo||""));
      if (duplicate) return "Já existe um popup com o mesmo título, início e dispositivo.";
    }
    if (key === "locutores") item.ordem=Number(item.ordem||0);
    return "";
  }

  function saveModal(event) {
    event.preventDefault();
    if (event.submitter?.value === "cancel") { $("#editor-modal").close(); return; }
    if (!editing) return;
    const { key,id } = editing, schema = schemas[key], editorForm=$("#editor-form");
    const imageValidation=validateImageControls(editorForm);
    if(!imageValidation.ok)return notify(imageValidation.message,"error");
    const form = new FormData(editorForm);
    if (!editorForm.checkValidity()) { editorForm.reportValidity(); return; }
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
    if (["podcasts","videos","promocoes","eventos","publicidade","banners","parceiros","popups"].includes(key)) { clone.ativo=false; clone.destaque=false; }
    if (key === "publicidade") { clone.situacao="Pausada"; clone.metricas={impressoes:0,cliques:0,fonte:"",atualizadoEm:""}; }
    if (key === "banners") clone.situacao="Pausado";
    if (key === "popups") clone.situacao="Pausado";
    if (key === "promocoes") clone.situacao="Automático pelas datas";
    if (key === "eventos") clone.situacao="Automático pela data";
    state.content[key].unshift(clone); persist(false); renderPage(); notify("Cópia criada para revisão.","success");
  }

  function deleteItem(key,id) {
    const item = state.content[key].find(entry => entry.id === id);
    if (!item) return;
    if (key === "anunciantes") {
      const linked=(state.content.publicidade||[]).filter(campaign=>String(campaign.anuncianteId||"")===String(id));
      if (linked.length) return notify(`Este anunciante está vinculado a ${linked.length} campanha${linked.length===1?"":"s"}. Remova ou altere o vínculo antes de excluir.`,"error");
    }
    if (!confirm(`Excluir “${item.titulo || item.nome || "este registro"}”?`)) return;
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
    bindImageInputs(root); $("#simple-form").addEventListener("submit",event=>{const validation=validateImageControls(event.currentTarget);if(!validation.ok){event.preventDefault();return notify(validation.message,"error");}onSubmit(event);});
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
      </div><section class="card" style="margin-top:18px"><header class="card-header"><div><h3>Sobre esta instalação</h3><p>Informações técnicas.</p></div></header><div class="card-body"><div class="code-box">Modo: produção integrada\nVersão: ${CONFIG.VERSION || "3.0.0-stage1"}\nPersistência: Cloudflare D1\nAPI: ${CONFIG.WORKER_URL || "não configurada"}\nÚltima alteração: ${formatDateTime(state.updatedAt)}</div></div></section>`;
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

  function themeOption(key,themeId=state.selectedTheme) { return editorThemeOptions(themeId)?.[key]; }
  function blockOption(id,key,fallback=null) { const value=editorBlockOptions(id)?.[key];return value===undefined||value===null||value===""?fallback:value; }
  function blockLimit(id,fallback) { return Math.max(1,Math.min(12,Number(blockOption(id,"limit",fallback)||fallback))); }
  function blockCustomColorStyle(opts) {
    if(opts.useThemeColors!==false)return "";
    return `--editor-block-bg:${normalizeHexColor(opts.backgroundColor,"#ffffff")};--editor-block-title:${normalizeHexColor(opts.titleColor,"#172033")};--editor-block-text:${normalizeHexColor(opts.textColor,"#52657a")};--editor-block-eyebrow:${normalizeHexColor(opts.eyebrowColor,"#1457d9")};--editor-block-button:${normalizeHexColor(opts.buttonColor,"#1457d9")};--editor-block-button-text:${normalizeHexColor(opts.buttonTextColor,"#ffffff")};`;
  }
  function applyBlockPresentation(id,html) {
    if(!html)return "";
    const opts=editorBlockOptions(id), classes=[`editor-block-${optionSlug(opts.layout)}`,`editor-width-${optionSlug(opts.width)}`,`editor-bg-${optionSlug(opts.background)}`,`editor-align-${optionSlug(opts.alignment)}`],colorStyle=blockCustomColorStyle(opts);
    if(opts.showDescription===false)classes.push("editor-hide-description");if(opts.showAction===false)classes.push("editor-hide-action");if(colorStyle)classes.push("editor-custom-colors");
    html=html.replace(/<(section|div)\b([^>]*)data-site-section=(["'])[^"']+\3([^>]*)>/,full=>{
      let updated=full;
      if(/class=(["'])/.test(updated))updated=updated.replace(/class=(["'])([^"']*)\1/,(_,quote,current)=>`class=${quote}${current} ${classes.join(" ")}${quote}`);
      else updated=updated.replace(/^<(section|div)/,match=>`${match} class="${classes.join(" ")}"`);
      if(colorStyle){
        if(/style=(["'])/.test(updated))updated=updated.replace(/style=(["'])([^"']*)\1/,(_,quote,current)=>`style=${quote}${current}${current.trim().endsWith(";")?"":";"}${colorStyle}${quote}`);
        else updated=updated.replace(/>$/,` style="${colorStyle}">`);
      }
      return updated;
    });
    if(!/data-site-section=/.test(html))return html;
    if(opts.title){html=html.replace(/<h([12])>[^<]*<\/h\1>/,(_,level)=>`<h${level}>${escapeHTML(opts.title)}</h${level}>`);}
    if(opts.eyebrow){html=html.replace(/(<div class="site-section-head"><div><span>)[^<]*(<\/span>)/,`$1${escapeHTML(opts.eyebrow)}$2`).replace(/(<span class="site-kicker">)[^<]*(<\/span>)/,`$1${escapeHTML(opts.eyebrow)}$2`);}
    return html;
  }
  function previewThemeClasses() {
    const o=editorThemeOptions(), out=[`editor-density-${optionSlug(o.density||"Confortável")}`,`editor-header-${optionSlug(o.headerStyle||"Padrão")}`];
    Object.entries(o).forEach(([key,value])=>{if(typeof value==="boolean"&&value)out.push(`editor-option-${optionSlug(key)}`);else if(typeof value==="string"&&!["density","headerStyle"].includes(key))out.push(`editor-${optionSlug(key)}-${optionSlug(value)}`);});
    return out.join(" ");
  }

  function themeLatestNews(limit=3) {
    return [...state.content.noticias].filter(isNewsVisible).sort((a,b)=>String(`${b.data||""}${b.hora||""}`).localeCompare(String(`${a.data||""}${a.hora||""}`))).slice(0,limit);
  }

  function siteNewsTicker() {
    if(themeOption("ticker")===false)return "";
    const items=themeLatestNews(4);
    if (!items.length) return "";
    return `<section class="theme-news-ticker" aria-label="Últimas notícias"><strong>AGORA</strong><div>${items.map(item=>`<button type="button" data-site-open="noticias" data-site-id="${escapeHTML(item.id)}">${escapeHTML(item.titulo)}</button>`).join("")}</div></section>`;
  }

  function siteMusicQuickActions() {
    if(themeOption("quickActions")===false)return "";
    return `<section class="theme-music-actions" aria-label="Participação do ouvinte"><button type="button" data-site-play><span>▶</span><strong>Ouvir agora</strong><small>Player ao vivo</small></button><button type="button" data-site-action="whatsapp"><span>✦</span><strong>Peça sua música</strong><small>Participe pelo WhatsApp</small></button>${previewSectionAvailable("promocoes")?`<button type="button" data-site-scroll="promocoes"><span>★</span><strong>Promoções</strong><small>Confira e participe</small></button>`:""}${previewSectionAvailable("programacao")?`<button type="button" data-site-scroll="programacao"><span>▦</span><strong>Programação</strong><small>Veja o que vem a seguir</small></button>`:""}</section>`;
  }

  function siteGospelWelcome() {
    if(themeOption("welcome")===false)return "";
    const cards=[
      ["programacao","Programação de hoje","Acompanhe mensagens, louvores e programas"],
      ["videos","Louvores e vídeos","Conteúdo para assistir e compartilhar"],
      ["eventos","Agenda e comunidade","Cultos, encontros e ações especiais"]
    ].filter(([id])=>previewSectionAvailable(id));
    return `<section class="theme-gospel-welcome"><div><span>Uma rádio que acolhe</span><h2>Fé, música e companhia todos os dias</h2><p>Conteúdo organizado para aproximar a emissora da comunidade.</p></div><div>${cards.map(([id,title,copy])=>`<button type="button" data-site-scroll="${id}"><strong>${title}</strong><small>${copy}</small><em>Explorar →</em></button>`).join("")}</div></section>`;
  }

  function siteRegionalLiveHub(r) {
    if(themeOption("liveHub")===false)return "";
    const firstVideo=sortMediaItems("videos",state.content.videos.filter(item=>item.ativo!==false))[0];
    return `<section class="theme-regional-livehub" aria-label="Central ao vivo"><div class="theme-regional-signal"><span>AO VIVO</span><strong>${escapeHTML(r.musicaAtual||"Transmissão da emissora")}</strong><small>${escapeHTML(r.locutorAtual||`${r.cidade} • ${r.estado}`)}</small></div><div class="theme-regional-hub-actions"><button type="button" data-site-play>▶ Ouvir rádio</button>${firstVideo?`<button type="button" data-site-open="videos" data-site-id="${escapeHTML(firstVideo.id)}">▣ Assistir destaque</button>`:""}${previewSectionAvailable("noticias")?`<button type="button" data-site-scroll="noticias">Últimas notícias</button>`:""}</div></section>`;
  }

  function renderSitePreview(container) {
    if (!container) return;
    const r = state.radio;
    const customStyle = state.selectedTheme === "custom" ? `--site-primary:${r.cores.primaria};--site-secondary:${r.cores.secundaria};--site-accent:${r.cores.destaque};--site-bg:${r.cores.fundo};` : "";
    const enabled = new Set(activeModules().map(m=>m.id));
    const ordered = activeModules().map(m=>m.id);
    const sections = {
      hero: () => siteHero(r), player: () => sitePlayer(r), programacao: () => siteProgramming(), noticias: () => siteNews(), promocoes: () => sitePromotions(), podcasts: () => sitePodcasts(), videos: () => siteVideos(), equipe: () => siteTeam(), galeria: () => siteGallery(), eventos: () => siteEvents(), publicidade: () => "", parceiros: () => sitePartners(), aplicativo: () => siteApp(), contato: () => siteContact()
    };
    const section=(id)=>enabled.has(id)&&sections[id]?applyBlockPresentation(id,sections[id]()):"";
    const rest=(skip)=>ordered.filter(id=>!skip.has(id)&&enabled.has(id)&&sections[id]).map(id=>section(id)).join("");
    let body="";
    if (state.selectedTheme === "spotify") body=`${siteHeader(r)}${siteMusicQuickActions()}<div class="theme-stage theme-stage-music">${section("player")}${section("hero")}</div>${section("promocoes")}${section("programacao")}${section("podcasts")}${rest(new Set(["hero","player","promocoes","programacao","podcasts"]))}`;
    else if (state.selectedTheme === "news") body=`${siteHeader(r)}${siteNewsTicker()}<div class="theme-stage theme-stage-news">${section("hero")}${section("noticias")}</div>${section("player")}${section("programacao")}${section("podcasts")}${rest(new Set(["hero","noticias","player","programacao","podcasts"]))}`;
    else if (state.selectedTheme === "gospel") body=`${siteHeader(r)}${section("hero")}${siteGospelWelcome()}<div class="theme-stage theme-stage-community">${section("player")}${section("programacao")}</div>${section("videos")}${section("eventos")}${rest(new Set(["hero","player","programacao","videos","eventos"]))}`;
    else if (state.selectedTheme === "young") body=`${siteHeader(r)}<div class="theme-stage theme-stage-young">${section("player")}${section("hero")}</div><div class="theme-young-featured">${section("promocoes")}${section("videos")}</div>${rest(new Set(["hero","player","promocoes","videos"]))}`;
    else if (state.selectedTheme === "custom") body=`${siteHeader(r)}<div class="theme-stage theme-stage-clean">${section("hero")}${section("player")}</div>${rest(new Set(["hero","player"]))}`;
    else body=`${siteHeader(r)}${siteRegionalLiveHub(r)}<div class="theme-stage theme-stage-regional">${section("hero")}${section("player")}</div>${section("noticias")}${section("videos")}${section("programacao")}${rest(new Set(["hero","player","noticias","videos","programacao"]))}`;

    const topSlot=siteCommercialSlot("Após o cabeçalho");
    const afterPlayerSlot=siteCommercialSlot("Após o player");
    const beforeNewsSlot=siteCommercialSlot("Antes de notícias");
    const betweenSlot=siteCommercialSlot("Entre seções");
    const footerSlot=siteCommercialSlot("Antes do rodapé");
    if (topSlot) body=body.replace("</header>",`</header>${topSlot}`);
    if (afterPlayerSlot) body=insertAfterSiteSection(body,"player",afterPlayerSlot);
    if (beforeNewsSlot) body=insertBeforeSiteSection(body,"noticias",beforeNewsSlot);
    if (betweenSlot) {
      const anchor=body.includes('data-site-section="programacao"') ? "programacao" : (body.includes('data-site-section="noticias"') ? "noticias" : "player");
      body=insertAfterSiteSection(body,anchor,betweenSlot);
    }
    container.innerHTML = `<div class="site-preview theme-${state.selectedTheme} ${previewThemeClasses()}" data-site-section="inicio" style="${customStyle}${r.hero ? `--hero-image:url('${escapeHTML(r.hero)}')` : ""}">${body}${footerSlot}${siteFooter(r)}</div>`;
    bindSitePreviewInteractions(container);
    schedulePreviewPopup(container);
    syncAudioButtons();
  }

  function insertBeforeSiteSection(html,sectionId,fragment) {
    if (!fragment) return html;
    const pattern=new RegExp(`(<section\\b[^>]*data-site-section=["']${sectionId}["'][^>]*>)`);
    return pattern.test(html) ? html.replace(pattern,`${fragment}$1`) : `${html}${fragment}`;
  }

  function insertAfterSiteSection(html,sectionId,fragment) {
    if (!fragment) return html;
    const pattern=new RegExp(`(<section\\b[^>]*data-site-section=["']${sectionId}["'][^>]*>[\\s\\S]*?<\\/section>)`);
    return pattern.test(html) ? html.replace(pattern,`$1${fragment}`) : `${html}${fragment}`;
  }

  function partnerSocialLinks(item) {
    return [["link","Site"],["instagram","Instagram"],["facebook","Facebook"],["youtube","YouTube"]].map(([field,label])=>[safeExternalURL(item?.[field]),label]).filter(([url])=>url);
  }
  function partnerWhatsappURL(item) {
    const digits=String(item?.whatsapp||"").replace(/\D/g,"");
    return digits.length>=10?`https://wa.me/${digits}`:"";
  }
  function previewDeviceKind(container) {
    return container?.classList.contains("mobile") ? "mobile" : "desktop";
  }
  function popupMatchesDevice(item,device) {
    const target=String(item?.dispositivo||"Desktop e celular");
    return target === "Desktop e celular" || (target === "Somente celular" && device === "mobile") || (target === "Somente desktop" && device !== "mobile");
  }
  function eligiblePreviewPopups(container) {
    const device=previewDeviceKind(container);
    return sortPopupItems((state.content.popups||[]).filter(item=>item.ativo!==false && popupStatusValue(item)==="ativo" && popupMatchesDevice(item,device)));
  }
  function clearPreviewPopupTimer() {
    if (previewPopupTimer) { clearTimeout(previewPopupTimer); previewPopupTimer=null; }
  }
  function closePreviewPopup(container,{restoreFocus=true}={}) {
    clearPreviewPopupTimer();
    const layer=$(".site-popup-layer",container); if(layer)layer.remove();
    if (restoreFocus && previewPopupReturnFocus && document.contains(previewPopupReturnFocus)) previewPopupReturnFocus.focus();
    previewPopupReturnFocus=null;
  }
  function showPreviewPopup(container,item) {
    if (!container || !item || !$(".site-preview",container)) return;
    closePreviewPopup(container,{restoreFocus:false});
    const link=safeExternalURL(item.link);
    const safeId=String(item.id||"preview").replace(/[^a-zA-Z0-9_-]/g,"-");
    const titleId=`site-popup-title-${safeId}`, descriptionId=`site-popup-description-${safeId}`;
    const layer=document.createElement("div");
    layer.className="site-popup-layer";
    layer.dataset.popupId=String(item.id||"");
    layer.setAttribute("role","presentation");
    layer.innerHTML=`<section class="site-popup-card" role="dialog" aria-modal="true" aria-labelledby="${titleId}" aria-describedby="${descriptionId}"><button class="site-popup-close" type="button" aria-label="Fechar popup">×</button>${item.imagem?`<img class="site-popup-image" src="${escapeHTML(item.imagem)}" alt="">`:""}<div class="site-popup-copy"><span>Mensagem da rádio</span><h2 id="${titleId}">${escapeHTML(item.titulo||"Aviso")}</h2><p id="${descriptionId}">${escapeHTML(item.mensagem||"")}</p><small>Prévia: ${escapeHTML(item.frequencia||"Frequência não definida")} • não registra exibição real</small>${link&&item.textoBotao?`<a class="site-popup-action" href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.textoBotao)}</a>`:""}</div></section>`;
    $(".site-preview",container).appendChild(layer);
    previewPopupReturnFocus=document.activeElement;
    const close=$(".site-popup-close",layer); close?.focus();
    close?.addEventListener("click",()=>closePreviewPopup(container));
    layer.addEventListener("click",event=>{if(event.target===layer)closePreviewPopup(container);});
    layer.addEventListener("keydown",event=>{
      if(event.key!=="Tab")return;
      const focusable=$$('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',layer).filter(element=>element.offsetParent!==null);
      if(!focusable.length){event.preventDefault();return;}
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    });
  }

  function schedulePreviewPopup(container) {
    clearPreviewPopupTimer();
    closePreviewPopup(container,{restoreFocus:false});
    const item=eligiblePreviewPopups(container)[0]; if(!item)return;
    const delay=Math.max(0,Math.min(120,Number(item.atrasoSegundos||0)))*1000;
    if(!delay)return showPreviewPopup(container,item);
    previewPopupTimer=setTimeout(()=>showPreviewPopup(container,item),delay);
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
    const links=[["inicio","Início"],["noticias","Notícias"],["programacao","Programação"],["promocoes","Promoções"],["equipe","Equipe"],["contato","Contato"]].filter(([id])=>id === "inicio" || previewSectionAvailable(id));
    return `<div class="site-topline"><span>${escapeHTML(r.cidade)} • ${escapeHTML(r.estado)} — Informação e música ao vivo</span>${socials.length?`<div class="site-social">${socials.map(item=>`<a href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir ${escapeHTML(item.label)}" title="${escapeHTML(item.label)}">${escapeHTML(item.icon)}</a>`).join("")}</div>`:""}</div><header class="site-header"><button class="site-logo site-logo-button" data-site-scroll="inicio" type="button" aria-label="Voltar ao início">${r.logo?`<img src="${escapeHTML(r.logo)}" alt="Logomarca">`:`<span class="site-logo-placeholder">CRB</span>`}<span><strong>${escapeHTML(r.nome)}</strong><small>${escapeHTML(r.slogan)}</small></span></button><nav class="site-nav" aria-label="Navegação da prévia">${links.map(([id,label])=>`<a href="#" data-site-scroll="${id}">${label}</a>`).join("")}</nav><div class="site-header-actions"><button class="site-wa-button" data-site-action="whatsapp" type="button">WhatsApp</button><button class="site-live-button" data-site-play type="button"><span class="site-live-dot"></span>OUVIR AO VIVO</button></div></header>`;
  }

  function siteHero(r) { return `<section class="site-hero" data-site-section="hero"><div class="site-hero-content"><span class="site-kicker">● Rádio e notícias de ${escapeHTML(r.cidade)}</span><h1>${escapeHTML(r.slogan || r.nome)}</h1><p>${escapeHTML(r.descricao)}</p><div class="site-hero-actions"><button class="primary" data-site-play type="button">▶ Ouvir agora</button>${previewSectionAvailable("programacao")?`<button class="secondary" data-site-scroll="programacao" type="button">Conheça a programação</button>`:""}</div></div></section>`; }
  function sitePlayer(r) { return `<div class="site-player-wrap" data-site-section="player"><section class="site-player"><div class="site-cover">${r.playerImage?`<img src="${escapeHTML(r.playerImage)}" alt="Capa do player">`:`♫`}</div><div class="site-track"><span>Ao vivo agora</span><strong>${escapeHTML(r.musicaAtual||"Transmissão ao vivo")}</strong><small>${escapeHTML(r.locutorAtual||"Programação da rádio")}</small></div><div class="site-player-controls"><button class="site-app" data-site-action="app" type="button">Baixar app</button><button class="site-play" data-site-play type="button" aria-label="Reproduzir ou pausar transmissão">▶</button></div></section></div>`; }
  function currentWeekdayLabel() {
    const timezone=state?.integrations?.configuracoes?.timezone || "America/Sao_Paulo";
    try {
      const raw=new Intl.DateTimeFormat("pt-BR",{timeZone:timezone,weekday:"long"}).format(new Date()).toLowerCase();
      return ({"domingo":"Domingo","segunda-feira":"Segunda","terça-feira":"Terça","quarta-feira":"Quarta","quinta-feira":"Quinta","sexta-feira":"Sexta","sábado":"Sábado"})[raw] || "";
    } catch { return weekOrder[new Date().getDay()] || ""; }
  }
  function currentTimeKey() {
    const timezone=state?.integrations?.configuracoes?.timezone || "America/Sao_Paulo";
    try { return new Intl.DateTimeFormat("pt-BR",{timeZone:timezone,hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date()).replace("24:","00:"); }
    catch { return new Date().toTimeString().slice(0,5); }
  }
  function isProgramLive(item) {
    const day=currentWeekdayLabel(), time=currentTimeKey();
    return item?.ativo !== false && normalizeDays(item.dias||item.dia).includes(day) && Boolean(item.inicio && item.fim && item.inicio <= time && time < item.fim);
  }
  function sortProgrammingItems(items) {
    const today=currentWeekdayLabel(), now=currentTimeKey();
    return [...items].sort((a,b)=>Number(isProgramLive(b))-Number(isProgramLive(a)) || Number(normalizeDays(b.dias||b.dia).includes(today) && b.inicio>=now)-Number(normalizeDays(a.dias||a.dia).includes(today) && a.inicio>=now) || Math.min(...normalizeDays(a.dias||a.dia).map(day=>weekOrder.indexOf(day)).filter(index=>index>=0),99)-Math.min(...normalizeDays(b.dias||b.dia).map(day=>weekOrder.indexOf(day)).filter(index=>index>=0),99) || compareTime(a.inicio,b.inicio) || String(a.titulo||"").localeCompare(String(b.titulo||""),"pt-BR"));
  }
  function siteProgramming() { const items=sortProgrammingItems(state.content.programacao.filter(i=>i.ativo!==false)).slice(0,blockLimit("programacao",4)), hasLive=items.some(isProgramLive); return `<section class="site-section" data-site-section="programacao"><div class="site-section-head"><div><span>${hasLive?"No ar e próximos":"Grade da emissora"}</span><h2>Programação</h2><p>Conteúdo organizado por dia e horário.</p></div><button class="site-section-link" data-site-list="programacao" type="button">Ver grade completa →</button></div><div class="site-program-grid">${items.map(i=>{const live=isProgramLive(i);return `<article class="site-program-card ${live?"live":""}" data-site-open="programacao" data-site-id="${escapeHTML(i.id)}" role="button" tabindex="0" aria-label="Abrir programa ${escapeHTML(i.titulo)}" style="${i.cor?`--program-color:${escapeHTML(i.cor)}`:""}"><div class="site-program-time">${live?"AGORA":escapeHTML(i.inicio||"")}</div><strong>${escapeHTML(i.titulo)}</strong><small>${escapeHTML(i.locutor||formatDays(i.dias||i.dia))}</small></article>`;}).join("")}</div></section>`; }
  function siteNews() { const items=[...state.content.noticias].filter(isNewsVisible).sort((a,b)=>Number(Boolean(b.destaque))-Number(Boolean(a.destaque)) || String(`${b.data||""}${b.hora||""}`).localeCompare(String(`${a.data||""}${a.hora||""}`))).slice(0,blockLimit("noticias",4)); return `<section class="site-section alt" data-site-section="noticias"><div class="site-section-head"><div><span>Informação</span><h2>Últimas notícias</h2><p>Cidade, esporte, agronegócio e os assuntos do dia.</p></div><button class="site-section-link" data-site-list="noticias" type="button">Todas as notícias →</button></div><div class="site-news-grid">${items.map((i,index)=>`<article class="site-news-card ${index===0?"featured":""}" data-site-open="noticias" data-site-id="${escapeHTML(i.id)}" role="button" tabindex="0" aria-label="Abrir notícia ${escapeHTML(i.titulo)}"><div class="site-news-image">${i.imagem?`<img src="${escapeHTML(i.imagem)}" alt="Capa da notícia ${escapeHTML(i.titulo)}">`:""}</div><div class="site-news-body"><span>${escapeHTML(i.categoria||"Notícias")}</span><h3>${escapeHTML(i.titulo)}</h3><p>${escapeHTML(i.resumo||"")}</p><small class="site-news-meta">${escapeHTML(i.autor||"")} ${i.data?`• ${formatDate(i.data)}`:""}</small></div></article>`).join("")}</div></section>`; }
  function sitePromotions() { const items=sortPromotionItems(state.content.promocoes.filter(i=>i.ativo!==false&&["ativa","agendada"].includes(promotionStatusValue(i)))).slice(0,blockLimit("promocoes",3)); if(!items.length)return ""; return `<section class="site-section" data-site-section="promocoes"><div class="site-section-head"><div><span>Participe</span><h2>Promoções</h2><p>Campanhas ativas e próximas oportunidades para os ouvintes.</p></div><button class="site-section-link" data-site-list="promocoes" type="button">Ver todas →</button></div><div class="site-promo-grid">${items.map(i=>`<article class="site-promo-card ${i.destaque?"media-featured":""}" data-site-open="promocoes" data-site-id="${escapeHTML(i.id)}" role="button" tabindex="0" aria-label="Abrir promoção ${escapeHTML(i.titulo)}" style="${i.imagem?`--card-image:url('${i.imagem}')`:""}"><span class="site-content-status status-promo-${promotionStatusValue(i)}">${escapeHTML(promotionStatusLabel(i))}</span><strong>${escapeHTML(i.titulo)}</strong><small>${escapeHTML(i.premio||i.descricao||"")}</small><em>${i.fim?`Até ${escapeHTML(formatDate(i.fim))}`:"Sem data de encerramento"}</em></article>`).join("")}</div></section>`; }
  function sitePodcasts() { const items=sortMediaItems("podcasts",state.content.podcasts.filter(i=>i.ativo!==false)).slice(0,blockLimit("podcasts",4)); if(!items.length)return ""; return `<section class="site-section dark" data-site-section="podcasts"><div class="site-section-head"><div><span>Ouça quando quiser</span><h2>Podcasts</h2><p>Programas, entrevistas e episódios sob demanda.</p></div><button class="site-section-link" data-site-list="podcasts" type="button">Todos os episódios →</button></div><div class="site-podcast-grid">${items.map(i=>`<article class="site-podcast-card ${i.destaque?"media-featured":""}" data-site-open="podcasts" data-site-id="${escapeHTML(i.id)}" role="button" tabindex="0" aria-label="Ouvir podcast ${escapeHTML(i.titulo)}"><div class="site-podcast-cover">${i.imagem?`<img src="${escapeHTML(i.imagem)}" alt="Capa de ${escapeHTML(i.titulo)}">`:`<span aria-hidden="true">◉</span>`}<i class="site-media-play" aria-hidden="true">▶</i></div><div class="site-podcast-copy"><div class="site-media-labels">${i.destaque?`<span>Destaque</span>`:""}<span>${escapeHTML(episodeLabel(i))}</span></div><strong>${escapeHTML(i.titulo)}</strong><small>${escapeHTML(i.programa||"Podcast")}</small><em>${[i.data?formatDate(i.data):"",i.duracaoMinutos?formatDuration(i.duracaoMinutos):""].filter(Boolean).map(escapeHTML).join(" • ")}</em></div></article>`).join("")}</div></section>`; }
  function siteVideos() { const items=sortMediaItems("videos",state.content.videos.filter(i=>i.ativo!==false)).slice(0,blockLimit("videos",4)); if(!items.length)return ""; return `<section class="site-section alt" data-site-section="videos"><div class="site-section-head"><div><span>Assista</span><h2>Vídeos</h2><p>Entrevistas, música, transmissões e bastidores.</p></div><button class="site-section-link" data-site-list="videos" type="button">Todos os vídeos →</button></div><div class="site-news-grid">${items.map((i,index)=>{const thumb=videoThumbnailURL(i);return `<article class="site-news-card ${(i.destaque||index===0)?"featured":""}" data-site-open="videos" data-site-id="${escapeHTML(i.id)}" role="button" tabindex="0" aria-label="Assistir vídeo ${escapeHTML(i.titulo)}"><div class="site-news-image site-video-thumb">${thumb?`<img src="${escapeHTML(thumb)}" alt="Miniatura de ${escapeHTML(i.titulo)}">`:""}<span class="site-video-play" aria-hidden="true">▶</span>${i.destaque?`<b class="site-media-corner">Destaque</b>`:""}</div><div class="site-news-body"><span>${escapeHTML(i.categoria||"Vídeo")} • ${escapeHTML(videoTypeLabel(i))}</span><h3>${escapeHTML(i.titulo)}</h3><p>${escapeHTML(i.descricao||"")}</p><small class="site-news-meta">${[i.data?formatDate(i.data):"",i.duracaoMinutos?formatDuration(i.duracaoMinutos):""].filter(Boolean).map(escapeHTML).join(" • ")}</small></div></article>`;}).join("")}</div></section>`; }
  function siteTeam() { const items=[...state.content.locutores].sort((a,b)=>Number(a.ordem||999)-Number(b.ordem||999)).concat(state.content.equipe).filter(i=>i.ativo!==false).slice(0,blockLimit("equipe",5)); if(!items.length)return ""; return `<section class="site-section" data-site-section="equipe"><div class="site-section-head"><div><span>Quem faz</span><h2>Nossa equipe</h2><p>As vozes e profissionais da emissora.</p></div><button class="site-section-link" data-site-list="equipe" type="button">Conheça a equipe →</button></div><div class="site-team-grid">${items.map(i=>`<article class="site-team-card" data-site-open="${state.content.locutores.some(loc=>loc.id===i.id)?"locutores":"equipe"}" data-site-id="${escapeHTML(i.id)}" role="button" tabindex="0" aria-label="Abrir perfil de ${escapeHTML(i.nome)}"><div class="site-team-photo">${i.foto?`<img src="${escapeHTML(i.foto)}" alt="Foto de ${escapeHTML(i.nome)}">`:""}</div><strong>${escapeHTML(i.nome)}</strong><small>${escapeHTML(i.cargo||"")}</small></article>`).join("")}</div></section>`; }
  function siteGallery() { const items=state.content.galeria.filter(i=>i.ativo!==false).slice(0,blockLimit("galeria",5)); if(!items.length)return ""; return `<section class="site-section alt" data-site-section="galeria"><div class="site-section-head"><div><span>Imagens</span><h2>Galeria</h2><p>Eventos, bastidores e momentos da rádio.</p></div><button class="site-section-link" data-site-list="galeria" type="button">Ver galeria →</button></div><div class="site-gallery-grid">${items.map(i=>`<div data-site-open="galeria" data-site-id="${escapeHTML(i.id)}" role="button" tabindex="0" aria-label="Ampliar foto ${escapeHTML(i.titulo)}">${i.imagem?`<img src="${escapeHTML(i.imagem)}" alt="${escapeHTML(i.titulo)}">`:`<span class="site-gallery-placeholder">${escapeHTML(i.titulo||"Foto")}</span>`}</div>`).join("")}</div></section>`; }
  function siteEvents() { const items=sortEventItems(state.content.eventos.filter(i=>i.ativo!==false&&["hoje","futuro","adiado"].includes(eventStatusValue(i)))).slice(0,blockLimit("eventos",3)); if(!items.length)return ""; return `<section class="site-section" data-site-section="eventos"><div class="site-section-head"><div><span>Agenda</span><h2>Próximos eventos</h2><p>Shows, ações, transmissões e encontros da rádio.</p></div><button class="site-section-link" data-site-list="eventos" type="button">Agenda completa →</button></div><div class="site-promo-grid">${items.map(i=>`<article class="site-promo-card ${i.destaque?"media-featured":""}" data-site-open="eventos" data-site-id="${escapeHTML(i.id)}" role="button" tabindex="0" aria-label="Abrir evento ${escapeHTML(i.titulo)}" style="${i.imagem?`--card-image:url('${i.imagem}')`:""}"><span class="site-content-status status-evento-${eventStatusValue(i)}">${escapeHTML(eventStatusLabel(i))}</span><strong>${escapeHTML(i.titulo)}</strong><small>${escapeHTML(i.local||i.cidade||i.tipo||"")}</small><em>${escapeHTML(formatEventPeriod(i))}</em></article>`).join("")}</div></section>`; }
  function responsiveCommercialImage(item,alt) {
    const desktop=item?.imagemDesktop || item?.imagem || "", mobile=item?.imagemMobile || desktop;
    if (!desktop) return `<span class="site-commercial-placeholder">ESPAÇO PUBLICITÁRIO</span>`;
    return `<picture>${mobile?`<source media="(max-width:640px)" srcset="${escapeHTML(mobile)}">`:""}<img src="${escapeHTML(desktop)}" alt="${escapeHTML(alt)}"></picture>`;
  }
  function siteAdvertising() {
    return siteCommercialSlot("Entre seções");
  }

  function normalizedBannerPosition(value) {
    return ({"Banner principal":"Após o cabeçalho","Antes de notícias":"Antes de notícias","Antes do rodapé":"Antes do rodapé","Página interna":"Página interna"})[value] || value || "Após o cabeçalho";
  }

  function normalizedCampaignPosition(value) {
    return ({"Topo do site":"Após o cabeçalho","Após o player":"Após o player","Player":"Após o player","Entre programação e notícias":"Antes de notícias","Entre seções":"Entre seções","Antes do rodapé":"Antes do rodapé"})[value] || value || "Entre seções";
  }

  function commercialSlotItems(position) {
    if (!isModuleEnabled("publicidade")) return [];
    const campaigns=sortCampaignItems((state.content.publicidade||[]).filter(item=>item.ativo!==false && campaignStatusValue(item)==="ativa" && normalizedCampaignPosition(item.posicao)===position)).map(item=>({kind:"campaign",item}));
    const banners=sortBannerItems((state.content.banners||[]).filter(item=>item.ativo!==false && bannerStatusValue(item)==="ativo" && normalizedBannerPosition(item.posicao)===position)).map(item=>({kind:"banner",item}));
    return [...campaigns,...banners].sort((a,b)=>Number(b.item.prioridade||0)-Number(a.item.prioridade||0) || (a.kind===b.kind?0:(a.kind==="campaign"?-1:1)) || String(a.item.titulo||"").localeCompare(String(b.item.titulo||""),"pt-BR"));
  }

  function commercialCreativeHTML(entry) {
    const {kind,item}=entry;
    const link=safeExternalURL(item.link), collection=kind==="campaign"?"publicidade":"banners";
    const tag=link?"a":"button";
    const attrs=link?`href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer"`:`data-site-open="${collection}" data-site-id="${escapeHTML(item.id)}" type="button"`;
    const label=kind==="campaign"?"Publicidade":(item.tipo||"Banner");
    const title=item.titulo || (kind==="campaign"?advertiserName(item):"Banner");
    const format=kind==="campaign"?` format-${slugify(item.formato||"banner")}`:"";
    const data=kind==="campaign"?` data-campaign-id="${escapeHTML(item.id)}" data-ad-position="${escapeHTML(item.posicao||"")}"`:` data-banner-id="${escapeHTML(item.id)}"`;
    return `<div class="site-commercial-entry kind-${kind}"><span class="site-ad-disclosure">${escapeHTML(label)}</span><${tag} class="site-responsive-commercial ${kind==="campaign"?"site-ad-link":"site-banner-link"}${format}" ${attrs}${data} aria-label="Abrir ${escapeHTML(label.toLowerCase())} ${escapeHTML(title)}">${responsiveCommercialImage(item,`${label} ${title}`)}${item.textoBotao?`<span class="site-commercial-cta">${escapeHTML(item.textoBotao)}</span>`:""}</${tag}></div>`;
  }

  function siteCommercialSlot(position,{limit=2}={}) {
    const items=commercialSlotItems(position).slice(0,limit);
    if (!items.length) return "";
    return `<section class="site-banner-slot site-commercial-slot position-${slugify(position)}" data-site-section="publicidade" data-commercial-position="${escapeHTML(position)}">${items.map(commercialCreativeHTML).join("")}</section>`;
  }

  function siteBannerSlot(position) {
    return siteCommercialSlot(position);
  }

  function sitePartners() { const items=sortPartnerItems(state.content.parceiros.filter(i=>i.ativo!==false)).slice(0,blockLimit("parceiros",8)); if(!items.length)return ""; return `<section class="site-section alt" data-site-section="parceiros"><div class="site-section-head"><div><span>Apoio</span><h2>Parceiros e patrocinadores</h2><p>Marcas que apoiam a rádio e seus projetos.</p></div><button class="site-section-link" data-site-list="parceiros" type="button">Ver todos →</button></div><div class="site-partner-grid">${items.map(i=>`<button class="site-partner-card ${i.destaque?"featured":""}" data-site-open="parceiros" data-site-id="${escapeHTML(i.id)}" type="button" aria-label="Abrir parceiro ${escapeHTML(i.nome)}"><span class="site-partner-logo">${i.logo?`<img src="${escapeHTML(i.logo)}" alt="Logomarca de ${escapeHTML(i.nome)}">`:`${escapeHTML(initials(i.nome))}`}</span><strong>${escapeHTML(i.nome)}</strong><small>${escapeHTML(i.categoria||"Parceiro")}</small>${i.destaque?`<em>Destaque</em>`:""}</button>`).join("")}</div></section>`; }
  function siteApp() { return `<section class="site-section dark" data-site-section="aplicativo"><div class="site-section-head"><div><span>Leve a rádio com você</span><h2>Baixe nosso aplicativo</h2><p>Ouça a programação no celular e receba novidades.</p></div><button class="site-live-button" data-site-action="app" type="button">Baixar aplicativo</button></div></section>`; }
  function siteContact() { return `<section class="site-section" data-site-section="contato"><div class="site-section-head"><div><span>Fale com a rádio</span><h2>Contato e participação</h2><p>WhatsApp, pedidos de música, comercial e jornalismo.</p></div><button class="site-wa-button" data-site-action="whatsapp" type="button">Abrir WhatsApp</button></div></section>`; }
  function siteFooter(r) { const links=[["inicio","Início"],["noticias","Notícias"],["programacao","Programação"],["promocoes","Promoções"]].filter(([id])=>id === "inicio" || previewSectionAvailable(id)); return `<footer class="site-footer"><div class="site-footer-grid"><div><h3>${escapeHTML(r.nome)}</h3><p>${escapeHTML(r.descricao)}</p></div><div><h3>Navegação</h3><p>${links.map(([id,label])=>`<a href="#" data-site-scroll="${id}">${label}</a>`).join("<br>")}</p></div><div><h3>Contato</h3><p>${escapeHTML(r.email)}<br>${escapeHTML(r.telefone)}<br>${escapeHTML(r.endereco)}</p></div><div><h3>Anuncie</h3><p>Apresente sua marca aos ouvintes da rádio.</p><button class="site-footer-action" data-site-action="whatsapp" type="button">Falar com o comercial</button></div></div><div class="site-footer-bottom"><span>© ${new Date().getFullYear()} ${escapeHTML(r.nome)}</span><span>Site administrado pela Central Rádios Brasil</span></div></footer>`; }

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

  function dateKey(value) { return /^\d{4}-\d{2}-\d{2}$/.test(String(value||"")) ? String(value) : ""; }
  function currentDateKey() {
    const timezone=state?.integrations?.configuracoes?.timezone || "America/Sao_Paulo";
    try { return new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()); }
    catch { return new Date().toISOString().slice(0,10); }
  }
  function periodStatus(item, labels={scheduled:"agendada",active:"ativa",ended:"encerrada",paused:"pausada",cancelled:"cancelada"}) {
    const manual=String(item?.situacao||"").toLowerCase();
    if (manual.includes("cancel")) return labels.cancelled;
    if (manual.includes("paus")) return labels.paused;
    const today=currentDateKey(), now=currentTimeKey(), start=dateKey(item?.inicio), end=dateKey(item?.fim);
    if (start && (start > today || (start === today && item?.horaInicio && item.horaInicio > now))) return labels.scheduled;
    if (end && (end < today || (end === today && item?.horaFim && item.horaFim <= now))) return labels.ended;
    return labels.active;
  }
  function campaignStatusValue(item) { return periodStatus(item); }
  function campaignStatusLabel(item) { return ({ativa:"Ativa",agendada:"Agendada",encerrada:"Encerrada",pausada:"Pausada",cancelada:"Cancelada"})[campaignStatusValue(item)] || "Campanha"; }
  function bannerStatusValue(item) { return periodStatus(item,{scheduled:"agendado",active:"ativo",ended:"encerrado",paused:"pausado",cancelled:"cancelado"}); }
  function bannerStatusLabel(item) { return ({ativo:"Ativo",agendado:"Agendado",encerrado:"Encerrado",pausado:"Pausado",cancelado:"Cancelado"})[bannerStatusValue(item)] || "Banner"; }
  function advertiserName(item) {
    const advertiser=(state.content.anunciantes||[]).find(ad=>String(ad.id)===String(item?.anuncianteId));
    return advertiser?.nome || item?.anunciante || "Anunciante não vinculado";
  }
  function campaignMetrics(item) {
    const data=item?.metricas && typeof item.metricas === "object" ? item.metricas : {};
    const imp=Math.max(0,Number(data.impressoes||0)), clicks=Math.max(0,Number(data.cliques||0));
    return {impressoes:imp,cliques:clicks,ctr:imp>0?(clicks/imp)*100:0,fonte:String(data.fonte||""),atualizadoEm:String(data.atualizadoEm||"")};
  }
  function campaignMetricsLabel(item) {
    const m=campaignMetrics(item);
    return m.fonte || m.impressoes || m.cliques ? `${m.impressoes} imp. • ${m.cliques} cliques` : "Sem métricas reais";
  }
  function campaignRank(item) { return ({ativa:0,agendada:1,pausada:2,encerrada:3,cancelada:4})[campaignStatusValue(item)] ?? 9; }
  function bannerRank(item) { return ({ativo:0,agendado:1,pausado:2,encerrado:3,cancelado:4})[bannerStatusValue(item)] ?? 9; }
  function sortCampaignItems(items) { return [...items].sort((a,b)=>campaignRank(a)-campaignRank(b) || Number(b.prioridade||0)-Number(a.prioridade||0) || dateKey(a.inicio).localeCompare(dateKey(b.inicio)) || String(a.titulo||"").localeCompare(String(b.titulo||""),"pt-BR")); }
  function sortBannerItems(items) { return [...items].sort((a,b)=>bannerRank(a)-bannerRank(b) || Number(b.prioridade||0)-Number(a.prioridade||0) || dateKey(a.inicio).localeCompare(dateKey(b.inicio)) || String(a.titulo||"").localeCompare(String(b.titulo||""),"pt-BR")); }
  function popupStatusValue(item) { return periodStatus(item,{scheduled:"agendado",active:"ativo",ended:"encerrado",paused:"pausado",cancelled:"cancelado"}); }
  function popupStatusLabel(item) { return ({ativo:"Ativo",agendado:"Agendado",encerrado:"Encerrado",pausado:"Pausado",cancelado:"Cancelado"})[popupStatusValue(item)] || "Popup"; }
  function popupRank(item) { return ({ativo:0,agendado:1,pausado:2,encerrado:3,cancelado:4})[popupStatusValue(item)] ?? 9; }
  function sortPopupItems(items) { return [...items].sort((a,b)=>popupRank(a)-popupRank(b) || Number(b.prioridade||0)-Number(a.prioridade||0) || dateKey(a.inicio).localeCompare(dateKey(b.inicio)) || String(a.titulo||"").localeCompare(String(b.titulo||""),"pt-BR")); }
  function sortPartnerItems(items) { return [...items].sort((a,b)=>Number(Boolean(b.destaque))-Number(Boolean(a.destaque)) || Number(a.ordem||999)-Number(b.ordem||999) || String(a.nome||"").localeCompare(String(b.nome||""),"pt-BR")); }

  function promotionStatusValue(item) {
    if (/cancelad/i.test(String(item?.situacao||""))) return "cancelada";
    const today=currentDateKey(), start=dateKey(item?.inicio), end=dateKey(item?.fim);
    if (start && start > today) return "agendada";
    if (end && end < today) return "encerrada";
    return "ativa";
  }
  function promotionStatusLabel(item) { return ({ativa:"Ativa",agendada:"Agendada",encerrada:"Encerrada",cancelada:"Cancelada"})[promotionStatusValue(item)] || "Promoção"; }
  function eventStatusValue(item) {
    const manual=String(item?.situacao||"").toLowerCase();
    if (manual.includes("cancel")) return "cancelado";
    if (manual.includes("adiad")) return "adiado";
    const today=currentDateKey(), start=dateKey(item?.data), end=dateKey(item?.dataFim)||start;
    if (start > today) return "futuro";
    if (end < today) return "encerrado";
    return "hoje";
  }
  function eventStatusLabel(item) { return ({futuro:"Próximo",hoje:"Hoje",encerrado:"Encerrado",adiado:"Adiado",cancelado:"Cancelado"})[eventStatusValue(item)] || "Evento"; }
  function formatEventPeriod(item) {
    const start=item?.data?formatDate(item.data):"Data não informada", end=item?.dataFim?formatDate(item.dataFim):"";
    const dates=end && item.dataFim!==item.data ? `${start} a ${end}` : start;
    const times=item?.hora ? `${item.hora}${item.horaFim?` às ${item.horaFim}`:""}` : "";
    return [dates,times].filter(Boolean).join(" • ");
  }
  function promotionRank(item) { return ({ativa:0,agendada:1,encerrada:2,cancelada:3})[promotionStatusValue(item)] ?? 9; }
  function eventRank(item) { return ({hoje:0,futuro:1,adiado:2,encerrado:3,cancelado:4})[eventStatusValue(item)] ?? 9; }
  function sortPromotionItems(items) {
    return [...items].sort((a,b)=>promotionRank(a)-promotionRank(b) || Number(Boolean(b.destaque))-Number(Boolean(a.destaque)) || (dateKey(a.fim)||"9999-12-31").localeCompare(dateKey(b.fim)||"9999-12-31") || dateKey(a.inicio).localeCompare(dateKey(b.inicio)));
  }
  function sortEventItems(items) {
    return [...items].sort((a,b)=>eventRank(a)-eventRank(b) || Number(Boolean(b.destaque))-Number(Boolean(a.destaque)) || (eventStatusValue(a)==="encerrado" ? dateKey(b.data).localeCompare(dateKey(a.data)) : dateKey(a.data).localeCompare(dateKey(b.data))) || String(a.hora||"").localeCompare(String(b.hora||"")));
  }
  function promotionParticipationHTML(item) {
    if (promotionStatusValue(item) !== "ativa") return `<div class="site-detail-notice">${promotionStatusValue(item)==="agendada"?`A participação começa em ${escapeHTML(formatDate(item.inicio))}.`:promotionStatusValue(item)==="encerrada"?"Esta promoção já foi encerrada.":"Esta promoção foi cancelada."}</div>`;
    if (item.participacao === "Link externo") {
      const url=absoluteHttpURL(item.linkParticipacao); return url?`<a class="button primary site-detail-external" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">Participar agora</a>`:`<div class="site-detail-notice">O link de participação ainda não foi configurado.</div>`;
    }
    if (item.participacao === "WhatsApp") {
      const number=String(state.integrations.whatsapp?.numero || state.radio.whatsapp || "").replace(/\D/g,"");
      if(!number)return `<div class="site-detail-notice">Configure o WhatsApp da rádio para liberar a participação.</div>`;
      const message=encodeURIComponent(item.mensagemWhatsApp || `Olá! Quero participar da promoção ${item.titulo||"da rádio"}.`);
      return `<a class="button primary site-detail-external" href="https://wa.me/${number}?text=${message}" target="_blank" rel="noopener noreferrer">Participar pelo WhatsApp</a>`;
    }
    return `<div class="site-detail-notice">Consulte a descrição e o regulamento para saber como participar.</div>`;
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
  function detailImage(item,key="imagem") { return item?.[key]?`<img class="site-detail-cover" src="${escapeHTML(item[key])}" alt="${escapeHTML(item.titulo||item.nome||"Conteúdo")}">`:""; }
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
    if (key === "promocoes") return `${detailImage(item)}${detailMeta([promotionStatusLabel(item),item.categoria,item.premio,item.inicio?`Início: ${formatDate(item.inicio)}`:"",item.fim?`Encerramento: ${formatDate(item.fim)}`:"Sem encerramento",item.destaque?"Destaque":""])}<div class="site-detail-text">${multilineHTML(item.descricao)}${item.regulamento?`<h3>Regulamento</h3>${multilineHTML(item.regulamento)}`:""}${item.resultado?`<h3>Resultado</h3>${multilineHTML(item.resultado)}`:""}</div>${promotionParticipationHTML(item)}`;
    if (key === "eventos") { const map=absoluteHttpURL(item.linkMapa), info=absoluteHttpURL(item.linkInformacoes); return `${detailImage(item)}${detailMeta([eventStatusLabel(item),item.tipo,item.categoria,formatEventPeriod(item),item.local,item.cidade,item.destaque?"Destaque":""])}${item.endereco?`<div class="site-event-address"><strong>Endereço</strong><span>${escapeHTML(item.endereco)}</span></div>`:""}<div class="site-detail-text">${multilineHTML(item.descricao)}</div><div class="site-detail-actions">${map?`<a class="button secondary site-detail-external" href="${escapeHTML(map)}" target="_blank" rel="noopener noreferrer">Abrir no mapa</a>`:""}${info?`<a class="button primary site-detail-external" href="${escapeHTML(info)}" target="_blank" rel="noopener noreferrer">Informações ou ingressos</a>`:""}</div>`; }
    if (key === "galeria") return `${detailImage(item)}${detailMeta([item.album,item.data?formatDate(item.data):""])}<div class="site-detail-text">${multilineHTML(item.descricao)}</div>`;
    if (["locutores","equipe"].includes(key)) return `${detailImage(item,"foto")}${detailMeta([item.cargo,item.email,item.telefone])}<div class="site-detail-text">${multilineHTML(item.bio || item.descricao)}</div>`;
    if (key === "parceiros") { const links=partnerSocialLinks(item),wa=partnerWhatsappURL(item); return `${detailImage(item,"logo")}${detailMeta([item.categoria,item.destaque?"Parceiro em destaque":"",item.ordem?`Ordem ${item.ordem}`:""])}<div class="site-detail-text">${multilineHTML(item.descricao)}</div><div class="site-detail-actions">${links.map(([url,label])=>`<a class="button secondary site-detail-external" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)}</a>`).join("")}${wa?`<a class="button primary site-detail-external" href="${escapeHTML(wa)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>`:""}</div>${!links.length&&!wa?`<div class="site-detail-notice">Parceiro sem contato público cadastrado.</div>`:""}`; }
    if (key === "popups") { const url=safeExternalURL(item.link); return `${detailImage(item)}${detailMeta([popupStatusLabel(item),item.dispositivo,item.frequencia,`Atraso ${Number(item.atrasoSegundos||0)}s`,`Prioridade ${Number(item.prioridade||0)}`,item.inicio?`Início: ${formatDate(item.inicio)}${item.horaInicio?` ${item.horaInicio}`:""}`:"",item.fim?`Fim: ${formatDate(item.fim)}${item.horaFim?` ${item.horaFim}`:""}`:"Sem data final"])}<div class="site-detail-text">${multilineHTML(item.mensagem)}</div>${url&&item.textoBotao?`<a class="button primary site-detail-external" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.textoBotao)}</a>`:""}<div class="site-detail-notice">A visualização do CMS não registra frequência ou impressão real.</div>`; }
    if (key === "anunciantes") { const url=safeExternalURL(item.site); return `${detailImage(item,"logo")}${detailMeta([item.razaoSocial,item.categoria,item.documento,item.responsavel,item.email,item.telefone,item.whatsapp])}<div class="site-detail-text">${multilineHTML(item.observacoes)}</div>${url?`<a class="button primary site-detail-external" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">Abrir site do anunciante</a>`:""}`; }
    if (key === "publicidade") { const url=safeExternalURL(item.link),m=campaignMetrics(item); return `${responsiveCommercialImage(item,item.titulo||"Campanha")} ${detailMeta([advertiserName(item),item.posicao,item.formato,campaignStatusLabel(item),item.inicio?`Início: ${formatDate(item.inicio)}${item.horaInicio?` ${item.horaInicio}`:""}`:"",item.fim?`Fim: ${formatDate(item.fim)}${item.horaFim?` ${item.horaFim}`:""}`:"Sem data final",`Prioridade ${item.prioridade||0}`])}<div class="real-metrics-panel"><div><span>Impressões reais</span><strong>${m.impressoes}</strong></div><div><span>Cliques reais</span><strong>${m.cliques}</strong></div><div><span>CTR</span><strong>${m.ctr.toFixed(2)}%</strong></div><small>${m.fonte?`Fonte: ${escapeHTML(m.fonte)}${m.atualizadoEm?` • atualizado em ${escapeHTML(formatDateTime(m.atualizadoEm))}`:""}`:"Aguardando dados reais do site/Worker. A prévia não gera contagem."}</small></div><div class="site-detail-text">${multilineHTML(item.descricao)}</div>${url?`<a class="button primary site-detail-external" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">Abrir destino da campanha</a>`:""}`; }
    if (key === "banners") { const url=safeExternalURL(item.link); return `${responsiveCommercialImage(item,item.titulo||"Banner")}${detailMeta([item.tipo,item.posicao,bannerStatusLabel(item),item.inicio?`Início: ${formatDate(item.inicio)}`:"",item.fim?`Fim: ${formatDate(item.fim)}`:"",`Prioridade ${item.prioridade||0}`])}<div class="site-detail-text">${multilineHTML(item.descricao)}</div>${url?`<a class="button primary site-detail-external" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">Abrir destino do banner</a>`:""}`; }
    return `${detailImage(item,item.foto?"foto":item.logo?"logo":"imagem")}${genericDetailHTML(key,item)}`;
  }

  function openSiteDetail(key,id) {
    const item=contentItem(key,id);
    if (!item) { notify("O conteúdo selecionado não foi encontrado.","error"); return; }
    const title=item.titulo || item.nome || schemas[key]?.singular || "Conteúdo";
    $("#site-content-eyebrow").textContent=schemas[key]?.title || "Conteúdo";
    $("#site-content-title").textContent=title;
    $("#site-content-body").innerHTML=`${siteCommercialSlot("Página interna",{limit:1})}${siteDetailContent(key,item)}`;
    $("#site-content-dialog").showModal();
  }

  function collectionVisibleItems(key) {
    if (key === "programacao") return sortProgrammingItems(state.content.programacao.filter(item=>item.ativo!==false));
    if (key === "noticias") return state.content.noticias.filter(isNewsVisible);
    if (key === "equipe") return [...state.content.locutores.map(i=>({...i,_collection:"locutores"})),...state.content.equipe.map(i=>({...i,_collection:"equipe"}))].filter(i=>i.ativo!==false);
    if (["podcasts","videos"].includes(key)) return sortMediaItems(key,(state.content[key] || []).filter(i=>i.ativo!==false));
    if (key === "promocoes") return sortPromotionItems((state.content.promocoes||[]).filter(i=>i.ativo!==false));
    if (key === "eventos") return sortEventItems((state.content.eventos||[]).filter(i=>i.ativo!==false));
    if (key === "publicidade") return sortCampaignItems((state.content.publicidade||[]).filter(i=>i.ativo!==false));
    if (key === "banners") return sortBannerItems((state.content.banners||[]).filter(i=>i.ativo!==false));
    if (key === "parceiros") return sortPartnerItems((state.content.parceiros||[]).filter(i=>i.ativo!==false));
    if (key === "popups") return sortPopupItems((state.content.popups||[]).filter(i=>i.ativo!==false));
    return (state.content[key] || []).filter(i=>i.ativo!==false);
  }

  function openSiteCollection(key) {
    const items=collectionVisibleItems(key);
    const title=key === "programacao"?"Grade completa":schemas[key]?.title || "Conteúdos";
    $("#site-content-eyebrow").textContent="Visualização completa";
    $("#site-content-title").textContent=title;
    const collection=items.length?`<div class="site-detail-collection">${items.map(item=>`<button class="site-detail-item" data-site-open="${escapeHTML(item._collection||key)}" data-site-id="${escapeHTML(item.id)}" type="button"><strong>${escapeHTML(item.titulo||item.nome||"Sem título")}</strong><span>${escapeHTML(schemas[item._collection||key]?.summary?.(item) || item.descricao || item.resumo || "Abrir conteúdo")}</span></button>`).join("")}</div>`:`<div class="site-detail-notice">Nenhum conteúdo publicado nesta seção.</div>`;
    $("#site-content-body").innerHTML=`${siteCommercialSlot("Página interna",{limit:1})}${collection}`;
    $("#site-content-dialog").showModal();
  }

  let audio = null;
  let previewThemeOverride = null;

  function syncAudioButtons(playing=Boolean(audio && !audio.paused)) {
    $$('[data-site-play]').forEach(button=>{
      if (!button.dataset.idleHtml) button.dataset.idleHtml=button.innerHTML;
      button.setAttribute("aria-pressed",String(playing));
      if (!playing) { button.innerHTML=button.dataset.idleHtml; return; }
      if (button.classList.contains("site-play")) button.textContent="❚❚";
      else if (button.classList.contains("site-live-button")) button.innerHTML='<span class="site-live-dot"></span>PAUSAR';
      else button.textContent="❚❚ Pausar";
    });
  }
  function resetAudio() {
    if (audio) { audio.pause(); audio.src=""; audio=null; }
    syncAudioButtons(false);
  }
  async function toggleAudio() {
    const stream=absoluteHttpURL(state.radio.streamUrl);
    if (!stream) { notify("Informe uma URL de stream válida em Minha Rádio para testar o áudio.","error"); return; }
    if (!audio || audio.src !== stream) {
      resetAudio(); audio=new Audio(stream);
      audio.addEventListener("play",()=>syncAudioButtons(true));
      audio.addEventListener("pause",()=>syncAudioButtons(false));
      audio.addEventListener("ended",()=>syncAudioButtons(false));
      audio.addEventListener("error",()=>{syncAudioButtons(false);notify("O navegador não conseguiu reproduzir este stream.","error");});
    }
    if (audio.paused) { try { await audio.play(); } catch { syncAudioButtons(false); notify("O navegador não conseguiu reproduzir este stream.","error"); } }
    else audio.pause();
  }

  function renderPreviewDialog() {
    const originalTheme=state.selectedTheme;
    if (previewThemeOverride) state.selectedTheme=previewThemeOverride;
    $("#preview-theme-name").textContent = themeById(state.selectedTheme).name;
    renderSitePreview($("#preview-canvas"));
    state.selectedTheme=originalTheme;
  }

  function openPreview(themeId=null) {
    if(themeId && typeof themeId === "object") themeId=null;
    previewThemeOverride=themeId || null;
    const dialog=$("#preview-dialog");
    if (!dialog.open) dialog.showModal();
    renderPreviewDialog();
  }

  function bindGoButtons(root=document) {
    $$('[data-go]',root).forEach(button=>button.addEventListener("click",()=>navigate(button.dataset.go)));
  }

  function updateConnectionStatus() {
    const chip=$("#connection-chip");if(!chip)return;
    const online=navigator.onLine!==false;
    const status=!online?"offline":workerReachable===true?"online":workerReachable===false?"error":"checking";
    const label=status==="online"?"Worker conectado":status==="offline"?"Sem internet":status==="error"?"Worker indisponível":"Verificando conexão";
    chip.className=`connection-chip ${status}`;const text=$("strong",chip);if(text)text.textContent=label;
  }

  function captureClientIssue(type,message,source="") {
    try{
      ensureV250State();
      state.production.clientErrors.unshift({id:uid("client-error"),timestamp:new Date().toISOString(),type:String(type||"erro"),message:String(message||"Erro não identificado").slice(0,500),source:String(source||"").slice(0,300)});
      state.production.clientErrors=state.production.clientErrors.slice(0,50);
    }catch{}
  }

  async function api(path, options = {}) {
    if(navigator.onLine===false){workerReachable=false;updateConnectionStatus();throw new Error("Você está sem conexão com a internet.");}
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS || 20000);
    const headers = { "Content-Type":"application/json", ...(options.headers || {}) };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    try {
      const response = await fetch(`${CONFIG.WORKER_URL}${path}`, { ...options, headers, signal: controller.signal, cache:"no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { const error = new Error(data.erro || data.mensagem || `Falha ${response.status}`); error.status = response.status; throw error; }
      workerReachable=true;updateConnectionStatus();
      return data;
    } catch (error) {
      if(error.name === "AbortError" || error instanceof TypeError){workerReachable=false;updateConnectionStatus();captureClientIssue("api",error.message,path);}
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

  async function logout() { try { await api("/api/cliente/logout",{method:"POST"}); } catch {} resetAudio(); authToken=""; sessionStorage.removeItem(CONFIG.TOKEN_KEY); showLogin(); }
  function showLogin(message="") { $("#app-shell").classList.add("hidden"); $("#login-view").classList.remove("hidden"); if(message)showLoginMessage(message,"error"); }
  function showApp() { $("#login-view").classList.add("hidden"); $("#app-shell").classList.remove("hidden"); updateConnectionStatus();renderNav(); updateChrome(); renderPage(); }
  function showLoginMessage(message,type="") { const box=$("#login-message"); box.textContent=message; box.className=`global-message ${type} ${message?"":"hidden"}`; }

  async function loadAll() {
    if (isLoading) return; isLoading=true;
    resetAudio();
    try {
      const [dash, siteResult] = await Promise.all([api("/api/cliente/dashboard"), api("/api/cliente/site").catch(error => error.status===404 ? null : Promise.reject(error))]);
      dashboardData=dash; remoteSite=siteResult?.site || null; versions=siteResult?.versoes || [];
      if (remoteSite) {
        const media = await api("/api/cliente/site/midias").catch(()=>({midias:[]})); mediaLibrary=media.midias || [];
        state=mapRemoteToState(remoteSite,dashboardData); ensureV250State();
      } else { state=defaultState(); state.radio.nome=dash?.cliente?.nome_radio || dash?.cliente?.nome || "Minha rádio"; ensureV250State(); }
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
    fresh.version="3.0.0-stage1"; fresh.updatedAt=versions[0]?.criado_em || new Date().toISOString(); fresh.status=site.status_publicacao || "sem_rascunho"; fresh.selectedTheme=cms.selectedTheme || "morada"; fresh.editor=normalizeEditorState(cms.editor||{});
    fresh.radio={...fresh.radio,nome:content.nome || site.nome_site || dashboard?.cliente?.nome_radio || "Minha rádio",slogan:content.slogan || "",descricao:content.descricao || texts.sobre || "",cidade:contacts.cidade || dashboard?.cliente?.cidade || "",estado:contacts.estado || dashboard?.cliente?.estado || "",email:contacts.email || dashboard?.cliente?.email || "",telefone:contacts.telefone || "",whatsapp:whats.numero || "",endereco:contacts.endereco || "",streamUrl:site.stream_url || "",musicaAtual:texts.player?.titulo || "Transmissão ao vivo",locutorAtual:texts.player?.subtitulo || "Programação da rádio",logo:content.logo || "",hero:content.capa || "",playerImage:texts.player?.imagem || "",cores:{primaria:colors.primaria || "#e31c45",secundaria:colors.secundaria || "#121d31",destaque:colors.destaque || "#f1a11a",fundo:colors.fundo || "#f4f6f9"},listenersEnabled:false};
    const moduleValues=texts.modulos || {}; const savedModules=safeArray(cms.modules);
    fresh.modules=modulesCatalog.map(([id,label,description],index)=>{const saved=savedModules.find(m=>m.id===id);return{id,label,description,enabled:saved? saved.enabled!==false : moduleValues[id]!==false,order:Number(saved?.order ?? index)};});
    fresh.content={
      programacao:ensureIds(safeArray(content.programacao).map(i=>({...i,titulo:i.titulo||i.programa||"",locutor:i.locutor||i.apresentador||"",dias:normalizeDays(i.dias||i.dia),categoria:i.categoria||"Variedades",cor:i.cor||"#e31c45",ativo:i.ativo!==false})),"prog"),
      locutores:ensureIds(safeArray(content.locutores).map((i,index)=>({...i,cargo:i.cargo||i.funcao||"",bio:i.bio||i.descricao||"",ordem:Number(i.ordem||index+1),ativo:i.ativo!==false})),"loc"),
      noticias:ensureIds(safeArray(content.noticias).map(i=>({...i,slug:i.slug||slugify(i.titulo),status:i.status|| (i.ativo===false?"Rascunho":"Publicada"),hora:i.hora||"",ativo:i.ativo!==false})),"news"),
      podcasts:ensureIds(safeArray(texts.podcasts).map(i=>({...i,temporada:Number(i.temporada||0),episodio:Number(i.episodio||0),duracaoMinutos:Number(i.duracaoMinutos||0),destaque:Boolean(i.destaque),ativo:i.ativo!==false})),"pod"),
      videos:ensureIds(safeArray(texts.videos).map(i=>({...i,tipo:i.tipo||"Automático",tipoDetectado:i.tipoDetectado||detectVideoType(i.url),duracaoMinutos:Number(i.duracaoMinutos||0),destaque:Boolean(i.destaque),ativo:i.ativo!==false})),"vid"),
      promocoes:ensureIds(safeArray(texts.promocoes).map(i=>({...i,categoria:i.categoria||"",premio:i.premio||"",situacao:i.situacao||"Automático pelas datas",participacao:i.participacao||(/whatsapp/i.test(i.descricao||"")?"WhatsApp":"Somente informativa"),linkParticipacao:i.linkParticipacao||"",mensagemWhatsApp:i.mensagemWhatsApp||"",resultado:i.resultado||"",destaque:Boolean(i.destaque),ativo:i.ativo!==false})),"promo"),
      galeria:ensureIds(texts.galeria,"foto"),
      eventos:ensureIds(safeArray(texts.eventos).map(i=>({...i,tipo:i.tipo||"Evento da rádio",categoria:i.categoria||"",dataFim:i.dataFim||"",horaFim:i.horaFim||"",situacao:i.situacao||"Automático pela data",endereco:i.endereco||"",cidade:i.cidade||"",linkMapa:i.linkMapa||"",linkInformacoes:i.linkInformacoes||"",destaque:Boolean(i.destaque),ativo:i.ativo!==false})),"evento"),
      equipe:ensureIds(cms.content?.equipe,"team"),
      anunciantes:ensureIds(safeArray(cms.content?.anunciantes).map(i=>({...i,site:i.site||i.link||"",ativo:i.ativo!==false})),"adv"),
      publicidade:ensureIds(safeArray(banners.publicidades).map(i=>({...i,anuncianteId:i.anuncianteId||"",anunciante:i.anunciante||"",posicao:i.posicao||"Entre seções",formato:i.formato||"Banner horizontal",inicio:i.inicio||"",horaInicio:i.horaInicio||"",fim:i.fim||"",horaFim:i.horaFim||"",situacao:i.situacao||"Automático pelo período",prioridade:Number(i.prioridade||0),imagemDesktop:i.imagemDesktop||i.imagem||"",imagemMobile:i.imagemMobile||"",textoBotao:i.textoBotao||"Saiba mais",metricas:i.metricas&&typeof i.metricas==="object"?i.metricas:{impressoes:Number(i.impressoes||0),cliques:Number(i.cliques||0),fonte:i.fonteMetricas||"",atualizadoEm:i.metricasAtualizadoEm||""},ativo:i.ativo!==false})),"ad"),
      parceiros:ensureIds(safeArray(content.patrocinadores).map((i,index)=>({...i,categoria:i.categoria||"Patrocinador",descricao:i.descricao||"",link:i.link||i.site||"",whatsapp:i.whatsapp||"",instagram:i.instagram||"",facebook:i.facebook||"",youtube:i.youtube||"",ordem:Number(i.ordem||index+1),destaque:Boolean(i.destaque),ativo:i.ativo!==false})),"part"),
      banners:ensureIds(safeArray(banners.destaques).map(i=>({...i,tipo:i.tipo||"Editorial",posicao:normalizedBannerPosition(i.posicao),inicio:i.inicio||"",horaInicio:i.horaInicio||"",fim:i.fim||"",horaFim:i.horaFim||"",situacao:i.situacao||"Automático pelo período",prioridade:Number(i.prioridade||0),imagemDesktop:i.imagemDesktop||i.imagem||"",imagemMobile:i.imagemMobile||"",textoBotao:i.textoBotao||"Saiba mais",ativo:i.ativo!==false})),"banner"),
      popups:ensureIds(safeArray(cms.content?.popups).map(i=>({...i,mensagem:i.mensagem||i.descricao||"",inicio:i.inicio||"",horaInicio:i.horaInicio||"",fim:i.fim||"",horaFim:i.horaFim||"",situacao:i.situacao||"Automático pelo período",dispositivo:i.dispositivo||"Desktop e celular",frequencia:i.frequencia||"Uma vez por sessão",atrasoSegundos:Number(i.atrasoSegundos||0),prioridade:Number(i.prioridade||0),textoBotao:i.textoBotao||"",ativo:i.ativo!==false})),"popup"), usuarios:[]
    };
    fresh.integrations={
      whatsapp:{numero:whats.numero||"",mensagem:whats.mensagem||"Olá! Vim pelo site da rádio.",flutuante:whats.flutuante!==false,pedidos:texts.pedidosMusica?.ativo!==false},
      redes:{instagram:content.redes_sociais?.instagram||"",facebook:content.redes_sociais?.facebook||"",youtube:content.redes_sociais?.youtube||"",tiktok:content.redes_sociais?.tiktok||"",x:content.redes_sociais?.xTwitter||"",spotify:content.redes_sociais?.spotify||""},
      seo:{titulo:texts.seo?.titulo||"",descricao:texts.seo?.descricao||"",palavras:texts.seo?.palavras||"",imagem:texts.seo?.imagem||""},
      dominio:{atual:site.subdominio||"",proprio:site.dominio_personalizado||"",ssl:true},
      aplicativo:{android:apps.android||"",ios:apps.ios||"",pwa:Boolean(apps.pwa),icone:cms.aplicativo?.icone||"",qrcode:apps.qr||""},
      configuracoes:{idioma:cms.configuracoes?.idioma||"pt-BR",timezone:cms.configuracoes?.timezone||"America/Sao_Paulo",moderacao:cms.configuracoes?.moderacao!==false,acessibilidade:texts.acessibilidade?.leitorTela!==false,cookies:cms.configuracoes?.cookies!==false}
    };
    fresh.security=cms.security || fresh.security;
    fresh.audit=cms.audit || fresh.audit;
    fresh.backup=cms.backup || fresh.backup;
    fresh.production=cms.production || fresh.production;
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
    if(can("textos_institucionais"))content.textos_institucionais={...texts,sobre:state.radio.descricao,player:{...(texts.player||{}),titulo:state.radio.musicaAtual,subtitulo:state.radio.locutorAtual,imagem:state.radio.playerImage},seo:state.integrations.seo,podcasts:state.content.podcasts,videos:state.content.videos,promocoes:state.content.promocoes,galeria:state.content.galeria,eventos:state.content.eventos,modulos:Object.fromEntries(state.modules.map(m=>[m.id,m.enabled])),pedidosMusica:{...(texts.pedidosMusica||{}),ativo:state.integrations.whatsapp.pedidos},acessibilidade:{...(texts.acessibilidade||{}),leitorTela:state.integrations.configuracoes.acessibilidade},cms_v2:{...cms,schemaVersion:13,release:"3.0.0-stage1",editor:state.editor,security:state.security,production:state.production,audit:{entries:(state.audit?.entries||[]).slice(0,500),functionalRuns:(state.audit?.functionalRuns||[]).slice(0,10)},backup:{settings:state.backup?.settings||{},snapshots:(state.backup?.snapshots||[]).slice(0,5)},selectedTheme:state.selectedTheme,modules:state.modules,content:{equipe:state.content.equipe,popups:state.content.popups,anunciantes:state.content.anunciantes},aplicativo:{icone:state.integrations.aplicativo.icone},configuracoes:state.integrations.configuracoes,updatedAt:new Date().toISOString()}};
    return content;
  }


  // ---------------------------------------------------------------------------
  // v2.5.0 — Usuários, permissões, auditoria e backup
  // ---------------------------------------------------------------------------
  const V250_ROLE_PROFILES = Object.freeze({
    "Administrador": { label:"Administrador", description:"Controle total do CMS, usuários, auditoria, backup e publicação.", areas:["*"], actions:["view","preview","create","edit","duplicate","toggle","delete","save","publish","manage_users","audit","backup","export"] },
    "Editor": { label:"Editor", description:"Gerencia site e conteúdo, revisa a prévia e solicita publicação.", areas:["dashboard","site","conteudo","integracoes","publicacao"], actions:["view","preview","create","edit","duplicate","toggle","delete","save","publish","export"] },
    "Redator": { label:"Redator", description:"Cria e edita conteúdo editorial, sem excluir ou publicar.", areas:["dashboard","conteudo"], actions:["view","preview","create","edit","duplicate","save","export"] },
    "Comercial": { label:"Comercial", description:"Gerencia anunciantes, campanhas, banners, parceiros e popups.", areas:["dashboard","comercial"], actions:["view","preview","create","edit","duplicate","toggle","delete","save","export"] },
    "Auditor": { label:"Auditor", description:"Consulta todas as áreas, executa auditorias e exporta relatórios.", areas:["*"], actions:["view","preview","audit","export"] },
    "Somente leitura": { label:"Somente leitura", description:"Consulta o painel e a prévia sem alterar dados.", areas:["*"], actions:["view","preview","export"] }
  });

  const V250_PAGE_AREAS = Object.freeze({
    dashboard:"dashboard", radio:"site", editor:"site", themes:"site",
    programacao:"conteudo", locutores:"conteudo", noticias:"conteudo", podcasts:"conteudo", videos:"conteudo", promocoes:"conteudo", galeria:"conteudo", eventos:"conteudo", equipe:"conteudo",
    anunciantes:"comercial", publicidade:"comercial", parceiros:"comercial", banners:"comercial", popups:"comercial",
    whatsapp:"integracoes", redes:"integracoes", seo:"integracoes", dominio:"integracoes", aplicativo:"integracoes",
    configuracoes:"sistema", usuarios:"usuarios", auditoria:"auditoria", producao:"auditoria", publicacao:"publicacao", faturas:"financeiro", contrato:"financeiro", backup:"backup"
  });

  let accessEditingId = null;
  let auditFilter = "todos";

  function ensureV250State() {
    if (!state || typeof state !== "object") state=defaultState();
    state.editor=normalizeEditorState(state.editor||{});
    state.version="3.0.0-stage1";
    const client=dashboardData?.cliente || {};
    const ownerEmail=String(client.email || state.radio?.email || "cliente@exemplo.com.br").trim().toLowerCase();
    const ownerName=client.nome || client.nome_radio || state.radio?.nome || "Administrador do cliente";
    const legacyUsers=safeArray(state.content?.usuarios);
    state.security=state.security && typeof state.security === "object" ? state.security : {};
    state.security.users=safeArray(state.security.users?.length ? state.security.users : legacyUsers).map((user,index)=>({
      id:user.id || uid("user"), nome:user.nome || `Usuário ${index+1}`, email:String(user.email||"").trim().toLowerCase(), perfil:V250_ROLE_PROFILES[user.perfil]?user.perfil:"Somente leitura",
      areas:Array.isArray(user.areas)?user.areas:String(user.areas||"").split(",").map(value=>value.trim()).filter(Boolean),
      status:user.status || (user.ativo===false?"Suspenso":"Ativo"), ativo:user.ativo!==false && user.status!=="Suspenso", exigir2FA:Boolean(user.exigir2FA),
      ultimoAcesso:user.ultimoAcesso||"", criadoEm:user.criadoEm||new Date().toISOString(), atualizadoEm:user.atualizadoEm||new Date().toISOString(), owner:Boolean(user.owner)
    }));
    let owner=state.security.users.find(user=>user.owner || (ownerEmail && user.email===ownerEmail));
    if (!owner) {
      owner={id:uid("owner"),nome:ownerName,email:ownerEmail,perfil:"Administrador",areas:["*"],status:"Ativo",ativo:true,exigir2FA:false,ultimoAcesso:"",criadoEm:new Date().toISOString(),atualizadoEm:new Date().toISOString(),owner:true};
      state.security.users.unshift(owner);
    } else {
      owner.owner=true; owner.perfil="Administrador"; owner.status="Ativo"; owner.ativo=true; owner.areas=["*"];
      if (!owner.nome) owner.nome=ownerName; if (!owner.email) owner.email=ownerEmail;
    }
    state.security.profiles=Object.fromEntries(Object.entries(V250_ROLE_PROFILES).map(([key,value])=>[key,{...value,areas:[...value.areas],actions:[...value.actions]}]));
    state.security.require2FAForAdmins=state.security.require2FAForAdmins!==false;
    state.security.sessionTimeoutMinutes=Math.max(15,Math.min(1440,Number(state.security.sessionTimeoutMinutes||120)));

    state.audit=state.audit && typeof state.audit === "object" ? state.audit : {};
    state.audit.entries=safeArray(state.audit.entries).slice(0,500);
    state.audit.functionalRuns=safeArray(state.audit.functionalRuns).slice(0,10);

    state.backup=state.backup && typeof state.backup === "object" ? state.backup : {};
    state.backup.settings={autoBeforeImport:true,autoBeforePublication:true,maxSnapshots:5,...(state.backup.settings||{})};
    state.backup.settings.maxSnapshots=Math.max(1,Math.min(10,Number(state.backup.settings.maxSnapshots||5)));
    state.backup.snapshots=safeArray(state.backup.snapshots).slice(0,state.backup.settings.maxSnapshots);

    state.production=state.production && typeof state.production === "object" ? state.production : {};
    state.production.stage="pre-production";
    state.production.runs=safeArray(state.production.runs).slice(0,10);
    state.production.clientErrors=safeArray(state.production.clientErrors).slice(0,50);
    state.production.manualReviews={legacyImages:false,serverPermissions:false,tenantIsolation:false,serverMediaValidation:false,...(state.production.manualReviews||{})};
    if (state.content) state.content.usuarios=[];
    return state;
  }

  function currentAccessUser() {
    ensureV250State();
    const email=String(dashboardData?.cliente?.email || "").trim().toLowerCase();
    return state.security.users.find(user=>email && user.email===email) || state.security.users.find(user=>user.owner) || state.security.users[0];
  }

  function pageArea(page=currentPage) { return V250_PAGE_AREAS[page] || "sistema"; }
  function permissionProfile(user=currentAccessUser()) { return V250_ROLE_PROFILES[user?.perfil] || V250_ROLE_PROFILES["Somente leitura"]; }
  function userAreas(user=currentAccessUser()) {
    const areas=Array.isArray(user?.areas)?user.areas:[];
    return areas.length?areas:permissionProfile(user).areas;
  }
  function canAccess(action,page=currentPage) {
    const user=currentAccessUser();
    if (!user || user.ativo===false || user.status==="Suspenso") return false;
    const profile=permissionProfile(user);
    const allowedActions=new Set(profile.actions||[]);
    if (!allowedActions.has(action)) return false;
    const area=pageArea(page), areas=userAreas(user);
    return areas.includes("*") || areas.includes(area) || profile.areas.includes("*") || profile.areas.includes(area);
  }
  function requirePermission(action,page=currentPage,message="Você não possui permissão para esta ação.") {
    if (canAccess(action,page)) return true;
    notify(message,"error");
    recordAudit("permissao.negada",pageArea(page),page,`Ação bloqueada: ${action}`,"denied");
    return false;
  }

  function auditActor() {
    const user=currentAccessUser();
    return {id:user?.id||"owner",nome:user?.nome||dashboardData?.cliente?.nome||"Cliente",email:user?.email||dashboardData?.cliente?.email||""};
  }
  function recordAudit(action,area,target,details="",result="success",metadata={}) {
    ensureV250State();
    const actor=auditActor();
    state.audit.entries.unshift({id:uid("audit"),timestamp:new Date().toISOString(),action,area:area||"sistema",target:target||"",details:String(details||""),result,actor,metadata});
    state.audit.entries=state.audit.entries.slice(0,500);
  }

  function visibleNavItems() {
    const output=[];
    let pendingSection=null;
    navItems.forEach(item=>{
      if (item.section) { pendingSection=item; return; }
      if (!canAccess("view",item.id)) return;
      if (pendingSection) { output.push(pendingSection); pendingSection=null; }
      output.push(item);
    });
    return output;
  }

  function renderNav() {
    ensureV250State();
    const nav=$("#sidebar-nav");
    nav.innerHTML=visibleNavItems().map(item=>item.section?`<span class="nav-section-label">${escapeHTML(item.section)}</span>`:`<button class="nav-link ${item.id===currentPage?"active":""}" data-page="${item.id}" type="button"><span class="nav-icon" aria-hidden="true">${item.icon}</span><span>${escapeHTML(item.label)}</span>${item.badge?`<span class="nav-badge">${item.badge}</span>`:""}</button>`).join("");
    $$('[data-page]',nav).forEach(button=>button.addEventListener("click",()=>navigate(button.dataset.page)));
  }

  function navigate(page) {
    if (!canAccess("view",page)) return requirePermission("view",page,"Seu perfil não permite abrir esta área.");
    currentPage=page; searchTerm=""; collectionFilter="todos"; collectionContextFilter="todos"; collectionSort="padrao";
    renderNav(); renderPage();
    if (window.innerWidth<=980) $("#sidebar").classList.remove("open");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function updateChrome() {
    ensureV250State();
    $("#sidebar-radio-name").textContent=state.radio.nome||"Minha rádio";
    const status=$("#sidebar-status"); status.textContent=statusLabel(state.status); status.className=`status-pill ${state.status==="publicado"?"published":"draft"}`;
    const save=$("#save-button"); if(save){save.disabled=!canAccess("save","radio");save.title=save.disabled?"Seu perfil não pode salvar alterações.":"Salvar alterações no rascunho";}
    const preview=$("#preview-top-button"); if(preview)preview.disabled=!canAccess("preview","dashboard");
  }

  function updateAccount() {
    ensureV250State();
    const user=currentAccessUser(), client=dashboardData?.cliente||{}, name=user?.nome||client.nome_radio||client.nome||"Cliente";
    $("#account-name").textContent=name; $("#account-avatar").textContent=initials(name); $("#account-role").textContent=user?.perfil||"Cliente autorizado";
  }

  function renderPage() {
    ensureV250State();
    if (!canAccess("view",currentPage)) currentPage="dashboard";
    document.body.classList.toggle("editor-page-active",currentPage==="editor");
    const mainContent=$("#main-content"); if(mainContent)mainContent.classList.toggle("editor-main-content",currentPage==="editor");
    const item=navItems.find(entry=>entry.id===currentPage);
    $("#page-title").textContent=item?.label||"Painel"; $("#page-eyebrow").textContent=pageEyebrow(currentPage);
    const root=$("#page-root");
    if(currentPage==="dashboard")renderDashboard(root); else if(currentPage==="radio")renderRadio(root); else if(currentPage==="editor")renderVisualEditor(root); else if(currentPage==="themes")renderThemes(root);
    else if(currentPage==="usuarios")renderUsers(root); else if(currentPage==="auditoria")renderAudit(root); else if(currentPage==="producao")renderProductionReadiness(root); else if(currentPage==="publicacao")renderPublication(root);
    else if(currentPage==="faturas")renderInvoices(root); else if(currentPage==="contrato")renderContract(root); else if(schemas[currentPage])renderCollection(root,currentPage); else renderIntegration(root,currentPage);
    applyPermissionState(root,currentPage); bindGoButtons(root);
  }

  function pageEyebrow(page) {
    if(["dashboard","radio","editor","themes"].includes(page))return"Gestão do site";
    if(["programacao","locutores","noticias","podcasts","videos","promocoes","galeria","eventos","equipe"].includes(page))return"Conteúdo editorial";
    if(["anunciantes","publicidade","parceiros","banners","popups"].includes(page))return"Comercial e monetização";
    if(["whatsapp","redes","seo","dominio","aplicativo"].includes(page))return"Integrações";
    if(page==="auditoria")return"Conformidade e rastreabilidade";
    if(page==="producao")return"Preparação para lançamento";
    if(page==="backup")return"Proteção e recuperação";
    return"Configuração do sistema";
  }

  function applyPermissionState(root,page) {
    if (!root) return;
    const map=[['[data-edit-item]',"edit"],['[data-duplicate-item]',"duplicate"],['[data-delete-item]',"delete"],['[data-toggle-item]',"toggle"],['#new-item',"create"]];
    map.forEach(([selector,action])=>{$$(selector,root).forEach(button=>{if(!canAccess(action,page)){button.disabled=true;button.title="Ação não permitida para este perfil.";}})});
    $$('form button[type="submit"]',root).forEach(button=>{if(!canAccess("save",page)&&page!=="usuarios"){button.disabled=true;button.title="Seu perfil não pode salvar nesta área.";}});
  }

  function persist(show=true) {
    ensureV250State();
    if(activeImageProcesses.size){if(show)notify("Aguarde a validação da imagem antes de salvar.","error");return Promise.resolve();}
    if(!canAccess("save",currentPage)){if(show)requirePermission("save",currentPage);return Promise.resolve();}
    state.updatedAt=new Date().toISOString(); updateChrome(); clearTimeout(saveTimer);
    if(show)return queueRemoteSave(true);
    saveTimer=setTimeout(()=>queueRemoteSave(false),650); return Promise.resolve();
  }

  function queueRemoteSave(show=true) {
    ensureV250State();
    if(!canAccess("save",currentPage)){if(show)requirePermission("save",currentPage);return Promise.resolve();}
    if(!remoteSite){if(show)notify("O site ainda não está preparado para edição.","error");return Promise.resolve();}
    const content=mapStateToSiteContent();
    saveQueue=saveQueue.catch(()=>{}).then(async()=>{
      setSaving(true);
      try{
        const result=await api("/api/cliente/site/rascunho",{method:"PUT",body:JSON.stringify({conteudo:content})});
        remoteSite.conteudoRascunho=result.conteudo||content; remoteSite.status_publicacao="rascunho"; state.status="rascunho";
        if(result.versao)versions.unshift({numero:result.versao,status:"rascunho",autor_tipo:"cliente",criado_em:new Date().toISOString()});
        recordAudit("rascunho.salvo","sistema","site",`Rascunho salvo${result.versao?` como versão ${result.versao}`:""}.`);
        if(show)notify(`Rascunho salvo${result.versao?` como versão ${result.versao}`:""}.`,"success");
      }catch(error){recordAudit("rascunho.falha","sistema","site",error.message||"Falha ao salvar","error");notify(error.message||"Não foi possível salvar o rascunho.","error");throw error;}
      finally{setSaving(false);updateChrome();}
    });
    return saveQueue;
  }

  function openItemModal(key,id=null) {
    const action=id?"edit":"create"; if(!requirePermission(action,key))return;
    const schema=schemas[key],today=new Date().toISOString().slice(0,10);
    const base=key==="noticias"?{ativo:true,status:"Rascunho",data:today}:key==="programacao"?{ativo:true,dias:["Segunda","Terça","Quarta","Quinta","Sexta"],cor:"#e31c45"}:key==="podcasts"?{ativo:true,destaque:false,data:today,temporada:1,episodio:0,duracaoMinutos:0}:key==="videos"?{ativo:true,destaque:false,data:today,tipo:"Automático",duracaoMinutos:0}:key==="promocoes"?{ativo:true,destaque:false,inicio:today,fim:"",situacao:"Automático pelas datas",participacao:"WhatsApp",mensagemWhatsApp:""}:key==="eventos"?{ativo:true,destaque:false,data:today,dataFim:"",situacao:"Automático pela data",tipo:"Evento da rádio"}:key==="publicidade"?{ativo:true,inicio:today,fim:"",horaInicio:"",horaFim:"",situacao:"Automático pelo período",posicao:"Entre seções",formato:"Banner horizontal",prioridade:10,textoBotao:"Saiba mais",metricas:{impressoes:0,cliques:0,fonte:""}}:key==="banners"?{ativo:true,inicio:today,fim:"",horaInicio:"",horaFim:"",situacao:"Automático pelo período",tipo:"Editorial",posicao:"Após o cabeçalho",prioridade:10,textoBotao:"Saiba mais"}:key==="parceiros"?{ativo:true,categoria:"Patrocinador",ordem:10,destaque:false}:key==="popups"?{ativo:true,inicio:today,fim:"",horaInicio:"",horaFim:"",situacao:"Automático pelo período",dispositivo:"Desktop e celular",frequencia:"Uma vez por sessão",atrasoSegundos:3,prioridade:10,textoBotao:""}:{ativo:true};
    const item=id?state.content[key].find(entry=>entry.id===id):base; if(!item)return notify("Registro não encontrado.","error");
    editing={key,id}; $("#modal-eyebrow").textContent=schema.title; $("#modal-title").textContent=id?`Editar ${schema.singular}`:(key==="noticias"?"Nova notícia":`Novo ${schema.singular}`);
    $("#modal-fields").innerHTML=`<div class="form-grid">${schema.fields.map(field=>modalFieldHTML(field,item)).join("")}</div>`; bindImageInputs($("#modal-fields")); $("#editor-modal").showModal();
  }

  function saveModal(event) {
    event.preventDefault(); if(event.submitter?.value==="cancel"){$("#editor-modal").close();return;} if(!editing)return;
    const {key,id}=editing,action=id?"edit":"create"; if(!requirePermission(action,key))return;
    const schema=schemas[key],editorForm=$("#editor-form"),imageValidation=validateImageControls(editorForm);
    if(!imageValidation.ok)return notify(imageValidation.message,"error");
    const form=new FormData(editorForm); if(!editorForm.checkValidity()){editorForm.reportValidity();return;}
    const item=id?state.content[key].find(entry=>entry.id===id):{id:uid(key),criadoEm:new Date().toISOString()};
    schema.fields.forEach(([name,,type])=>{if(type==="checkbox")item[name]=form.has(name);else if(type==="multicheck")item[name]=form.getAll(name).map(String);else if(type==="number")item[name]=Number(form.get(name)||0);else item[name]=String(form.get(name)||"").trim();});
    item.atualizadoEm=new Date().toISOString(); const validation=validateEditorialItem(key,item,id); if(validation)return notify(validation,"error");
    if(!id)state.content[key].unshift(item); recordAudit(id?"conteudo.editado":"conteudo.criado",pageArea(key),key,item.titulo||item.nome||item.id); persist(false); $("#editor-modal").close(); editing=null; renderPage(); notify(id?"Registro atualizado.":"Registro criado.","success");
  }

  function duplicateItem(key,id) {
    if(!requirePermission("duplicate",key))return; const source=state.content[key].find(entry=>entry.id===id);if(!source)return;
    const clone=JSON.parse(JSON.stringify(source));clone.id=uid(key);clone.criadoEm=new Date().toISOString();clone.atualizadoEm=clone.criadoEm;
    if(clone.titulo)clone.titulo=`${clone.titulo} — cópia`;if(clone.nome)clone.nome=`${clone.nome} — cópia`;
    if(key==="noticias"){clone.slug=slugify(`${clone.slug||clone.titulo}-copia`);clone.status="Rascunho";clone.destaque=false;} if(key==="programacao")clone.ativo=false;
    if(["podcasts","videos","promocoes","eventos","publicidade","banners","parceiros","popups"].includes(key)){clone.ativo=false;clone.destaque=false;}
    if(key==="publicidade"){clone.situacao="Pausada";clone.metricas={impressoes:0,cliques:0,fonte:"",atualizadoEm:""};} if(key==="banners")clone.situacao="Pausado";if(key==="popups")clone.situacao="Pausado";if(key==="promocoes")clone.situacao="Automático pelas datas";if(key==="eventos")clone.situacao="Automático pela data";
    state.content[key].unshift(clone);recordAudit("conteudo.duplicado",pageArea(key),key,source.titulo||source.nome||source.id);persist(false);renderPage();notify("Cópia criada para revisão.","success");
  }

  function deleteItem(key,id) {
    if(!requirePermission("delete",key))return;const item=state.content[key].find(entry=>entry.id===id);if(!item)return;
    if(key==="anunciantes"){const linked=(state.content.publicidade||[]).filter(c=>String(c.anuncianteId||"")===String(id));if(linked.length)return notify(`Este anunciante está vinculado a ${linked.length} campanha${linked.length===1?"":"s"}. Remova ou altere o vínculo antes de excluir.`,"error");}
    if(!confirm(`Excluir “${item.titulo||item.nome||"este registro"}”?`))return;state.content[key]=state.content[key].filter(entry=>entry.id!==id);recordAudit("conteudo.excluido",pageArea(key),key,item.titulo||item.nome||id);persist(false);renderPage();notify("Registro excluído.","success");
  }

  function toggleItem(key,id) {
    if(!requirePermission("toggle",key))return;const item=state.content[key].find(entry=>entry.id===id);if(!item)return;item.ativo=item.ativo===false;recordAudit("conteudo.status",pageArea(key),key,`${item.titulo||item.nome||id}: ${item.ativo?"ativo":"inativo"}`);persist(false);renderPage();
  }

  function renderCollection(root,key) {
    const schema=schemas[key],source=state.content[key]||[],items=filterAndSortCollection(key,source),stats=editorialStats(key,source),newItemLabel=key==="noticias"?"+ Nova notícia":`+ Novo ${schema.singular}`;
    root.innerHTML=`${pageHeader(schema.title,schema.description,`<button class="button secondary" data-preview type="button">Ver no site</button><button class="button primary" id="new-item" type="button">${newItemLabel}</button>`)}${stats.length?`<div class="editorial-kpis">${stats.map(([label,value])=>`<article><span>${escapeHTML(label)}</span><strong>${value}</strong></article>`).join("")}</div>`:""}<section class="table-card"><div class="table-toolbar editorial-toolbar"><div class="search-input"><input id="collection-search" type="search" placeholder="Buscar em ${schema.title.toLowerCase()}" value="${escapeHTML(searchTerm)}"></div><div class="collection-filters">${collectionFilters(key,source)}</div><span class="badge info">${items.length} de ${source.length}</span></div>${items.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>${schema.singular}</th><th>Resumo</th><th>Status</th><th style="text-align:right">Ações</th></tr></thead><tbody>${items.map(item=>collectionRow(schema,key,item)).join("")}</tbody></table></div>`:`<div class="empty-state"><strong>Nenhum registro encontrado</strong><span>Ajuste os filtros ou use o botão “Novo”.</span></div>`}</section>`;
    $("#new-item")?.addEventListener("click",()=>openItemModal(key));$$('[data-preview]',root).forEach(button=>button.addEventListener("click",openPreview));
    $("#collection-search")?.addEventListener("input",event=>{searchTerm=event.target.value;renderCollection(root,key);$("#collection-search")?.focus();});
    $("#collection-filter")?.addEventListener("change",event=>{collectionFilter=event.target.value;renderCollection(root,key);});$("#collection-context-filter")?.addEventListener("change",event=>{collectionContextFilter=event.target.value;renderCollection(root,key);});$("#collection-sort")?.addEventListener("change",event=>{collectionSort=event.target.value;renderCollection(root,key);});
    $$('[data-view-item]',root).forEach(button=>button.addEventListener("click",()=>openSiteDetail(key,button.dataset.viewItem)));$$('[data-edit-item]',root).forEach(button=>button.addEventListener("click",()=>openItemModal(key,button.dataset.editItem)));$$('[data-duplicate-item]',root).forEach(button=>button.addEventListener("click",()=>duplicateItem(key,button.dataset.duplicateItem)));$$('[data-delete-item]',root).forEach(button=>button.addEventListener("click",()=>deleteItem(key,button.dataset.deleteItem)));$$('[data-toggle-item]',root).forEach(button=>button.addEventListener("click",()=>toggleItem(key,button.dataset.toggleItem)));applyPermissionState(root,key);
  }

  function roleOptions(selected) { return Object.keys(V250_ROLE_PROFILES).map(role=>`<option value="${escapeHTML(role)}" ${role===selected?"selected":""}>${escapeHTML(role)}</option>`).join(""); }
  function securityAreaOptions(selected=[]) {
    const areas=[["site","Site e temas"],["conteudo","Conteúdo editorial"],["comercial","Comercial"],["integracoes","Integrações"],["publicacao","Publicação"],["financeiro","Faturas e contrato"],["auditoria","Auditoria"],["backup","Backup"],["usuarios","Usuários"]];
    return `<fieldset class="field full checkbox-fieldset"><legend>Áreas permitidas</legend><div class="checkbox-grid permission-area-grid">${areas.map(([id,label])=>`<label><input type="checkbox" name="areas" value="${id}" ${selected.includes("*")||selected.includes(id)?"checked":""}><span>${label}</span></label>`).join("")}</div></fieldset>`;
  }
  function openAccessUserModal(id=null) {
    if(!requirePermission("manage_users","usuarios"))return;ensureV250State();const user=id?state.security.users.find(entry=>entry.id===id):{perfil:"Editor",areas:[],status:"Convite pendente",ativo:true,exigir2FA:false};if(!user)return;
    accessEditingId=id;$("#access-user-title").textContent=id?"Editar usuário":"Novo usuário";
    $("#access-user-fields").innerHTML=`<div class="form-grid"><div class="field"><label for="access-name">Nome</label><input id="access-name" name="nome" value="${escapeHTML(user.nome||"")}" required></div><div class="field"><label for="access-email">E-mail</label><input id="access-email" name="email" type="email" value="${escapeHTML(user.email||"")}" required ${user.owner?"readonly":""}></div><div class="field"><label for="access-role">Perfil</label><select id="access-role" name="perfil" ${user.owner?"disabled":""}>${roleOptions(user.perfil)}</select></div><div class="field"><label for="access-status">Situação</label><select id="access-status" name="status" ${user.owner?"disabled":""}><option ${user.status==="Ativo"?"selected":""}>Ativo</option><option ${user.status==="Convite pendente"?"selected":""}>Convite pendente</option><option ${user.status==="Suspenso"?"selected":""}>Suspenso</option></select></div>${securityAreaOptions(user.areas||[])}<div class="field full"><div class="toggle-row"><div><strong>Exigir autenticação em duas etapas</strong><small>Recomendado para administradores e publicação.</small></div><label class="switch"><input type="checkbox" name="exigir2FA" ${user.exigir2FA?"checked":""}><span></span></label></div></div></div>`;
    $("#access-user-modal").showModal();
  }
  function saveAccessUser(event) {
    event.preventDefault();if(event.submitter?.value==="cancel"){$("#access-user-modal").close();return;}if(!requirePermission("manage_users","usuarios"))return;
    const form=new FormData(event.currentTarget),email=String(form.get("email")||"").trim().toLowerCase(),nome=String(form.get("nome")||"").trim();if(!nome||!email)return notify("Informe nome e e-mail válidos.","error");
    const duplicate=state.security.users.find(user=>user.id!==accessEditingId&&user.email===email);if(duplicate)return notify("Já existe um usuário com este e-mail.","error");
    const existing=accessEditingId?state.security.users.find(user=>user.id===accessEditingId):null;const perfil=existing?.owner?"Administrador":String(form.get("perfil")||"Somente leitura"),status=existing?.owner?"Ativo":String(form.get("status")||"Convite pendente");
    const user=existing||{id:uid("user"),criadoEm:new Date().toISOString(),owner:false};user.nome=nome;user.email=email;user.perfil=perfil;user.status=status;user.ativo=status!=="Suspenso";user.areas=existing?.owner?["*"]:form.getAll("areas").map(String);user.exigir2FA=form.has("exigir2FA");user.atualizadoEm=new Date().toISOString();
    if(!existing)state.security.users.push(user);recordAudit(existing?"usuario.editado":"usuario.criado","usuarios","usuario",`${nome} • ${perfil}`);persist(false);$("#access-user-modal").close();accessEditingId=null;renderUsers($("#page-root"));notify(existing?"Usuário atualizado.":"Usuário configurado.","success");
  }
  function toggleAccessUser(id) {
    if(!requirePermission("manage_users","usuarios"))return;const user=state.security.users.find(entry=>entry.id===id);if(!user||user.owner)return notify("O administrador principal não pode ser suspenso.","error");user.ativo=user.ativo===false;user.status=user.ativo?"Ativo":"Suspenso";user.atualizadoEm=new Date().toISOString();recordAudit("usuario.status","usuarios","usuario",`${user.email}: ${user.status}`);persist(false);renderUsers($("#page-root"));
  }
  function deleteAccessUser(id) {
    if(!requirePermission("manage_users","usuarios"))return;const user=state.security.users.find(entry=>entry.id===id);if(!user||user.owner)return notify("O administrador principal não pode ser excluído.","error");if(!confirm(`Excluir o acesso de “${user.nome}”?`))return;state.security.users=state.security.users.filter(entry=>entry.id!==id);recordAudit("usuario.excluido","usuarios","usuario",user.email);persist(false);renderUsers($("#page-root"));notify("Usuário removido.","success");
  }

  function renderUsers(root) {
    ensureV250State();const client=dashboardData?.cliente||{},current=currentAccessUser(),canManage=canAccess("manage_users","usuarios"),users=state.security.users;
    root.innerHTML=`${pageHeader("Usuários e permissões","Controle perfis, áreas, situação, autenticação em duas etapas e acesso ao CMS.",canManage?`<button class="button primary" id="new-access-user" type="button">+ Novo usuário</button>`:"")}
      <div class="editorial-kpis"><article><span>Usuários configurados</span><strong>${users.length}</strong></article><article><span>Acessos ativos</span><strong>${users.filter(user=>user.ativo!==false).length}</strong></article><article><span>Administradores</span><strong>${users.filter(user=>user.perfil==="Administrador"&&user.ativo!==false).length}</strong></article><article><span>2FA exigida</span><strong>${users.filter(user=>user.exigir2FA).length}</strong></article></div>
      <div class="grid-2"><section class="card"><header class="card-header"><div><h3>Acesso atual</h3><p>Permissões aplicadas nesta sessão.</p></div><span class="badge active">${escapeHTML(current.perfil)}</span></header><div class="card-body"><div class="status-list"><div class="health-row"><div><strong>${escapeHTML(current.nome||client.nome||"Cliente")}</strong><span>${escapeHTML(current.email||client.email||"")}</span></div><span class="badge active">${escapeHTML(current.status||"Ativo")}</span></div><div class="notice">O administrador principal permanece protegido contra suspensão e exclusão. Contas adicionais são salvas no CMS para integração segura com o Worker.</div></div></div></section>
      <form class="card" id="password-form"><header class="card-header"><div><h3>Alterar minha senha</h3><p>Use ao menos 8 caracteres.</p></div></header><div class="card-body"><div class="form-grid">${fieldHTML("senhaAtual","Senha atual","password","",true)}${fieldHTML("novaSenha","Nova senha","password","",true)}${fieldHTML("confirmacao","Confirmar nova senha","password","",true)}</div></div><footer class="card-footer"><button class="button primary" type="submit">Atualizar senha</button></footer></form></div>
      <section class="table-card" style="margin-top:18px"><div class="table-toolbar"><div><strong>Equipe com acesso</strong><small>Perfis e áreas são aplicados ao menu e às ações do painel.</small></div><span class="badge info">${users.length} usuário${users.length===1?"":"s"}</span></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Usuário</th><th>Perfil e áreas</th><th>Segurança</th><th>Situação</th><th style="text-align:right">Ações</th></tr></thead><tbody>${users.map(user=>`<tr><td><div class="row-main"><span class="row-thumb row-thumb-placeholder">${escapeHTML(initials(user.nome))}</span><div><strong>${escapeHTML(user.nome)}</strong><small>${escapeHTML(user.email)}</small></div></div></td><td><strong>${escapeHTML(user.perfil)}</strong><small>${escapeHTML((user.areas||[]).includes("*")?"Todas as áreas":(user.areas||[]).map(area=>statusLabel(area)).join(", ")||"Áreas do perfil")}</small></td><td><span class="badge ${user.exigir2FA?"active":"info"}">${user.exigir2FA?"2FA exigida":"2FA opcional"}</span><small>${user.ultimoAcesso?`Último acesso: ${formatDateTime(user.ultimoAcesso)}`:"Sem acesso registrado"}</small></td><td><span class="badge ${user.ativo!==false?"active":"inactive"}">${escapeHTML(user.status||"Ativo")}</span>${user.owner?`<small>Administrador principal</small>`:""}</td><td><div class="row-actions"><button class="button small secondary" data-access-edit="${user.id}" type="button">Editar</button>${user.owner?"":`<button class="button small ghost" data-access-toggle="${user.id}" type="button">${user.ativo!==false?"Suspender":"Ativar"}</button><button class="button small danger" data-access-delete="${user.id}" type="button">Excluir</button>`}</div></td></tr>`).join("")}</tbody></table></div></section>
      <section class="card" style="margin-top:18px"><header class="card-header"><div><h3>Matriz de perfis</h3><p>Permissões padrão aplicadas a cada função.</p></div></header><div class="card-body"><div class="permission-profile-grid">${Object.values(V250_ROLE_PROFILES).map(profile=>`<article class="permission-profile-card"><strong>${escapeHTML(profile.label)}</strong><p>${escapeHTML(profile.description)}</p><div>${profile.actions.map(action=>`<span>${escapeHTML(action)}</span>`).join("")}</div></article>`).join("")}</div></div></section>`;
    $("#new-access-user")?.addEventListener("click",()=>openAccessUserModal());$("#password-form")?.addEventListener("submit",changePassword);$$('[data-access-edit]',root).forEach(button=>button.addEventListener("click",()=>openAccessUserModal(button.dataset.accessEdit)));$$('[data-access-toggle]',root).forEach(button=>button.addEventListener("click",()=>toggleAccessUser(button.dataset.accessToggle)));$$('[data-access-delete]',root).forEach(button=>button.addEventListener("click",()=>deleteAccessUser(button.dataset.accessDelete)));applyPermissionState(root,"usuarios");
  }

  async function changePassword(event) {
    event.preventDefault();const form=new FormData(event.currentTarget),nova=String(form.get("novaSenha")||""),confirmacao=String(form.get("confirmacao")||"");if(nova.length<8)return notify("A nova senha deve ter ao menos 8 caracteres.","error");if(nova!==confirmacao)return notify("A confirmação não corresponde à nova senha.","error");
    try{const result=await api("/api/cliente/trocar-senha",{method:"POST",body:JSON.stringify({senhaAtual:form.get("senhaAtual"),novaSenha:nova})});event.currentTarget.reset();recordAudit("senha.alterada","usuarios","conta","Senha do usuário atual alterada.");notify(result.mensagem||"Senha atualizada.","success");}catch(error){recordAudit("senha.falha","usuarios","conta",error.message,"error");notify(error.message,"error");}
  }

  function stableBackupData() {
    ensureV250State();const copy=JSON.parse(JSON.stringify(state));copy.backup={settings:{...state.backup.settings},snapshots:[]};return copy;
  }
  function checksumText(text) { let hash=2166136261;for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}return(`00000000${(hash>>>0).toString(16)}`).slice(-8); }
  function contentCounts(data=state) { const result={};Object.entries(data.content||{}).forEach(([key,value])=>{if(Array.isArray(value))result[key]=value.length;});return result; }
  function createSnapshot(label="Ponto de restauração",source="manual") {
    ensureV250State();const data=stableBackupData(),json=JSON.stringify(data),snapshot={id:uid("snapshot"),label,source,createdAt:new Date().toISOString(),checksum:checksumText(json),size:json.length,counts:contentCounts(data),data:json};state.backup.snapshots.unshift(snapshot);state.backup.snapshots=state.backup.snapshots.slice(0,state.backup.settings.maxSnapshots);recordAudit("backup.criado","backup","snapshot",`${label} • ${source}`);return snapshot;
  }
  function downloadBlob(filename,content,type="application/json") { const blob=new Blob([content],{type}),a=document.createElement("a"),url=URL.createObjectURL(blob);a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0); }
  function backupEnvelope(data=stableBackupData()) { const payload=JSON.stringify(data);return{format:"crb-cms-backup",version:"3.0.0-stage1",schemaVersion:13,generatedAt:new Date().toISOString(),checksum:checksumText(payload),counts:contentCounts(data),data}; }
  function exportBackup() { if(!requirePermission("export","backup"))return;const envelope=backupEnvelope();downloadBlob(`crb-cms-backup-v3.0.0-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(envelope,null,2));recordAudit("backup.exportado","backup","arquivo",envelope.checksum);notify("Backup completo gerado.","success"); }
  function downloadSnapshot(id) { if(!requirePermission("export","backup"))return;const snapshot=state.backup.snapshots.find(item=>item.id===id);if(!snapshot)return;const data=JSON.parse(snapshot.data);downloadBlob(`crb-ponto-${slugify(snapshot.label)}-${snapshot.createdAt.slice(0,10)}.json`,JSON.stringify(backupEnvelope(data),null,2));recordAudit("backup.snapshot_exportado","backup","snapshot",snapshot.label); }
  function restoreSnapshot(id) { if(!requirePermission("backup","backup"))return;const snapshot=state.backup.snapshots.find(item=>item.id===id);if(!snapshot)return;if(checksumText(snapshot.data)!==snapshot.checksum)return notify("Este ponto de restauração está corrompido.","error");if(!confirm(`Restaurar “${snapshot.label}”? O estado atual será preservado em um novo ponto.`))return;const existing=[...state.backup.snapshots];createSnapshot("Antes da restauração","automático");const preserved=[...state.backup.snapshots];state=deepMerge(defaultState(),JSON.parse(snapshot.data));ensureV250State();state.backup.snapshots=preserved;recordAudit("backup.restaurado","backup","snapshot",snapshot.label);persist(false);renderPage();notify("Ponto de restauração carregado. Salve o rascunho para confirmar no servidor.","success"); }
  function deleteSnapshot(id) { if(!requirePermission("backup","backup"))return;const snapshot=state.backup.snapshots.find(item=>item.id===id);if(!snapshot)return;if(!confirm(`Excluir o ponto “${snapshot.label}”?`))return;state.backup.snapshots=state.backup.snapshots.filter(item=>item.id!==id);recordAudit("backup.excluido","backup","snapshot",snapshot.label);persist(false);renderBackup($("#page-root")); }
  function importBackup(file) {
    if(!requirePermission("backup","backup"))return;const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(reader.result),data=parsed?.format==="crb-cms-backup"?parsed.data:parsed;if(parsed?.format==="crb-cms-backup"){const actual=checksumText(JSON.stringify(data));if(parsed.checksum!==actual)throw new Error("A verificação de integridade do backup falhou.");}if(!data?.radio||!data?.modules||!data?.content)throw new Error("Estrutura inválida");if(confirm("Importar este backup e substituir o conteúdo atual no editor?")){if(state.backup.settings.autoBeforeImport)createSnapshot("Antes da importação","automático");const snapshots=[...state.backup.snapshots];state=deepMerge(defaultState(),data);ensureV250State();state.backup.snapshots=snapshots;recordAudit("backup.importado","backup","arquivo",file.name);persist(false);renderPage();notify("Backup importado e validado.","success");}}catch(error){recordAudit("backup.importacao_falhou","backup","arquivo",error.message,"error");notify(error.message||"Arquivo de backup inválido.","error");}};reader.readAsText(file);
  }

  function renderBackup(root) {
    ensureV250State();const snapshots=state.backup.snapshots,totalSize=snapshots.reduce((sum,item)=>sum+Number(item.size||0),0);
    root.innerHTML=`${pageHeader("Backup e recuperação","Exporte, valide, crie pontos de restauração e recupere o CMS com segurança.",canAccess("backup","backup")?`<button class="button primary" id="create-snapshot" type="button">Criar ponto agora</button>`:"")}
      <div class="editorial-kpis"><article><span>Pontos disponíveis</span><strong>${snapshots.length}</strong></article><article><span>Limite configurado</span><strong>${state.backup.settings.maxSnapshots}</strong></article><article><span>Espaço estimado</span><strong>${Math.ceil(totalSize/1024)} KB</strong></article><article><span>Schema</span><strong>13</strong></article></div>
      <div class="grid-3"><section class="card"><div class="card-body"><h3>Exportar backup completo</h3><p class="field-help">Arquivo com metadados, contagens e checksum de integridade.</p><button class="button primary" id="export-backup" type="button">Baixar backup</button></div></section><section class="card"><div class="card-body"><h3>Importar e validar</h3><p class="field-help">Confere estrutura e checksum antes de carregar os dados.</p><button class="button secondary" id="import-backup" type="button">Selecionar arquivo</button></div></section><section class="card"><div class="card-body"><h3>Recarregar do servidor</h3><p class="field-help">Descarta alterações locais e recupera o último rascunho do D1.</p><button class="button danger" id="reset-demo" type="button">Recarregar dados</button></div></section></div>
      <section class="card" style="margin-top:18px"><header class="card-header"><div><h3>Automação de segurança</h3><p>Proteções antes de operações críticas.</p></div></header><div class="card-body"><form id="backup-settings" class="form-grid"><div class="field full"><div class="toggle-row"><div><strong>Ponto automático antes de importar</strong><small>Preserva o estado atual antes de substituir dados.</small></div><label class="switch"><input type="checkbox" name="autoBeforeImport" ${state.backup.settings.autoBeforeImport?"checked":""}><span></span></label></div><div class="toggle-row"><div><strong>Ponto automático antes de publicar</strong><small>Cria uma referência antes de enviar para revisão.</small></div><label class="switch"><input type="checkbox" name="autoBeforePublication" ${state.backup.settings.autoBeforePublication?"checked":""}><span></span></label></div></div><div class="field"><label for="max-snapshots">Máximo de pontos</label><input id="max-snapshots" name="maxSnapshots" type="number" min="1" max="10" value="${state.backup.settings.maxSnapshots}"></div><div class="field"><button class="button secondary" type="submit">Salvar automação</button></div></form></div></section>
      <section class="table-card" style="margin-top:18px"><div class="table-toolbar"><div><strong>Pontos de restauração</strong><small>O conteúdo atual é preservado antes de restaurar outro ponto.</small></div><span class="badge info">${snapshots.length}</span></div>${snapshots.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Ponto</th><th>Origem</th><th>Conteúdo</th><th>Integridade</th><th style="text-align:right">Ações</th></tr></thead><tbody>${snapshots.map(item=>`<tr><td><strong>${escapeHTML(item.label)}</strong><small>${formatDateTime(item.createdAt)}</small></td><td>${escapeHTML(item.source)}</td><td><small>${Object.values(item.counts||{}).reduce((a,b)=>a+Number(b||0),0)} registros • ${Math.ceil(Number(item.size||0)/1024)} KB</small></td><td><span class="badge ${checksumText(item.data||"")===item.checksum?"active":"inactive"}">${checksumText(item.data||"")===item.checksum?"Íntegro":"Corrompido"}</span></td><td><div class="row-actions"><button class="button small primary" data-snapshot-restore="${item.id}" type="button">Restaurar</button><button class="button small secondary" data-snapshot-download="${item.id}" type="button">Baixar</button><button class="button small danger" data-snapshot-delete="${item.id}" type="button">Excluir</button></div></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty-state"><strong>Nenhum ponto criado</strong><span>Crie um ponto antes de grandes alterações.</span></div>`}</section>
      <section class="card" style="margin-top:18px"><header class="card-header"><div><h3>Sobre esta instalação</h3><p>Informações técnicas.</p></div></header><div class="card-body"><div class="code-box">Modo: produção integrada\nVersão: ${CONFIG.VERSION||"3.0.0-stage1"}\nSchema: 13\nPersistência: Cloudflare D1\nAPI: ${CONFIG.WORKER_URL||"não configurada"}\nÚltima alteração: ${formatDateTime(state.updatedAt)}</div></div></section>`;
    $("#create-snapshot")?.addEventListener("click",()=>{createSnapshot("Ponto manual","manual");persist(false);renderBackup(root);notify("Ponto de restauração criado.","success");});$("#export-backup")?.addEventListener("click",exportBackup);$("#import-backup")?.addEventListener("click",()=>$("#backup-import").click());$("#reset-demo")?.addEventListener("click",()=>{if(confirm("Descartar alterações não salvas e recarregar o rascunho do servidor?")){createSnapshot("Antes de recarregar servidor","automático");recordAudit("servidor.recarregado","backup","site","Recarga solicitada");loadAll();}});
    $("#backup-settings")?.addEventListener("submit",event=>{event.preventDefault();if(!requirePermission("backup","backup"))return;const form=new FormData(event.currentTarget);state.backup.settings.autoBeforeImport=form.has("autoBeforeImport");state.backup.settings.autoBeforePublication=form.has("autoBeforePublication");state.backup.settings.maxSnapshots=Math.max(1,Math.min(10,Number(form.get("maxSnapshots")||5)));state.backup.snapshots=state.backup.snapshots.slice(0,state.backup.settings.maxSnapshots);recordAudit("backup.configurado","backup","configuracao",`Máximo ${state.backup.settings.maxSnapshots}`);persist(false);renderBackup(root);notify("Automação de backup atualizada.","success");});
    $$('[data-snapshot-restore]',root).forEach(button=>button.addEventListener("click",()=>restoreSnapshot(button.dataset.snapshotRestore)));$$('[data-snapshot-download]',root).forEach(button=>button.addEventListener("click",()=>downloadSnapshot(button.dataset.snapshotDownload)));$$('[data-snapshot-delete]',root).forEach(button=>button.addEventListener("click",()=>deleteSnapshot(button.dataset.snapshotDelete)));applyPermissionState(root,"backup");
  }

  function auditCheck(id,label,status="pass",details="") { return {id,label,status,details}; }
  function duplicateValues(values) { const seen=new Set(),duplicates=new Set();values.filter(Boolean).forEach(value=>{const key=String(value).trim().toLowerCase();if(seen.has(key))duplicates.add(key);seen.add(key);});return [...duplicates]; }
  function runFunctionalAudit({save=true}={}) {
    ensureV250State();const checks=[];
    const requiredDom=["login-view","app-shell","sidebar-nav","page-root","editor-modal","preview-dialog","site-content-dialog","access-user-modal","backup-import","connection-chip"];requiredDom.forEach(id=>checks.push(auditCheck(`dom-${id}`,`Componente #${id}`,document.getElementById(id)?"pass":"fail",document.getElementById(id)?"Disponível":"Elemento ausente")));
    const navIds=navItems.filter(item=>item.id).map(item=>item.id),navDup=duplicateValues(navIds);checks.push(auditCheck("nav-unique","Rotas do menu sem duplicidade",navDup.length?"fail":"pass",navDup.length?navDup.join(", "):`${navIds.length} áreas registradas`));
    navIds.forEach(id=>checks.push(auditCheck(`route-${id}`,`Rota ${id}`,(["dashboard","radio","editor","themes","usuarios","auditoria","producao","publicacao","faturas","contrato"].includes(id)||schemas[id]||["whatsapp","redes","seo","dominio","aplicativo","configuracoes","backup"].includes(id))?"pass":"fail","Renderizador disponível")));
    Object.entries(state.content||{}).forEach(([key,items])=>{if(!Array.isArray(items))return;const ids=items.map(item=>item.id),dups=duplicateValues(ids);checks.push(auditCheck(`ids-${key}`,`${schemas[key]?.title||key}: identificadores únicos`,dups.length?"fail":"pass",`${items.length} registro(s)`));const missing=items.filter(item=>!String(item.titulo||item.nome||"").trim());checks.push(auditCheck(`title-${key}`,`${schemas[key]?.title||key}: conteúdo nomeado`,missing.length?"warning":"pass",missing.length?`${missing.length} sem título/nome`:"Todos identificados"));});
    const moduleDup=duplicateValues(state.modules.map(item=>item.id));checks.push(auditCheck("modules","Blocos do editor visual",moduleDup.length?"fail":"pass",`${state.modules.length} blocos, ${activeModules().length} ativos`));
    ensureV260EditorState();
    checks.push(auditCheck("editor-themes","Editor: opções por modelo",themes.every(theme=>state.editor.themeOptions[theme.id])?"pass":"fail",`${Object.keys(state.editor.themeOptions).length} modelos configuráveis`));
    checks.push(auditCheck("editor-blocks","Editor: opções por bloco",themes.every(theme=>modulesCatalog.every(([id])=>state.editor.blocks[theme.id]?.[id]))?"pass":"fail",`${themes.length*modulesCatalog.length} configurações isoladas`));
    const colorConfigComplete=themes.every(theme=>modulesCatalog.every(([id])=>{const options=state.editor.blocks[theme.id]?.[id];return options&&typeof options.useThemeColors==="boolean"&&editorBlockColorKeys.every(key=>/^#[0-9a-f]{6}$/i.test(options[key]||""));}));
    checks.push(auditCheck("editor-block-colors","Editor: cores por modelo e bloco",colorConfigComplete?"pass":"fail",`${themes.length*modulesCatalog.length} paletas isoladas com 6 cores`));
    const customColorWarnings=[];themes.forEach(theme=>modulesCatalog.forEach(([id])=>{const options=state.editor.blocks[theme.id]?.[id];if(options?.useThemeColors===false){const failed=blockContrastChecks(options).filter(item=>!item.pass);if(failed.length)customColorWarnings.push(`${theme.name}/${id}: ${failed.length}`);}}));
    checks.push(auditCheck("editor-block-contrast","Editor: contraste das cores personalizadas",customColorWarnings.length?"warning":"pass",customColorWarnings.slice(0,8).join("; ")||"Sem combinações personalizadas abaixo do recomendado"));
    const programConflicts=[];(state.content.programacao||[]).forEach((a,index)=>(state.content.programacao||[]).slice(index+1).forEach(b=>{if(a.ativo===false||b.ativo===false)return;const shared=normalizeDays(a.dias||a.dia).some(day=>normalizeDays(b.dias||b.dia).includes(day));if(shared&&a.inicio<b.fim&&a.fim>b.inicio)programConflicts.push(`${a.titulo} × ${b.titulo}`);}));checks.push(auditCheck("program-conflicts","Programação sem conflitos",programConflicts.length?"warning":"pass",programConflicts.slice(0,5).join("; ")||"Nenhum conflito"));
    const slugs=duplicateValues((state.content.noticias||[]).map(item=>slugify(item.slug||item.titulo)));checks.push(auditCheck("news-slugs","Notícias com endereços únicos",slugs.length?"fail":"pass",slugs.length?slugs.join(", "):"Sem duplicidades"));
    const videoUrls=duplicateValues((state.content.videos||[]).map(item=>normalizeComparableURL(item.url)));checks.push(auditCheck("video-urls","Vídeos sem URLs duplicadas",videoUrls.length?"warning":"pass",videoUrls.length?`${videoUrls.length} duplicidade(s)`:"Sem duplicidades"));
    const orphan=(state.content.publicidade||[]).filter(item=>item.anuncianteId&&!String(item.anuncianteId).startsWith("legacy:")&&!(state.content.anunciantes||[]).some(ad=>String(ad.id)===String(item.anuncianteId)));checks.push(auditCheck("campaign-advertiser","Campanhas vinculadas a anunciantes",orphan.length?"fail":"pass",orphan.length?`${orphan.length} vínculo(s) inválido(s)`:"Todos os vínculos válidos"));
    const invalidLinks=[];const linkFields={videos:["url"],promocoes:["linkParticipacao"],eventos:["linkMapa","linkInformacoes"],anunciantes:["site"],publicidade:["link"],parceiros:["link","instagram","facebook","youtube"],banners:["link"],popups:["link"]};Object.entries(linkFields).forEach(([key,fields])=>(state.content[key]||[]).forEach(item=>fields.forEach(field=>{if(item[field]&&!absoluteHttpURL(item[field]))invalidLinks.push(`${key}/${item.titulo||item.nome}/${field}`);})));checks.push(auditCheck("links","Links públicos válidos",invalidLinks.length?"fail":"pass",invalidLinks.slice(0,8).join("; ")||"Todos os links preenchidos são válidos"));
    const emails=duplicateValues(state.security.users.map(user=>user.email));checks.push(auditCheck("users-email","Usuários com e-mails únicos",emails.length?"fail":"pass",`${state.security.users.length} usuário(s)`));checks.push(auditCheck("users-admin","Administrador ativo disponível",state.security.users.some(user=>user.perfil==="Administrador"&&user.ativo!==false)?"pass":"fail","Proteção contra bloqueio total"));
    const badSnapshots=state.backup.snapshots.filter(item=>checksumText(item.data||"")!==item.checksum);checks.push(auditCheck("backup-integrity","Pontos de restauração íntegros",badSnapshots.length?"fail":"pass",`${state.backup.snapshots.length-badSnapshots.length}/${state.backup.snapshots.length} íntegros`));
    const temp=document.createElement("div");temp.className="preview-canvas desktop";try{renderSitePreview(temp);clearPreviewPopupTimer();const unlabeled=$$('button,[role="button"]',temp).filter(el=>!String(el.textContent||"").trim()&&!el.getAttribute("aria-label")&&!el.getAttribute("title"));checks.push(auditCheck("preview-buttons","Botões e cards da prévia identificados",unlabeled.length?"fail":"pass",unlabeled.length?`${unlabeled.length} sem rótulo`:`${$$('button,[role="button"]',temp).length} controles auditados`));const brokenOpen=$$('[data-site-open]',temp).filter(el=>!contentItem(el.dataset.siteOpen,el.dataset.siteId));checks.push(auditCheck("preview-content","Cards da prévia abrem conteúdo existente",brokenOpen.length?"fail":"pass",brokenOpen.length?`${brokenOpen.length} alvo(s) ausente(s)`:"Todos os alvos encontrados"));}catch(error){checks.push(auditCheck("preview-render","Renderização da prévia","fail",error.message));}
    const originalAuditTheme=state.selectedTheme;
    const themeStructures={morada:".theme-stage-regional",spotify:".theme-stage-music",news:".theme-stage-news",gospel:".theme-stage-community",young:".theme-stage-young",custom:".theme-stage-clean"};
    themes.forEach(theme=>{const probe=document.createElement("div");probe.className="preview-canvas desktop";try{state.selectedTheme=theme.id;renderSitePreview(probe);clearPreviewPopupTimer();const preview=$(`.site-preview.theme-${theme.id}`,probe),structure=$(themeStructures[theme.id],probe);const unlabeled=$$('button,[role="button"]',probe).filter(el=>!String(el.textContent||"").trim()&&!el.getAttribute("aria-label")&&!el.getAttribute("title"));const broken=$$('[data-site-open]',probe).filter(el=>!contentItem(el.dataset.siteOpen,el.dataset.siteId));checks.push(auditCheck(`theme-${theme.id}`,`${theme.name}: renderização e estrutura`,preview&&structure?"pass":"fail",preview&&structure?`${themeLayoutLabel(theme.layout)} carregada`:`Estrutura ${themeStructures[theme.id]} ausente`));checks.push(auditCheck(`theme-buttons-${theme.id}`,`${theme.name}: controles identificados`,unlabeled.length?"fail":"pass",unlabeled.length?`${unlabeled.length} sem rótulo`:`${$$('button,[role="button"]',probe).length} controles`));checks.push(auditCheck(`theme-content-${theme.id}`,`${theme.name}: conteúdo navegável`,broken.length?"fail":"pass",broken.length?`${broken.length} alvo(s) ausente(s)`:"Todos os cards apontam para conteúdo existente"));}catch(error){checks.push(auditCheck(`theme-${theme.id}`,`${theme.name}: renderização`,"fail",error.message));}});
    state.selectedTheme=originalAuditTheme;
    const pageButtons=$$('button',document).filter(button=>!String(button.textContent||"").trim()&&!button.getAttribute("aria-label")&&!button.getAttribute("title"));checks.push(auditCheck("page-buttons","Botões da tela atual identificados",pageButtons.length?"fail":"pass",pageButtons.length?`${pageButtons.length} sem rótulo`:`${$$('button',document).length} botões verificados`));
    const strictProfiles=Object.values(workerImageSpecs).filter(spec=>Number(spec.width)>0&&Number(spec.height)>0&&Number(spec.maxKB)>0);
    checks.push(auditCheck("image-strict-profiles","Imagens: padrões obrigatórios configurados",strictProfiles.length===Object.keys(workerImageSpecs).length?"pass":"fail",`${strictProfiles.length}/${Object.keys(workerImageSpecs).length} perfis com largura, altura e peso máximo`));
    checks.push(auditCheck("image-client-validation","Imagens: validação antes do envio","pass","Formato, peso e dimensões exatas são conferidos no Portal antes da chamada de mídia"));
    const totals={pass:checks.filter(c=>c.status==="pass").length,warning:checks.filter(c=>c.status==="warning").length,fail:checks.filter(c=>c.status==="fail").length};const run={id:uid("run"),timestamp:new Date().toISOString(),version:"3.0.0-stage1",checks,totals};
    if(save){state.audit.functionalRuns.unshift(run);state.audit.functionalRuns=state.audit.functionalRuns.slice(0,10);recordAudit("auditoria.executada","auditoria","sistema",`${totals.pass} aprovadas, ${totals.warning} alertas, ${totals.fail} falhas`,totals.fail?"error":totals.warning?"warning":"success");persist(false);}return run;
  }
  function exportAuditCSV() { if(!requirePermission("export","auditoria"))return;const rows=[["Data/hora","Resultado","Ação","Área","Alvo","Usuário","Detalhes"],...state.audit.entries.map(item=>[item.timestamp,item.result,item.action,item.area,item.target,item.actor?.email||item.actor?.nome||"",item.details])];const csv=rows.map(row=>row.map(value=>`"${String(value??"").replaceAll('"','""')}"`).join(";")).join("\n");downloadBlob(`crb-auditoria-${new Date().toISOString().slice(0,10)}.csv`,`\ufeff${csv}`,"text/csv;charset=utf-8");recordAudit("auditoria.exportada","auditoria","csv",`${state.audit.entries.length} eventos`); }
  function renderAudit(root) {
    ensureV250State();const last=state.audit.functionalRuns[0]||null,entries=state.audit.entries.filter(item=>auditFilter==="todos"||item.result===auditFilter);
    root.innerHTML=`${pageHeader("Auditoria integrada","Verifique botões, conteúdos, vínculos, rotas, permissões, backups e registre todas as alterações.",`<button class="button secondary" id="export-audit" type="button">Exportar CSV</button><button class="button primary" id="run-audit" type="button">Executar auditoria completa</button>`)}
      <div class="editorial-kpis"><article><span>Verificações aprovadas</span><strong>${last?.totals.pass||0}</strong></article><article><span>Alertas</span><strong>${last?.totals.warning||0}</strong></article><article><span>Falhas</span><strong>${last?.totals.fail||0}</strong></article><article><span>Eventos registrados</span><strong>${state.audit.entries.length}</strong></article></div>
      <section class="card"><header class="card-header"><div><h3>Última auditoria funcional</h3><p>${last?`Executada em ${formatDateTime(last.timestamp)}`:"Ainda não executada nesta base."}</p></div>${last?`<span class="badge ${last.totals.fail?"inactive":last.totals.warning?"info":"active"}">${last.totals.fail?"Requer correção":last.totals.warning?"Com alertas":"Aprovada"}</span>`:""}</header><div class="card-body">${last?`<div class="audit-check-grid">${last.checks.map(check=>`<article class="audit-check ${check.status}"><span aria-hidden="true">${check.status==="pass"?"✓":check.status==="warning"?"!":"×"}</span><div><strong>${escapeHTML(check.label)}</strong><small>${escapeHTML(check.details||"")}</small></div></article>`).join("")}</div>`:`<div class="empty-state"><strong>Execute a auditoria completa</strong><span>Ela verifica estrutura, conteúdo, links, cards, botões, usuários e backups.</span></div>`}</div></section>
      <section class="table-card" style="margin-top:18px"><div class="table-toolbar"><div><strong>Histórico de atividades</strong><small>Alterações e operações críticas registradas no rascunho.</small></div><div class="collection-filters"><select id="audit-filter"><option value="todos">Todos os resultados</option><option value="success" ${auditFilter==="success"?"selected":""}>Sucesso</option><option value="warning" ${auditFilter==="warning"?"selected":""}>Alertas</option><option value="error" ${auditFilter==="error"?"selected":""}>Erros</option><option value="denied" ${auditFilter==="denied"?"selected":""}>Permissão negada</option></select>${canAccess("audit","auditoria")?`<button class="button small danger" id="clear-audit" type="button">Limpar histórico</button>`:""}</div></div>${entries.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Data</th><th>Ação</th><th>Usuário</th><th>Resultado</th><th>Detalhes</th></tr></thead><tbody>${entries.slice(0,250).map(item=>`<tr><td><strong>${formatDateTime(item.timestamp)}</strong><small>${escapeHTML(item.area)}</small></td><td>${escapeHTML(item.action)}</td><td><strong>${escapeHTML(item.actor?.nome||"Cliente")}</strong><small>${escapeHTML(item.actor?.email||"")}</small></td><td><span class="badge ${item.result==="success"?"active":item.result==="warning"?"info":"inactive"}">${escapeHTML(item.result)}</span></td><td>${escapeHTML(item.details||item.target||"—")}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty-state"><strong>Nenhum evento neste filtro</strong></div>`}</section>`;
    $("#run-audit")?.addEventListener("click",()=>{if(!requirePermission("audit","auditoria"))return;runFunctionalAudit();renderAudit(root);notify("Auditoria completa concluída.","success");});$("#export-audit")?.addEventListener("click",exportAuditCSV);$("#audit-filter")?.addEventListener("change",event=>{auditFilter=event.target.value;renderAudit(root);});$("#clear-audit")?.addEventListener("click",()=>{if(!confirm("Limpar o histórico de auditoria?"))return;state.audit.entries=[];recordAudit("auditoria.historico_limpo","auditoria","historico","Histórico reiniciado");persist(false);renderAudit(root);});applyPermissionState(root,"auditoria");
  }


  function productionCheck(id,label,status,details,group="portal",blocking=false) {
    return {id,label,status,details,group,blocking:Boolean(blocking)};
  }

  function countImageReferences(value, seen=new Set()) {
    if (!value || typeof value !== "object" || seen.has(value)) return 0;
    seen.add(value); let total=0;
    Object.entries(value).forEach(([key,item])=>{
      if (["imagem","foto","logo","capa","hero","playerImage","imagemDesktop","imagemMobile","icone","qrcode"].includes(key) && typeof item === "string" && item.trim()) total++;
      else if (item && typeof item === "object") total+=countImageReferences(item,seen);
    });
    return total;
  }

  function validEmail(value="") { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim()); }
  function validHttpURL(value="") { try { const url=new URL(String(value));return ["http:","https:"].includes(url.protocol); } catch { return false; } }

  function buildProductionAnalysis() {
    ensureV250State();
    const checks=[];
    const workerURL=String(CONFIG.WORKER_URL||"");
    const pageProtocol=location.protocol;
    const enabledModules=state.modules.filter(item=>item.enabled!==false).length;
    const lastAudit=state.audit.functionalRuns[0]||null;
    const owner=state.security.users.find(user=>user.owner);
    const imageRefs=countImageReferences({radio:state.radio,content:state.content,integrations:state.integrations});
    const domain=state.integrations.dominio.proprio || state.integrations.dominio.atual;

    checks.push(productionCheck("portal-https","Portal servido por HTTPS",pageProtocol==="https:"?"pass":(["file:","about:"].includes(pageProtocol)||((location.hostname==="localhost"||location.hostname==="127.0.0.1")&&pageProtocol==="http:")?"warning":"fail"),pageProtocol==="https:"?"Conexão segura ativa.":`Protocolo atual: ${pageProtocol}. No ambiente público, use HTTPS.`,"portal",true));
    checks.push(productionCheck("worker-url","URL do Worker segura",workerURL.startsWith("https://")?"pass":"fail",workerURL||"WORKER_URL não configurada.","portal",true));
    checks.push(productionCheck("worker-reachable","Comunicação com o Worker",workerReachable===true?"pass":workerReachable===false?"fail":"warning",workerReachable===true?"Últimas chamadas respondidas.":workerReachable===false?"Falha de comunicação detectada.":"Aguardando uma chamada à API.","portal",true));
    checks.push(productionCheck("session","Sessão autenticada",authToken?"pass":"fail",authToken?"Token mantido apenas na sessão do navegador.":"Nenhuma sessão ativa.","portal",true));
    checks.push(productionCheck("site-loaded","Rascunho do site carregado",remoteSite?"pass":"fail",remoteSite?`Site ${remoteSite.id||"carregado"}.`:"O Worker não retornou um site editável.","portal",true));
    checks.push(productionCheck("identity-name","Nome da emissora",state.radio.nome.trim()?"pass":"fail",state.radio.nome.trim()||"Nome não informado.","conteudo",true));
    checks.push(productionCheck("identity-email","E-mail de contato",validEmail(state.radio.email)?"pass":"fail",state.radio.email||"E-mail não informado.","conteudo",true));
    checks.push(productionCheck("identity-location","Cidade e estado",state.radio.cidade.trim()&&state.radio.estado.trim()?"pass":"warning",state.radio.cidade&&state.radio.estado?`${state.radio.cidade}/${state.radio.estado}`:"Complete a localização pública.","conteudo",false));
    checks.push(productionCheck("stream","Stream da rádio",validHttpURL(state.radio.streamUrl)?"pass":"fail",state.radio.streamUrl||"URL do stream não informada.","conteudo",true));
    checks.push(productionCheck("domain","Domínio ou subdomínio",domain?"pass":"warning",domain||"Nenhum domínio apresentado pelo Worker.","conteudo",false));
    checks.push(productionCheck("theme","Modelo visual selecionado",themes.some(theme=>theme.id===state.selectedTheme)?"pass":"fail",themeById(state.selectedTheme).name,"conteudo",true));
    checks.push(productionCheck("modules","Blocos ativos",enabledModules>0?"pass":"fail",`${enabledModules} de ${state.modules.length} blocos ativos.`,"conteudo",true));
    checks.push(productionCheck("image-client-validation","Validação preventiva de novas imagens","pass","Dimensões, formato e peso são verificados antes do envio.","conteudo",false));
    checks.push(productionCheck("legacy-images","Imagens já cadastradas",imageRefs?"warning":"pass",imageRefs?`${imageRefs} referência(s) existente(s) exigem revisão visual; o navegador não consegue garantir dimensões de arquivos remotos antigos.`:"Nenhuma imagem legada pendente.","conteudo",false));
    checks.push(productionCheck("functional-audit","Auditoria funcional do CMS",!lastAudit?"warning":lastAudit.totals.fail?"fail":"pass",!lastAudit?"Execute a Auditoria integrada.":`${lastAudit.totals.pass} aprovadas, ${lastAudit.totals.warning} alertas e ${lastAudit.totals.fail} falhas.`,"qualidade",Boolean(lastAudit?.totals.fail)));
    checks.push(productionCheck("backup","Ponto de restauração",state.backup.snapshots.length?"pass":"warning",state.backup.snapshots.length?`${state.backup.snapshots.length} ponto(s) disponível(is).`:"Crie um ponto antes do piloto.","qualidade",false));
    checks.push(productionCheck("owner","Administrador principal protegido",owner&&owner.ativo&&owner.perfil==="Administrador"?"pass":"fail",owner?`${owner.nome} • ${owner.email}`:"Administrador principal não encontrado.","qualidade",true));
    checks.push(productionCheck("client-errors","Erros capturados nesta sessão",state.production.clientErrors.length?"warning":"pass",state.production.clientErrors.length?`${state.production.clientErrors.length} ocorrência(s) registrada(s).`:"Nenhum erro de cliente registrado.","qualidade",false));

    checks.push(productionCheck("server-permissions","Permissões validadas pelo servidor","pending","A interface restringe ações, mas cada endpoint precisa confirmar a permissão no Worker.","servidor",true));
    checks.push(productionCheck("tenant-isolation","Isolamento entre emissoras","pending","É necessário auditar consultas e gravações por cliente/site no Worker e D1.","servidor",true));
    checks.push(productionCheck("server-media","Validação de mídias no servidor","pending","A validação atual é preventiva no navegador e pode ser contornada fora da interface.","servidor",true));
    checks.push(productionCheck("session-policy","Sessões, expiração e revogação","pending","Confirmar duração real, revogação, troca de senha e invalidação de tokens no servidor.","servidor",true));
    checks.push(productionCheck("rate-limit","Proteção contra abuso e tentativas de login","pending","Confirmar rate limiting, bloqueios temporários e registros de tentativas no Worker.","servidor",true));
    checks.push(productionCheck("cors","CORS restrito aos domínios autorizados","pending","Revisar origens permitidas antes de liberar múltiplos clientes.","servidor",true));
    checks.push(productionCheck("server-backup","Backup e restauração em ambiente real","pending","Validar recuperação do D1 e das mídias fora do backup local do CMS.","servidor",true));

    const totals={
      pass:checks.filter(item=>item.status==="pass").length,
      warning:checks.filter(item=>item.status==="warning").length,
      fail:checks.filter(item=>item.status==="fail").length,
      pending:checks.filter(item=>item.status==="pending").length
    };
    const localBlockers=checks.filter(item=>item.group!=="servidor"&&item.blocking&&item.status==="fail");
    const launchBlockers=checks.filter(item=>item.blocking&&["fail","pending"].includes(item.status));
    return {id:uid("production-run"),timestamp:new Date().toISOString(),version:"3.0.0-stage1",schemaVersion:13,checks,totals,portalReady:localBlockers.length===0,productionReady:launchBlockers.length===0,localBlockers:localBlockers.map(item=>item.id),launchBlockers:launchBlockers.map(item=>item.id)};
  }

  function runProductionAnalysis({save=true,silent=false}={}) {
    const run=buildProductionAnalysis();
    if(save){
      state.production.runs.unshift(run);state.production.runs=state.production.runs.slice(0,10);
      recordAudit("producao.analisada","auditoria","pre-producao",`${run.totals.pass} aprovadas, ${run.totals.warning} alertas, ${run.totals.fail} falhas e ${run.totals.pending} pendências`,run.portalReady?"warning":"error");
      persist(false);
    }
    if(!silent)notify(run.portalReady?"Análise concluída. O Portal pode seguir para piloto controlado; a liberação geral ainda depende da auditoria do servidor.":"Análise concluída com bloqueios locais. Corrija-os antes do piloto.",run.portalReady?"success":"error");
    return run;
  }

  function productionStatusLabel(status){return status==="pass"?"Aprovado":status==="warning"?"Atenção":status==="pending"?"Pendente":"Falha";}
  function productionStatusIcon(status){return status==="pass"?"✓":status==="warning"?"!":status==="pending"?"…":"×";}

  function exportProductionReport() {
    if(!requirePermission("export","producao"))return;
    const run=state.production.runs[0]||buildProductionAnalysis();
    const report={produto:"Central Rádios Brasil — Portal do Cliente",stage:"v3.0.0 Etapa 1 — Pré-produção",generatedAt:new Date().toISOString(),workerURL:CONFIG.WORKER_URL,portalReady:run.portalReady,productionReady:run.productionReady,totals:run.totals,checks:run.checks,note:"Este relatório não comprova controles internos do Worker/D1. As pendências de servidor exigem análise separada antes do lançamento geral."};
    downloadBlob(`crb-pre-producao-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(report,null,2),"application/json;charset=utf-8");
    recordAudit("producao.relatorio_exportado","auditoria","pre-producao","Relatório JSON exportado");
  }

  function renderProductionReadiness(root) {
    ensureV250State();
    const run=state.production.runs[0]||buildProductionAnalysis();
    const groups=[
      ["portal","Portal e conexão"],
      ["conteudo","Identidade e conteúdo"],
      ["qualidade","Qualidade e recuperação"],
      ["servidor","Pendências externas — análise obrigatória, sem alterações nesta etapa"]
    ];
    const blockers=run.checks.filter(item=>item.blocking&&["fail","pending"].includes(item.status));
    root.innerHTML=`${pageHeader("Pré-produção v3.0.0","Diagnóstico de lançamento, riscos e dependências. Esta etapa não altera Worker, D1 ou outros repositórios.",`<button class="button secondary" id="export-production" type="button">Exportar relatório</button><button class="button primary" id="run-production" type="button">Executar análise</button>`)}
      <section class="production-hero ${run.portalReady?"pilot-ready":"blocked"}"><div><span class="overline">Etapa 1 — preparação segura</span><h2>${run.portalReady?"Portal apto para piloto controlado":"Existem bloqueios locais antes do piloto"}</h2><p>${run.productionReady?"Os requisitos verificados estão aprovados.":"A liberação para vários clientes permanece bloqueada até a análise e validação do servidor."}</p></div><div class="production-status-pills"><span class="production-pill ${run.portalReady?"pass":"fail"}">Portal: ${run.portalReady?"piloto possível":"corrigir"}</span><span class="production-pill ${run.productionReady?"pass":"pending"}">Produção geral: ${run.productionReady?"apta":"pendente"}</span></div></section>
      <div class="editorial-kpis production-kpis"><article><span>Aprovadas</span><strong>${run.totals.pass}</strong></article><article><span>Alertas</span><strong>${run.totals.warning}</strong></article><article><span>Falhas locais</span><strong>${run.totals.fail}</strong></article><article><span>Pendências externas</span><strong>${run.totals.pending}</strong></article></div>
      <section class="production-actions card"><div class="card-body"><div><h3>Antes de um piloto</h3><p>Crie um ponto de restauração, execute a auditoria completa e revise a publicação. A liberação geral só poderá ocorrer após a análise do Worker/D1.</p></div><div class="page-actions"><button class="button secondary" id="production-snapshot" type="button">Criar ponto de segurança</button><button class="button secondary" data-go="auditoria" type="button">Abrir auditoria</button><button class="button primary" data-go="publicacao" type="button">Revisar publicação</button></div></div></section>
      ${blockers.length?`<section class="production-blockers"><strong>Bloqueadores e pendências para o lançamento geral</strong><div>${blockers.map(item=>`<span>${escapeHTML(item.label)}</span>`).join("")}</div></section>`:""}
      <div class="production-groups">${groups.map(([id,title])=>{const items=run.checks.filter(item=>item.group===id);return`<section class="card production-group"><header class="card-header"><div><h3>${escapeHTML(title)}</h3><p>${id==="servidor"?"Somente análise documental nesta entrega; nenhuma mudança será realizada fora do Portal do Cliente.":`${items.length} verificações`}</p></div></header><div class="card-body"><div class="production-check-list">${items.map(item=>`<article class="production-check ${item.status}"><span aria-hidden="true">${productionStatusIcon(item.status)}</span><div><strong>${escapeHTML(item.label)}</strong><small>${escapeHTML(item.details)}</small></div><em>${productionStatusLabel(item.status)}</em></article>`).join("")}</div></div></section>`;}).join("")}</div>
      <section class="card production-history"><header class="card-header"><div><h3>Histórico das análises</h3><p>Últimas execuções gravadas no mesmo rascunho do CMS.</p></div><span class="badge info">${state.production.runs.length}</span></header><div class="card-body">${state.production.runs.length?`<div class="activity-list">${state.production.runs.map(item=>`<div class="activity-item"><span class="activity-dot"></span><div><strong>${item.portalReady?"Piloto possível":"Correção necessária"}</strong><p>${item.totals.pass} aprovadas • ${item.totals.warning} alertas • ${item.totals.fail} falhas • ${item.totals.pending} pendências</p></div><span class="activity-time">${formatDateTime(item.timestamp)}</span></div>`).join("")}</div>`:`<div class="empty-state"><strong>Nenhuma análise gravada</strong></div>`}</div></section>`;
    $("#run-production")?.addEventListener("click",()=>{if(!requirePermission("audit","producao"))return;runProductionAnalysis();renderProductionReadiness(root);});
    $("#export-production")?.addEventListener("click",exportProductionReport);
    $("#production-snapshot")?.addEventListener("click",()=>{if(!requirePermission("backup","backup"))return;createSnapshot("Pré-lançamento v3.0.0","manual");persist(false);renderProductionReadiness(root);notify("Ponto de segurança criado.","success");});
    bindGoButtons(root);applyPermissionState(root,"producao");
  }

  function renderPublication(root) {
    const status=remoteSite?.status_publicacao||state.status,canPublish=canAccess("publish","publicacao");
    root.innerHTML=`${pageHeader("Publicação","Revise a prévia, gere um ponto de segurança e envie o rascunho para aprovação da Central.",`<button class="button secondary" data-preview type="button">Abrir prévia</button>`)}<div class="grid-2"><section class="card"><header class="card-header"><div><h3>Situação atual</h3><p>Fluxo real de publicação.</p></div></header><div class="card-body"><div class="status-list"><div class="health-row"><div><strong>${escapeHTML(statusLabel(status))}</strong><span>${remoteSite?.solicitacao_publicacao_em?`Solicitado em ${formatDateTime(remoteSite.solicitacao_publicacao_em)}`:remoteSite?.ultima_publicacao_em?`Publicado em ${formatDateTime(remoteSite.ultima_publicacao_em)}`:"Ainda não publicado"}</span></div><span class="badge ${status==="publicado"?"active":"info"}">${escapeHTML(statusLabel(status))}</span></div><div class="notice">Salvar o rascunho não altera o site público. A publicação é revisada pela Central Rádios Brasil.</div>${state.backup.settings.autoBeforePublication?`<div class="notice" style="margin-top:10px">Um ponto de restauração será criado automaticamente antes da solicitação.</div>`:""}</div></div><footer class="card-footer"><div class="page-actions"><button class="button secondary" id="publication-save" type="button">Salvar rascunho</button><button class="button primary" id="publication-request" type="button" ${status==="aguardando_publicacao"||!canPublish?"disabled":""}>Solicitar publicação</button></div></footer></section><section class="card"><header class="card-header"><div><h3>Histórico de versões</h3><p>Últimas versões registradas no D1.</p></div></header><div class="card-body"><div class="activity-list">${versions.slice(0,12).map(v=>`<div class="activity-item"><span class="activity-dot"></span><div><strong>Versão ${Number(v.numero)}</strong><p>${escapeHTML(statusLabel(v.status))} • ${escapeHTML(statusLabel(v.autor_tipo))}</p></div><span class="activity-time">${formatDateTime(v.criado_em)}</span></div>`).join("")||`<div class="empty-state"><strong>Nenhuma versão registrada</strong></div>`}</div></div></section></div>`;
    $$('[data-preview]',root).forEach(button=>button.addEventListener("click",openPreview));$("#publication-save")?.addEventListener("click",()=>persist(true));$("#publication-request")?.addEventListener("click",requestPublication);applyPermissionState(root,"publicacao");
  }
  async function requestPublication() {
    if(activeImageProcesses.size)return notify("Aguarde a validação da imagem antes de solicitar publicação.","error");
    if(!requirePermission("publish","publicacao"))return;if(!remoteSite)return;
    const readiness=runProductionAnalysis({save:false,silent:true});
    if(readiness.localBlockers.length){currentPage="producao";renderNav();renderPage();return notify("A publicação foi bloqueada por falhas locais na análise de pré-produção.","error");}
    if(!confirm("Enviar o rascunho atual para revisão e publicação pela Central Rádios Brasil?"))return;
    try{if(state.backup.settings.autoBeforePublication)createSnapshot("Antes da solicitação de publicação","automático");await queueRemoteSave(false);const result=await api("/api/cliente/site/solicitar-publicacao",{method:"POST",body:"{}"});remoteSite.status_publicacao=result.statusPublicacao||"aguardando_publicacao";remoteSite.solicitacao_publicacao_em=new Date().toISOString();state.status=remoteSite.status_publicacao;recordAudit("publicacao.solicitada","publicacao","site",result.mensagem||"Solicitação enviada");renderPage();updateChrome();notify(result.mensagem||"Solicitação enviada.","success");}catch(error){recordAudit("publicacao.falha","publicacao","site",error.message,"error");notify(error.message,"error");}
  }

  async function loadAll() {
    if(isLoading)return;isLoading=true;resetAudio();
    try{const[dash,siteResult]=await Promise.all([api("/api/cliente/dashboard"),api("/api/cliente/site").catch(error=>error.status===404?null:Promise.reject(error))]);dashboardData=dash;remoteSite=siteResult?.site||null;versions=siteResult?.versoes||[];if(remoteSite){const media=await api("/api/cliente/site/midias").catch(()=>({midias:[]}));mediaLibrary=media.midias||[];state=mapRemoteToState(remoteSite,dashboardData);}else{state=defaultState();state.radio.nome=dash?.cliente?.nome_radio||dash?.cliente?.nome||"Minha rádio";}ensureV250State();currentPage="dashboard";searchTerm="";updateAccount();if(!$("#app-shell").classList.contains("hidden")){renderNav();updateChrome();renderPage();}}finally{isLoading=false;}
  }

  function setupV250() {
    ensureV250State();
    $("#access-user-form")?.addEventListener("submit",saveAccessUser);
    $$('#access-user-modal [value="cancel"]').forEach(button=>button.addEventListener("click",event=>{event.preventDefault();accessEditingId=null;$("#access-user-modal").close();}));
  }


  function setup() {
    $("#login-form").addEventListener("submit",login);
    $("#logout-button").addEventListener("click",logout);
    $("#save-button").addEventListener("click",()=>persist(true));
    $("#preview-top-button").addEventListener("click",openPreview);
    $("#preview-close").addEventListener("click",()=>{clearPreviewPopupTimer();closePreviewPopup($("#preview-canvas"),{restoreFocus:false});previewThemeOverride=null;$("#preview-dialog").close();});
    $("#site-content-close").addEventListener("click",()=>$("#site-content-dialog").close());
    $("#site-content-dialog").addEventListener("click",event=>{if(event.target===$("#site-content-dialog"))$("#site-content-dialog").close();});
    $("#site-content-body").addEventListener("click",event=>{const open=event.target.closest("[data-site-open]");if(open)return openSiteDetail(open.dataset.siteOpen,open.dataset.siteId);const action=event.target.closest("[data-site-action]");if(action)return runSiteAction(action.dataset.siteAction);});
    $("#preview-refresh").addEventListener("click",renderPreviewDialog);
    $$('[data-preview-device]').forEach(button=>button.addEventListener("click",()=>{ $$('[data-preview-device]').forEach(i=>i.classList.remove("active"));button.classList.add("active");$("#preview-canvas").className=`preview-canvas ${button.dataset.previewDevice}`;renderPreviewDialog();}));
    $("#menu-toggle").addEventListener("click",()=>{const sidebar=$("#sidebar");sidebar.classList.toggle("open");$("#menu-toggle").setAttribute("aria-expanded",String(sidebar.classList.contains("open")));});
    $("#editor-form").addEventListener("submit",saveModal);
    $$('#editor-modal [value="cancel"]').forEach(button=>button.addEventListener("click",event=>{event.preventDefault();editing=null;$("#editor-modal").close();}));
    $("#backup-import").addEventListener("change",event=>{const file=event.target.files?.[0];if(file)importBackup(file);event.target.value="";});
    document.addEventListener("keydown",event=>{if(event.key!=="Escape")return;const previewCanvas=$("#preview-canvas");if($(".site-popup-layer",previewCanvas)){event.preventDefault();return closePreviewPopup(previewCanvas);}if($("#site-content-dialog").open)$("#site-content-dialog").close();else if($("#preview-dialog").open){clearPreviewPopupTimer();previewThemeOverride=null;$("#preview-dialog").close();}});
    window.addEventListener("online",()=>{workerReachable=null;updateConnectionStatus();});
    window.addEventListener("offline",()=>{workerReachable=false;updateConnectionStatus();notify("Conexão perdida. Evite fechar a página até a internet voltar.","error");});
    window.addEventListener("error",event=>captureClientIssue("javascript",event.message,event.filename||""));
    window.addEventListener("unhandledrejection",event=>captureClientIssue("promise",event.reason?.message||String(event.reason||"Rejeição não tratada"),"unhandledrejection"));
    updateConnectionStatus();
    resumeSession();
  }

  setupV250();
  setup();
})();
