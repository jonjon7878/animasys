/* =====================================================================
   IPC · loja-mobile.js  —  v19
   Feature M1: Recompor o pre\u00e7o dos CARDS de produto (TEMA MOBILE)
   Feature M2: Formata\u00e7\u00e3o do PRE\u00c7O na P\u00c1GINA DE PRODUTO (PDP, TEMA MOBILE)
               PIX her\u00f3i + "ou R$ X em at\u00e9 Nx sem juros" + "Parcelar em at\u00e9 Nx"
               que ABRE uma TABELA de parcelas formatada (sem juros/com juros + Total).
   Feature M3: MENU mobile de dois n\u00edveis (drill-in) — l\u00ea a \u00e1rvore VIVA da
               ul.menu-top-list e renderiza nosso menu (topo amarelo, categorias
               em mai\u00fasculas com drill-in de profundidade vari\u00e1vel, blocos
               "A Empresa" e "Ferramentas de Apoio" com \u00edcones lineares, WhatsApp).
               Painel alargado p/ 85vw; \u2715/m\u00e1scara fecham via mecanismo nativo.
   ---------------------------------------------------------------------
   Loader (no campo de C\u00f3digos do painel, ao lado da linha do desktop):
     <script src="https://ipc.tec.br/loja/loja-mobile.js?v=19" defer></script>

   S\u00f3 age no TEMA MOBILE (body.layout-mobile / style-mobile.css). No desktop, dorme.

   ---- FEATURE M1 (cards) — INALTERADA (= v9) ----

   ---- FEATURE M2 (PDP) — CONFIRMADA POR INSPE\u00c7\u00c3O DO DOM REAL ----
   ATEN\u00c7\u00c3O: a PDP mobile tem BLOCOS DE PRE\u00c7O DUPLICADOS (2x product-price-off,
   3x product-new-price...). Por isso ancoramos no bloco VIS\u00cdVEL que cont\u00e9m o PIX,
   detectado em runtime (n\u00e3o por \u00edndice fixo). Foi o que derrubou a v11 (mirava
   .product-amount, que N\u00c3O tem PIX).
   - PIX:   p.product-price-off > span.desconto_parcela ("5%") + span.desconto_avista ("R$ 19,95")
   - "Por": .product-new-price > span.product-big-price ("R$ 21,00")
   - Cart\u00e3o (m\u00e1x parcelas): .product-parcelled-price .parcel-number ("4x")
   - Tabela: table.deferred-payment (dentro de .element-product-parcels), cada tr com
       td.parcel-number / td.parcel-price / td.parcel-desc ("Sem juros"/"Com juros") / td.parcel-total ("Total: R$ X")
   - Promo (riscado) na PDP: .product-scratched-price (nome diferente do card!)

   PAGAMENTO HONESTO (regra inegoci\u00e1vel): s\u00f3 1x/2x s\u00e3o sem juros na IPC.
   - "Nx sem juros" da sublinha = DIN\u00c2MICO (maior parcela "Sem juros" da tabela);
     fallback CARD_SEM_JUROS se a tabela n\u00e3o existir.
   - Na tabela: cada linha mostra "sem juros"/"com juros" + o TOTAL (cliente confere).
   - Nunca rotulamos parcela com juros como sem juros.

   Comportamento: tabela come\u00e7a FECHADA, abre ao tocar em "Parcelar". A tabela
   NATIVA (.element-product-parcels) \u00e9 escondida (display:none, preserva SEO).
   BOT\u00c3O "Comprar": nativo/painel — N\u00c3O tocamos.
   ===================================================================== */
(function () {
  'use strict';

  var IPC_M_VER = 'v19';
  try { console.log('[IPC] loja-mobile.js ' + IPC_M_VER); } catch (e) {}

  /* ---- AJUST\u00c1VEL: parcelas SEM JUROS (fixo) — fallback p/ card e p/ PDP ----
     S\u00f3 1x/2x sem juros na IPC. Trocar SOMENTE este n\u00famero ao renegociar a taxa. */
  var CARD_SEM_JUROS = 2;

  var CAND_ANTIGO = [
    '.product-old-price .product-strikethrough-price',
    '.product-old-price'
  ];

  /* ---------- Guarda de tema: s\u00f3 no MOBILE ---------- */
  function isMobile() {
    try {
      return document.body.classList.contains('layout-mobile')
          || !!document.querySelector('link[href*="style-mobile"]');
    } catch (e) { return false; }
  }

  function txt(el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function escapeHTML(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function visivel(el) {
    return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  }

  /* =====================================================================
     FEATURE M1 — CARDS  (inalterada)
     ===================================================================== */
  function lerPix(card) {
    var p = card.querySelector('.product-cash-price');
    if (!p) return null;
    var spans = p.querySelectorAll('span');
    if (spans.length < 2) return null;
    var pct = txt(spans[0]);
    var valor = txt(spans[spans.length - 1]);
    if (!/R\$/.test(valor)) return null;
    return { pct: pct, valor: valor };
  }
  function lerParcela(card) {
    var s = card.querySelector('.product-parcelled-price span');
    var v = txt(s);
    return /\d+x/i.test(v) ? v : null;
  }
  function lerBase(card) {
    var ini = card.querySelector('.product-price-initial .product-price');
    if (ini && /R\$/.test(ini.textContent)) return { valor: txt(ini), faixa: true };
    var cands = ['.product-big-price', '.product-price ins', '.product-sell-price ins', '.product-price'];
    for (var i = 0; i < cands.length; i++) {
      var el = card.querySelector(cands[i]);
      if (el && /R\$/.test(el.textContent)) return { valor: txt(el), faixa: false };
    }
    return null;
  }
  function lerPrecoAntigo(card) {
    for (var i = 0; i < CAND_ANTIGO.length; i++) {
      var el = card.querySelector(CAND_ANTIGO[i]);
      if (el && /R\$/.test(el.textContent)) return { el: el, texto: txt(el) };
    }
    return null;
  }
  function ensureStyle() {
    if (document.getElementById('ipc-m-style')) return;
    var css =
      '.ipc-m-card-price{margin:6px 0 12px;}'
    + '.ipc-m-card-price .ipc-m-old{margin:0 0 4px !important;font-size:12px;color:#888780;}'
    + '.ipc-m-card-price .ipc-m-old s{color:#888780;}'
    + '.ipc-m-pix-line{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:0;}'
    + '.ipc-m-pre{font-size:12px;color:#5F5E5A;}'
    + '.ipc-m-pix{font-size:22px;font-weight:700;color:#15161A;line-height:1.1;}'
    + '.ipc-m-pixlbl{font-size:12px;color:#5F5E5A;}'
    + '.ipc-m-off{background:#EAF3DE;color:#3B6D11;font-size:11px;font-weight:600;padding:2px 7px;border-radius:6px;}'
    + '.ipc-m-div{height:1px;background:#E7E8EC;border:0;margin:9px 0;}'
    + '.ipc-m-semjuros-linha{margin:0 !important;line-height:1.3;}'
    + '.ipc-m-apartir{font-weight:400;font-size:12.5px;color:#3A3D44;}'
    + '.ipc-m-semjuros-val{font-size:15px;font-weight:700;color:#15161A;}'
    + '.ipc-m-semjuros-lbl{font-size:12.5px;color:#3A3D44;}'
    + '.ipc-m-semjuros-lbl strong{color:#15161A;font-weight:700;}'
    + '.ipc-m-cartao{margin:0 !important;font-size:11.5px;color:#5F5E5A;line-height:1.3;}'
    + '.ipc-m-done .product-list-item-inner{display:flex !important;flex-direction:column;min-height:100%;}'
    + '.ipc-m-done .wrapper-btn-product{margin-top:auto;}'
    + '.ipc-m-done p.product-price,'
    + '.ipc-m-done p.product-price-initial,'
    + '.ipc-m-done p.product-price-final,'
    + '.ipc-m-done p.product-cash-price,'
    + '.ipc-m-done p.product-parcelled-price,'
    + '.ipc-m-done p.product-unit{display:none !important;}';
    var st = document.createElement('style');
    st.id = 'ipc-m-style';
    st.textContent = css;
    document.head.appendChild(st);
  }
  function recompor(card) {
    if (card.classList.contains('ipc-m-done')) return;
    var pix = lerPix(card);
    if (!pix) return;
    var info = card.querySelector('.product-info');
    if (!info) return;
    var base = lerBase(card);
    var faixa = !!(base && base.faixa);
    var nx = lerParcela(card);
    var antigo = lerPrecoAntigo(card);

    var html = '';
    if (antigo) html += '<p class="ipc-m-old">de <s>' + antigo.texto + '</s></p>';
    html += '<div class="ipc-m-pix-line">'
         + (faixa ? '<span class="ipc-m-pre">a partir de</span>' : '')
         + '<span class="ipc-m-pix">' + pix.valor + '</span>'
         + '<span class="ipc-m-pixlbl">no PIX</span>'
         + (pix.pct ? '<span class="ipc-m-off">' + pix.pct + ' OFF</span>' : '')
         + '</div>';
    if (base) {
      html += '<div class="ipc-m-div"></div>'
           + '<p class="ipc-m-semjuros-linha">'
           + (faixa ? '<span class="ipc-m-apartir">a partir de </span>' : '')
           + '<span class="ipc-m-semjuros-val">' + base.valor + '</span>'
           + ' <span class="ipc-m-semjuros-lbl">em at\u00e9 <strong>' + CARD_SEM_JUROS + 'x sem juros</strong></span>'
           + '</p>';
    }
    if (nx) {
      html += '<div class="ipc-m-div"></div>'
           + '<p class="ipc-m-cartao">em at\u00e9 ' + nx + ' com acr\u00e9scimo</p>';
    }

    var box = document.createElement('div');
    box.className = 'ipc-m-card-price';
    box.setAttribute('data-ipc', '1');
    box.innerHTML = html;

    if (antigo && antigo.el) {
      var pAntigo = antigo.el.closest('p') || antigo.el;
      pAntigo.style.setProperty('display', 'none', 'important');
    }
    var nome = info.querySelector('.product-name');
    if (nome) nome.insertAdjacentElement('afterend', box);
    else info.insertBefore(box, info.firstChild);

    card.classList.add('ipc-m-done');
  }
  function aplicarCards() {
    try { ensureStyle(); } catch (e) {}
    var cards = document.querySelectorAll('li.product-list-item');
    for (var i = 0; i < cards.length; i++) {
      try { recompor(cards[i]); } catch (e) {}
    }
  }

  /* =====================================================================
     FEATURE M2 — PDP (PIX formatado + tabela de parcelas)
     ===================================================================== */

  /* Acha o bloco de pre\u00e7o VIS\u00cdVEL que cont\u00e9m o PIX (resolve duplicados). */
  function acharBlocoPDP() {
    var offs = document.querySelectorAll('.product-price-off');
    var escolha = null;
    for (var i = 0; i < offs.length; i++) {
      if (/R\$/.test(offs[i].textContent) && visivel(offs[i])) { escolha = offs[i]; break; }
    }
    if (!escolha) { /* fallback: 1\u00ba com texto, mesmo se a visibilidade falhar */
      for (var j = 0; j < offs.length; j++) {
        if (/R\$/.test(offs[j].textContent)) { escolha = offs[j]; break; }
      }
    }
    if (!escolha) return null;
    var cont = escolha.closest('.product-price') || escolha.closest('.wrapper-product-price') || escolha.parentElement;
    return { off: escolha, cont: cont };
  }

  /* L\u00ea a tabela real do MP. Retorna array {n, pr, sj(bool), total} ou null. */
  function lerTabelaParcelas() {
    var tbl = document.querySelector('table.deferred-payment') || document.querySelector('#deferred-payment');
    if (!tbl) return null;
    var trs = tbl.querySelectorAll('tr');
    var linhas = [];
    for (var i = 0; i < trs.length; i++) {
      var n = txt(trs[i].querySelector('.parcel-number'));
      var pr = txt(trs[i].querySelector('.parcel-price'));
      var ds = txt(trs[i].querySelector('.parcel-desc'));
      var to = txt(trs[i].querySelector('.parcel-total')).replace(/^total:\s*/i, '');
      if (n && pr) linhas.push({ n: n, pr: pr, sj: /sem\s*juros/i.test(ds), total: to });
    }
    return linhas.length ? linhas : null;
  }

  /* Maior "Nx" marcado como SEM juros (din\u00e2mico). Retorna "2x" ou null. */
  function maiorSemJuros(linhas) {
    var m = null;
    for (var i = 0; i < linhas.length; i++) { if (linhas[i].sj) m = linhas[i].n; }
    return m;
  }

  function ensurePdpStyle() {
    if (document.getElementById('ipc-m-pdp-style')) return;
    var css =
      '#mp-ipc-pix{margin:2px 0 14px;text-align:left;}'
    /* PIX her\u00f3i */
    + '#mp-ipc-pix .ipc-pix-val{font-size:29px;font-weight:800;color:#15161A;line-height:1;letter-spacing:-.01em;}'
    + '#mp-ipc-pix .ipc-pix-cap{font-size:13px;color:#8A8A86;margin-top:6px;}'
    + '#mp-ipc-pix .ipc-pix-cap b{color:#3B6D11;font-weight:700;}'
    /* se\u00e7\u00f5es com divis\u00f3ria e micro-r\u00f3tulo */
    + '#mp-ipc-pix .ipc-pix-sec{border-top:1px solid #EEF0F2;margin-top:16px;padding-top:14px;}'
    + '#mp-ipc-pix .ipc-pix-seclbl{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#9A9CA1;font-weight:700;margin-bottom:5px;}'
    + '#mp-ipc-pix .ipc-pix-sub{font-size:15px;color:#3A3D44;}'
    + '#mp-ipc-pix .ipc-pix-subval{font-weight:700;color:#15161A;}'
    + '#mp-ipc-pix .ipc-pix-sj{font-weight:700;color:#3B6D11;white-space:nowrap;}'
    /* "Parcelar em at\u00e9 Nx" como linha clic\u00e1vel */
    + '#mp-ipc-pix .ipc-pix-parcelar{display:flex;align-items:center;justify-content:space-between;font-size:14px;font-weight:700;color:#15161A;cursor:pointer;-webkit-tap-highlight-color:transparent;}'
    + '#mp-ipc-pix .ipc-seta{color:#9A7A00;font-size:16px;transition:transform .2s;display:inline-block;}'
    + '#mp-ipc-pix.ipc-pix-aberto .ipc-seta{transform:rotate(90deg);}'
    + '#mp-ipc-pix .ipc-pix-tabela{display:none;margin-top:12px;}'
    + '#mp-ipc-pix.ipc-pix-aberto .ipc-pix-tabela{display:block;}'
    /* tabela de parcelas (inalterada) */
    + '#mp-ipc-pix .ipc-pix-tbl{width:100%;border-collapse:collapse;font-size:13px;}'
    + '#mp-ipc-pix .ipc-pix-tbl th{text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.03em;'
        + 'color:#8A8A86;font-weight:600;padding:7px 6px;border-bottom:2px solid #FFD700;}'
    + '#mp-ipc-pix .ipc-pix-tbl th.r,#mp-ipc-pix .ipc-pix-tbl td.r{text-align:right;font-variant-numeric:tabular-nums;}'
    + '#mp-ipc-pix .ipc-pix-tbl td{padding:9px 6px;border-bottom:1px solid #F0F1F4;color:#3A3D44;}'
    + '#mp-ipc-pix .ipc-pix-tbl tr:last-child td{border-bottom:0;}'
    + '#mp-ipc-pix .ipc-pn{font-weight:700;color:#15161A;}'
    + '#mp-ipc-pix .ipc-sj{color:#3B6D11;font-weight:700;font-size:11px;}'
    + '#mp-ipc-pix .ipc-cj{color:#9AA0A6;font-size:11px;}';
    var st = document.createElement('style');
    st.id = 'ipc-m-pdp-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* Esconde S\u00d3 as linhas de pre\u00e7o nativas do bloco escolhido (escopo .ipc-m-pdp-done)
     + a tabela de parcelas nativa (mostramos a nossa no lugar). */
  function ensurePdpHideStyle() {
    if (document.getElementById('ipc-m-pdp-hide')) return;
    var css =
      '.ipc-m-pdp-done .product-new-price,'
    + '.ipc-m-pdp-done .product-price-off,'
    + '.ipc-m-pdp-done .product-old-price,'
    + '.ipc-m-pdp-done .product-parcelled-price{display:none !important;}'
    + '.element-product-parcels{display:none !important;}';
    var st = document.createElement('style');
    st.id = 'ipc-m-pdp-hide';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function montarTabelaHTML(linhas) {
    var rows = '';
    for (var i = 0; i < linhas.length; i++) {
      var L = linhas[i];
      var desc = L.sj ? '<span class="ipc-sj">SEM JUROS</span>' : '<span class="ipc-cj">com juros</span>';
      rows += '<tr>'
            + '<td><span class="ipc-pn">' + escapeHTML(L.n) + '</span> de ' + escapeHTML(L.pr) + '</td>'
            + '<td>' + desc + '</td>'
            + '<td class="r">' + escapeHTML(L.total || '') + '</td>'
            + '</tr>';
    }
    return '<div class="ipc-pix-tabela">'
         + '<table class="ipc-pix-tbl"><thead><tr><th>Parcela</th><th></th><th class="r">Total</th></tr></thead>'
         + '<tbody>' + rows + '</tbody></table></div>';
  }

  /* Extrai os dados atuais do bloco nativo (re-l\u00ea a cada mudan\u00e7a de qtd). */
  function lerDadosPDP(alvo) {
    var cont = alvo.cont, off = alvo.off;
    var pixVal = txt(off.querySelector('.desconto_avista'));
    var pixPct = txt(off.querySelector('.desconto_parcela'));
    if (!pixVal) return null;
    var por = txt(cont.querySelector('.product-new-price .product-big-price'))
           || txt(cont.querySelector('.product-big-price'))
           || txt(document.querySelector('.product-new-price .product-big-price'));
    var maxN = txt(cont.querySelector('.product-parcelled-price .parcel-number'))
            || txt(cont.querySelector('.product-parcelled-price span'))
            || txt(document.querySelector('.product-parcelled-price .parcel-number'));
    var linhas = lerTabelaParcelas();
    var semJuros = (linhas && maiorSemJuros(linhas)) || (CARD_SEM_JUROS + 'x');
    return { pixVal: pixVal, pixPct: pixPct, por: por, maxN: maxN, linhas: linhas, semJuros: semJuros };
  }

  /* Monta o HTML interno do nosso bloco a partir dos dados. */
  function montarHTMLPDP(d) {
    var html = '';
    /* ---- PIX her\u00f3i + legenda (\u00e0 vista no PIX \u00b7 economize X%) ---- */
    html += '<div class="ipc-pix-val">' + escapeHTML(d.pixVal) + '</div>';
    html += '<div class="ipc-pix-cap">\u00e0 vista no PIX'
         + (d.pixPct ? ' \u00b7 <b>economize ' + escapeHTML(d.pixPct) + '</b>' : '')
         + '</div>';
    /* ---- se\u00e7\u00e3o "No cart\u00e3o" ---- */
    if (d.por) {
      html += '<div class="ipc-pix-sec">'
           + '<div class="ipc-pix-seclbl">No cart\u00e3o</div>'
           + '<div class="ipc-pix-sub"><span class="ipc-pix-subval">' + escapeHTML(d.por)
           + '</span> em at\u00e9 <span class="ipc-pix-sj">' + escapeHTML(d.semJuros) + ' sem juros</span></div>'
           + '</div>';
    }
    /* ---- se\u00e7\u00e3o "Parcelar em at\u00e9 Nx" (abre a tabela) ---- */
    if (d.maxN && d.linhas) {
      html += '<div class="ipc-pix-sec ipc-pix-sec-parc">'
           + '<div class="ipc-pix-parcelar" role="button" tabindex="0" aria-expanded="false">'
           + '<span>Parcelar em at\u00e9 ' + escapeHTML(d.maxN) + '</span>'
           + '<span class="ipc-seta">\u203A</span></div>';
      html += montarTabelaHTML(d.linhas);
      html += '</div>';
    }
    return html;
  }

  /* Liga o toggle do "Parcelar" no bloco (preserva estado aberto/fechado). */
  function ligarToggle(box) {
    var link = box.querySelector('.ipc-pix-parcelar');
    if (!link) return;
    var toggle = function () {
      var aberto = box.classList.toggle('ipc-pix-aberto');
      link.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    };
    link.addEventListener('click', toggle);
    link.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  }

  /* Re-sincroniza o conte\u00fado do MESMO n\u00f3 (n\u00e3o recria) — preserva aberto/fechado. */
  function sincronizarPDP(box, alvo) {
    var d = lerDadosPDP(alvo);
    if (!d) return;
    var estavaAberto = box.classList.contains('ipc-pix-aberto');
    box.innerHTML = montarHTMLPDP(d);
    if (estavaAberto) {
      box.classList.add('ipc-pix-aberto');
      var link = box.querySelector('.ipc-pix-parcelar');
      if (link) link.setAttribute('aria-expanded', 'true');
    }
    ligarToggle(box);
  }

  function aplicarPDP() {
    var alvo = acharBlocoPDP();
    if (!alvo) return;                                       /* n\u00e3o \u00e9 PDP / sem PIX */
    var cont = alvo.cont;
    if (!cont || cont.classList.contains('ipc-m-pdp-done')) return; /* idempot\u00eancia */

    var d = lerDadosPDP(alvo);
    if (!d) return; /* sem PIX -> degrada\u00e7\u00e3o segura */

    try { ensurePdpStyle(); } catch (e) {}
    try { ensurePdpHideStyle(); } catch (e) {}

    var box = document.createElement('div');
    box.id = 'mp-ipc-pix';
    box.setAttribute('data-ipc', '1');
    box.innerHTML = montarHTMLPDP(d);

    /* insere antes da linha nativa do PIX (dentro do bloco escolhido) */
    alvo.off.insertAdjacentElement('beforebegin', box);
    cont.classList.add('ipc-m-pdp-done');
    ligarToggle(box);

    /* ---- Acompanhar a MUDAN\u00c7A DE QUANTIDADE (li\u00e7\u00e3o 4.12 do desktop) ----
       O tema recalcula o pre\u00e7o/parcelas nativos (escondidos) ao mudar a qtd.
       Observamos o bloco nativo e re-sincronizamos o nosso. Trava anti-loop:
       desconectar antes das nossas escritas e religar com takeRecords(). */
    var observando = true;
    var obs = new MutationObserver(function () {
      if (!observando) return;
      observando = false;
      try { obs.disconnect(); } catch (e) {}
      try { sincronizarPDP(box, alvo); } catch (e) {}
      try { obs.takeRecords(); } catch (e) {}
      try { obs.observe(cont, { childList: true, subtree: true, characterData: true }); } catch (e) {}
      observando = true;
    });
    try { obs.observe(cont, { childList: true, subtree: true, characterData: true }); } catch (e) {}
  }

  /* =====================================================================
     FEATURE M3 — Menu mobile de dois n\u00edveis (drill-in)
     ---------------------------------------------------------------------
     CONFIRMADO POR INSPE\u00c7\u00c3O (Claude no Chrome):
     - O painel off-canvas VIS\u00cdVEL \u00e9 a pr\u00f3pria ul.menu-top-list (250px, fixed,
       left:0, z=100, scroll pr\u00f3prio). N\u00c3O existe wrapper .menu-top.
     - Abre/fecha via classe body.menu-open (CSS slide). O tema N\u00c3O remove nem
       recria o conte\u00fado do painel ao abrir/fechar (testado: n\u00f3 injetado sobrevive
       a 0/500/2000ms e a ciclos de toggle).
     - O nav#menu-category / .menu-category-list \u00e9 o nav DESKTOP, renderiza 0x0 no
       mobile (foi onde as tentativas antigas falhavam: n\u00f3 sem dimens\u00e3o).
     - Hierarquia REAL (categoria \u2192 grupo \u2192 produto), profundidade vari\u00e1vel:
       cada submenu come\u00e7a com um cabe\u00e7alho-repeti\u00e7\u00e3o href="javascript:;" (FILTRADO)
       e termina com "Ver todos" (vira o link "Ver todos em [X]").

     FONTE = ul.menu-top-list lida AO VIVO (espelho din\u00e2mico): produto novo no
     painel da Simplo7 aparece sozinho, sem mexer no c\u00f3digo.
     ===================================================================== */

  var M3_FLAG = 'data-ipc-m3';                 /* marca no <body> p/ idempot\u00eancia */
  var M3_HREFS = {
    quemSomos: '/p/quem-somos',
    calcRoletes: '/p/calculo-de-roletes-industriais',
    calcPerfil: '/p/calculo-do-perfil-de-aluminio-estrutural',
    faleConosco: '/p/central-atendimento',
    localizacao: '/p/onde-estamos'
  };

  /* L\u00ea um <li> da \u00e1rvore nativa recursivamente.
     Filtra: cabe\u00e7alhos "javascript:;" e captura o "Ver todos" como verTodos. */
  function m3LerNo(li) {
    var a = li.querySelector(':scope > a');
    var ul = li.querySelector(':scope > ul');
    var node = { label: txt(a), href: a ? a.getAttribute('href') : null, children: [], verTodos: null };
    if (ul) {
      [].forEach.call(ul.children, function (cli) {
        if (cli.tagName !== 'LI') return;
        var ca = cli.querySelector(':scope > a');
        var clabel = txt(ca);
        var chref = ca ? ca.getAttribute('href') : '';
        /* cabe\u00e7alho-repeti\u00e7\u00e3o do tema: href "javascript:;" -> descarta */
        if (chref && chref.indexOf('javascript:') === 0) return;
        var c = m3LerNo(cli);
        if (c.label && c.label.toLowerCase() === 'ver todos') {
          if (!node.verTodos) node.verTodos = c.href;
        } else if (c.label) {
          node.children.push(c);
        }
      });
    }
    return node;
  }

  /* L\u00ea a \u00e1rvore de categorias direto da ul.menu-top-list (a vis\u00edvel no mobile). */
  function m3LerArvore(topList) {
    var cats = [];
    [].forEach.call(topList.children, function (li) {
      if (li.tagName !== 'LI') return;
      var a = li.querySelector(':scope > a');
      var lb = txt(a).toLowerCase();
      var href = a ? (a.getAttribute('href') || '') : '';
      /* fora: Home (vai destacado \u00e0 parte), "ver todos" solto, cabe\u00e7alhos js */
      if (!lb || lb === 'home' || lb === 'ver todos') return;
      if (href.indexOf('javascript:') === 0) return;
      var n = m3LerNo(li);
      if (n.label) cats.push(n);
    });
    return cats;
  }

  function m3WaHref() {
    var waEl = document.querySelector('a[href*="wa.me"],a[href*="api.whatsapp"],a[href*="whatsapp.com"]');
    return waEl ? waEl.getAttribute('href') : null;
  }

  function m3EnsureStyle() {
    if (document.getElementById('ipc-m3-style')) return;
    var css = ''
     + '#ipc-m3-menu{font-family:inherit;background:#fff;position:relative;z-index:2;min-height:100%;padding-bottom:32px;}'
     + '#ipc-m3-menu *{box-sizing:border-box;}'
     + '#ipc-m3-menu a{text-decoration:none;}'
     /* topo amarelo */
     + '#ipc-m3-menu .ipc-m3-top{background:#FFD400;display:flex;align-items:center;justify-content:space-between;padding:14px 16px;}'
     + '#ipc-m3-menu .ipc-m3-logo{height:30px !important;width:auto !important;max-width:120px !important;max-height:30px !important;display:block !important;object-fit:contain !important;}'
     + '#ipc-m3-menu .ipc-m3-x{color:#15161A;font-size:24px;line-height:1;background:none;border:0;padding:4px 6px;cursor:pointer;}'
     /* linhas (maiores p/ legibilidade do p\u00fablico mais velho) */
     + '#ipc-m3-menu .ipc-m3-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 16px;border-bottom:1px solid #F2F3F5;font-size:16px;color:#1F2227;cursor:pointer;text-transform:uppercase;letter-spacing:.02em;line-height:1.2;}'
     + '#ipc-m3-menu .ipc-m3-row.strong{font-weight:700;}'
     + '#ipc-m3-menu .ipc-m3-home{background:#F4F5F7;justify-content:flex-start;}'
     + '#ipc-m3-menu .ipc-m3-home .ipc-m3-ilb{flex:1;}'
     + '#ipc-m3-menu .ipc-m3-chev{color:#B7B9BE;font-size:16px;flex:none;}'
     + '#ipc-m3-menu .ipc-m3-sec{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#8C8F96;font-weight:700;padding:18px 16px 6px;}'
     + '#ipc-m3-menu .ipc-m3-vt{color:#9A7A00;font-weight:600;}'
     /* drill-in: voltar + t\u00edtulo */
     + '#ipc-m3-menu .ipc-m3-back{display:flex;align-items:center;gap:8px;padding:15px 16px;font-size:14px;font-weight:700;color:#15161A;border-bottom:1px solid #F2F3F5;cursor:pointer;background:#F4F5F7;text-transform:uppercase;letter-spacing:.03em;}'
     + '#ipc-m3-menu .ipc-m3-title{padding:16px 16px 4px;font-size:18px;font-weight:700;color:#15161A;text-transform:uppercase;letter-spacing:.02em;}'
     /* ===== Direction B: zona de produtos (branca) vs zona de apoio (cinza) ===== */
     /* faixa divis\u00f3ria — o "ch\u00e3o" entre comprar e apoio */
     + '#ipc-m3-menu .ipc-m3-zona{height:10px;background:#EEF0F2;box-shadow:inset 0 1px 2px rgba(20,22,26,.06);}'
     /* zona de apoio: fundo cinza que engloba Empresa + Ferramentas */
     + '#ipc-m3-menu .ipc-m3-apoio{background:#F4F5F7;padding-bottom:6px;}'
     + '#ipc-m3-menu .ipc-m3-apoio .ipc-m3-sec{color:#6E727B;padding-top:14px;}'
     + '#ipc-m3-menu .ipc-m3-apoio .ipc-m3-row{background:transparent;justify-content:flex-start;border-bottom:1px solid #E5E7EB;}'
     + '#ipc-m3-menu .ipc-m3-apoio .ipc-m3-row .ipc-m3-chev{margin-left:auto;}'
     + '#ipc-m3-menu .ipc-m3-iic{font-size:20px;color:#6E727B;width:24px;text-align:center;flex:none;}'
     + '#ipc-m3-menu .ipc-m3-ilb{flex:1;}'
     /* rodap\u00e9 WhatsApp (na zona cinza) */
     + '#ipc-m3-menu .ipc-m3-foot{padding:14px 16px 18px;background:#F4F5F7;border-top:1px solid #E5E7EB;}'
     + '#ipc-m3-menu .ipc-m3-wpp{display:flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#fff;font-weight:700;font-size:14.5px;padding:14px;border-radius:9px;}'
     + '#ipc-m3-menu .ipc-m3-wic{flex:none;}'
     /* alargar o painel nativo p/ ~85vw, garantir ROLAGEM at\u00e9 o fim e esconder os <li> nativos */
     + 'body.menu-open ul.menu-top-list{width:85vw !important;max-width:360px !important;height:100% !important;max-height:100vh !important;overflow-y:auto !important;-webkit-overflow-scrolling:touch !important;}'
     + 'ul.menu-top-list > li{display:none !important;}'
     + '.menu-top-mask{width:100% !important;}';
    var st = document.createElement('style');
    st.id = 'ipc-m3-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* \u00cdcone SVG linear monocrom\u00e1tico inline (string). Evita depender de webfont. */
  function m3Icon(kind) {
    var s = '<svg class="ipc-m3-iic" viewBox="0 0 24 24" fill="none" stroke="#6E727B" stroke-width="1.8" '
          + 'stroke-linecap="round" stroke-linejoin="round" width="17" height="17" aria-hidden="true" style="display:inline-block;vertical-align:middle;">';
    if (kind === 'home')     return s + '<path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>';
    if (kind === 'empresa')  return s + '<path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/><path d="M9 9h0M9 12h0M9 15h0"/></svg>';
    if (kind === 'fone')     return s + '<path d="M4 14a8 8 0 0 1 16 0v3a2 2 0 0 1-2 2h-1v-5h3M4 14v3a2 2 0 0 0 2 2h1v-5H4"/></svg>';
    if (kind === 'pin')      return s + '<path d="M12 21s-6-5.7-6-10a6 6 0 0 1 12 0c0 4.3-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>';
    if (kind === 'calc')     return s + '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h0M12 11h0M16 11h0M8 15h0M12 15h0M16 15h0"/></svg>';
    if (kind === 'regua')    return s + '<rect x="3" y="8" width="18" height="8" rx="1" transform="rotate(0 12 12)"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/></svg>';
    return s + '</svg>';
  }
  function m3WppIcon() {
    return '<svg class="ipc-m3-wic" viewBox="0 0 24 24" fill="#fff" width="17" height="17" aria-hidden="true" style="display:inline-block;vertical-align:middle;">'
         + '<path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8.9-.1.2-.3.2-.5.1-.7-.3-1.4-.6-2.1-1.4-.5-.5-.9-1.1-1-1.3-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4 0-.1-.5-1.3-.7-1.7-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2 1 2.4c.1.2 1.6 2.5 4 3.4.5.2 1 .4 1.3.4.5.1 1 .1 1.3 0 .4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1z"/></svg>';
  }

  function applyMenuMobile() {
    var topList = document.querySelector('ul.menu-top-list');
    if (!topList) return;                                  /* painel ainda n\u00e3o no DOM */
    if (document.body.getAttribute(M3_FLAG) === '1' && document.getElementById('ipc-m3-menu')) return; /* idempot\u00eancia */

    var cats = m3LerArvore(topList);
    if (!cats.length) return;                              /* nada lido -> n\u00e3o age */

    m3EnsureStyle();

    var waHref = m3WppIcon ? m3WaHref() : null;
    var stack = [];
    var box = document.getElementById('ipc-m3-menu');
    if (!box) { box = document.createElement('div'); box.id = 'ipc-m3-menu'; box.setAttribute('data-ipc', '1'); }

    function fecharMenu() {
      var b = document.querySelector('.btn-link-menu') || document.querySelector('.icon-menu');
      if (b) b.click();
    }
    function rowBranch(node) {
      var d = document.createElement('div'); d.className = 'ipc-m3-row';
      d.innerHTML = '<span>' + escapeHTML(node.label) + '</span><span class="ipc-m3-chev">\u203A</span>';
      d.addEventListener('click', function () { stack.push(node); render(); });
      return d;
    }
    function rowLink(label, href, cls) {
      var a = document.createElement('a'); a.className = 'ipc-m3-row ' + (cls || '');
      a.href = href || '#'; a.innerHTML = '<span>' + escapeHTML(label) + '</span>';
      return a;
    }
    function rowIconLink(label, href, iconKind) {
      var a = document.createElement('a'); a.className = 'ipc-m3-row';
      a.href = href || '#';
      a.innerHTML = m3Icon(iconKind) + '<span class="ipc-m3-ilb">' + escapeHTML(label) + '</span><span class="ipc-m3-chev">\u203A</span>';
      return a;
    }
    function sec(t) { var d = document.createElement('div'); d.className = 'ipc-m3-sec'; d.textContent = t; return d; }
    /* Variante p/ a ZONA DE APOIO (Direction B): r\u00f3tulo + linhas, SEM moldura de
       cart\u00e3o (a zona cinza j\u00e1 \u00e9 o cont\u00eainer). */
    function blocoLinhasApoio(lab, itens) {
      var frag = document.createDocumentFragment();
      var l = document.createElement('div'); l.className = 'ipc-m3-sec'; l.textContent = lab; frag.appendChild(l);
      itens.forEach(function (it) { frag.appendChild(rowIconLink(it.label, it.href, it.icon)); });
      return frag;
    }

    function render() {
      box.innerHTML = '';
      var top = document.createElement('div'); top.className = 'ipc-m3-top';
      top.innerHTML = '<img class="ipc-m3-logo" src="https://ipc.tec.br/himg/uploads/img_6a3afa1b6ed6a4.95692748.png" alt="IPC Comercial">';
      var x = document.createElement('button'); x.className = 'ipc-m3-x'; x.setAttribute('aria-label', 'Fechar'); x.textContent = '\u2715';
      x.addEventListener('click', fecharMenu);
      top.appendChild(x); box.appendChild(top);

      var cur = stack[stack.length - 1];
      if (!cur) {
        var home = document.createElement('a');
        home.className = 'ipc-m3-row ipc-m3-home strong';
        home.href = '/';
        home.innerHTML = m3Icon('home') + '<span class="ipc-m3-ilb">Home</span>';
        box.appendChild(home);
        /* ---- ZONA DE PRODUTOS (branca, full-width) ---- */
        box.appendChild(sec('Categorias'));
        cats.forEach(function (c) {
          box.appendChild(c.children.length ? rowBranch(c) : rowLink(c.label, c.href));
        });
        /* ---- faixa divis\u00f3ria (o "ch\u00e3o") ---- */
        var zona = document.createElement('div'); zona.className = 'ipc-m3-zona';
        box.appendChild(zona);
        /* ---- ZONA DE APOIO (cinza, engloba Empresa + Ferramentas) ---- */
        var apoio = document.createElement('div'); apoio.className = 'ipc-m3-apoio';
        apoio.appendChild(blocoLinhasApoio('A Empresa', [
          { label: 'Quem Somos', href: M3_HREFS.quemSomos, icon: 'empresa' },
          { label: 'Fale Conosco', href: M3_HREFS.faleConosco, icon: 'fone' },
          { label: 'Nossa Localiza\u00e7\u00e3o', href: M3_HREFS.localizacao, icon: 'pin' }
        ]));
        apoio.appendChild(blocoLinhasApoio('Ferramentas de Apoio', [
          { label: 'C\u00e1lculo de Roletes', href: M3_HREFS.calcRoletes, icon: 'calc' },
          { label: 'C\u00e1lculo de Perfil', href: M3_HREFS.calcPerfil, icon: 'regua' }
        ]));
        box.appendChild(apoio);
        var foot = document.createElement('div'); foot.className = 'ipc-m3-foot';
        var wa = document.createElement('a'); wa.className = 'ipc-m3-wpp'; wa.href = waHref || '#';
        wa.innerHTML = m3WppIcon() + 'Falar no WhatsApp';
        foot.appendChild(wa); box.appendChild(foot);
      } else {
        var back = document.createElement('div'); back.className = 'ipc-m3-back'; back.textContent = '\u2039 Voltar';
        back.addEventListener('click', function () { stack.pop(); render(); });
        box.appendChild(back);
        var ti = document.createElement('div'); ti.className = 'ipc-m3-title'; ti.textContent = cur.label; box.appendChild(ti);
        var vt = cur.href || cur.verTodos;
        if (vt) box.appendChild(rowLink('Ver todos em ' + cur.label + ' \u2192', vt, 'ipc-m3-vt'));
        cur.children.forEach(function (c) {
          box.appendChild(c.children.length ? rowBranch(c) : rowLink(c.label, c.href));
        });
      }
      box.scrollTop = 0;
    }

    render();
    if (box.parentElement !== topList) topList.insertBefore(box, topList.firstChild);
    document.body.setAttribute(M3_FLAG, '1');
  }

  /* =====================================================================
     Disparo geral
     ===================================================================== */
  function aplicarTudo() {
    if (!isMobile()) return; /* dorme no desktop */
    try { aplicarCards(); } catch (e) {}
    try { aplicarPDP(); } catch (e) {}
    try { applyMenuMobile(); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicarTudo);
  } else {
    aplicarTudo();
  }
  window.addEventListener('load', aplicarTudo); /* re-aplica; idempotente */
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
