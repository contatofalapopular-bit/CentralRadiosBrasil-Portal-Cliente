(() => {
  "use strict";

  const CONFIG = window.CRB_CLIENTE_CONFIG;
  const state = {
    token: sessionStorage.getItem(CONFIG.TOKEN_KEY) || "",
    dashboard: null,
    site: null,
    versions: [],
    activeEditor: "inicio"
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const EDITOR_META = {
    inicio:["Painel do site","Inicial","Resumo do conteúdo e atalhos de edição."],
    principal:["Configurações","Principal","Nome, identidade e apresentação da rádio."],
    redes:["Configurações","Redes sociais","Links oficiais exibidos no site."],
    player:["Configurações","Player","Aparência e mensagens do player da rádio."],
    google:["Configurações","Serviços Google","Integrações de medição, busca e publicidade."],
    contato:["Configurações","Página Fale Conosco","Informações públicas e formulário de contato."],
    cabecalho:["Layout","Cabeçalho","Organize a parte superior do site."],
    rodape:["Layout","Rodapé","Configure a parte inferior das páginas."],
    aparencia:["Layout","Plano de fundo, cores e ícones","Personalize a identidade visual."],
    paginas:["Layout","Páginas fixas","Crie páginas institucionais adicionais."],
    menu:["Layout","Menu do site","Defina itens, links e comportamento."],
    seo:["Layout","SEO e compartilhamento","Configure buscadores e redes sociais."],
    modulos:["Módulos","Ativar e organizar módulos","Escolha as seções disponíveis no site."],
    destaques:["Conteúdo","Destaques e banners","Slides e chamadas da página inicial."],
    enquete:["Conteúdo","Enquete","Pergunta e opções para os ouvintes."],
    galeria:["Conteúdo","Galeria de fotos","Fotos da rádio, equipe e eventos."],
    locutores:["Conteúdo","Locutores","Equipe e apresentadores."],
    mural:["Conteúdo","Mural","Mensagens e participação do público."],
    noticias:["Conteúdo","Notícias","Notícias e comunicados da rádio."],
    ouvinte:["Conteúdo","Ouvinte do mês","Destaque mensal de um ouvinte."],
    parceiros:["Conteúdo","Parceiros e patrocinadores","Empresas apoiadoras da emissora."],
    pedidos:["Conteúdo","Peça sua música","Canal para pedidos dos ouvintes."],
    programacao:["Conteúdo","Programação","Grade de programas e horários."],
    publicidades:["Conteúdo","Publicidades","Banners comerciais e abertura."],
    topmusicas:["Conteúdo","Top músicas","Ranking editorial da rádio."],
    videos:["Conteúdo","Vídeos e Web TV","Vídeos incorporados e transmissão."],
    whatsapp:["Conteúdo","WhatsApp","Botão flutuante e mensagens rápidas."],
    aplicativos:["Conteúdo","Aplicativos","PWA, lojas e assistentes de voz."],
    podcasts:["Extras","Podcasts","Episódios e programas sob demanda."],
    eventos:["Extras","Agenda e eventos","Eventos e transmissões especiais."],
    promocoes:["Extras","Promoções e sorteios","Campanhas promocionais da rádio."],
    acessibilidade:["Extras","Acessibilidade","Recursos para ampliar o acesso."],
    backup:["Extras","Backup do conteúdo","Baixe uma cópia do rascunho."],
    publicacao:["Publicação","Revisão e publicação","Salve, visualize e envie para aprovação."]
  };

  const MODULES = [
    ["destaques","Destaques","Slides e chamadas da página inicial"],
    ["player","Player","Player principal da rádio"],
    ["sobre","Sobre a rádio","Apresentação institucional"],
    ["programacao","Programação","Grade de programas"],
    ["locutores","Locutores","Equipe e apresentadores"],
    ["noticias","Notícias","Notícias e comunicados"],
    ["galeria","Galeria de fotos","Fotos e álbuns"],
    ["parceiros","Parceiros","Patrocinadores e apoiadores"],
    ["enquete","Enquete","Participação dos ouvintes"],
    ["mural","Mural","Mensagens do público"],
    ["ouvinte_mes","Ouvinte do mês","Destaque mensal"],
    ["pedidos","Peça sua música","Pedidos de músicas"],
    ["top_musicas","Top músicas","Ranking editorial"],
    ["videos","Vídeos","Conteúdo em vídeo"],
    ["webtv","Web TV","Transmissão de vídeo"],
    ["whatsapp","WhatsApp","Contato flutuante"],
    ["aplicativos","Aplicativos","Links para aplicativos"],
    ["podcasts","Podcasts","Conteúdo sob demanda"],
    ["eventos","Eventos","Agenda da rádio"],
    ["promocoes","Promoções","Campanhas e sorteios"]
  ];

  const REPEATERS = {
    paginas:{container:"pages-list",fields:[
      ["titulo","Título","text"],["slug","Endereço amigável","text"],["conteudo","Conteúdo","textarea","full"],["menu","Mostrar no menu","checkbox"],["ativo","Página ativa","checkbox"]
    ]},
    destaques:{container:"highlights-list",fields:[
      ["titulo","Título","text"],["subtitulo","Subtítulo","text"],["imagem","Imagem","url","full"],["link","Link","url"],["botao","Texto do botão","text"],["ativo","Ativo","checkbox"]
    ]},
    galeria:{container:"gallery-list",fields:[
      ["titulo","Título","text"],["categoria","Categoria","text"],["imagem","Imagem","url","full"],["legenda","Legenda","textarea","full"],["ativo","Ativa","checkbox"]
    ]},
    locutores:{container:"hosts-list",fields:[
      ["nome","Nome","text"],["funcao","Função","text"],["foto","Foto","url","full"],["instagram","Instagram","url"],["descricao","Biografia","textarea","full"]
    ]},
    noticias:{container:"news-list",fields:[
      ["titulo","Título","text","full"],["categoria","Categoria","text"],["data","Data","date"],["imagem","Imagem","url","full"],["resumo","Resumo","textarea","full"],["conteudo","Conteúdo","textarea","full"],["status","Status","select",null,["rascunho:Rascunho","publicada:Publicada"]]
    ]},
    parceiros:{container:"sponsors-list",fields:[
      ["nome","Nome","text"],["categoria","Categoria","text"],["site","Site","url"],["logo","Logomarca","url"],["ordem","Ordem","number"]
    ]},
    programacao:{container:"schedule-list",fields:[
      ["dia","Dia","text"],["inicio","Início","time"],["fim","Fim","time"],["programa","Programa","text"],["apresentador","Apresentador","text"],["imagem","Imagem","url"],["descricao","Descrição","textarea","full"]
    ]},
    publicidades:{container:"ads-list",fields:[
      ["nome","Campanha","text"],["posicao","Posição","select",null,["topo:Topo","meio:Meio","rodape:Rodapé","player:Player"]],["imagem","Imagem","url","full"],["link","Link","url"],["inicio","Início","date"],["fim","Fim","date"],["ativo","Ativa","checkbox"]
    ]},
    topmusicas:{container:"top-songs-list",fields:[
      ["posicao","Posição","number"],["musica","Música","text"],["artista","Artista","text"],["capa","Capa","url"],["link","Link","url"]
    ]},
    videos:{container:"videos-list",fields:[
      ["titulo","Título","text"],["categoria","Categoria","text"],["url","URL do vídeo","url","full"],["miniatura","Miniatura","url","full"],["ativo","Ativo","checkbox"]
    ]},
    podcasts:{container:"podcasts-list",fields:[
      ["titulo","Título","text"],["data","Data","date"],["audio","URL do áudio","url","full"],["capa","Capa","url","full"],["descricao","Descrição","textarea","full"]
    ]},
    eventos:{container:"events-list",fields:[
      ["titulo","Evento","text"],["data","Data","date"],["horario","Horário","time"],["local","Local","text"],["link","Link","url","full"],["descricao","Descrição","textarea","full"]
    ]},
    promocoes:{container:"promotions-list",fields:[
      ["titulo","Promoção","text"],["inicio","Início","date"],["fim","Fim","date"],["imagem","Imagem","url","full"],["link","Link","url","full"],["regulamento","Regulamento","textarea","full"],["ativa","Ativa","checkbox"]
    ]}
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    $("#login-form").addEventListener("submit", login);
    $("#logout-button").addEventListener("click", logout);
    $("#refresh-button").addEventListener("click", loadAll);
    $("#save-draft-button").addEventListener("click", saveDraft);
    $("#publication-save-button").addEventListener("click", saveDraft);
    $("#request-publication-button").addEventListener("click", requestPublication);
    $("#preview-button").addEventListener("click", openPreview);
    $("#publication-preview-button").addEventListener("click", openPreview);
    $("#close-preview").addEventListener("click", () => $("#preview-dialog").close());
    $("#password-form").addEventListener("submit", changePassword);
    $("#export-content-button").addEventListener("click", exportContent);
    $$("[data-tab]").forEach(button => button.addEventListener("click", () => navigateToTab(button.dataset.tab, button)));
    $$("[data-editor-page]").forEach(button => button.addEventListener("click", () => navigateToEditor(button.dataset.editorPage, button)));
    $$("[data-route-tab]").forEach(button => button.addEventListener("click", () => navigateToTab(button.dataset.routeTab, button)));
    $$("[data-route-editor]").forEach(button => button.addEventListener("click", () => navigateToEditor(button.dataset.routeEditor, button)));
    $("#sidebar-toggle")?.addEventListener("click", toggleSidebar);
    $("#sidebar-backdrop")?.addEventListener("click", closeSidebar);
    window.addEventListener("keydown", event => { if (event.key === "Escape") closeSidebar(); });
    $$("[data-go-editor]").forEach(button => button.addEventListener("click", () => switchEditor(button.dataset.goEditor)));
    $$("[data-add-item]").forEach(button => button.addEventListener("click", () => addRepeaterItem(button.dataset.addItem)));
    $("#site-form").addEventListener("click", event => {
      const remove = event.target.closest("[data-remove-item]");
      if (remove) { remove.closest(".repeater-item")?.remove(); updateEditorMetrics(); }
    });
    $("#site-form").addEventListener("input", updateEditorMetrics);
    if (state.token) resumeSession();
  }

  async function api(path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);
    const headers = new Headers(options.headers || {});
    if (state.token) headers.set("Authorization", `Bearer ${state.token}`);
    if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    try {
      const response = await fetch(`${CONFIG.WORKER_URL}${path}`, { ...options, headers, signal: controller.signal, cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        const error = new Error(data.erro || `Falha HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return data;
    } catch (error) {
      if (error.name === "AbortError") throw new Error("A conexão demorou mais que o permitido.");
      if (error.status === 401 && path !== "/api/cliente/login") forceLogout("Sua sessão terminou. Entre novamente.");
      throw error;
    } finally { clearTimeout(timer); }
  }

  async function login(event) {
    event.preventDefault();
    const button = $("#login-button"); setButton(button, true, "Entrando…"); showMessage("#login-message", "", "");
    try {
      const data = await api("/api/cliente/login", { method:"POST", body:JSON.stringify({ email:$("#login-email").value.trim(), senha:$("#login-password").value }) });
      state.token = data.token; sessionStorage.setItem(CONFIG.TOKEN_KEY, data.token); showApp(); await loadAll();
      if (data.forcarTrocaSenha) { switchTab("seguranca"); showGlobal("Por segurança, crie uma nova senha antes de continuar.", "error"); }
    } catch (error) { showMessage("#login-message", error.message, "error"); }
    finally { setButton(button, false, "Entrar"); }
  }

  async function resumeSession() { try { await api("/api/cliente/sessao"); showApp(); await loadAll(); } catch { forceLogout(); } }
  async function logout() { try { await api("/api/cliente/logout", { method:"POST" }); } catch {} forceLogout(); }
  function forceLogout(message="") { state.token=""; state.dashboard=null; state.site=null; state.versions=[]; sessionStorage.removeItem(CONFIG.TOKEN_KEY); closeSidebar(); $("#app-view").classList.add("hidden"); $("#login-view").classList.remove("hidden"); if(message)showMessage("#login-message",message,"error"); }
  function showApp(){ $("#login-view").classList.add("hidden"); $("#app-view").classList.remove("hidden"); closeSidebar(); }

  async function loadAll() {
    showGlobal("Atualizando dados…", "");
    try {
      const [dashboard, siteResult] = await Promise.all([
        api("/api/cliente/dashboard"),
        api("/api/cliente/site").catch(error => error.status === 404 ? null : Promise.reject(error))
      ]);
      state.dashboard=dashboard; state.site=siteResult?.site||null; state.versions=siteResult?.versoes||[];
      renderDashboard(); renderSite(); renderInvoices(); renderContracts();
      showGlobal("Dados atualizados.","success",2200);
      if(dashboard.forcarTrocaSenha){switchTab("seguranca");showGlobal("Troque a senha temporária para proteger sua conta.","error");}
    } catch(error){showGlobal(error.message,"error");}
  }

  function renderDashboard(){
    const d=state.dashboard||{},client=d.cliente||{},contracts=d.contratos||[],invoices=d.faturas||[],sites=d.sites||[];
    const displayName=client.nome_radio||client.nome||"Cliente";
    text("#session-name",displayName); text("#welcome-title",client.nome_radio||"Portal do Cliente"); text("#welcome-subtitle",[client.cidade,client.estado].filter(Boolean).join(" — ")||"Central Rádios Brasil");
    text("#header-site-name",displayName); text("#sidebar-site-name",displayName); text("#session-role","Cliente autorizado");
    const activeContract=contracts.find(c=>["ativo","rascunho","proposta_enviada","aguardando_pagamento"].includes(c.status))||contracts[0],site=sites[0],open=invoices.filter(f=>["aberta","parcial","vencida"].includes(f.status)),next=[...open].sort((a,b)=>String(a.vencimento).localeCompare(String(b.vencimento)))[0];
    text("#kpi-contract",activeContract?statusLabel(activeContract.status):"—"); text("#kpi-contract-detail",activeContract?.plano_nome||activeContract?.numero||"Nenhum contrato");
    text("#kpi-site",site?statusLabel(site.status_publicacao||site.status):"—"); text("#kpi-site-detail",site?.modelo_nome||"Não preparado");
    text("#kpi-invoices",String(open.length)); text("#kpi-invoices-detail",money(open.reduce((sum,f)=>sum+Math.max(0,(f.valor_total_centavos||0)-(f.valor_pago_centavos||0)),0)));
    text("#kpi-due",next?dateBr(next.vencimento):"—"); text("#kpi-due-detail",next?`${next.numero} • ${money(next.valor_total_centavos)}`:"Sem cobrança pendente");
    $("#site-progress").innerHTML=site?[["Modelo",site.modelo_nome||"Ainda não escolhido",""],["Conteúdo",statusLabel(site.status_publicacao||"sem_rascunho"),site.status_publicacao||""],["Endereço",site.dominio_personalizado||site.subdominio||"Ainda não configurado",""],["Última publicação",site.ultima_publicacao_em?dateTimeBr(site.ultima_publicacao_em):"Nunca publicado",""]].map(([label,value,status])=>`<div class="status-row"><div><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>${status?`<span class="badge ${escapeHtml(status)}">${escapeHtml(statusLabel(status))}</span>`:""}</div>`).join(""):'<div class="empty">O site ainda não foi preparado.</div>';
    $("#recent-invoices").innerHTML=invoices.slice(0,5).map(invoice=>`<div class="compact-row"><div><strong>${escapeHtml(invoice.numero)}</strong><small>${escapeHtml(invoice.competencia)} • ${dateBr(invoice.vencimento)}</small></div><div><strong>${money(invoice.valor_total_centavos)}</strong><span class="badge ${escapeHtml(invoice.status)}">${escapeHtml(statusLabel(invoice.status))}</span></div></div>`).join("")||'<div class="empty">Nenhuma fatura registrada.</div>';
  }

  function renderSite(){
    const site=state.site; $("#site-unavailable").classList.toggle("hidden",Boolean(site)); $("#site-form").classList.toggle("hidden",!site); if(!site)return;
    const allowed=new Set(site.camposPermitidos||[]);
    $$("[data-field]",$("#site-form")).forEach(element=>{const keys=String(element.dataset.field||"").split(/\s+/).filter(Boolean);element.classList.toggle("hidden",keys.length&&!keys.some(key=>allowed.has(key)));});
    $$("[data-editor-page-content][data-field]").forEach(page=>{const hidden=page.classList.contains("hidden");const key=page.dataset.editorPageContent;$$(`[data-editor-page="${key}"]`).forEach(button=>button.classList.toggle("hidden",hidden));});
    fillSiteForm(site.conteudoRascunho||{});
    const siteName=site.nome_site||"Meu site", siteStatus=statusLabel(site.status_publicacao||site.status||"rascunho");
    text("#manager-site-name",siteName); text("#manager-site-status",siteStatus); text("#header-site-name",siteName); text("#sidebar-site-name",siteName); text("#header-site-status",siteStatus); text("#technical-stream",site.stream_url||"Será definido pela Central.");
    text("#draft-status",statusLabel(site.status_publicacao||"sem_rascunho"));
    text("#publication-detail",site.solicitacao_publicacao_em?`Solicitado em ${dateTimeBr(site.solicitacao_publicacao_em)}`:site.ultima_publicacao_em?`Publicado em ${dateTimeBr(site.ultima_publicacao_em)}`:"As alterações não aparecem no site até a publicação.");
    $("#request-publication-button").disabled=site.status_publicacao==="aguardando_publicacao";
    renderVersions(); updateEditorMetrics(); switchEditor(state.activeEditor);
  }

  function fillSiteForm(content){
    const form=$("#site-form"),contacts=content.contatos||{},social=content.redes_sociais||{},colors=content.cores||{},apps=content.links_aplicativos||{},texts=content.textos_institucionais||{},banners=content.banners||{};
    const whats=typeof content.whatsapp==="string"?{numero:content.whatsapp}:content.whatsapp||{};
    setValue(form,"nome",content.nome);setValue(form,"slogan",content.slogan);setValue(form,"logo",content.logo);setValue(form,"capa",content.capa);setValue(form,"descricao",content.descricao);
    setValue(form,"sobre",texts.sobre);setValue(form,"missao",texts.missao);setValue(form,"visao",texts.visao);setValue(form,"valores",texts.valores);
    ["instagram","facebook","youtube","tiktok","xTwitter","threads","telegram","spotify"].forEach(name=>setValue(form,name,social[name]||social[name==="xTwitter"?"x":""]));
    const player=texts.player||{};setValue(form,"playerTitulo",player.titulo);setValue(form,"playerBotao",player.botao);setValue(form,"playerEstilo",player.estilo||"compacto");setValue(form,"playerMostrarCapa",player.mostrarCapa||"sim");setValue(form,"playerOffline",player.offline);
    const google=texts.google||{};setValue(form,"googleAnalytics",google.analytics);setValue(form,"googleTagManager",google.tagManager);setValue(form,"googleSearchConsole",google.searchConsole);setValue(form,"googleAdsense",google.adsense);setValue(form,"googleMaps",google.maps);
    setValue(form,"contatoEmail",contacts.email);setValue(form,"contatoTelefone",contacts.telefone);setValue(form,"contatoResponsavel",contacts.responsavel);setValue(form,"contatoHorario",contacts.horario);setValue(form,"contatoEndereco",contacts.endereco);setValue(form,"contatoCidade",contacts.cidade);setValue(form,"contatoEstado",contacts.estado);setChecked(form,"contatoFormulario",contacts.formularioAtivo!==false);
    const header=texts.cabecalho||{};setValue(form,"headerModelo",header.modelo||"centralizado");setValue(form,"headerAlinhamento",header.alinhamento||"centro");setValue(form,"headerAltura",header.altura||360);setChecked(form,"headerMostrarLogo",header.mostrarLogo!==false);setChecked(form,"headerMostrarSlogan",header.mostrarSlogan!==false);setChecked(form,"headerMostrarPlayer",header.mostrarPlayer!==false);
    const footer=texts.rodape||{};setValue(form,"footerTexto",footer.texto);setChecked(form,"footerRedes",footer.mostrarRedes!==false);setChecked(form,"footerContato",footer.mostrarContato!==false);setChecked(form,"footerMenu",footer.mostrarMenu!==false);setValue(form,"footerCopyright",footer.copyright);
    setValue(form,"corPrimaria",colors.primaria||"#0b1f3a");setValue(form,"corSecundaria",colors.secundaria||"#13a8e5");setValue(form,"corFundo",colors.fundo||"#07142b");setValue(form,"corTexto",colors.texto||"#f4f8ff");setValue(form,"corCabecalho",colors.cabecalho||colors.primaria||"#0b1f3a");setValue(form,"corRodape",colors.rodape||"#07142b");setValue(form,"fundoImagem",colors.fundoImagem);setValue(form,"fonteSite",colors.fonte||"sistema");setValue(form,"iconeEstilo",colors.icones||"linha");
    const menu=texts.menu||{};setValue(form,"menuItens",listToLines(menu.itens||[],["nome","link"]));setValue(form,"menuEstilo",menu.estilo||"horizontal");setChecked(form,"menuFixo",menu.fixo!==false);
    const seo=texts.seo||{};setValue(form,"seoTitulo",seo.titulo);setValue(form,"seoDescricao",seo.descricao);setValue(form,"seoPalavras",seo.palavras);setValue(form,"seoImagem",seo.imagem);setChecked(form,"seoIndexar",seo.indexar!==false);
    const poll=texts.enquete||{};setValue(form,"enquetePergunta",poll.pergunta);setValue(form,"enqueteOpcoes",(poll.opcoes||[]).join("\n"));setChecked(form,"enqueteAtiva",Boolean(poll.ativa));
    const mural=texts.mural||{};setValue(form,"muralTitulo",mural.titulo);setValue(form,"muralModeracao",mural.moderacao||"sim");setValue(form,"muralMensagem",mural.mensagem);setChecked(form,"muralAtivo",Boolean(mural.ativo));
    const listener=texts.ouvinteMes||{};setValue(form,"ouvinteNome",listener.nome);setValue(form,"ouvinteCidade",listener.cidade);setValue(form,"ouvinteFoto",listener.foto);setValue(form,"ouvinteMensagem",listener.mensagem);setChecked(form,"ouvinteAtivo",Boolean(listener.ativo));
    const requests=texts.pedidosMusica||{};setValue(form,"pedidoCanal",requests.canal||"whatsapp");setValue(form,"pedidoDestino",requests.destino);setValue(form,"pedidoMensagem",requests.mensagem);setChecked(form,"pedidoAtivo",Boolean(requests.ativo));
    const opening=banners.abertura||{};setChecked(form,"aberturaAtiva",Boolean(opening.ativo));setValue(form,"aberturaSegundos",opening.segundos||5);setValue(form,"aberturaImagem",opening.imagem);setValue(form,"aberturaLink",opening.link);
    const webtv=texts.webtv||{};setChecked(form,"webtvAtiva",Boolean(webtv.ativa));setValue(form,"webtvTitulo",webtv.titulo);setValue(form,"webtvUrl",webtv.url);
    setValue(form,"whatsappNumero",whats.numero);setValue(form,"whatsappTitulo",whats.titulo);setValue(form,"whatsappMensagem",whats.mensagem);setValue(form,"whatsappHorario",whats.horario);setChecked(form,"whatsappFlutuante",whats.flutuante!==false);
    setValue(form,"appAndroid",apps.android);setValue(form,"appIos",apps.ios);setValue(form,"appPwa",apps.pwa);setValue(form,"appAlexa",apps.alexa);setValue(form,"appWindows",apps.windows);setValue(form,"appQr",apps.qr);
    const a11y=texts.acessibilidade||{};setChecked(form,"acessibilidadeContraste",a11y.contraste!==false);setChecked(form,"acessibilidadeFonte",a11y.fonte!==false);setChecked(form,"acessibilidadeReducao",a11y.reducaoMovimento!==false);setChecked(form,"acessibilidadeLeitor",a11y.leitorTela!==false);setValue(form,"acessibilidadeLogoAlt",a11y.logoAlt);

    renderModules(texts.modulos||{});
    renderRepeater("paginas",texts.paginasFixas||[]);renderRepeater("destaques",banners.destaques||[]);renderRepeater("galeria",texts.galeria||[]);renderRepeater("locutores",content.locutores||[]);renderRepeater("noticias",content.noticias||[]);renderRepeater("parceiros",content.patrocinadores||[]);renderRepeater("programacao",content.programacao||[]);renderRepeater("publicidades",banners.publicidades||[]);renderRepeater("topmusicas",texts.topMusicas||[]);renderRepeater("videos",texts.videos||[]);renderRepeater("podcasts",texts.podcasts||[]);renderRepeater("eventos",texts.eventos||[]);renderRepeater("promocoes",texts.promocoes||[]);
  }

  function collectSiteContent(){
    const form=$("#site-form"),allowed=new Set(state.site?.camposPermitidos||[]),content=deepClone(state.site?.conteudoRascunho||{}),value=name=>String(form.elements[name]?.value||"").trim(),checked=name=>Boolean(form.elements[name]?.checked);
    if(allowed.has("nome"))content.nome=value("nome");if(allowed.has("slogan"))content.slogan=value("slogan");if(allowed.has("logo"))content.logo=value("logo");if(allowed.has("capa"))content.capa=value("capa");if(allowed.has("descricao"))content.descricao=value("descricao");
    if(allowed.has("cores"))content.cores={primaria:value("corPrimaria"),secundaria:value("corSecundaria"),fundo:value("corFundo"),texto:value("corTexto"),cabecalho:value("corCabecalho"),rodape:value("corRodape"),fundoImagem:value("fundoImagem"),fonte:value("fonteSite"),icones:value("iconeEstilo")};
    if(allowed.has("contatos"))content.contatos={email:value("contatoEmail"),telefone:value("contatoTelefone"),responsavel:value("contatoResponsavel"),horario:value("contatoHorario"),endereco:value("contatoEndereco"),cidade:value("contatoCidade"),estado:value("contatoEstado").toUpperCase(),formularioAtivo:checked("contatoFormulario")};
    if(allowed.has("whatsapp"))content.whatsapp={numero:value("whatsappNumero"),titulo:value("whatsappTitulo"),mensagem:value("whatsappMensagem"),horario:value("whatsappHorario"),flutuante:checked("whatsappFlutuante")};
    if(allowed.has("redes_sociais"))content.redes_sociais={instagram:value("instagram"),facebook:value("facebook"),youtube:value("youtube"),tiktok:value("tiktok"),xTwitter:value("xTwitter"),threads:value("threads"),telegram:value("telegram"),spotify:value("spotify")};
    if(allowed.has("programacao"))content.programacao=collectRepeater("programacao");if(allowed.has("locutores"))content.locutores=collectRepeater("locutores");if(allowed.has("noticias"))content.noticias=collectRepeater("noticias");if(allowed.has("patrocinadores"))content.patrocinadores=collectRepeater("parceiros");
    if(allowed.has("banners"))content.banners={destaques:collectRepeater("destaques"),publicidades:collectRepeater("publicidades"),abertura:{ativo:checked("aberturaAtiva"),segundos:Number(value("aberturaSegundos")||5),imagem:value("aberturaImagem"),link:value("aberturaLink")}};
    if(allowed.has("links_aplicativos"))content.links_aplicativos={android:value("appAndroid"),ios:value("appIos"),pwa:value("appPwa"),alexa:value("appAlexa"),windows:value("appWindows"),qr:value("appQr")};
    if(allowed.has("textos_institucionais"))content.textos_institucionais={
      ...(content.textos_institucionais||{}),sobre:value("sobre"),missao:value("missao"),visao:value("visao"),valores:value("valores"),
      player:{titulo:value("playerTitulo"),botao:value("playerBotao"),estilo:value("playerEstilo"),mostrarCapa:value("playerMostrarCapa"),offline:value("playerOffline")},
      google:{analytics:value("googleAnalytics"),tagManager:value("googleTagManager"),searchConsole:value("googleSearchConsole"),adsense:value("googleAdsense"),maps:value("googleMaps")},
      cabecalho:{modelo:value("headerModelo"),alinhamento:value("headerAlinhamento"),altura:Number(value("headerAltura")||360),mostrarLogo:checked("headerMostrarLogo"),mostrarSlogan:checked("headerMostrarSlogan"),mostrarPlayer:checked("headerMostrarPlayer")},
      rodape:{texto:value("footerTexto"),mostrarRedes:checked("footerRedes"),mostrarContato:checked("footerContato"),mostrarMenu:checked("footerMenu"),copyright:value("footerCopyright")},
      paginasFixas:collectRepeater("paginas"),menu:{itens:linesToObjects(value("menuItens"),["nome","link"]),estilo:value("menuEstilo"),fixo:checked("menuFixo")},seo:{titulo:value("seoTitulo"),descricao:value("seoDescricao"),palavras:value("seoPalavras"),imagem:value("seoImagem"),indexar:checked("seoIndexar")},
      modulos:collectModules(),enquete:{pergunta:value("enquetePergunta"),opcoes:value("enqueteOpcoes").split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,20),ativa:checked("enqueteAtiva")},galeria:collectRepeater("galeria"),mural:{titulo:value("muralTitulo"),moderacao:value("muralModeracao"),mensagem:value("muralMensagem"),ativo:checked("muralAtivo")},
      ouvinteMes:{nome:value("ouvinteNome"),cidade:value("ouvinteCidade"),foto:value("ouvinteFoto"),mensagem:value("ouvinteMensagem"),ativo:checked("ouvinteAtivo")},pedidosMusica:{canal:value("pedidoCanal"),destino:value("pedidoDestino"),mensagem:value("pedidoMensagem"),ativo:checked("pedidoAtivo")},topMusicas:collectRepeater("topmusicas"),videos:collectRepeater("videos"),webtv:{ativa:checked("webtvAtiva"),titulo:value("webtvTitulo"),url:value("webtvUrl")},podcasts:collectRepeater("podcasts"),eventos:collectRepeater("eventos"),promocoes:collectRepeater("promocoes"),
      acessibilidade:{contraste:checked("acessibilidadeContraste"),fonte:checked("acessibilidadeFonte"),reducaoMovimento:checked("acessibilidadeReducao"),leitorTela:checked("acessibilidadeLeitor"),logoAlt:value("acessibilidadeLogoAlt")}
    };
    return content;
  }

  function renderModules(values){const grid=$("#modules-grid");grid.innerHTML=MODULES.map(([id,label,description])=>`<label class="module-card"><input type="checkbox" data-module="${escapeAttr(id)}" ${values[id]!==false?"checked":""}><span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(description)}</small></span></label>`).join("");}
  function collectModules(){return Object.fromEntries($$("[data-module]",$("#modules-grid")).map(input=>[input.dataset.module,input.checked]));}

  function renderRepeater(type,items){const def=REPEATERS[type];if(!def)return;const container=$("#"+def.container);container.innerHTML="";(Array.isArray(items)?items:[]).forEach(item=>container.appendChild(createRepeaterItem(type,item)));if(!container.children.length)container.innerHTML='<div class="empty repeater-empty">Nenhum item cadastrado.</div>';}
  function addRepeaterItem(type){const def=REPEATERS[type];if(!def)return;const container=$("#"+def.container);container.querySelector(".repeater-empty")?.remove();container.appendChild(createRepeaterItem(type,{}));container.lastElementChild.scrollIntoView({behavior:"smooth",block:"center"});updateEditorMetrics();}
  function createRepeaterItem(type,item){const def=REPEATERS[type],template=$("#repeater-template").content.cloneNode(true),article=$(".repeater-item",template),fields=$(".repeater-fields",template);article.dataset.repeaterType=type;def.fields.forEach(([key,label,inputType,layout,options])=>{const wrapper=document.createElement("label");wrapper.className=layout||"";wrapper.textContent=label;let input;if(inputType==="textarea"){input=document.createElement("textarea");input.rows=4;}else if(inputType==="select"){input=document.createElement("select");(options||[]).forEach(option=>{const [value,text]=option.split(":");input.add(new Option(text,value));});}else{input=document.createElement("input");input.type=inputType||"text";}input.dataset.itemKey=key;if(inputType==="checkbox"){wrapper.classList.add("toggle");input.checked=Boolean(item?.[key]);wrapper.textContent="";wrapper.append(input,document.createTextNode(" "+label));}else{input.value=item?.[key]??"";wrapper.appendChild(input);}fields.appendChild(wrapper);});return template;}
  function collectRepeater(type){const def=REPEATERS[type];if(!def)return[];return $$(".repeater-item",$("#"+def.container)).map(article=>{const item={};$$('[data-item-key]',article).forEach(input=>{item[input.dataset.itemKey]=input.type==="checkbox"?input.checked:input.type==="number"?Number(input.value||0):String(input.value||"").trim();});return item;}).filter(item=>Object.values(item).some(value=>value!==""&&value!==false&&value!==0)).slice(0,60);}

  async function saveDraft(){
    if(!state.site)return;const active=state.activeEditor,buttons=[$("#save-draft-button"),$("#publication-save-button")];buttons.forEach(button=>setButton(button,true,"Salvando…"));
    try{const result=await api("/api/cliente/site/rascunho",{method:"PUT",body:JSON.stringify({conteudo:collectSiteContent()})});state.site.conteudoRascunho=result.conteudo;state.site.status_publicacao="rascunho";const refreshed=await api("/api/cliente/site");state.site=refreshed.site;state.versions=refreshed.versoes||[];renderSite();switchEditor(active);showGlobal(`Rascunho salvo como versão ${result.versao}.`,"success");}
    catch(error){showGlobal(error.message,"error");}finally{setButton($("#save-draft-button"),false,"Salvar rascunho");setButton($("#publication-save-button"),false,"Salvar rascunho");}
  }

  async function requestPublication(){if(!state.site)return;if(!confirm("Enviar este rascunho para revisão e publicação pela Central Rádios Brasil?"))return;const button=$("#request-publication-button");setButton(button,true,"Enviando…");try{const result=await api("/api/cliente/site/solicitar-publicacao",{method:"POST",body:"{}"});state.site.status_publicacao=result.statusPublicacao;state.site.solicitacao_publicacao_em=new Date().toISOString();renderSite();switchEditor("publicacao");showGlobal(result.mensagem,"success");}catch(error){showGlobal(error.message,"error");}finally{setButton(button,false,"Solicitar publicação");}}

  function openPreview(){const content=collectSiteContent(),dialog=$("#preview-dialog");$("#preview-content").innerHTML=buildPreview(content,state.site?.stream_url);dialog.showModal();}
  function buildPreview(content,streamUrl){
    const colors=content.cores||{},texts=content.textos_institucionais||{},modules=texts.modulos||{},logo=safeUrl(content.logo),cover=safeUrl(content.capa),programs=content.programacao||[],people=content.locutores||[],news=content.noticias||[],sponsors=content.patrocinadores||[],highlights=content.banners?.destaques||[],menu=texts.menu?.itens||[];
    const show=id=>modules[id]!==false;
    return `<header class="preview-site-header" style="--preview-header:${escapeAttr(colors.cabecalho||colors.primaria||'#0b1f3a')}"><div class="brand-inline">${logo?`<img src="${escapeAttr(logo)}" alt="${escapeAttr(texts.acessibilidade?.logoAlt||content.nome||'Logomarca')}">`:''}<strong>${escapeHtml(content.nome||'Nome da rádio')}</strong></div><nav>${menu.slice(0,8).map(item=>`<a href="${escapeAttr(item.link||'#')}">${escapeHtml(item.nome||'Link')}</a>`).join('')}</nav></header><section class="preview-hero" style="--preview-primary:${escapeAttr(colors.primaria||'#0b1f3a')};--preview-cover:${cover?`url('${escapeAttr(cover)}')`:'none'}"><div>${logo?`<img src="${escapeAttr(logo)}" alt="">`:''}<h1>${escapeHtml(content.nome||'Nome da rádio')}</h1><p>${escapeHtml(content.slogan||'Slogan da emissora')}</p>${streamUrl?`<audio controls preload="none" src="${escapeAttr(safeUrl(streamUrl))}"></audio>`:'<small>O stream técnico será definido pela Central.</small>'}</div></section>${show('destaques')&&highlights.length?`<section class="preview-section alt"><h2>Destaques</h2><div class="preview-grid">${highlights.slice(0,6).map(item=>`<article class="preview-card">${safeUrl(item.imagem)?`<img src="${escapeAttr(safeUrl(item.imagem))}" alt="">`:''}<h3>${escapeHtml(item.titulo||'Destaque')}</h3><p>${escapeHtml(item.subtitulo||'')}</p></article>`).join('')}</div></section>`:''}${show('sobre')?`<section class="preview-section"><h2>Sobre a rádio</h2><p>${escapeHtml(content.descricao||texts.sobre||'Conteúdo ainda não informado.')}</p></section>`:''}${show('programacao')&&programs.length?`<section class="preview-section alt"><h2>Programação</h2><div class="preview-grid">${programs.slice(0,12).map(p=>`<article class="preview-card"><strong>${escapeHtml(p.programa||'Programa')}</strong><p>${escapeHtml([p.dia,p.inicio,p.fim].filter(Boolean).join(' • '))}</p><small>${escapeHtml(p.apresentador||'')}</small></article>`).join('')}</div></section>`:''}${show('noticias')&&news.length?`<section class="preview-section"><h2>Notícias</h2><div class="preview-grid">${news.slice(0,6).map(n=>`<article class="preview-card">${safeUrl(n.imagem)?`<img src="${escapeAttr(safeUrl(n.imagem))}" alt="">`:''}<strong>${escapeHtml(n.titulo||'Notícia')}</strong><p>${escapeHtml(n.resumo||'')}</p></article>`).join('')}</div></section>`:''}${show('locutores')&&people.length?`<section class="preview-section alt"><h2>Equipe</h2><div class="preview-grid">${people.slice(0,12).map(p=>`<article class="preview-card">${safeUrl(p.foto)?`<img src="${escapeAttr(safeUrl(p.foto))}" alt="">`:''}<strong>${escapeHtml(p.nome||'')}</strong><small>${escapeHtml(p.funcao||'')}</small></article>`).join('')}</div></section>`:''}${show('parceiros')&&sponsors.length?`<section class="preview-section"><h2>Parceiros</h2><div class="preview-grid">${sponsors.slice(0,12).map(p=>`<article class="preview-card">${safeUrl(p.logo)?`<img src="${escapeAttr(safeUrl(p.logo))}" alt="">`:''}<strong>${escapeHtml(p.nome||'')}</strong></article>`).join('')}</div></section>`:''}<footer class="preview-site-footer" style="--preview-footer:${escapeAttr(colors.rodape||'#07142b')}">${escapeHtml(texts.rodape?.texto||texts.rodape?.copyright||content.nome||'Rádio')}</footer>`;
  }

  function switchEditor(page,sourceButton=null){if(!EDITOR_META[page]||$(`[data-editor-page-content="${page}"]`)?.classList.contains("hidden"))page="inicio";state.activeEditor=page;$$('[data-editor-page]').forEach(button=>button.classList.toggle('active',button.dataset.editorPage===page));const sitePanel=$('[data-panel="site"]'),siteVisible=sitePanel&&!sitePanel.classList.contains('hidden');if(siteVisible){$$('[data-route-editor], [data-route-tab]').forEach(button=>button.classList.remove('active'));const routeButton=sourceButton?.matches?.('[data-route-editor]')?sourceButton:$(`[data-route-editor="${page}"]`);routeButton?.classList.add('active');}$$('[data-editor-page-content]').forEach(section=>section.classList.toggle('active',section.dataset.editorPageContent===page));const [crumb,title,description]=EDITOR_META[page];text("#editor-breadcrumb",crumb);text("#editor-title",title);text("#editor-description",description);$(".client-workspace")?.scrollTo({top:0,behavior:"smooth"});window.scrollTo({top:0,behavior:'smooth'});}
  function updateEditorMetrics(){if(!state.site)return;const content=collectSiteContent(),texts=content.textos_institucionais||{},main=[content.nome,content.slogan,content.logo,content.descricao,typeof content.whatsapp==='string'?content.whatsapp:content.whatsapp?.numero,content.contatos?.email,(content.programacao||[]).length,(content.locutores||[]).length],done=main.filter(value=>Array.isArray(value)?value.length:Boolean(value)).length,completion=Math.round(done/main.length*100),contentCount=[content.programacao,content.locutores,content.noticias,content.patrocinadores,content.banners?.destaques,content.banners?.publicidades,texts.paginasFixas,texts.galeria,texts.topMusicas,texts.videos,texts.podcasts,texts.eventos,texts.promocoes].reduce((sum,list)=>sum+(Array.isArray(list)?list.length:0),0),modules=Object.values(texts.modulos||{}).filter(Boolean).length; text("#editor-completion",`${completion}%`);text("#editor-content-count",String(contentCount));text("#editor-modules-count",String(modules));text("#home-content-count",String(contentCount));text("#home-module-count",String(modules));text("#home-version-count",String(state.versions.length));const latest=state.versions[0];text("#editor-version",latest?`Versão ${latest.numero}`:"—");text("#editor-version-date",latest?dateTimeBr(latest.criado_em):"Ainda não salva");text("#sidebar-last-update",latest?`Última versão: ${dateTimeBr(latest.criado_em)}`:"Nenhuma versão salva");$("#editor-status-list").innerHTML=[["Publicação",statusLabel(state.site.status_publicacao||"sem_rascunho")],["Modelo",state.site.modelo_nome||"Rádio Essencial"],["Domínio",state.site.dominio_personalizado||state.site.subdominio||"Ainda não definido"],["Campos liberados",`${(state.site.camposPermitidos||[]).length} campos`]].map(([label,value])=>`<div class="status-row"><div><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div></div>`).join("");}
  function renderVersions(){const list=$("#versions-list");list.innerHTML=state.versions.slice(0,12).map(version=>`<div class="compact-row"><div><strong>Versão ${Number(version.numero)}</strong><small>${escapeHtml(statusLabel(version.status))} • ${escapeHtml(statusLabel(version.autor_tipo))}</small></div><small>${dateTimeBr(version.criado_em)}</small></div>`).join("")||'<div class="empty">Nenhuma versão salva.</div>';}

  function exportContent(){const content=collectSiteContent(),blob=new Blob([JSON.stringify({versaoPortal:CONFIG.VERSION,exportadoEm:new Date().toISOString(),site:state.site?.nome_site||"site",conteudo:content},null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`backup-${slugify(state.site?.nome_site||'site')}-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);}

  function renderInvoices(){const invoices=state.dashboard?.faturas||[];$("#invoices-body").innerHTML=invoices.map(f=>`<tr><td><strong>${escapeHtml(f.numero)}</strong></td><td>${escapeHtml(statusLabel(f.tipo_cobranca))}${f.descricao?`<small>${escapeHtml(f.descricao)}</small>`:''}</td><td>${escapeHtml(f.competencia)}</td><td>${dateBr(f.vencimento)}</td><td>${money(f.valor_total_centavos)}</td><td>${money(f.valor_pago_centavos)}</td><td><span class="badge ${escapeHtml(f.status)}">${escapeHtml(statusLabel(f.status))}</span></td></tr>`).join('')||'<tr><td colspan="7">Nenhuma fatura registrada.</td></tr>';}
  function renderContracts(){const contracts=state.dashboard?.contratos||[];$("#contracts-list").innerHTML=contracts.map(c=>`<article class="contract-card"><div><strong>${escapeHtml(c.numero)}</strong><small>${escapeHtml(c.plano_nome||'Plano personalizado')}</small></div><div><small>Status</small><span class="badge ${escapeHtml(c.status)}">${escapeHtml(statusLabel(c.status))}</span></div><div><small>Valor</small><strong>${money(c.valor_centavos)}</strong></div><div><small>Vencimento</small><strong>Dia ${Number(c.dia_vencimento||10)}</strong></div><div><small>Serviços</small><strong>Streaming: ${escapeHtml(statusLabel(c.streaming_status))}<br>Site: ${escapeHtml(statusLabel(c.site_status))}</strong></div></article>`).join('')||'<div class="empty">Nenhum contrato registrado.</div>';}
  async function changePassword(event){event.preventDefault();const form=event.currentTarget,data=new FormData(form),newPassword=String(data.get("novaSenha")||""),confirmation=String(data.get("confirmacao")||"");if(newPassword!==confirmation){showGlobal("A confirmação não corresponde à nova senha.","error");return;}const button=$("button[type=submit]",form);setButton(button,true,"Atualizando…");try{const result=await api("/api/cliente/trocar-senha",{method:"POST",body:JSON.stringify({senhaAtual:data.get("senhaAtual"),novaSenha:newPassword})});form.reset();if(state.dashboard)state.dashboard.forcarTrocaSenha=false;showGlobal(result.mensagem,"success");switchTab("resumo");}catch(error){showGlobal(error.message,"error");}finally{setButton(button,false,"Atualizar senha");}}

  function navigateToTab(tab,sourceButton=null){switchTab(tab,true,sourceButton);closeSidebar();}
  function navigateToEditor(page,sourceButton=null){if(!state.site){switchTab("resumo");showGlobal("O site ainda não foi preparado para edição.","error",3200);return;}switchTab("site",false);switchEditor(page,sourceButton);closeSidebar();}
  function switchTab(tab,markRoute=true,sourceButton=null){$$('[data-tab]').forEach(button=>button.classList.toggle('active',button.dataset.tab===tab));$$('[data-panel]').forEach(panel=>panel.classList.toggle('hidden',panel.dataset.panel!==tab));if(markRoute){$$('[data-route-tab], [data-route-editor]').forEach(button=>button.classList.remove('active'));const routeButton=sourceButton?.matches?.('[data-route-tab]')?sourceButton:$(`[data-route-tab="${tab}"]`);routeButton?.classList.add('active');}window.scrollTo({top:0,behavior:'smooth'});if(tab==="site")switchEditor(state.activeEditor);}
  function toggleSidebar(){const app=$("#app-view"),open=!app.classList.contains("sidebar-open");app.classList.toggle("sidebar-open",open);const toggle=$("#sidebar-toggle"),backdrop=$("#sidebar-backdrop");toggle?.setAttribute("aria-expanded",String(open));if(toggle)toggle.setAttribute("aria-label",open?"Fechar menu":"Abrir menu");if(backdrop)backdrop.hidden=!open;}
  function closeSidebar(){const app=$("#app-view"),toggle=$("#sidebar-toggle"),backdrop=$("#sidebar-backdrop");app?.classList.remove("sidebar-open");toggle?.setAttribute("aria-expanded","false");toggle?.setAttribute("aria-label","Abrir menu");if(backdrop)backdrop.hidden=true;}
  function showGlobal(message,type="",timeout=0){showMessage("#global-message",message,type);if(timeout)setTimeout(()=>showMessage("#global-message","",""),timeout);}
  function showMessage(selector,message,type){const element=$(selector);element.textContent=message;element.className=`message ${type||''} ${message?'':'hidden'}`.trim();}
  function setButton(button,disabled,label){if(!button)return;button.disabled=disabled;button.textContent=label;}
  function text(selector,value){const element=$(selector);if(element)element.textContent=value??"";}
  function setValue(form,name,value){if(form.elements[name])form.elements[name].value=value??"";}
  function setChecked(form,name,value){if(form.elements[name])form.elements[name].checked=Boolean(value);}
  function linesToObjects(textValue,keys){return String(textValue||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean).slice(0,60).map(line=>{const parts=line.split('|').map(item=>item.trim());return Object.fromEntries(keys.map((key,index)=>[key,parts[index]||'']));});}
  function listToLines(list,keys){return Array.isArray(list)?list.map(item=>typeof item==='string'?item:keys.map(key=>item?.[key]||'').join(' | ')).join('\n'):'';}
  function statusLabel(value){const labels={ativo:'Ativo',prospect:'Prospect',suspenso:'Suspenso',cancelado:'Cancelado',rascunho:'Rascunho',proposta_enviada:'Proposta enviada',aguardando_pagamento:'Aguardando pagamento',em_atraso:'Em atraso',planejamento:'Planejamento',configurando:'Configurando',nao_incluido:'Não incluído',publicado:'Publicado',sem_rascunho:'Sem rascunho',aguardando_publicacao:'Aguardando publicação',aberta:'Aberta',parcial:'Parcial',paga:'Paga',vencida:'Vencida',cancelada:'Cancelada',estornada:'Estornada',mensalidade:'Mensalidade',implantacao:'Implantação',servico_adicional:'Serviço adicional',ajuste:'Ajuste',outro:'Outro',cliente:'Cliente',admin:'Admin',publicada:'Publicada'};return labels[value]||String(value||'—').replaceAll('_',' ');}
  function money(cents){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(cents||0)/100);}
  function dateBr(value){if(!value)return'—';const date=new Date(`${String(value).slice(0,10)}T12:00:00`);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat('pt-BR').format(date);}
  function dateTimeBr(value){if(!value)return'—';const date=new Date(value);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(date);}
  function safeUrl(value){try{const url=new URL(String(value||''));return ['http:','https:'].includes(url.protocol)?url.href:'';}catch{return'';}}
  function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));}
  function escapeAttr(value){return escapeHtml(value).replace(/`/g,'&#96;');}
  function deepClone(value){try{return structuredClone(value||{});}catch{return JSON.parse(JSON.stringify(value||{}));}}
  function slugify(value){return String(value||'site').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'site';}
})();
