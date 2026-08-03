(() => {
  "use strict";

  const CONFIG = window.CRB_CLIENTE_CONFIG;
  const state = { token: sessionStorage.getItem(CONFIG.TOKEN_KEY) || "", dashboard: null, site: null };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    $("#login-form").addEventListener("submit", login);
    $("#logout-button").addEventListener("click", logout);
    $("#refresh-button").addEventListener("click", loadAll);
    $("#save-draft-button").addEventListener("click", saveDraft);
    $("#request-publication-button").addEventListener("click", requestPublication);
    $("#preview-button").addEventListener("click", openPreview);
    $("#close-preview").addEventListener("click", () => $("#preview-dialog").close());
    $("#password-form").addEventListener("submit", changePassword);
    $$("[data-tab]").forEach(button => button.addEventListener("click", () => switchTab(button.dataset.tab)));
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
    const button = $("#login-button");
    setButton(button, true, "Entrando…");
    showMessage("#login-message", "", "");
    try {
      const data = await api("/api/cliente/login", { method: "POST", body: JSON.stringify({ email: $("#login-email").value.trim(), senha: $("#login-password").value }) });
      state.token = data.token;
      sessionStorage.setItem(CONFIG.TOKEN_KEY, data.token);
      showApp();
      await loadAll();
      if (data.forcarTrocaSenha) { switchTab("seguranca"); showGlobal("Por segurança, crie uma nova senha antes de continuar.", "error"); }
    } catch (error) { showMessage("#login-message", error.message, "error"); }
    finally { setButton(button, false, "Entrar"); }
  }

  async function resumeSession() {
    try { await api("/api/cliente/sessao"); showApp(); await loadAll(); }
    catch { forceLogout(); }
  }

  async function logout() {
    try { await api("/api/cliente/logout", { method: "POST" }); } catch {}
    forceLogout();
  }

  function forceLogout(message = "") {
    state.token = ""; state.dashboard = null; state.site = null;
    sessionStorage.removeItem(CONFIG.TOKEN_KEY);
    $("#app-view").classList.add("hidden"); $("#login-view").classList.remove("hidden");
    if (message) showMessage("#login-message", message, "error");
  }

  function showApp() { $("#login-view").classList.add("hidden"); $("#app-view").classList.remove("hidden"); }

  async function loadAll() {
    showGlobal("Atualizando dados…", "");
    try {
      const [dashboard, siteResult] = await Promise.all([
        api("/api/cliente/dashboard"),
        api("/api/cliente/site").catch(error => error.status === 404 ? null : Promise.reject(error))
      ]);
      state.dashboard = dashboard; state.site = siteResult?.site || null;
      renderDashboard(); renderSite(); renderInvoices(); renderContracts();
      showGlobal("Dados atualizados.", "success", 2200);
      if (dashboard.forcarTrocaSenha) { switchTab("seguranca"); showGlobal("Troque a senha temporária para proteger sua conta.", "error"); }
    } catch (error) { showGlobal(error.message, "error"); }
  }

  function renderDashboard() {
    const d = state.dashboard || {}, client = d.cliente || {}, contracts = d.contratos || [], invoices = d.faturas || [], sites = d.sites || [];
    $("#session-name").textContent = client.nome_radio || client.nome || "Cliente";
    $("#welcome-title").textContent = client.nome_radio || "Portal do Cliente";
    $("#welcome-subtitle").textContent = [client.cidade, client.estado].filter(Boolean).join(" — ") || "Central Rádios Brasil";
    const activeContract = contracts.find(c => ["ativo", "rascunho", "proposta_enviada", "aguardando_pagamento"].includes(c.status)) || contracts[0];
    const site = sites[0];
    const open = invoices.filter(f => ["aberta", "parcial", "vencida"].includes(f.status));
    const next = [...open].sort((a,b) => String(a.vencimento).localeCompare(String(b.vencimento)))[0];
    text("#kpi-contract", activeContract ? statusLabel(activeContract.status) : "—");
    text("#kpi-contract-detail", activeContract?.plano_nome || activeContract?.numero || "Nenhum contrato");
    text("#kpi-site", site ? statusLabel(site.status_publicacao || site.status) : "—");
    text("#kpi-site-detail", site?.modelo_nome || "Não preparado");
    text("#kpi-invoices", String(open.length)); text("#kpi-invoices-detail", money(open.reduce((sum,f)=>sum+Math.max(0,(f.valor_total_centavos||0)-(f.valor_pago_centavos||0)),0)));
    text("#kpi-due", next ? dateBr(next.vencimento) : "—"); text("#kpi-due-detail", next ? `${next.numero} • ${money(next.valor_total_centavos)}` : "Sem cobrança pendente");
    $("#site-progress").innerHTML = site ? [
      ["Modelo", site.modelo_nome || "Ainda não escolhido", ""],
      ["Conteúdo", statusLabel(site.status_publicacao || "sem_rascunho"), site.status_publicacao || ""],
      ["Endereço", site.dominio_personalizado || site.subdominio || "Ainda não configurado", ""],
      ["Última publicação", site.ultima_publicacao_em ? dateTimeBr(site.ultima_publicacao_em) : "Nunca publicado", ""]
    ].map(([label,value,status]) => `<div class="status-row"><div><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>${status ? `<span class="badge ${escapeHtml(status)}">${escapeHtml(statusLabel(status))}</span>` : ""}</div>`).join("") : '<div class="empty">O site ainda não foi preparado.</div>';
    $("#recent-invoices").innerHTML = invoices.slice(0,5).map(invoice => `<div class="compact-row"><div><strong>${escapeHtml(invoice.numero)}</strong><small>${escapeHtml(invoice.competencia)} • ${dateBr(invoice.vencimento)}</small></div><div><strong>${money(invoice.valor_total_centavos)}</strong><span class="badge ${escapeHtml(invoice.status)}">${escapeHtml(statusLabel(invoice.status))}</span></div></div>`).join("") || '<div class="empty">Nenhuma fatura registrada.</div>';
  }

  function renderSite() {
    const site = state.site;
    $("#site-unavailable").classList.toggle("hidden", Boolean(site));
    $("#site-form").classList.toggle("hidden", !site);
    if (!site) return;
    const allowed = new Set(site.camposPermitidos || []);
    $$("[data-field]").forEach(element => {
      const keys = String(element.dataset.field || "").split(/\s+/);
      element.classList.toggle("hidden", !keys.some(key => allowed.has(key)));
    });
    fillSiteForm(site.conteudoRascunho || {});
    text("#draft-status", statusLabel(site.status_publicacao || "sem_rascunho"));
    text("#publication-detail", site.solicitacao_publicacao_em ? `Solicitado em ${dateTimeBr(site.solicitacao_publicacao_em)}` : site.ultima_publicacao_em ? `Publicado em ${dateTimeBr(site.ultima_publicacao_em)}` : "As alterações não aparecem no site até a publicação.");
    $("#request-publication-button").disabled = site.status_publicacao === "aguardando_publicacao";
  }

  function fillSiteForm(content) {
    const form = $("#site-form"), contacts = content.contatos || {}, social = content.redes_sociais || {}, colors = content.cores || {}, apps = content.links_aplicativos || {}, texts = content.textos_institucionais || {};
    setValue(form,"nome",content.nome); setValue(form,"slogan",content.slogan); setValue(form,"logo",content.logo); setValue(form,"capa",content.capa); setValue(form,"descricao",content.descricao); setValue(form,"corPrimaria",colors.primaria || "#0b1f3a"); setValue(form,"corSecundaria",colors.secundaria || "#13a8e5");
    setValue(form,"whatsapp",content.whatsapp); setValue(form,"contatoEmail",contacts.email); setValue(form,"contatoTelefone",contacts.telefone); setValue(form,"contatoEndereco",contacts.endereco);
    setValue(form,"instagram",social.instagram); setValue(form,"facebook",social.facebook); setValue(form,"youtube",social.youtube); setValue(form,"tiktok",social.tiktok);
    setValue(form,"programacao",listToLines(content.programacao,["dia","horario","programa","apresentador"])); setValue(form,"locutores",listToLines(content.locutores,["nome","funcao","foto"])); setValue(form,"patrocinadores",listToLines(content.patrocinadores,["nome","site","logo"]));
    setValue(form,"appAndroid",apps.android); setValue(form,"appIos",apps.ios); setValue(form,"appAlexa",apps.alexa); setValue(form,"sobre",texts.sobre);
  }

  function collectSiteContent() {
    const form = $("#site-form"), allowed = new Set(state.site?.camposPermitidos || []), content = {};
    const value = name => String(form.elements[name]?.value || "").trim();
    if (allowed.has("nome")) content.nome=value("nome"); if(allowed.has("slogan"))content.slogan=value("slogan"); if(allowed.has("logo"))content.logo=value("logo"); if(allowed.has("capa"))content.capa=value("capa"); if(allowed.has("descricao"))content.descricao=value("descricao");
    if(allowed.has("cores"))content.cores={primaria:value("corPrimaria"),secundaria:value("corSecundaria")};
    if(allowed.has("whatsapp"))content.whatsapp=value("whatsapp"); if(allowed.has("contatos"))content.contatos={email:value("contatoEmail"),telefone:value("contatoTelefone"),endereco:value("contatoEndereco")};
    if(allowed.has("redes_sociais"))content.redes_sociais={instagram:value("instagram"),facebook:value("facebook"),youtube:value("youtube"),tiktok:value("tiktok")};
    if(allowed.has("programacao"))content.programacao=linesToObjects(value("programacao"),["dia","horario","programa","apresentador"]); if(allowed.has("locutores"))content.locutores=linesToObjects(value("locutores"),["nome","funcao","foto"]); if(allowed.has("patrocinadores"))content.patrocinadores=linesToObjects(value("patrocinadores"),["nome","site","logo"]);
    if(allowed.has("links_aplicativos"))content.links_aplicativos={android:value("appAndroid"),ios:value("appIos"),alexa:value("appAlexa")}; if(allowed.has("textos_institucionais"))content.textos_institucionais={sobre:value("sobre")};
    return content;
  }

  async function saveDraft() {
    if (!state.site) return;
    const button=$("#save-draft-button"); setButton(button,true,"Salvando…");
    try { const result=await api("/api/cliente/site/rascunho",{method:"PUT",body:JSON.stringify({conteudo:collectSiteContent()})}); state.site.conteudoRascunho=result.conteudo; state.site.status_publicacao="rascunho"; renderSite(); showGlobal(`Rascunho salvo como versão ${result.versao}.`,"success"); }
    catch(error){showGlobal(error.message,"error");} finally{setButton(button,false,"Salvar rascunho");}
  }

  async function requestPublication() {
    if(!state.site)return; if(!confirm("Enviar este rascunho para revisão e publicação pela Central Rádios Brasil?"))return;
    const button=$("#request-publication-button");setButton(button,true,"Enviando…");
    try{const result=await api("/api/cliente/site/solicitar-publicacao",{method:"POST",body:"{}"});state.site.status_publicacao=result.statusPublicacao;state.site.solicitacao_publicacao_em=new Date().toISOString();renderSite();showGlobal(result.mensagem,"success");}
    catch(error){showGlobal(error.message,"error");}finally{setButton(button,false,"Solicitar publicação");}
  }

  function openPreview(){const content=collectSiteContent(),dialog=$("#preview-dialog");$("#preview-content").innerHTML=buildPreview(content,state.site?.stream_url);dialog.showModal();}

  function buildPreview(content,streamUrl){const colors=content.cores||{},logo=safeUrl(content.logo),cover=safeUrl(content.capa),programs=content.programacao||[],people=content.locutores||[],sponsors=content.patrocinadores||[];return `<section class="preview-hero" style="--preview-primary:${escapeAttr(colors.primaria||'#0b1f3a')};--preview-cover:${cover?`url('${escapeAttr(cover)}')`:'none'}"> <div>${logo?`<img src="${escapeAttr(logo)}" alt="">`:''}<h1>${escapeHtml(content.nome||'Nome da rádio')}</h1><p>${escapeHtml(content.slogan||'Slogan da emissora')}</p>${streamUrl?`<audio controls preload="none" src="${escapeAttr(safeUrl(streamUrl))}"></audio>`:'<small>O stream técnico será definido pela Central.</small>'}</div></section><section class="preview-section"><h2>Sobre a rádio</h2><p>${escapeHtml(content.descricao||content.textos_institucionais?.sobre||'Conteúdo ainda não informado.')}</p></section>${programs.length?`<section class="preview-section"><h2>Programação</h2><div class="preview-grid">${programs.map(p=>`<article class="preview-card"><strong>${escapeHtml(p.programa||'Programa')}</strong><p>${escapeHtml([p.dia,p.horario].filter(Boolean).join(' • '))}</p><small>${escapeHtml(p.apresentador||'')}</small></article>`).join('')}</div></section>`:''}${people.length?`<section class="preview-section"><h2>Equipe</h2><div class="preview-grid">${people.map(p=>`<article class="preview-card">${safeUrl(p.foto)?`<img src="${escapeAttr(safeUrl(p.foto))}" alt="">`:''}<strong>${escapeHtml(p.nome||'')}</strong><small>${escapeHtml(p.funcao||'')}</small></article>`).join('')}</div></section>`:''}${sponsors.length?`<section class="preview-section"><h2>Patrocinadores</h2><div class="preview-grid">${sponsors.map(p=>`<article class="preview-card">${safeUrl(p.logo)?`<img src="${escapeAttr(safeUrl(p.logo))}" alt="">`:''}<strong>${escapeHtml(p.nome||'')}</strong></article>`).join('')}</div></section>`:''}`;}

  function renderInvoices(){const invoices=state.dashboard?.faturas||[];$("#invoices-body").innerHTML=invoices.map(f=>`<tr><td><strong>${escapeHtml(f.numero)}</strong></td><td>${escapeHtml(statusLabel(f.tipo_cobranca))}${f.descricao?`<small>${escapeHtml(f.descricao)}</small>`:''}</td><td>${escapeHtml(f.competencia)}</td><td>${dateBr(f.vencimento)}</td><td>${money(f.valor_total_centavos)}</td><td>${money(f.valor_pago_centavos)}</td><td><span class="badge ${escapeHtml(f.status)}">${escapeHtml(statusLabel(f.status))}</span></td></tr>`).join('')||'<tr><td colspan="7">Nenhuma fatura registrada.</td></tr>';}
  function renderContracts(){const contracts=state.dashboard?.contratos||[];$("#contracts-list").innerHTML=contracts.map(c=>`<article class="contract-card"><div><strong>${escapeHtml(c.numero)}</strong><small>${escapeHtml(c.plano_nome||'Plano personalizado')}</small></div><div><small>Status</small><span class="badge ${escapeHtml(c.status)}">${escapeHtml(statusLabel(c.status))}</span></div><div><small>Valor</small><strong>${money(c.valor_centavos)}</strong></div><div><small>Vencimento</small><strong>Dia ${Number(c.dia_vencimento||10)}</strong></div><div><small>Serviços</small><strong>Streaming: ${escapeHtml(statusLabel(c.streaming_status))}<br>Site: ${escapeHtml(statusLabel(c.site_status))}</strong></div></article>`).join('')||'<div class="empty">Nenhum contrato registrado.</div>';}

  async function changePassword(event){event.preventDefault();const form=event.currentTarget,data=new FormData(form),newPassword=String(data.get("novaSenha")||""),confirmation=String(data.get("confirmacao")||"");if(newPassword!==confirmation){showGlobal("A confirmação não corresponde à nova senha.","error");return;}const button=$("button[type=submit]",form);setButton(button,true,"Atualizando…");try{const result=await api("/api/cliente/trocar-senha",{method:"POST",body:JSON.stringify({senhaAtual:data.get("senhaAtual"),novaSenha:newPassword})});form.reset();if(state.dashboard)state.dashboard.forcarTrocaSenha=false;showGlobal(result.mensagem,"success");switchTab("resumo");}catch(error){showGlobal(error.message,"error");}finally{setButton(button,false,"Atualizar senha");}}

  function switchTab(tab){$$('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$$('[data-panel]').forEach(p=>p.classList.toggle('hidden',p.dataset.panel!==tab));window.scrollTo({top:0,behavior:'smooth'});}
  function showGlobal(message,type="",timeout=0){showMessage("#global-message",message,type);if(timeout)setTimeout(()=>showMessage("#global-message","",""),timeout);}
  function showMessage(selector,message,type){const el=$(selector);el.textContent=message;el.className=`message ${type||''} ${message?'':'hidden'}`.trim();}
  function setButton(button,disabled,label){button.disabled=disabled;button.textContent=label;}
  function text(selector,value){$(selector).textContent=value??"";}
  function setValue(form,name,value){if(form.elements[name])form.elements[name].value=value??"";}
  function linesToObjects(text,keys){return String(text||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean).slice(0,60).map(line=>{const parts=line.split('|').map(x=>x.trim());return Object.fromEntries(keys.map((key,index)=>[key,parts[index]||'']));});}
  function listToLines(list,keys){return Array.isArray(list)?list.map(item=>typeof item==='string'?item:keys.map(key=>item?.[key]||'').join(' | ')).join('\n'):'';}
  function statusLabel(value){const labels={ativo:'Ativo',prospect:'Prospect',suspenso:'Suspenso',cancelado:'Cancelado',rascunho:'Rascunho',proposta_enviada:'Proposta enviada',aguardando_pagamento:'Aguardando pagamento',em_atraso:'Em atraso',planejamento:'Planejamento',configurando:'Configurando',nao_incluido:'Não incluído',publicado:'Publicado',sem_rascunho:'Sem rascunho',aguardando_publicacao:'Aguardando publicação',aberta:'Aberta',parcial:'Parcial',paga:'Paga',vencida:'Vencida',cancelada:'Cancelada',estornada:'Estornada',mensalidade:'Mensalidade',implantacao:'Implantação',servico_adicional:'Serviço adicional',ajuste:'Ajuste',outro:'Outro'};return labels[value]||String(value||'—').replaceAll('_',' ');}
  function money(cents){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(cents||0)/100);}
  function dateBr(value){if(!value)return'—';const date=new Date(`${String(value).slice(0,10)}T12:00:00`);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat('pt-BR').format(date);}
  function dateTimeBr(value){if(!value)return'—';const date=new Date(value);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(date);}
  function safeUrl(value){try{const url=new URL(String(value||''));return ['http:','https:'].includes(url.protocol)?url.href:'';}catch{return'';}}
  function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));}
  function escapeAttr(value){return escapeHtml(value).replace(/`/g,'&#96;');}
})();
