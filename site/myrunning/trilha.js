/* trilha.lab — mapa topográfico + rota animada (código próprio, só para testes). */
(function () {
  var W = 600, H = 520;
  var NS = 'http://www.w3.org/2000/svg';
  var params = new URLSearchParams(location.search);
  var SPEED = parseFloat(params.get('speed')) || 1;
  var REDUZIR = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- relevo: soma de morros gaussianos + ondulação ---------- */
  var MORROS = [[170, 170, 95, 1], [440, 320, 120, .95], [310, 430, 80, -.55],
                [490, 110, 70, .55], [110, 420, 90, .45], [300, 260, 60, -.35]];
  function altura(x, y) {
    var v = 0;
    for (var i = 0; i < MORROS.length; i++) {
      var m = MORROS[i], dx = x - m[0], dy = y - m[1];
      v += m[3] * Math.exp(-(dx * dx + dy * dy) / (2 * m[2] * m[2]));
    }
    return v + .1 * Math.sin(x * .014 + y * .009) + .06 * Math.sin(y * .022 - x * .011 + 1.3);
  }

  /* marching squares → um <path> por nível */
  function desenhaRelevo(g) {
    var PASSO = 5, X0 = -80, Y0 = -80, X1 = W + 80, Y1 = H + 80;
    var cols = Math.ceil((X1 - X0) / PASSO) + 1, rows = Math.ceil((Y1 - Y0) / PASSO) + 1;
    var grade = [];
    for (var j = 0; j < rows; j++) {
      grade.push(new Float32Array(cols));
      for (var i = 0; i < cols; i++) grade[j][i] = altura(X0 + i * PASSO, Y0 + j * PASSO);
    }
    var n = 0;
    for (var nivel = -.45; nivel <= 1.1; nivel += .17, n++) {
      var d = [];
      for (j = 0; j < rows - 1; j++) for (i = 0; i < cols - 1; i++) {
        var a = grade[j][i], b = grade[j][i + 1], c = grade[j + 1][i + 1], e = grade[j + 1][i];
        var caso = (a > nivel ? 8 : 0) | (b > nivel ? 4 : 0) | (c > nivel ? 2 : 0) | (e > nivel ? 1 : 0);
        if (caso === 0 || caso === 15) continue;
        var x = X0 + i * PASSO, y = Y0 + j * PASSO;
        var T = [x + PASSO * (nivel - a) / (b - a), y];
        var R = [x + PASSO, y + PASSO * (nivel - b) / (c - b)];
        var B = [x + PASSO * (nivel - e) / (c - e), y + PASSO];
        var L = [x, y + PASSO * (nivel - a) / (e - a)];
        var segs = {1: [[L, B]], 2: [[B, R]], 3: [[L, R]], 4: [[T, R]], 5: [[T, R], [L, B]], 6: [[T, B]], 7: [[T, L]],
                    8: [[T, L]], 9: [[T, B]], 10: [[T, L], [B, R]], 11: [[T, R]], 12: [[L, R]], 13: [[B, R]], 14: [[L, B]]}[caso];
        for (var s = 0; s < segs.length; s++)
          d.push('M' + segs[s][0][0].toFixed(1) + ' ' + segs[s][0][1].toFixed(1) + 'L' + segs[s][1][0].toFixed(1) + ' ' + segs[s][1][1].toFixed(1));
      }
      if (!d.length) continue;
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('class', n % 3 === 2 ? 'curva forte' : 'curva');
      p.setAttribute('d', d.join(''));
      g.appendChild(p);
    }
  }

  /* Catmull-Rom → Bézier */
  function suaviza(pts) {
    var f = function (v) { return v.toFixed(1); };
    var d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += 'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
                 f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
    }
    return d;
  }

  /* ---------- rotas de exemplo ---------- */
  var ROTAS = [
    { nome: 'Trilha do Açude', sub: 'Corrida · manhã', km: 8.1, ritmo: 372, fc: 142, camera: [0, 0, 1],
      pts: [[70, 380], [120, 350], [150, 300], [140, 240], [190, 200], [260, 190], [300, 150], [290, 110], [350, 95], [420, 115], [470, 165], [500, 235], [470, 300], [420, 330]],
      wps: [3, 7, 11] },
    { nome: 'Volta da Represa', sub: 'Caminhada · tarde', km: 5.4, ritmo: 648, fc: 104, camera: [-40, 25, 1.06],
      pts: [[300, 370], [240, 350], [190, 310], [175, 250], [205, 190], [270, 155], [345, 150], [410, 180], [440, 240], [420, 305], [365, 345], [310, 372]],
      wps: [2, 5, 8] },
    { nome: 'Serra Baixa', sub: 'Trail · 21 km', km: 21.3, ritmo: 455, fc: 156, camera: [30, -20, 1.1],
      pts: [[540, 380], [490, 350], [470, 290], [420, 260], [360, 280], [300, 240], [250, 260], [190, 230], [150, 170], [100, 140], [60, 100]],
      wps: [2, 5, 8] }
  ];

  /* ---------- elementos ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var relevo = $('relevo'), rota = $('rota'), fantasma = $('fantasma'), brilho = $('brilho'), trilha = $('trilha');
  var cabeca = $('cabeca'), anel = $('cabeca-anel'), pontosRota = $('pontos-rota');
  var sonares = rota.querySelectorAll('.sonar');
  var perfilLinha = $('perfil-linha'), perfilArea = $('perfil-area'), perfilRev = $('perfil-rev'), perfilCursor = $('perfil-cursor');
  var hDist = $('h-dist'), hTempo = $('h-tempo'), hRitmo = $('h-ritmo'), hFc = $('h-fc');
  var selo = $('selo'), pronto = $('pronto'), prontoTxt = $('pronto-txt');
  var statusDot = $('status-dot'), statusTxt = $('status-txt'), rotaNome = $('rota-nome'), rotaSub = $('rota-sub');
  var nomeBox = rotaNome.parentNode;

  desenhaRelevo(relevo);

  /* ---------- formatação ---------- */
  var virgula = function (v, c) { return v.toFixed(c).replace('.', ','); };
  function hms(s) { s = Math.round(s); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h + ':' + (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x; }
  function ms(s) { s = Math.round(s); var m = Math.floor(s / 60), x = s % 60; return m + ':' + (x < 10 ? '0' : '') + x; }

  /* ---------- controle de execução ---------- */
  var ficha = 0, atual = 0;
  function espera(ms, f) { return new Promise(function (ok, nao) { setTimeout(function () { f === ficha ? ok() : nao('cancelado'); }, ms / SPEED); }); }
  function anima(dur, f, cada) {
    return new Promise(function (ok, nao) {
      var t0 = performance.now();
      (function passo(t) {
        if (f !== ficha) return nao('cancelado');
        var p = Math.min(1, (t - t0) * SPEED / dur);
        cada(p);
        p < 1 ? requestAnimationFrame(passo) : ok();
      })(t0);
    });
  }
  var suave = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* ---------- montar uma rota ---------- */
  function monta(r) {
    var d = suaviza(r.pts);
    [fantasma, brilho, trilha].forEach(function (p) { p.setAttribute('d', d); });
    var len = trilha.getTotalLength();
    [brilho, trilha].forEach(function (p) { p.style.strokeDasharray = len; p.style.strokeDashoffset = len; });

    // pontos de passagem na posição (fração do comprimento) mais próxima de cada ponto
    pontosRota.innerHTML = '';
    var amostras = [], N = 160;
    for (var i = 0; i <= N; i++) { var q = trilha.getPointAtLength(len * i / N); amostras.push([q.x, q.y, altura(q.x, q.y)]); }
    var wps = r.wps.map(function (k) {
      var alvo = r.pts[k], melhor = 0, dm = 1e9;
      amostras.forEach(function (a, i) { var dd = (a[0] - alvo[0]) * (a[0] - alvo[0]) + (a[1] - alvo[1]) * (a[1] - alvo[1]); if (dd < dm) { dm = dd; melhor = i; } });
      var a = amostras[melhor];
      var anelEl = document.createElementNS(NS, 'circle'); anelEl.setAttribute('r', 5); anelEl.setAttribute('cx', a[0]); anelEl.setAttribute('cy', a[1]); anelEl.setAttribute('data-anel', '');
      var wp = document.createElementNS(NS, 'circle'); wp.setAttribute('r', 4.5); wp.setAttribute('cx', a[0]); wp.setAttribute('cy', a[1]); wp.setAttribute('data-wp', '');
      pontosRota.appendChild(anelEl); pontosRota.appendChild(wp);
      return { p: melhor / N, wp: wp, anel: anelEl };
    });
    // início e fim
    [0, N].forEach(function (i) {
      var c = document.createElementNS(NS, 'circle'); c.setAttribute('r', i ? 5.5 : 3.5); c.setAttribute('cx', amostras[i][0]); c.setAttribute('cy', amostras[i][1]);
      c.setAttribute('data-wp', ''); if (!i) c.classList.add('on'); pontosRota.appendChild(c);
      if (i) wps.push({ p: 1, wp: c, anel: null });
    });

    // perfil de elevação
    var mn = Math.min.apply(null, amostras.map(function (a) { return a[2]; }));
    var mx = Math.max.apply(null, amostras.map(function (a) { return a[2]; }));
    var px = function (i) { return 22 + 556 * i / N; };
    var py = function (h) { return 450 - 34 * (h - mn) / (mx - mn || 1); };
    var linha = amostras.map(function (a, i) { return (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(a[2]).toFixed(1); }).join('');
    perfilLinha.setAttribute('d', linha);
    perfilArea.setAttribute('d', linha + 'L578 452L22 452Z');
    var ganho = 0; for (i = 1; i <= N; i++) ganho += Math.max(0, amostras[i][2] - amostras[i - 1][2]);

    return { len: len, amostras: amostras, wps: wps, px: px, py: py, N: N, ganho: Math.round(ganho * 180) };
  }

  function hud(r, m, p) {
    var i = Math.min(m.N, Math.round(p * m.N)), a = m.amostras[i], b = m.amostras[Math.max(0, i - 4)];
    var incl = Math.max(-1, Math.min(1, (a[2] - b[2]) * 8)); // -1 descendo … 1 subindo
    var dist = r.km * p;
    hDist.innerHTML = virgula(dist, 2) + '<i>km</i>';
    hTempo.textContent = hms(dist * r.ritmo);
    hRitmo.innerHTML = (p ? ms(r.ritmo * (1 + incl * .18)) : '0:00') + '<i>/km</i>';
    hFc.innerHTML = (p ? Math.round(r.fc - 18 + 18 * Math.min(1, p * 4) + incl * 8) : 0) + '<i>bpm</i>';
  }

  function posiciona(m, p) {
    var q = trilha.getPointAtLength(m.len * p);
    cabeca.setAttribute('cx', q.x); cabeca.setAttribute('cy', q.y);
    anel.setAttribute('cx', q.x); anel.setAttribute('cy', q.y);
    sonares.forEach(function (s) { s.setAttribute('cx', q.x); s.setAttribute('cy', q.y); });
    var off = m.len * (1 - p);
    trilha.style.strokeDashoffset = off; brilho.style.strokeDashoffset = off;
    perfilRev.setAttribute('width', m.px(p * m.N));
    var i = Math.round(p * m.N);
    perfilCursor.setAttribute('cx', m.px(i)); perfilCursor.setAttribute('cy', m.py(m.amostras[i][2]));
  }

  async function toca(idx, f) {
    var r = ROTAS[idx];
    // saída da rota anterior
    rota.classList.add('sai'); nomeBox.classList.add('troca'); pronto.classList.remove('on');
    sonares.forEach(function (s) { s.classList.remove('on'); });
    var c = r.camera; relevo.style.transform = 'translate(' + c[0] + 'px,' + c[1] + 'px) scale(' + c[2] + ')';
    await espera(600, f);

    var m = monta(r);
    fantasma.classList.remove('on'); posiciona(m, 0); hud(r, m, 0);
    rotaNome.textContent = r.nome; rotaSub.textContent = r.sub;
    statusDot.classList.remove('ok'); statusTxt.textContent = 'Traçando rota'; selo.classList.remove('some');
    rota.classList.remove('sai'); nomeBox.classList.remove('troca');
    await espera(350, f);
    fantasma.classList.add('on');
    await espera(700, f);

    var duracao = 4200 + r.km * 120;
    await anima(duracao, f, function (t) {
      var p = suave(t);
      posiciona(m, p); hud(r, m, p);
      m.wps.forEach(function (w) {
        if (p >= w.p && !w.wp.classList.contains('on')) { w.wp.classList.add('on'); if (w.anel) w.anel.classList.add('on'); }
      });
    });

    // conclusão
    trilha.classList.add('flash');
    await espera(90, f);
    trilha.classList.remove('flash');
    sonares.forEach(function (s) { s.classList.add('on'); });
    statusDot.classList.add('ok'); statusTxt.textContent = 'Rota concluída';
    prontoTxt.textContent = 'Rota pronta · ' + virgula(r.km, 1) + ' km · +' + m.ganho + ' m';
    selo.classList.add('some'); pronto.classList.add('on');
    await espera(4200, f);
    atual = (idx + 1) % ROTAS.length;
    toca(atual, f).catch(function () {});
  }

  function estatico(idx) {
    var r = ROTAS[idx], m = monta(r);
    fantasma.classList.add('on'); posiciona(m, 1); hud(r, m, 1);
    m.wps.forEach(function (w) { w.wp.classList.add('on'); });
    rotaNome.textContent = r.nome; rotaSub.textContent = r.sub;
    statusDot.classList.add('ok'); statusTxt.textContent = 'Rota concluída';
    prontoTxt.textContent = 'Rota pronta · ' + virgula(r.km, 1) + ' km · +' + m.ganho + ' m';
    selo.classList.add('some'); pronto.classList.add('on');
  }

  function inicia(idx) {
    ficha++;
    atual = idx;
    if (REDUZIR) return estatico(idx);
    toca(idx, ficha).catch(function () {});
  }

  $('replay').addEventListener('click', function () { inicia(atual); });
  document.addEventListener('keydown', function (e) {
    if (e.target.closest('input, textarea')) return;
    if (e.key === 'r' || e.key === 'R') inicia(atual);
    if (e.key === 'ArrowRight') inicia((atual + 1) % ROTAS.length);
    if (e.key === 'ArrowLeft') inicia((atual + ROTAS.length - 1) % ROTAS.length);
  });

  inicia(+params.get('rota') || 0);

  /* ---------- recursos: um ponto percorre 01 → 02 → 03 ---------- */
  var secao = document.querySelector('.recursos');
  var recs = [].slice.call(secao.querySelectorAll('.rec'));
  recs.forEach(function (rec) {
    var t = document.createElement('div');
    t.className = 'trilho'; t.setAttribute('aria-hidden', 'true');
    t.innerHTML = '<i class="linha"></i><i class="ponta"></i>';
    if (rec.dataset.anim === 'pulsar')
      t.insertAdjacentHTML('beforeend', '<svg class="ecg"><path/></svg><i class="onda"></i>');
    if (rec.dataset.anim === 'recuperar')
      t.insertAdjacentHTML('beforeend', '<span class="ok"><svg viewBox="0 0 16 16"><path d="M3.8 8.4l2.6 2.6 5.6-6" fill="none" stroke="#141416" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>');
    rec.insertBefore(t, rec.firstChild);
  });

  var tempo = function (ms) { return ms / SPEED; };
  function A(el, kf, opt) {
    opt = Object.assign({ fill: 'forwards' }, opt);
    opt.duration = tempo(opt.duration); if (opt.delay) opt.delay = tempo(opt.delay);
    return el.animate(kf, opt).finished;
  }
  var SOBE = [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }];
  var SAIDA = 'cubic-bezier(.2,.8,.2,1)', VAIVEM = 'cubic-bezier(.65,0,.35,1)';
  var TITULO = 120, TEXTO = 550; // mesmo atraso de título e texto nas 3 colunas
  var DURACAO = 1200;            // mesma duração da linha nas 3 colunas
  function partes(rec) {
    return { linha: rec.querySelector('.linha'), ponta: rec.querySelector('.ponta'), num: rec.querySelector('.num'),
             h2: rec.querySelector('h2'), p: rec.querySelector('p:last-child') };
  }

  // 01 — o título é "desenhado" junto com a linha, da esquerda para a direita
  function tracar(rec) {
    var e = partes(rec), D = DURACAO;
    A(e.num, SOBE, { duration: 400, easing: SAIDA });
    A(e.ponta, [{ opacity: 0, left: '0%' }, { opacity: 1, left: '0%', offset: .06 }, { opacity: 1, left: '100%' }], { duration: D, easing: VAIVEM });
    A(e.h2, [{ opacity: 1, clipPath: 'inset(-20% 100% -20% 0)' }, { opacity: 1, clipPath: 'inset(-20% 0% -20% 0)' }], { duration: D * .85, delay: TITULO, easing: VAIVEM });
    A(e.p, SOBE, { duration: 650, delay: TEXTO, easing: SAIDA });
    return A(e.linha, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: D, easing: VAIVEM })
      .then(function () { A(e.ponta, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 }); });
  }

  // 02 — batimento: a linha vira um monitor cardíaco. O ponto corre SOBRE o traçado (sobe e desce nos picos),
  // cada pico solta uma onda e faz o título pulsar (tum-tum). No fim o eletro "acalma" e vira a linha reta.
  function pulsar(rec) {
    var e = partes(rec), ecg = rec.querySelector('.ecg'), path = ecg.querySelector('path'), onda = rec.querySelector('.onda');
    var L = Math.round(rec.getBoundingClientRect().width), Y = 20, D = DURACAO;
    var picos = [Math.round(L * .34), Math.round(L * .68)];
    // cada batida ocupa 92px; em colunas estreitas ela encolhe para sobrar folga entre as duas
    var sx = Math.max(.45, Math.min(1, (L * .34 - 28) / 92));

    // uma batida PQRST com amplitude a (0 = linha reta)
    function batida(c, a) {
      var x = function (dx) { return (c + dx * sx).toFixed(1); };
      return 'H' + x(-46) +
        'C' + x(-42) + ' ' + Y + ' ' + x(-40) + ' ' + (Y - 4 * a) + ' ' + x(-35) + ' ' + (Y - 4 * a) +      // P
        'C' + x(-30) + ' ' + (Y - 4 * a) + ' ' + x(-28) + ' ' + Y + ' ' + x(-24) + ' ' + Y +
        'H' + x(-8) + 'L' + x(-4) + ' ' + (Y + 4 * a) + 'L' + c + ' ' + (Y - 17 * a) +                   // Q R
        'L' + x(5) + ' ' + (Y + 8 * a) + 'L' + x(9) + ' ' + Y +                                          // S
        'H' + x(18) + 'C' + x(23) + ' ' + Y + ' ' + x(26) + ' ' + (Y - 6 * a) + ' ' + x(32) + ' ' + (Y - 6 * a) + // T
        'C' + x(38) + ' ' + (Y - 6 * a) + ' ' + x(41) + ' ' + Y + ' ' + x(46) + ' ' + Y;
    }
    function traco(a) { return 'M0 ' + Y + batida(picos[0], a) + batida(picos[1], a) + 'H' + L; }

    ecg.setAttribute('viewBox', '0 0 ' + L + ' 40');
    path.setAttribute('d', traco(1));
    var total = path.getTotalLength();
    // tabela x → comprimento, para o ponto e o traço andarem juntos no eixo x
    var tab = [], N = Math.max(200, Math.round(total / 2));
    for (var i = 0; i <= N; i++) { var q = path.getPointAtLength(total * i / N); tab.push([q.x, q.y, total * i / N]); }
    function noX(x) { var lo = 0, hi = N; while (lo < hi) { var m = (lo + hi) >> 1; tab[m][0] < x ? lo = m + 1 : hi = m; } return tab[lo]; }

    path.style.strokeDasharray = total + ' ' + total;
    path.style.strokeDashoffset = total;
    ecg.classList.add('vivo');
    ecg.style.visibility = 'visible';

    // número: lê "dados" e desacelera até assentar na primeira batida
    var alvo = e.num.textContent, passo = 40, fim = false;
    e.num.style.opacity = 1; e.num.style.fontVariantNumeric = 'tabular-nums';
    (function sorteia() {
      if (fim) { e.num.textContent = alvo; return; }
      e.num.textContent = ('0' + Math.floor(Math.random() * 100)).slice(-2);
      passo *= 1.12; setTimeout(sorteia, tempo(passo));
    })();

    A(e.h2, SOBE, { duration: 500, delay: TITULO, easing: SAIDA });
    A(e.p, SOBE, { duration: 650, delay: TEXTO, easing: SAIDA });
    var tumTum = [{ transform: 'scale(1)' }, { transform: 'scale(1.06)', offset: .14 }, { transform: 'scale(.995)', offset: .38 },
                  { transform: 'scale(1.025)', offset: .52 }, { transform: 'scale(1)' }];

    function bate(k, x, y) {
      A(e.h2, tumTum, { duration: 520, easing: 'ease-out', composite: 'add' });
      A(e.ponta, [{ boxShadow: '0 0 0 4px rgba(255,99,79,.18)' }, { boxShadow: '0 0 0 9px rgba(255,99,79,0)' }], { duration: 500, fill: 'none' });
      var o = onda.cloneNode(); onda.parentNode.appendChild(o);
      A(o, [{ opacity: .9, transform: 'translate(' + x + 'px,' + y + 'px) scale(.4)' }, { opacity: 0, transform: 'translate(' + x + 'px,' + y + 'px) scale(3.4)' }],
        { duration: 1000, easing: 'cubic-bezier(.1,.7,.3,1)' }).then(function () { o.remove(); });
      if (k === 0) fim = true;
    }

    var suaveSeno = function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; };
    var batidas = 0;
    e.ponta.style.left = '0px';
    A(e.ponta, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });

    return new Promise(function (pronto) {
      var t0 = performance.now();
      (function quadro(t) {
        var p = Math.min(1, (t - t0) * SPEED / D), x = L * suaveSeno(p), pt = noX(x);
        path.style.strokeDashoffset = total - pt[2];
        e.ponta.style.transform = 'translate(' + pt[0].toFixed(1) + 'px,' + (pt[1] - Y).toFixed(1) + 'px)';
        while (batidas < picos.length && x >= picos[batidas]) { bate(batidas, picos[batidas], -17); batidas++; }
        if (p < 1) return requestAnimationFrame(quadro);
        pronto();
      })(t0);
    }).then(function () {
      // o monitor acalma: amplitude 1 → 0, e a linha reta assume.
      // Roda em paralelo: a próxima coluna já começa quando o ponto chega ao fim.
      A(e.ponta, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
      path.style.strokeDasharray = 'none';
      e.linha.style.transform = 'none'; // a linha reta já fica por baixo, sem troca brusca no fim
      var t0 = performance.now(), DUR = tempo(800);
      (function quadro(t) {
        var p = Math.min(1, (t - t0) / DUR), a = Math.pow(1 - p, 3);
        path.setAttribute('d', traco(a));
        ecg.style.opacity = 1 - p * p; // brilho e espessura somem junto com os picos
        if (p < 1) return requestAnimationFrame(quadro);
        ecg.classList.remove('vivo');
        ecg.style.visibility = 'hidden';
      })(t0);
    });
  }

  // 03 — recuperação: barra de progresso contínua, texto entra igual às outras colunas e fecha com o selo verde
  function recuperar(rec) {
    var e = partes(rec), D = DURACAO, ok = rec.querySelector('.ok');
    A(e.num, SOBE, { duration: 400, easing: SAIDA });
    A(e.linha, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: D, easing: VAIVEM });
    A(e.ponta, [{ opacity: 0, left: '0%' }, { opacity: 1, left: '0%', offset: .06 }, { opacity: 1, left: '100%' }], { duration: D, easing: VAIVEM });
    A(e.h2, SOBE, { duration: 500, delay: TITULO, easing: SAIDA });
    A(e.p, SOBE, { duration: 650, delay: TEXTO, easing: SAIDA });
    return new Promise(function (ok2) { setTimeout(ok2, tempo(D)); }).then(function () {
      A(e.ponta, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 });
      A(e.linha, [{ background: '#8fe3b0' }, { background: '#8fe3b0', offset: .4 }, { background: '#ff634f' }], { duration: 900 });
      return A(ok, [{ transform: 'scale(0)' }, { transform: 'scale(1.25)', offset: .6 }, { transform: 'scale(1)' }], { duration: 450, easing: 'cubic-bezier(.2,1.4,.4,1)' });
    });
  }

  var ANIMS = { tracar: tracar, pulsar: pulsar, recuperar: recuperar };
  if (REDUZIR || params.has('editar') || !Element.prototype.animate || !('IntersectionObserver' in window)) {
    secao.classList.add('rec-final');
  } else {
    secao.classList.add('rec-js');
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      // uma de cada vez: quando a linha de uma chega ao fim, a próxima começa
      recs.reduce(function (fila, rec) {
        return fila.then(function () { return ANIMS[rec.dataset.anim](rec); });
      }, Promise.resolve());
    }, { threshold: .35 });
    io.observe(secao);
  }
})();
