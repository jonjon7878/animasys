/* IPC - customizacoes da loja (DESKTOP) - v33
   Pasta unica no servidor: ipc.tec.br/loja/
   Carregar no painel com UMA linha:
   <script src="https://ipc.tec.br/loja/loja-desktop.js?v=33" defer></script>

   FEATURES ATIVAS (cada uma no seu try/catch, so no desktop, reversivel):
   1) Menu: Calculadoras (dropdown), Institucional no topo, ocultar Home no desktop
   2) Produto: botao de cotacao no WhatsApp (apos o card de frete)
   3) Preco PDP: PIX heroi + parcelamento honesto (tabela com TOTAL, sem-juros dinamico)
   4) Cards de listagem (home/categoria/busca): PIX heroi compacto
   5) Botao "Comprar" nos cards de "Produtos Relacionados" (PDP)
   6) Rodape: formas de pagamento monocromaticas (bandeiras em SVG cinza + hover,
      agrupadas num painel sutil, com o titulo "Formas de pagamento").
   7) Pagina "Central de Atendimento": layout com cards de telefone por cidade,
      canais (WhatsApp/horario/endereco) e mapa do Google Maps. So /p/central-atendimento.

   v26: adicionada a feature 6 (rodape).
   v30: feature 7 (checkout PJ via JS) REVERTIDA. O handler de clique do tema e delegado
        e nao respondia ao clique-proxy da caixa; o destaque do link passou a ser CSS no painel.
   v31: pagina "Central de Atendimento" reconstruida via JS (o editor da Simplo7
        sanitiza HTML/SVG/iframe ao salvar). So no desktop; mobile e processo separado.
   v32: correcao do CEP para 09667-020 (no texto do endereco e na query do mapa).
   v33: isDesktop() corrigido - loja-mobile.js (e qualquer loja-*.js) NAO e mais
        marca de mobile. So body.layout-mobile e style-mobile.css barram (os loaders
        moram no MESMO campo global e carregam nos dois temas). Fallback de largura mantido.
*/
(function () {
  'use strict';

  var DESKTOP = '(min-width: 1024px)';
  var BASE = 'https://www.ipccomercial.com.br';
  var PHONE = '551131361560';

  /* ============================================================
     >>> PARCELAS SEM JUROS NOS CARDS DE LISTAGEM <<<
     Quantas vezes SEM JUROS aparecem nos cards (home/categoria/busca).
     O card nao tem como ler isso por produto (so a pagina do produto tem),
     entao e um numero FIXO da loja. Veio do acordo de taxas com a operadora.
     Se renegociar, troque SO este numero (e suba o ?v= no painel).
     Importante: use o menor valor que vale para TODOS os produtos, senao
     algum card pode prometer mais parcelas sem juros do que o real.
     ============================================================ */
  var CARD_SEM_JUROS = 2;

  var URL_QUEM   = BASE + '/p/quem-somos';
  var URL_FALE   = BASE + '/p/central-atendimento';
  var URL_ONDE   = BASE + '/p/onde-estamos';
  var URL_CALC_R = BASE + '/p/calculo-de-roletes-industriais';
  var URL_CALC_P = BASE + '/p/calculo-do-perfil-de-aluminio-estrutural';

  /* ===================== helpers compartilhados ===================== */
  function pick(sels) {
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (el) { return el; }
    }
    return null;
  }
  /* Deteccao de plataforma pelo TEMA servido pela Simplo7 (decisao do servidor,
     por User-Agent), nao pela largura. O tema mobile carrega 'style-mobile.css' e
     poe a classe 'layout-mobile' no body. Conservador: QUALQUER marca de mobile
     barra a aplicacao. Assim "pedir versao desktop no celular" (servidor entrega o
     tema desktop, sem essas marcas) passa a aplicar normalmente.
     ATENCAO: os loaders loja-desktop.js / loja-mobile.js moram no MESMO campo
     global de Codigos e carregam nos DOIS temas -> NAO servem de marca de
     plataforma. So contam body.layout-mobile e style-mobile.css (render do servidor). */
  function isDesktop() {
    try {
      if (document.querySelector('link[href*="style-mobile"]')) { return false; }
      var b = document.body;
      if (b && /(^|\s)layout-mobile(\s|$)/.test(b.className)) { return false; }
      return true;
    } catch (e) {
      /* em caso de erro, cai no criterio antigo de largura (seguro) */
      return window.matchMedia(DESKTOP).matches;
    }
  }
  function nudge() { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }
  function copyFont(target, ref) {
    if (!ref) { return; }
    var cs = window.getComputedStyle(ref);
    target.style.fontSize = cs.fontSize;
    target.style.fontWeight = cs.fontWeight;
    target.style.fontFamily = cs.fontFamily;
    target.style.letterSpacing = cs.letterSpacing;
  }

  /* ===================== 1) MENU ===================== */
  var MENU_SELECTORS = ['#menu-main .menu-main-list', '.menu-main-list', '#nav-main .element-menu-main ul'];
  var TOPBAR_SELECTORS = ['#header-main .header-1 .container-12', '#header-main .header-1', '.header-1'];

  function interItemGap(menu) {
    var kids = [];
    for (var i = 0; i < menu.children.length; i++) {
      var c = menu.children[i];
      if (c.tagName === 'LI' && !c.getAttribute('data-ipc')) { kids.push(c); }
    }
    if (kids.length >= 2) {
      var g = kids[1].offsetLeft - (kids[0].offsetLeft + kids[0].offsetWidth);
      if (g >= 0 && g < 200) { return g; }
    }
    return null;
  }

  function makeTool(href, title, desc) {
    var a = document.createElement('a');
    a.href = href;
    a.style.display = 'block';
    a.style.padding = '10px 12px';
    a.style.textDecoration = 'none';
    a.style.borderRadius = '8px';
    a.style.background = 'transparent';
    var t = document.createElement('span');
    t.textContent = title;
    t.style.display = 'block';
    t.style.fontSize = '13.5px';
    t.style.fontWeight = '500';
    t.style.color = '#15161A';
    var d = document.createElement('span');
    d.textContent = desc;
    d.style.display = 'block';
    d.style.fontSize = '11.5px';
    d.style.color = '#6E727B';
    d.style.marginTop = '2px';
    a.appendChild(t);
    a.appendChild(d);
    a.addEventListener('mouseenter', function () { a.style.background = '#FBF6E0'; });
    a.addEventListener('mouseleave', function () { a.style.background = 'transparent'; });
    return a;
  }

  function buildCalc(menu) {
    var li = document.createElement('li');
    li.id = 'ipc-calc-item';
    li.setAttribute('data-ipc', '1');
    li.style.position = 'relative';
    li.style.display = 'flex';
    li.style.alignItems = 'center';

    var gap = interItemGap(menu);
    if (gap !== null) { li.style.marginLeft = gap + 'px'; }

    var btn = document.createElement('a');
    btn.href = URL_CALC_R;
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.gap = '6px';
    btn.style.padding = '8px 13px';
    btn.style.fontWeight = '500';
    btn.style.lineHeight = '1';
    btn.style.color = '#15161A';
    btn.style.background = '#FFD700';
    btn.style.borderRadius = '999px';
    btn.style.textDecoration = 'none';
    btn.style.whiteSpace = 'nowrap';

    var refA = menu.querySelector('li > a');
    if (refA) {
      var cs = window.getComputedStyle(refA);
      btn.style.fontSize = cs.fontSize;
      btn.style.fontFamily = cs.fontFamily;
    }

    var label = document.createElement('span');
    label.textContent = 'Calculadoras';
    var caret = document.createElement('span');
    caret.textContent = '\u25be';
    caret.style.fontSize = '10px';
    btn.appendChild(label);
    btn.appendChild(caret);

    var panel = document.createElement('div');
    panel.setAttribute('data-ipc', '1');
    panel.style.position = 'absolute';
    panel.style.top = '100%';
    panel.style.right = '0';
    panel.style.width = '300px';
    panel.style.background = '#fff';
    panel.style.border = '1px solid #E7E8EC';
    panel.style.borderTop = '3px solid #FFD700';
    panel.style.borderRadius = '0 0 10px 10px';
    panel.style.boxShadow = '0 12px 26px -8px rgba(20,22,26,.28)';
    panel.style.padding = '6px';
    panel.style.zIndex = '9999';
    panel.style.display = 'none';
    panel.appendChild(makeTool(URL_CALC_R, 'C\u00e1lculo de Roletes', 'Descubra o rolete ideal pra sua carga'));
    panel.appendChild(makeTool(URL_CALC_P, 'C\u00e1lculo de Perfil de Alum\u00ednio', 'Monte o perfil estrutural sob medida'));

    li.appendChild(btn);
    li.appendChild(panel);
    var closeT;
    function showPanel() { clearTimeout(closeT); panel.style.display = 'block'; }
    function hidePanel() { closeT = setTimeout(function () { panel.style.display = 'none'; }, 180); }
    li.addEventListener('mouseenter', showPanel);
    li.addEventListener('mouseleave', hidePanel);
    panel.addEventListener('mouseenter', showPanel);
    return li;
  }

  function makeTopLink(href, text, ref) {
    var a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    a.style.color = '#FFD700';
    a.style.textDecoration = 'none';
    a.style.whiteSpace = 'nowrap';
    copyFont(a, ref);
    return a;
  }

  function buildTopLinks(bar) {
    var ref = bar.querySelector('a');
    var span = document.createElement('span');
    span.id = 'ipc-top-inst';
    span.setAttribute('data-ipc', '1');
    span.style.display = 'inline-flex';
    span.style.alignItems = 'center';
    span.style.gap = '14px';
    span.style.marginLeft = '18px';
    span.appendChild(makeTopLink(URL_QUEM, 'Quem Somos', ref));
    span.appendChild(makeTopLink(URL_FALE, 'Fale Conosco', ref));
    span.appendChild(makeTopLink(URL_ONDE, 'Nossa Localiza\u00e7\u00e3o', ref));
    return span;
  }

  function getHomeDropdown() {
    var list = pick(MENU_SELECTORS);
    if (!list) { return null; }
    var lis = list.children;
    for (var i = 0; i < lis.length; i++) {
      if (lis[i].tagName !== 'LI') { continue; }
      var a = lis[i].querySelector('a');
      if (a && a.textContent.trim().toLowerCase() === 'home') {
        return lis[i].getElementsByTagName('ul')[0] || null;
      }
    }
    return (lis[0] && lis[0].getElementsByTagName) ? (lis[0].getElementsByTagName('ul')[0] || null) : null;
  }

  function applyMenu(desk) {
    try {
      var menu = pick(MENU_SELECTORS);
      var calc = document.getElementById('ipc-calc-item');
      if (menu) {
        if (desk && !calc) { menu.appendChild(buildCalc(menu)); }
        else if (!desk && calc) { calc.parentNode.removeChild(calc); }
      }
    } catch (e) {}

    try {
      var bar = pick(TOPBAR_SELECTORS);
      var top = document.getElementById('ipc-top-inst');
      if (bar) {
        if (desk && !top) { bar.appendChild(buildTopLinks(bar)); }
        else if (!desk && top) { top.parentNode.removeChild(top); }
      }
    } catch (e) {}

    try {
      var hd = getHomeDropdown();
      if (hd) { hd.style.display = desk ? 'none' : ''; }
    } catch (e) {}
  }

  /* ===================== 2) PRODUTO (so o botao de cotacao no WhatsApp) ===================== */
  var BUYBOX_SELECTORS = ['.product-detail-right', '.product-detail .product-detail-right', '#product .product-detail-right', '.product-detail'];
  var TITLE_SELECTORS = ['.product-detail-right h1', '.product-detail h1', 'h1.product-name', '#product h1', 'h1'];
  var WPP_ID = 'ipc-cotacao-wpp';

  function productName() {
    var el = pick(TITLE_SELECTORS);
    return el ? el.textContent.trim().replace(/\s+/g, ' ') : '';
  }

  function waUrl() {
    var canon = document.querySelector('link[rel=canonical]');
    var url = (canon && canon.href) ? canon.href : window.location.href;
    var msg = 'Ol\u00e1! Tenho interesse neste produto:\n' + productName() + '\n' + url;
    return 'https://api.whatsapp.com/send?phone=' + PHONE + '&text=' + encodeURIComponent(msg);
  }

  function buildBtn() {
    var a = document.createElement('a');
    a.id = WPP_ID;
    a.setAttribute('data-ipc', '1');
    a.href = waUrl();
    a.target = '_blank';
    a.rel = 'noopener';
    a.style.display = 'flex';
    a.style.alignItems = 'center';
    a.style.justifyContent = 'center';
    a.style.gap = '8px';
    a.style.boxSizing = 'border-box';
    a.style.width = '100%';
    a.style.marginTop = '12px';
    a.style.padding = '12px 14px';
    a.style.background = '#25D366';
    a.style.color = '#fff';
    a.style.borderRadius = '8px';
    a.style.textDecoration = 'none';
    a.style.fontSize = '14px';
    a.style.fontWeight = '500';
    a.style.lineHeight = '1';

    var icon = document.createElement('span');
    icon.style.display = 'inline-flex';
    icon.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 1.67c2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.42 5.82c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 9.7c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z"/></svg>';

    var label = document.createElement('span');
    label.textContent = 'Tirar d\u00favida ou pedir cota\u00e7\u00e3o';

    a.appendChild(icon);
    a.appendChild(label);
    return a;
  }

  /* ponto de insercao: logo APOS o card de frete (.box-shipping), no rodape da
     coluna de compra (posicao validada em producao via inspecao). Fallback:
     apos o proprio botao Comprar (.wrapper-btn-buy), se a pagina nao tiver frete. */
  var ANCHOR_SELECTORS = ['.product-detail-right .box-shipping', '.product-detail-right .wrapper-btn-buy'];

  function applyProduto(desk) {
    try {
      var anchor = pick(ANCHOR_SELECTORS);
      var existing = document.getElementById(WPP_ID);
      if (!anchor) { return; } /* nao e pagina de produto */
      if (desk && !existing) { anchor.insertAdjacentElement('afterend', buildBtn()); }
      else if (!desk && existing) { existing.parentNode.removeChild(existing); }
    } catch (e) {}
  }

  /* ===================== 3) PRECO (Opcao 2: PIX heroi + parcelamento honesto) =====================
     - Mostra o PIX em destaque (maior preco) + selo de % OFF.
     - "em ate Nx sem juros" e DINAMICO: lemos a tabela #deferred-payment (que o tema
       alimenta a partir do Mercado Pago) e calculamos a maior parcela "Sem juros".
       Mudou no MP, muda aqui sozinho - sem editar o script.
     - Montamos NOSSA tabela limpa de parcelas (sem/c juros honesto) e escondemos o
       popover nativo (jQuery UI) feio.
     - O .product-price-off tem display:inline-block !important no tema, por isso
       escondemos os originais com setProperty('display','none','important'). */
  var PRECO_ID = 'ipc-preco-block';
  var PRECO_HIDE = ['.product-new-price', '.product-price-off', '.product-parcelled-price', '.wrapper-product-parcels'];

  /* le as parcelas da tabela nativa: [{ n, label, price, sem, total }] */
  function parseParcelas(scope) {
    var out = [];
    var table = scope.querySelector('#deferred-payment') || document.querySelector('#deferred-payment');
    if (!table) { return out; }
    var trs = table.querySelectorAll('tbody tr');
    for (var i = 0; i < trs.length; i++) {
      var numEl = trs[i].querySelector('.parcel-number');
      var priceEl = trs[i].querySelector('.parcel-price');
      var descEl = trs[i].querySelector('.parcel-desc');
      var totEl = trs[i].querySelector('.parcel-total');
      if (!numEl || !priceEl) { continue; }
      var label = numEl.textContent.trim();
      /* total vem como "Total: R$ 57,71" - tiramos o rotulo "Total:" */
      var total = totEl ? totEl.textContent.replace(/total\s*:?\s*/i, '').trim() : '';
      out.push({
        n: parseInt(label, 10) || 0,
        label: label,
        price: priceEl.textContent.trim(),
        sem: descEl ? /sem\s*juros/i.test(descEl.textContent) : false,
        total: total
      });
    }
    return out;
  }

  /* preenche um box JA EXISTENTE (e vazio) com o conteudo do preco, a partir dos
     dados ja lidos (d). Atualizamos sempre o MESMO box, sem remover/recriar - e
     isso que evita o "pisca/abre-e-fecha" na troca de variacao. */
  function fillPreco(box, d) {
    var regular = d.regular, pixVal = d.pixVal, pct = d.pct;
    var parcelas = d.parcelas;
    var maxSem = 0, maxN = 0;
    for (var i = 0; i < parcelas.length; i++) {
      if (parcelas[i].n > maxN) { maxN = parcelas[i].n; }
      if (parcelas[i].sem && parcelas[i].n > maxSem) { maxSem = parcelas[i].n; }
    }

    /* --- heroi: PIX --- */
    var hero = document.createElement('div');
    hero.style.display = 'flex';
    hero.style.alignItems = 'baseline';
    hero.style.flexWrap = 'wrap';
    hero.style.gap = '8px';
    var v = document.createElement('span');
    v.textContent = pixVal;
    v.style.fontSize = '28px';
    v.style.fontWeight = '800';
    v.style.color = '#15161A';
    v.style.letterSpacing = '-.5px';
    var lbl = document.createElement('span');
    lbl.textContent = 'no PIX';
    lbl.style.fontSize = '13px';
    lbl.style.color = '#6E727B';
    hero.appendChild(v);
    hero.appendChild(lbl);
    if (pct) {
      var badge = document.createElement('span');
      badge.textContent = pct + ' OFF';
      badge.style.fontSize = '11px';
      badge.style.fontWeight = '700';
      badge.style.color = '#1E7F3C';
      badge.style.background = '#E7F5EC';
      badge.style.padding = '2px 8px';
      badge.style.borderRadius = '6px';
      hero.appendChild(badge);
    }
    box.appendChild(hero);

    /* --- linha do cartao: "ou R$ X em ate Nx sem juros" (N dinamico). Se so houver
       1x sem juros (ou nenhuma parcela), cai para "no cartao" sem prometer nada. --- */
    var line = document.createElement('div');
    line.style.fontSize = '12.5px';
    line.style.color = '#6E727B';
    line.style.marginTop = '8px';
    line.appendChild(document.createTextNode('ou '));
    var r = document.createElement('span');
    r.textContent = regular;
    r.style.color = '#15161A';
    line.appendChild(r);
    if (maxSem >= 2) {
      line.appendChild(document.createTextNode(' em at\u00e9 '));
      var s = document.createElement('span');
      s.textContent = maxSem + 'x sem juros';
      s.style.color = '#15161A';
      s.style.fontWeight = '700';
      s.style.background = '#FBF6E0';
      s.style.padding = '1px 5px';
      s.style.borderRadius = '4px';
      line.appendChild(s);
    } else {
      line.appendChild(document.createTextNode(' no cart\u00e3o'));
    }
    box.appendChild(line);

    /* --- nossa tabela limpa de parcelas (toggle proprio) --- */
    if (parcelas.length) {
      var trigTxt = maxN ? ('Parcelar em at\u00e9 ' + maxN + 'x') : 'Ver parcelas';
      var trig = document.createElement('button');
      trig.type = 'button';
      trig.style.cssText = 'display:inline-block;margin-top:11px;background:transparent;border:none;padding:0 0 1px;font-family:inherit;font-size:12px;font-weight:600;color:#15161A;border-bottom:2px solid #FFD700;cursor:pointer;';
      trig.textContent = trigTxt + ' \u203a';

      var panel = document.createElement('div');
      panel.style.cssText = 'max-height:0;overflow:hidden;transition:max-height .25s ease;';

      var listas = document.createElement('div');
      listas.style.cssText = 'margin-top:8px;border:1px solid #EEF0F3;border-radius:8px;overflow:hidden;font-size:12px;';

      /* cabecalho: PARCELAMENTO | TOTAL */
      var head = document.createElement('div');
      head.style.cssText = 'display:flex;justify-content:space-between;padding:6px 11px;background:#F5F6F8;font-size:10px;letter-spacing:.04em;color:#9aa0a8;';
      var h1 = document.createElement('span'); h1.textContent = 'PARCELAMENTO';
      var h2 = document.createElement('span'); h2.textContent = 'TOTAL';
      head.appendChild(h1); head.appendChild(h2);
      listas.appendChild(head);

      for (var k = 0; k < parcelas.length; k++) {
        var p = parcelas[k];
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:7px 11px;background:' + (k % 2 ? '#FAFBFC' : '#fff') + ';';

        /* esquerda: "Nx de R$ X" */
        var left = document.createElement('span');
        left.style.color = '#3A3D44';
        var nb = document.createElement('b');
        nb.style.color = '#15161A';
        nb.textContent = p.label;
        left.appendChild(nb);
        left.appendChild(document.createTextNode(' de ' + p.price));

        /* direita: total (em cima) + tag sem/com juros (embaixo) */
        var right = document.createElement('span');
        right.style.cssText = 'text-align:right;line-height:1.25;';
        var tot = document.createElement('span');
        tot.style.cssText = 'color:#15161A;font-weight:600;';
        tot.textContent = p.total || '';
        var tag = document.createElement('span');
        tag.style.fontSize = '9.5px';
        tag.style.color = p.sem ? '#1E7F3C' : '#9aa0a8';
        tag.style.fontWeight = p.sem ? '700' : '400';
        tag.textContent = p.sem ? 'sem juros' : 'com juros';
        right.appendChild(tot);
        right.appendChild(document.createElement('br'));
        right.appendChild(tag);

        row.appendChild(left);
        row.appendChild(right);
        listas.appendChild(row);
      }
      panel.appendChild(listas);

      (function (pn, tg, txt, inner) {
        var open = false;
        tg.addEventListener('click', function () {
          open = !open;
          pn.style.maxHeight = open ? (inner.scrollHeight + 20) + 'px' : '0';
          tg.textContent = (open ? 'Ocultar parcelas \u2304' : txt + ' \u203a');
        });
      })(panel, trig, trigTxt, listas);

      box.appendChild(trig);
      box.appendChild(panel);
    }
  }

  /* ---- leitura + assinatura (para detectar mudanca de variacao/preco) ---- */
  function readPreco(scope) {
    var bigEl = scope.querySelector('.product-big-price');
    var pixEl = scope.querySelector('.desconto_avista');
    var offEl = scope.querySelector('.product-price-off');
    if (!bigEl || !pixEl) { return null; }
    var pct = '';
    if (offEl) { var m = offEl.textContent.match(/(\d+%)/); if (m) { pct = m[1]; } }
    return {
      regular: bigEl.textContent.trim(),
      pixVal: pixEl.textContent.trim(),
      pct: pct,
      parcelas: parseParcelas(scope)
    };
  }
  function precoSig(d) {
    if (!d) { return ''; }
    var p = '';
    for (var i = 0; i < d.parcelas.length; i++) {
      var x = d.parcelas[i];
      p += x.label + x.price + x.total + (x.sem ? '1' : '0') + ';';
    }
    return d.regular + '~' + d.pixVal + '~' + d.pct + '~' + p;
  }
  /* esconde os nativos por CSS injetado (1 regra). Vale para os elementos ATUAIS
     e para os que o tema recriar na troca de variacao - sem flash, sem reaparecer.
     So injetamos depois que nosso bloco existe (fallback seguro: se o JS falhar
     antes disso, o preco nativo continua visivel). */
  var PRECO_STYLE_ID = 'ipc-preco-hide';
  function ensureHideStyle() {
    if (document.getElementById(PRECO_STYLE_ID)) { return; }
    var st = document.createElement('style');
    st.id = PRECO_STYLE_ID;
    st.setAttribute('data-ipc', '1');
    var sel = [];
    for (var i = 0; i < PRECO_HIDE.length; i++) { sel.push('.product-detail-right ' + PRECO_HIDE[i]); }
    st.textContent = sel.join(',') + '{display:none !important;}';
    (document.head || document.documentElement).appendChild(st);
  }
  function removeHideStyle() {
    var st = document.getElementById(PRECO_STYLE_ID);
    if (st) { st.parentNode.removeChild(st); }
  }

  var PRECO_LAST_SIG = '';
  /* (re)constroi o bloco a partir dos valores ATUAIS; so refaz se algo mudou
     (assinatura), pra nao reconstruir a toa. Le os nativos, monta o nosso bloco
     e re-esconde os nativos ATUAIS (importante: em produto com variacao, o tema
     cria nativos NOVOS a cada troca - precisamos esconder os novos). */
  function rebuildPreco(scope) {
    var d = readPreco(scope);
    var sig = precoSig(d);
    var box = document.getElementById(PRECO_ID);
    if (box && sig === PRECO_LAST_SIG) { return; } /* nada mudou */

    if (!d) { /* sem preco: tira nosso bloco e revela o nativo (fallback seguro) */
      if (box) { box.parentNode.removeChild(box); }
      removeHideStyle();
      PRECO_LAST_SIG = '';
      return;
    }

    if (box) {
      /* ATUALIZA no lugar: esvazia e repreenche o MESMO node (nao pisca) */
      while (box.firstChild) { box.removeChild(box.firstChild); }
      fillPreco(box, d);
    } else {
      /* cria 1x. Ancora FORA da area que o tema re-renderiza: logo antes do botao
         Comprar (.wrapper-btn-buy). Assim a troca de variacao nao apaga nosso bloco. */
      box = document.createElement('div');
      box.id = PRECO_ID;
      box.setAttribute('data-ipc', '1');
      box.style.margin = '6px 0 4px';
      fillPreco(box, d);
      var btn = scope.querySelector('.wrapper-btn-buy');
      if (btn && btn.parentNode) {
        btn.parentNode.insertBefore(box, btn);
      } else {
        var wrap = scope.querySelector('.product-price') || scope.querySelector('.wrapper-product-price') || scope;
        wrap.insertBefore(box, wrap.firstChild);
      }
    }
    ensureHideStyle();
    PRECO_LAST_SIG = sig;
  }

  /* observa a coluna de compra: produtos com variacao (e o widget do Mercado Pago)
     re-renderizam o preco/parcelas DEPOIS do load. Sem vigiar, os dizeres antigos
     ("Cartao de Credito em ate Nx" / "Ver parcelas") reaparecem embaixo do nosso
     bloco. Trava anti-loop: desconecta durante nossas mutacoes + takeRecords. */
  var PRECO_OBS = null, PRECO_DEB = null;
  function startPrecoObserver(scope) {
    if (PRECO_OBS || typeof MutationObserver === 'undefined') { return; }
    PRECO_OBS = new MutationObserver(function () {
      clearTimeout(PRECO_DEB);
      PRECO_DEB = setTimeout(function () {
        var sc = document.querySelector('.product-detail-right');
        if (!sc) { return; }
        PRECO_OBS.disconnect();
        try { rebuildPreco(sc); } catch (e) {}
        try { PRECO_OBS.takeRecords(); PRECO_OBS.observe(scope, { childList: true, subtree: true, characterData: true }); } catch (e) {}
      }, 150);
    });
    PRECO_OBS.observe(scope, { childList: true, subtree: true, characterData: true });
  }
  function stopPrecoObserver() {
    if (PRECO_OBS) { PRECO_OBS.disconnect(); PRECO_OBS = null; }
  }

  function applyPreco(desk) {
    try {
      var scope = document.querySelector('.product-detail-right');
      if (!scope) { return; } /* nao e pagina de produto */
      if (desk) {
        rebuildPreco(scope);
        startPrecoObserver(scope);
      } else {
        stopPrecoObserver();
        var ex = document.getElementById(PRECO_ID);
        if (ex) { ex.parentNode.removeChild(ex); }
        removeHideStyle();
        PRECO_LAST_SIG = '';
      }
    } catch (e) {}
  }

  /* ===================== 4) CARDS de listagem (home, categoria, busca) =====================
     Mesmo card nas 3 telas (li.product-list-item). Recompoe o preco do card no
     estilo "PIX heroi" (compacto): preco riscado (se promo) + PIX em destaque +
     selo "% OFF" + "ou R$ X em ate Nx no cartao" (espelha o site; SEM tabela de
     parcelas - nao existe no card; SEM "sem juros" - nao temos essa info aqui).
     Esconde os nativos por CSS injetado (vale pros clones do bxSlider na home). */
  var CARD_SEL = 'li.product-list-item';
  var CARD_DONE = 'ipc-card-done';
  var CARD_BLOCK = 'ipc-card-price';
  var CARD_STYLE_ID = 'ipc-card-hide';
  var CARD_HIDE = ['.product-old-price', '.product-price', '.product-parcelled-price', '.product-cash-price'];

  function ensureCardStyle() {
    if (document.getElementById(CARD_STYLE_ID)) { return; }
    var st = document.createElement('style');
    st.id = CARD_STYLE_ID;
    st.setAttribute('data-ipc', '1');
    var sel = [];
    for (var i = 0; i < CARD_HIDE.length; i++) { sel.push('.' + CARD_DONE + ' ' + CARD_HIDE[i]); }
    st.textContent = sel.join(',') + '{display:none !important;}';
    (document.head || document.documentElement).appendChild(st);
  }
  function removeCardStyle() {
    var st = document.getElementById(CARD_STYLE_ID);
    if (st) { st.parentNode.removeChild(st); }
  }

  function buildCardPrice(card) {
    /* preco cheio: 'product-simple' usa .product-big-price; 'product-compounded'
       (variacao de cor) guarda em <p class="product-price product-sell-price"><ins>R$ X</ins>.
       Os fallbacks cobrem os dois formatos. Card so-parcelado ("Ate R$ X", sem <ins>)
       fica de fora (bigEl null -> deixa o card nativo). */
    var bigEl = card.querySelector('.product-big-price')
             || card.querySelector('.product-sell-price ins')
             || card.querySelector('.product-price ins');
    var cashEl = card.querySelector('.product-cash-price');
    if (!bigEl || !cashEl) { return null; } /* sem preco/PIX: deixa o card nativo */
    var regular = bigEl.textContent.trim();
    var spans = cashEl.querySelectorAll('span');
    var pixVal = spans.length ? spans[spans.length - 1].textContent.trim() : '';
    if (!pixVal) { return null; }
    var pm = cashEl.textContent.match(/(\d+%)/);
    var pct = pm ? pm[1] : '';
    var parcEl = card.querySelector('.product-parcelled-price');
    var nx = '';
    if (parcEl) { var sp = parcEl.querySelector('span'); nx = sp ? sp.textContent.trim() : ''; }
    var oldEl = card.querySelector('.product-old-price .product-strikethrough-price');
    var oldVal = oldEl ? oldEl.textContent.trim() : '';

    var box = document.createElement('div');
    box.className = CARD_BLOCK;
    box.setAttribute('data-ipc', '1');
    /* divisoria fina separando do nome/rating + respiro (variante "B") */
    box.style.cssText = 'border-top:1px solid #F1F2F5;margin-top:8px;padding-top:8px;';

    /* (so em promocao) "de R$ X" riscado */
    if (oldVal) {
      var o = document.createElement('div');
      o.style.cssText = 'font-size:10.5px;color:#9aa0a8;text-decoration:line-through;';
      o.textContent = 'de ' + oldVal;
      box.appendChild(o);
    }

    /* linha 1: PIX em destaque + "no PIX" + "% OFF" (tudo na mesma linha) */
    var hero = document.createElement('div');
    hero.style.cssText = 'display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;';
    var v = document.createElement('span');
    v.textContent = pixVal;
    v.style.cssText = 'font-size:25px;font-weight:800;color:#15161A;letter-spacing:-.4px;';
    var lbl = document.createElement('span');
    lbl.textContent = 'no PIX';
    lbl.style.cssText = 'font-size:10.5px;color:#6E727B;';
    hero.appendChild(v);
    hero.appendChild(lbl);
    if (pct) {
      var badge = document.createElement('span');
      badge.textContent = pct + ' OFF';
      badge.style.cssText = 'font-size:9.5px;font-weight:700;color:#1E7F3C;background:#E7F5EC;padding:1px 5px;border-radius:4px;';
      hero.appendChild(badge);
    }
    box.appendChild(hero);

    /* bloco suave com as formas de pagamento (layout "2" escolhido). O numero de
       parcelas sem juros vem da constante CARD_SEM_JUROS (topo do arquivo) - o card
       nao tem como ler isso por produto, entao e um valor fixo da loja. */
    var pay = document.createElement('div');
    pay.style.cssText = 'background:#FAFBFC;border:1px solid #F1F2F5;border-radius:7px;padding:8px 9px;margin-top:7px;';

    var pline = document.createElement('div');
    pline.style.cssText = 'font-size:11.5px;font-weight:400;color:#3A3D44;line-height:1.4;white-space:normal;';
    pline.appendChild(document.createTextNode('Boleto, d\u00e9bito ou cr\u00e9dito em at\u00e9 '));
    var sj = document.createElement('b');
    sj.style.cssText = 'font-weight:700;color:#15161A;';
    sj.textContent = CARD_SEM_JUROS + 'x sem juros';
    pline.appendChild(sj);
    pline.appendChild(document.createTextNode(': '));
    var rv = document.createElement('b');
    rv.style.cssText = 'font-weight:700;color:#15161A;font-size:13px;';
    rv.textContent = regular;
    pline.appendChild(rv);
    pay.appendChild(pline);

    /* parcelas no credito, com icone de cartao (16px) */
    if (nx) {
      var pl = document.createElement('div');
      pl.style.cssText = 'display:flex;align-items:center;gap:5px;font-size:11px;color:#9aa0a8;margin-top:4px;white-space:normal;';
      var ic = document.createElement('span');
      ic.setAttribute('aria-hidden', 'true');
      ic.style.cssText = 'display:inline-flex;flex:0 0 auto;';
      ic.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>';
      pl.appendChild(ic);
      pl.appendChild(document.createTextNode('em at\u00e9 ' + nx + ' no cart\u00e3o de cr\u00e9dito'));
      pay.appendChild(pl);
    }

    box.appendChild(pay);

    return box;
  }

  function applyCardOne(card) {
    if (card.classList.contains(CARD_DONE)) { return; } /* ja processado (idempotente) */
    var box = buildCardPrice(card);
    if (!box) { return; }
    var anchor = card.querySelector('.product-old-price') || card.querySelector('.product-price');
    if (!anchor || !anchor.parentNode) { return; }
    anchor.parentNode.insertBefore(box, anchor);
    card.classList.add(CARD_DONE);
  }
  function undoCardOne(card) {
    var b = card.querySelector('.' + CARD_BLOCK);
    if (b) { b.parentNode.removeChild(b); }
    card.classList.remove(CARD_DONE);
  }

  /* observer so para os carrosseis da home (bxSlider clona slides depois do load).
     Categoria/busca usam paginacao (reload por pagina), entao nem precisam. */
  var CARD_OBS = null, CARD_DEB = null, CARD_VIEWS = null, REL_RESIZED = false;
  function startCardObserver() {
    if (CARD_OBS || typeof MutationObserver === 'undefined') { return; }
    /* so os carrosseis da home; o de "relacionados" (PDP) fica de fora (ver applyCardOne) */
    var allViews = document.querySelectorAll('.bx-viewport');
    CARD_VIEWS = [];
    for (var v = 0; v < allViews.length; v++) {
      if (!(allViews[v].closest && allViews[v].closest('.element-product-related'))) {
        CARD_VIEWS.push(allViews[v]);
      }
    }
    if (!CARD_VIEWS.length) { return; }
    CARD_OBS = new MutationObserver(function () {
      clearTimeout(CARD_DEB);
      CARD_DEB = setTimeout(function () {
        if (!isDesktop()) { return; }
        var cards = document.querySelectorAll(CARD_SEL + ':not(.' + CARD_DONE + ')');
        CARD_OBS.disconnect();
        for (var i = 0; i < cards.length; i++) { try { applyCardOne(cards[i]); } catch (e) {} }
        try { CARD_OBS.takeRecords(); for (var j = 0; j < CARD_VIEWS.length; j++) { CARD_OBS.observe(CARD_VIEWS[j], { childList: true, subtree: true }); } } catch (e) {}
      }, 200);
    });
    for (var k = 0; k < CARD_VIEWS.length; k++) { CARD_OBS.observe(CARD_VIEWS[k], { childList: true, subtree: true }); }
  }
  function stopCardObserver() {
    if (CARD_OBS) { CARD_OBS.disconnect(); CARD_OBS = null; }
  }

  function applyCards(desk) {
    try {
      if (desk) {
        if (!document.querySelector(CARD_SEL)) { return; } /* pagina sem cards */
        ensureCardStyle();
        var cards = document.querySelectorAll(CARD_SEL + ':not(.' + CARD_DONE + ')');
        var relTouched = false;
        for (var i = 0; i < cards.length; i++) {
          applyCardOne(cards[i]);
          if (cards[i].classList.contains(CARD_DONE) && cards[i].closest &&
              cards[i].closest('.element-product-related')) { relTouched = true; }
        }
        startCardObserver();
        /* recompor deixa os cards de relacionados mais altos; o bxSlider precisa
           remedir, senao desloca a fileira pra fora da tela no scroll/relayout.
           Disparamos UM resize (so 1x, com atraso pro reflow assentar) pra ele
           reassentar. REL_RESIZED evita repeticao/loop com o listener de resize. */
        if (relTouched && !REL_RESIZED) { REL_RESIZED = true; setTimeout(nudge, 150); }
      } else {
        stopCardObserver();
        var done = document.querySelectorAll('.' + CARD_DONE);
        for (var j = 0; j < done.length; j++) { undoCardOne(done[j]); }
        removeCardStyle();
        REL_RESIZED = false;
      }
    } catch (e) {}
  }

  /* ===================== 5) BOTAO "COMPRAR" NOS CARDS DE RELACIONADOS =====================
     No carrossel "Produtos Relacionados" (PDP), o tema esconde o botao: o avo
     .wrapper-btn-product nasce com display:none vindo de CSS cross-origin com
     !important forte - um <style> do nosso lado NAO vence (empata/perde por ordem
     de carga). Por isso o display:block tem que ser INLINE via JS (diretriz 4.9).
     A parte cosmetica (verde/line-height) vai por <style> injetado (o tema nao
     disputa essas). O botao ocupa o espaco vazio que o card JA reserva na base,
     entao NAO aumenta a altura do card -> nao desestabiliza o bxSlider (validado:
     card continua 548px, slider estavel). position:static garante que ele fique
     em fluxo (e nao absoluto fora de lugar). */
  var RELBTN_STYLE_ID = 'ipc-relbtn-style';
  var RELBTN_WRAP = '.element-product-related .product-list-item .wrapper-btn-product';

  function ensureRelBtnStyle() {
    if (document.getElementById(RELBTN_STYLE_ID)) { return; }
    var st = document.createElement('style');
    st.id = RELBTN_STYLE_ID;
    st.setAttribute('data-ipc', '1');
    st.textContent =
      '.element-product-related .product-list-item a.btn{' +
      'line-height:1.2 !important;display:block !important;' +
      'background:#2B8A3E !important;color:#fff !important;' +
      'padding:10px 16px !important;border-radius:6px !important;' +
      'text-align:center !important;font-weight:600 !important;margin-top:8px !important;}' +
      '.element-product-related .product-list-item a.btn:hover{background:#256F31 !important;}' +
      '.element-product-related .product-list-item a.btn .btn-text{line-height:1.2 !important;}' +
      '.element-product-related .product-list-item a.btn .btn-icon{display:none !important;}';
    (document.head || document.documentElement).appendChild(st);
  }
  function removeRelBtnStyle() {
    var st = document.getElementById(RELBTN_STYLE_ID);
    if (st) { st.parentNode.removeChild(st); }
  }

  function applyRelatedBtn(desk) {
    try {
      if (desk) {
        if (!document.querySelector('.element-product-related')) { return; } /* nao e PDP com relacionados */
        ensureRelBtnStyle();
        var wraps = document.querySelectorAll(RELBTN_WRAP);
        for (var i = 0; i < wraps.length; i++) {
          var w = wraps[i];
          if (w.getAttribute('data-ipc-relbtn') === '1') { continue; } /* idempotente */
          /* INLINE com important: unico jeito de vencer o display:none cross-origin do tema */
          w.style.setProperty('display', 'block', 'important');
          w.style.setProperty('position', 'static', 'important');
          w.setAttribute('data-ipc-relbtn', '1');
        }
      } else {
        var done = document.querySelectorAll(RELBTN_WRAP + '[data-ipc-relbtn="1"]');
        for (var j = 0; j < done.length; j++) {
          done[j].style.removeProperty('display');
          done[j].style.removeProperty('position');
          done[j].removeAttribute('data-ipc-relbtn');
        }
        removeRelBtnStyle();
      }
    } catch (e) {}
  }

  /* ===================== 6) RODAPE: formas de pagamento (recolorir + painel) =====================
     No rodape, cada bandeira e um <div> VAZIO com sprite PNG colorido (a "capsula"
     branca esta embutida no proprio PNG) dentro de <li class="payment-methods-item">,
     todos num <ul class="payment-methods-list">. CSS-filter NAO recolore (a capsula
     branca esta na imagem), entao a estrategia e: esconder o sprite nativo e injetar
     um SVG monocromatico (cinza, clareia no hover) no lugar, agrupando tudo num painel
     sutil (fundo levissimo + borda fina + cantos arredondados) com o titulo
     "Formas de pagamento" (herda a classe .title-footer dos demais titulos do rodape).
     So no desktop e totalmente reversivel (no mobile/fallback desfaz e o nativo
     colorido reaparece).

     >>> SVGs das bandeiras: o Pix e o OFICIAL (kit do BC). Visa/Master/Hipercard/
     Amex/Elo/Boleto sao aproximacoes monocromaticas. Para trocar pelos oficiais
     depois, basta editar a string correspondente em PAY_SVGS abaixo e subir o ?v=.
     A chave do objeto e o sufixo da classe do tema: icon-payment-<chave>. */
  var PAY_LIST_SEL = 'ul.payment-methods-list';
  var PAY_TITLE_ID = 'ipc-pay-title';
  var PAY_STYLE_ID = 'ipc-pay-style';
  var PAY_SVG_CLASS = 'ipc-pay-svg';
  var PAY_DONE = 'ipc-pay-done';

  var PAY_SVGS = {
    'visa': '<svg class="' + PAY_SVG_CLASS + '" viewBox="0 0 50 16"><text x="25" y="13" text-anchor="middle" font-family="Arial,sans-serif" font-style="italic" font-weight="700" font-size="15" letter-spacing="-.5" fill="currentColor">VISA</text></svg>',
    'mastercard': '<svg class="' + PAY_SVG_CLASS + '" viewBox="0 0 42 24"><circle cx="16" cy="12" r="9" fill="currentColor" opacity=".9"/><circle cx="26" cy="12" r="9" fill="currentColor" opacity=".5"/></svg>',
    'hipercard': '<svg class="' + PAY_SVG_CLASS + '" viewBox="0 0 74 16"><text x="37" y="13" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="13" fill="currentColor">hipercard</text></svg>',
    'amex': '<svg class="' + PAY_SVG_CLASS + '" viewBox="0 0 88 26"><text x="44" y="10" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="8" letter-spacing=".5" fill="currentColor">AMERICAN</text><text x="44" y="22" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="8" letter-spacing=".5" fill="currentColor">EXPRESS</text></svg>',
    'elo': '<svg class="' + PAY_SVG_CLASS + '" viewBox="0 0 34 16"><text x="17" y="13" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="14" fill="currentColor">elo</text></svg>',
    'boleto-bancario': '<svg class="' + PAY_SVG_CLASS + '" viewBox="0 0 64 16"><g fill="currentColor"><rect x="1" y="1" width="2" height="14"/><rect x="4" y="1" width="1" height="14"/><rect x="6" y="1" width="2" height="14"/><rect x="9" y="1" width="1" height="14"/><rect x="11" y="1" width="2" height="14"/><rect x="15" y="1" width="1" height="14"/></g><text x="20" y="12" font-family="Arial,sans-serif" font-weight="700" font-size="12" fill="currentColor">boleto</text></svg>',
    'pix': '<svg class="' + PAY_SVG_CLASS + '" viewBox="0 0 42 16"><g fill="currentColor"><path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z"/><path d="m14.377 6.496-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z"/></g><text x="20" y="12" font-family="Arial,sans-serif" font-weight="700" font-size="12" fill="currentColor">pix</text></svg>'
  };

  /* propriedades que aplicamos inline (com important) - listadas para limpar na reversao */
  var PAY_LI_PROPS = ['background', 'border', 'box-shadow', 'padding', 'margin', 'width', 'min-width', 'overflow', 'display', 'align-items'];
  var PAY_UL_PROPS = ['display', 'flex-wrap', 'justify-content', 'align-items', 'gap', 'width', 'max-width', 'margin', 'padding', 'list-style', 'background', 'border', 'border-radius'];

  function ensurePayStyle() {
    if (document.getElementById(PAY_STYLE_ID)) { return; }
    var st = document.createElement('style');
    st.id = PAY_STYLE_ID;
    st.setAttribute('data-ipc', '1');
    st.textContent =
      '.' + PAY_SVG_CLASS + '{height:24px !important;width:auto !important;color:#9396a0;transition:color .15s;vertical-align:middle;}' +
      '.' + PAY_SVG_CLASS + ':hover{color:#fff;}';
    (document.head || document.documentElement).appendChild(st);
  }
  function removePayStyle() {
    var st = document.getElementById(PAY_STYLE_ID);
    if (st) { st.parentNode.removeChild(st); }
  }

  function payBrandKey(icon) {
    var m = icon.className.match(/icon-payment-([a-z0-9-]+)/);
    return m ? m[1] : null;
  }
  function clearProps(el, props) {
    for (var i = 0; i < props.length; i++) { el.style.removeProperty(props[i]); }
  }

  /* o proprio <ul> vira o painel: encolhe ao conteudo (fit-content) e centraliza
     (margin auto), sem depender do estilo do container pai */
  function stylePayPanel(ul) {
    ul.style.setProperty('display', 'flex', 'important');
    ul.style.setProperty('flex-wrap', 'wrap', 'important');
    ul.style.setProperty('justify-content', 'center', 'important');
    ul.style.setProperty('align-items', 'center', 'important');
    ul.style.setProperty('gap', '18px', 'important');
    ul.style.setProperty('width', 'fit-content', 'important');
    ul.style.setProperty('max-width', '100%', 'important');
    ul.style.setProperty('margin', '0 auto', 'important');
    ul.style.setProperty('padding', '18px 26px', 'important');
    ul.style.setProperty('list-style', 'none', 'important');
    ul.style.setProperty('background', 'rgba(255,255,255,.045)', 'important');
    ul.style.setProperty('border', '1px solid rgba(255,255,255,.09)', 'important');
    ul.style.setProperty('border-radius', '14px', 'important');
  }

  function buildPayTitle() {
    var t = document.createElement('span');
    t.id = PAY_TITLE_ID;
    t.className = 'title-footer'; /* herda a tipografia dos titulos do rodape */
    t.setAttribute('data-ipc', '1');
    t.textContent = 'Formas de pagamento';
    t.style.display = 'block';
    t.style.textAlign = 'center';
    t.style.margin = '0 0 14px';
    return t;
  }

  function applyFooterPay(desk) {
    try {
      var ul = document.querySelector(PAY_LIST_SEL);
      if (!ul) { return; } /* rodape sem o bloco de pagamento */

      if (desk) {
        ensurePayStyle();
        if (!document.getElementById(PAY_TITLE_ID)) {
          ul.insertAdjacentElement('beforebegin', buildPayTitle());
        }
        stylePayPanel(ul);
        var lis = ul.querySelectorAll('li.payment-methods-item');
        for (var i = 0; i < lis.length; i++) {
          var li = lis[i];
          if (li.classList.contains(PAY_DONE)) { continue; } /* idempotente */
          var icon = li.querySelector('div[class*="icon-payment-"]');
          if (!icon) { continue; }
          var key = payBrandKey(icon);
          var svg = key && PAY_SVGS[key];
          if (!svg) { continue; } /* marca desconhecida: deixa o nativo */
          /* esconde o sprite nativo (inline+important vence ate CSS do tema) */
          icon.style.setProperty('display', 'none', 'important');
          /* zera a "capsula" branca que mora no proprio <li> */
          li.style.setProperty('background', 'transparent', 'important');
          li.style.setProperty('border', '0', 'important');
          li.style.setProperty('box-shadow', 'none', 'important');
          li.style.setProperty('padding', '0', 'important');
          li.style.setProperty('margin', '0', 'important');
          li.style.setProperty('width', 'auto', 'important');
          li.style.setProperty('min-width', '0', 'important');
          li.style.setProperty('overflow', 'visible', 'important');
          li.style.setProperty('display', 'inline-flex', 'important');
          li.style.setProperty('align-items', 'center', 'important');
          li.insertAdjacentHTML('beforeend', svg);
          li.classList.add(PAY_DONE);
        }
      } else {
        /* reverte: volta o nativo colorido (mobile / fallback) */
        var title = document.getElementById(PAY_TITLE_ID);
        if (title) { title.parentNode.removeChild(title); }
        clearProps(ul, PAY_UL_PROPS);
        var done = ul.querySelectorAll('li.' + PAY_DONE);
        for (var j = 0; j < done.length; j++) {
          var d = done[j];
          var s = d.querySelector('.' + PAY_SVG_CLASS);
          if (s) { s.parentNode.removeChild(s); }
          var ic = d.querySelector('div[class*="icon-payment-"]');
          if (ic) { ic.style.removeProperty('display'); }
          clearProps(d, PAY_LI_PROPS);
          d.classList.remove(PAY_DONE);
        }
        removePayStyle();
      }
    } catch (e) {}
  }

  /* ===================== 7) PAGINA "CENTRAL DE ATENDIMENTO" =====================
     Reconstroi a pagina institucional /p/central-atendimento: o texto cru (intro +
     lista de telefones) vira um layout com cards de telefone por cidade, canais
     (WhatsApp/horario/endereco) e um mapa do Google Maps.
     POR QUE VIA JS: o editor WYSIWYG da Simplo7 sanitiza HTML/SVG/iframe ao salvar,
     entao nao da pra colar o bloco na pagina. So no desktop; no mobile desfaz.
     Ancora por HEURISTICA de conteudo (intro + ultimo telefone), sem depender de classe.
     SEO/mobile: o conteudo original e ESCONDIDO (display:none), nunca removido. */

  function caIsPage() {
    return /\/p\/central-atendimento\/?$/.test(location.pathname);
  }

  function caCard(cidade, numero, tel, destaque) {
    var estilo = destaque
      ? 'border:1px solid #E2E4E9;background:#EEF0F3;box-shadow:0 2px 8px rgba(20,22,26,.10);'
      : 'border:1px solid #E7E8EC;background:#fff;';
    return '<a href="tel:' + tel + '" style="padding:12px 15px;border-radius:8px;' + estilo + 'text-decoration:none;">' +
      '<span style="display:block;font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:#6E727B;font-weight:600;margin-bottom:3px;">' + cidade + '</span>' +
      '<span style="display:block;font-size:16px;color:#104E8B;font-weight:600;">' + numero + '</span></a>';
  }

  function caTitulo(txt, mb) {
    return '<div style="font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:#15161A;font-weight:600;border-bottom:1px solid #E7E8EC;padding-bottom:9px;margin-bottom:' + mb + ';">' + txt + '</div>';
  }

  function caCanal(icone, cor, rotulo, valor, href, ultima) {
    var borda = ultima ? '' : 'border-bottom:1px solid #F1F2F5;';
    var inner =
      '<span style="color:' + cor + ';flex:none;display:inline-flex;">' + icone + '</span>' +
      '<span><span style="display:block;font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:#6E727B;font-weight:600;">' + rotulo + '</span>' +
      '<span style="display:block;font-size:15px;color:#15161A;font-weight:600;line-height:1.5;">' + valor + '</span></span>';
    var box = 'display:flex;align-items:center;gap:14px;padding:15px 2px;' + borda;
    if (href) { return '<a href="' + href + '" style="' + box + 'text-decoration:none;">' + inner + '</a>'; }
    return '<div style="' + box + '">' + inner + '</div>';
  }

  function caBuildHTML() {
    var W = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9"></path><path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1"></path></svg>';
    var C = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>';
    var P = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"></path><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"></path></svg>';
    var END = 'Rua Venezuela, 391, Tabo\u00e3o, S\u00e3o Bernardo do Campo - SP, 09667-020';
    var MS = 'https://www.google.com/maps?q=' + encodeURIComponent(END) + '&output=embed';

    var h = '<div data-ipc-central="1" style="font-family:Poppins,Arial,sans-serif;color:#3A3D44;">';
    h += '<p style="margin:0 0 30px;font-size:15px;line-height:1.7;color:#4B5563;">Para falar com nosso <strong style="color:#15161A;">departamento de vendas</strong> ou com o <strong style="color:#15161A;">suporte ao cliente</strong>, use o telefone com o DDD da sua regi\u00e3o e economize nas liga\u00e7\u00f5es interurbanas.</p>';
    h += caTitulo('Atendimento por telefone', '16px');
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(172px,1fr));gap:10px;margin-bottom:34px;">';
    h += caCard('S\u00e3o Paulo',     '(11) 3136-1560', '+551131361560', true);
    h += caCard('Rio de Janeiro',     '(21) 2038-9971', '+552120389971', false);
    h += caCard('Bel\u00e9m',         '(91) 2018-2338', '+559120182338', false);
    h += caCard('Belo Horizonte',     '(31) 3181-7857', '+553131817857', false);
    h += caCard('Campinas',           '(19) 2038-5696', '+551920385696', false);
    h += caCard('Curitiba',           '(41) 2018-0359', '+554120180359', false);
    h += caCard('Florian\u00f3polis', '(48) 3036-7989', '+554830367989', false);
    h += caCard('Goi\u00e2nia',       '(62) 3602-9579', '+556236029579', false);
    h += caCard('Porto Alegre',       '(51) 3376-7091', '+555133767091', false);
    h += caCard('Recife',             '(81) 3180-4821', '+558131804821', false);
    h += caCard('Salvador',           '(71) 2180-1546', '+557121801546', false);
    h += caCard('Vit\u00f3ria',       '(27) 2018-2138', '+552720182138', false);
    h += '</div>';
    h += caTitulo('Outros canais', '6px');
    h += caCanal(W, '#128C7E', 'WhatsApp', '(11) 3136-1560', 'https://api.whatsapp.com/send?phone=551131361560', false);
    h += caCanal(C, '#6E727B', 'Hor\u00e1rio', 'Seg a sex, 8h \u00e0s 17h30', '', false);
    h += caCanal(P, '#EA4335', 'Nosso endere\u00e7o', 'Rua Venezuela, 391 \u2014 Tabo\u00e3o, S\u00e3o Bernardo do Campo / SP \u2014 CEP 09667-020', '', true);
    h += '<iframe src="' + MS + '" width="100%" height="280" style="border:0;border-radius:8px;margin-top:16px;display:block;" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Localiza\u00e7\u00e3o IPC Comercial"></iframe>';
    h += '</div>';
    return h;
  }

  function caFindContainer() {
    function temTudo(el) {
      var t = el.textContent || '';
      return /departamento de vendas/i.test(t) && /vit[o\u00f3]ria/i.test(t);
    }
    var cont = null, todos = document.querySelectorAll('div,section,article,main'), i, k;
    for (i = 0; i < todos.length; i++) { if (temTudo(todos[i])) { cont = todos[i]; } }
    if (cont) {
      var mudou = true;
      while (mudou) {
        mudou = false;
        var filhos = cont.children;
        for (k = 0; k < filhos.length; k++) {
          if (temTudo(filhos[k])) { cont = filhos[k]; mudou = true; break; }
        }
      }
    }
    return cont;
  }

  function applyCentralAtendimento(desk) {
    try {
      if (!caIsPage()) { return; }
      if (!desk) {
        /* mobile: desfaz (mostra o conteudo original, remove o nosso) */
        var inj = document.querySelector('[data-ipc-central="1"]');
        if (inj) { inj.parentNode.removeChild(inj); }
        var oldm = document.querySelector('[data-ipc-central-old="1"]');
        if (oldm) { oldm.style.display = ''; oldm.removeAttribute('data-ipc-central-old'); }
        return;
      }
      if (document.querySelector('[data-ipc-central="1"]')) { return; } /* idempotente */
      var cont = caFindContainer();
      if (!cont) { return; }
      cont.setAttribute('data-ipc-central-old', '1');
      cont.style.display = 'none';
      var wrap = document.createElement('div');
      wrap.innerHTML = caBuildHTML();
      var node = wrap.firstElementChild;
      if (node) { cont.insertAdjacentElement('afterend', node); }
    } catch (e) {}
  }

  /* ===================== orquestracao ===================== */
  function apply() {
    var desk = isDesktop();
    applyMenu(desk);
    applyProduto(desk);
    applyPreco(desk);
    applyCards(desk);
    applyRelatedBtn(desk);
    applyFooterPay(desk);
    applyCentralAtendimento(desk);
  }

  function init() {
    apply();
    nudge();
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(apply, 200); });
    window.addEventListener('load', function () { apply(); nudge(); });
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();

/* ─── o rastreio do link curto (12/09/2026) ───────────────────────────────────
 *
 * Marcio: *"Vou usar no momento basicamente na ipccomercial.com.br"*.
 *
 * ⚠ POR QUE AQUI DENTRO, E NÃO NO PAINEL DA LOJA. A loja é Simplo7, plataforma
 * que não é nossa, e pôr uma tag lá exige entrar no painel dela. Só que esta
 * loja JÁ CARREGA este arquivo, que mora na nossa hospedagem e é publicado pelo
 * Publicador como o resto do sistema. Uma linha aqui liga o rastreio sem pedir
 * nada a ninguém, e apagar esta linha desliga.
 *
 * O que o p.js faz: se a pessoa chegou por um link ipc.cx, ele avisa a visita e
 * conta a compra pelo evento que a própria loja já manda para o Google. Ele não
 * lê a página, não usa cookie e não identifica ninguém.
 */
(function () {
  var s = document.createElement('script');
  s.src = 'https://ipc.tec.br/l/p.js';
  s.defer = true;
  (document.head || document.documentElement).appendChild(s);
})();
