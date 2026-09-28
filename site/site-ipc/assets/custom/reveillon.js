/* Tema de Réveillon — IPC Comercial (cópia local)
 * A bolinha do "i" desce a escada do logo e, no chão, vira um rojão: sobe e estoura.
 * Depois sobem mais rojões do pé da faixa amarela, o último forma o ano novo
 * ("2027") com as faíscas por cima da busca, e uma faísca volta como cometa até
 * o pingo do "i", onde a bolinha reaparece com um "pop".
 * Tudo acontece dentro da faixa amarela, uma vez por carregamento.
 * Para desligar: ATIVO = false. */
(function () {
  var ATIVO = false;
  // ?tema=... na URL escolhe o tema (para comparar os temas em abas separadas).
  var temaUrl = new URLSearchParams(location.search).get('tema') || location.hash.replace('#', '') || null;
  if (temaUrl) ATIVO = temaUrl === 'reveillon';
  if (!ATIVO) return;

  var ball = document.querySelector('.ipc-logo-ball');
  var header = document.querySelector('#header-main');
  if (!ball || !header) return;
  document.body.classList.add('ipc-reveillon');
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // A partir de julho já mostra o ano que vem.
  var hoje = new Date();
  var ANO = String(hoje.getMonth() >= 6 ? hoje.getFullYear() + 1 : hoje.getFullYear());

  var CORES = { vermelho: '#e03131', azul: '#1971c2', roxo: '#7048e8', verde: '#2f9e44', laranja: '#e8590c', preto: '#15161a', rosa: '#d6336c' };
  var black = document.querySelector('#header-main .header-1');
  var logo = document.querySelector('.logo img');
  var busca = document.querySelector('.search-field');

  /* ---------- Canvas na faixa amarela (recorta tudo: nada vai para o preto) ---------- */
  function faixaTela() {
    var hb = header.getBoundingClientRect();
    var top = black ? black.getBoundingClientRect().bottom : hb.top;
    return { left: hb.left, top: top, width: hb.width, height: hb.bottom - top };
  }
  var canvas = document.createElement('canvas');
  canvas.className = 'ipc-rv-ceu';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0;

  // O cabeçalho ainda muda de posição enquanto a página carrega.
  function place() {
    var f = faixaTela();
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.style.left = f.left + window.scrollX + 'px';
    canvas.style.top = f.top + window.scrollY + 'px';
    canvas.style.width = f.width + 'px';
    canvas.style.height = f.height + 'px';
    if (W !== f.width || H !== f.height) {
      W = f.width; H = f.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }
  place();
  var ro = window.ResizeObserver ? new ResizeObserver(place) : null;
  if (ro) ro.observe(document.body);

  // Retângulo de um elemento em coordenadas da faixa.
  function naFaixa(el) {
    var f = faixaTela(), r = el.getBoundingClientRect();
    return { x: r.left - f.left, y: r.top - f.top, w: r.width, h: r.height, cx: r.left - f.left + r.width / 2, cy: r.top - f.top + r.height / 2 };
  }
  // Onde a bolinha fica em repouso (antes de a animação começar ela está no lugar).
  var repouso = naFaixa(ball);

  /* ---------- Partículas ---------- */
  var faiscas = [], rojoes = [], letras = [], eventos = [], relogio = 0;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function escolha(l) { return l[Math.floor(Math.random() * l.length)]; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function faisca(x, y, vx, vy, o) {
    faiscas.push({
      x: x, y: y, vx: vx, vy: vy, vida: 0,
      max: o.vida || 1, cor: o.cor, tam: o.tam || 1.6,
      arrasto: o.arrasto == null ? 2 : o.arrasto, grav: o.grav == null ? 45 : o.grav,
      pisca: !!o.pisca
    });
  }

  var k = 1;                                   // escala dos estouros pela altura da faixa
  function estouro(x, y, tipo, cor) {
    k = Math.max(0.8, Math.min(1.3, H / 95));
    // clarão rápido no centro
    faiscas.push({ x: x, y: y, vx: 0, vy: 0, vida: 0, max: 0.18, cor: cor, tam: 0, arrasto: 0, grav: 0, clarao: 11 * k });
    var n, i, ang, v;
    if (tipo === 'anel') {
      n = 36;
      for (i = 0; i < n; i++) {
        ang = i / n * Math.PI * 2;
        faisca(x, y, Math.cos(ang) * 78 * k, Math.sin(ang) * 78 * k, { cor: cor, vida: rnd(1, 1.25), arrasto: 2.6, grav: 30 });
      }
    } else if (tipo === 'salgueiro') {
      n = 40;
      for (i = 0; i < n; i++) {
        ang = rnd(0, Math.PI * 2); v = rnd(35, 60) * k;
        faisca(x, y, Math.cos(ang) * v, Math.sin(ang) * v - 10, { cor: cor, vida: rnd(1.5, 1.9), arrasto: 1.5, grav: 75, tam: 1.4, pisca: true });
      }
    } else { // peônia: esfera cheia, com estalinhos no fim
      n = 48;
      for (i = 0; i < n; i++) {
        ang = i / n * Math.PI * 2 + rnd(-0.08, 0.08); v = rnd(58, 90) * k;
        faisca(x, y, Math.cos(ang) * v, Math.sin(ang) * v, { cor: i % 7 === 0 ? CORES.preto : cor, vida: rnd(1.1, 1.5), arrasto: 2.2, grav: 45, pisca: true });
      }
    }
  }

  // Rojão: sobe numa curva (Bézier) com rastro, e estoura no fim.
  function rojao(x0, y0, x1, y1, dur, aoChegar) {
    rojoes.push({
      x0: x0, y0: y0, x1: x1, y1: y1,
      cx: x0 + (x1 - x0) * 0.15, cy: Math.max(4, y1 - 6),
      t: 0, dur: dur, aoChegar: aoChegar, x: x0, y: y0
    });
  }

  /* ---------- O ano novo escrito com as faíscas ---------- */
  function pontosDoTexto(texto, cx, cy, altura) {
    var off = document.createElement('canvas');
    var fs = Math.round(altura);
    var c2 = off.getContext('2d');
    c2.font = '800 ' + fs + 'px Poppins, sans-serif';
    var larg = Math.ceil(c2.measureText(texto).width) + 4;
    off.width = larg; off.height = fs + 8;
    c2.font = '800 ' + fs + 'px Poppins, sans-serif';
    c2.textBaseline = 'middle';
    c2.fillText(texto, 2, off.height / 2);
    var d = c2.getImageData(0, 0, off.width, off.height).data, pts = [];
    var passo = Math.max(2, Math.round(fs / 17));
    for (var y = 0; y < off.height; y += passo)
      for (var x = 0; x < off.width; x += passo)
        if (d[(y * off.width + x) * 4 + 3] > 140) pts.push({ x: cx - larg / 2 + x, y: cy - off.height / 2 + y });
    return { pts: pts, larg: larg };
  }

  var textoInfo = null;
  function formarAno(x, y, alvo) {
    faiscas.push({ x: x, y: y, vx: 0, vy: 0, vida: 0, max: 0.25, cor: CORES.rosa, tam: 0, arrasto: 0, grav: 0, clarao: 16 * k });
    var alt = Math.min(H * 0.5, alvo.h ? alvo.h * 0.9 : H * 0.45);
    textoInfo = pontosDoTexto(ANO, alvo.cx, alvo.cy, alt);
    textoInfo.cx = alvo.cx; textoInfo.cy = alvo.cy;
    textoInfo.pts.forEach(function (p, i) {
      letras.push({ sx: x, sy: y, tx: p.x, ty: p.y, x: x, y: y, t: 0, atraso: rnd(0, 0.12), cor: i % 4 === 0 ? CORES.vermelho : CORES.preto, fase: rnd(0, 6.28) });
    });
  }
  function soltarAno() {
    letras.forEach(function (l) {
      faisca(l.x, l.y, rnd(-18, 18), rnd(-14, 6), { cor: l.cor, vida: rnd(0.7, 1.1), arrasto: 1, grav: 70, tam: 1.3, pisca: true });
    });
    letras = [];
  }

  /* ---------- A bolinha volta: cometa até o pingo do "i" ---------- */
  function cometa(x0, y0) {
    var alvo = { x: repouso.cx, y: repouso.cy };
    var c = { x: (x0 + alvo.x) / 2, y: Math.max(5, Math.min(y0, alvo.y) - 18) };
    rojoes.push({ x0: x0, y0: y0, x1: alvo.x, y1: alvo.y, cx: c.x, cy: c.y, t: 0, dur: 0.75, cometa: true, x: x0, y: y0, aoChegar: function () {
      ball.classList.remove('ipc-rv-oculta');
      ball.classList.add('ipc-rv-volta');
      for (var i = 0; i < 14; i++) {
        var ang = i / 14 * Math.PI * 2;
        faisca(alvo.x, alvo.y, Math.cos(ang) * 40, Math.sin(ang) * 40, { cor: i % 2 ? CORES.vermelho : CORES.preto, vida: 0.5, arrasto: 3, grav: 20, tam: 1.3 });
      }
    } });
  }

  /* ---------- Roteiro do show (tempos em s a partir do disparo) ---------- */
  function iniciarShow() {
    var chao = naFaixa(ball);
    ball.classList.add('ipc-rv-oculta');
    var x0 = chao.cx, y0 = chao.y + chao.h - 2;

    var lg = logo ? naFaixa(logo) : { x: 0, w: 0, cx: W * 0.15 };
    var bz = busca ? naFaixa(busca) : { x: W * 0.3, w: W * 0.4, cx: W / 2, cy: H / 2, h: H * 0.5 };
    function limX(x) { return Math.max(25, Math.min(W - 25, x)); }

    var alvos = [
      { t: 0,    x0: x0,                              y0: y0,    x: limX(lg.x + lg.w + 70), y: H * 0.42, tipo: 'peonia',    cor: CORES.vermelho },
      { t: 0.45, x0: limX(bz.x + bz.w * 0.62),        y0: H + 4, x: limX(bz.x + bz.w * 0.62), y: H * 0.38, tipo: 'anel', cor: CORES.azul },
      { t: 0.9,  x0: limX((bz.x + bz.w + W) / 2),     y0: H + 4, x: limX((bz.x + bz.w + W) / 2), y: H * 0.44, tipo: 'peonia', cor: CORES.roxo },
      { t: 1.3,  x0: limX(lg.x / 2),                  y0: H + 4, x: limX(lg.x / 2),         y: H * 0.36, tipo: 'salgueiro', cor: CORES.laranja },
      { t: 1.75, x0: limX(bz.x + bz.w * 0.3),         y0: H + 4, x: limX(bz.x + bz.w * 0.3), y: H * 0.45, tipo: 'peonia',  cor: CORES.verde }
    ];
    alvos.forEach(function (a, i) {
      eventos.push({ t: relogio + a.t, fn: function () {
        rojao(a.x0, a.y0, a.x, a.y, i === 0 ? 0.8 : 0.7, function (x, y) { estouro(x, y, a.tipo, a.cor); });
      } });
    });

    // Grand finale: o ano novo por cima da busca.
    var alvoTexto = { cx: limX(bz.cx), cy: Math.max(H * 0.3, Math.min(H * 0.7, bz.cy)), h: bz.h || H * 0.45 };
    eventos.push({ t: relogio + 2.3, fn: function () {
      rojao(alvoTexto.cx, H + 4, alvoTexto.cx, alvoTexto.cy, 0.75, function (x, y) { formarAno(x, y, alvoTexto); });
    } });
    eventos.push({ t: relogio + 4.8, fn: function () {
      var saida = textoInfo ? { x: textoInfo.cx - textoInfo.larg * 0.35, y: textoInfo.cy } : { x: W / 2, y: H / 2 };
      soltarAno();
      cometa(saida.x, saida.y);
    } });
    fimShow = relogio + 7;
  }
  var fimShow = Infinity;

  ball.addEventListener('animationend', function (e) {
    if (e.animationName === 'ipc-rv-desce') iniciarShow();
  });

  /* ---------- Laço de animação ---------- */
  var antes = performance.now();
  function quadro(agora) {
    var dt = Math.min(0.05, (agora - antes) / 1000);
    antes = agora;
    relogio += dt;

    // Pavio aceso: faíscas saindo da bolinha enquanto ela treme no chão.
    var an = ball.getAnimations ? ball.getAnimations()[0] : null;
    if (an && an.animationName === 'ipc-rv-desce' && an.playState === 'running') {
      var tAn = an.currentTime - 800;
      if (tAn > 1900 * 0.8 && tAn < 1900) {
        var b = naFaixa(ball);
        for (var s = 0; s < 2; s++)
          faisca(b.cx + rnd(-2, 2), b.y, rnd(-30, 30), rnd(-70, -30), { cor: escolha([CORES.laranja, CORES.vermelho, CORES.preto]), vida: rnd(0.25, 0.45), arrasto: 2, grav: 120, tam: 1.2 });
      }
    }

    for (var e = eventos.length - 1; e >= 0; e--) {
      if (relogio >= eventos[e].t) { var ev = eventos.splice(e, 1)[0]; ev.fn(); }
    }

    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';

    // Rojões e o cometa
    for (var r = rojoes.length - 1; r >= 0; r--) {
      var rj = rojoes[r];
      rj.t += dt;
      var u = Math.min(1, rj.t / rj.dur), q = rj.cometa ? u * u * (3 - 2 * u) : easeOut(u);
      var nx = (1 - q) * (1 - q) * rj.x0 + 2 * (1 - q) * q * rj.cx + q * q * rj.x1;
      var ny = (1 - q) * (1 - q) * rj.y0 + 2 * (1 - q) * q * rj.cy + q * q * rj.y1;
      for (var m = 0; m < 2; m++)
        faisca(nx + rnd(-1, 1), ny + rnd(-1, 1), rnd(-12, 12), rnd(5, 25), { cor: rj.cometa ? escolha([CORES.vermelho, CORES.preto]) : escolha([CORES.laranja, CORES.vermelho]), vida: rnd(0.25, 0.45), arrasto: 3, grav: 40, tam: 1.3 });
      rj.x = nx; rj.y = ny;
      ctx.globalAlpha = 1;
      ctx.fillStyle = rj.cometa ? CORES.preto : '#c2410c';
      ctx.beginPath(); ctx.arc(nx, ny, rj.cometa ? 2.4 : 2.1, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#fff4c2';
      ctx.beginPath(); ctx.arc(nx, ny, 0.9, 0, 6.2832); ctx.fill();
      if (u >= 1) { rojoes.splice(r, 1); if (rj.aoChegar) rj.aoChegar(nx, ny); }
    }

    // Faíscas (traço proporcional à velocidade)
    for (var i = faiscas.length - 1; i >= 0; i--) {
      var p = faiscas[i];
      p.vida += dt;
      if (p.vida >= p.max) { faiscas.splice(i, 1); continue; }
      var f = p.vida / p.max;
      if (p.clarao) {
        ctx.globalAlpha = 0.45 * (1 - f);
        ctx.fillStyle = p.cor;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.clarao * (0.6 + f), 0, 6.2832); ctx.fill();
        continue;
      }
      var fr = Math.exp(-p.arrasto * dt);
      p.vx *= fr; p.vy = p.vy * fr + p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.pisca && f > 0.62 && Math.random() < 0.45) continue;
      ctx.globalAlpha = 1 - f * f;
      ctx.strokeStyle = p.cor;
      ctx.lineWidth = p.tam;
      ctx.beginPath();
      ctx.moveTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    // O ano novo: faíscas voando até as letras e brilhando no lugar
    for (var j = 0; j < letras.length; j++) {
      var l = letras[j];
      l.t += dt;
      var a2 = easeOut(Math.max(0, Math.min(1, (l.t - l.atraso) / 0.6)));
      l.x = l.sx + (l.tx - l.sx) * a2;
      l.y = l.sy + (l.ty - l.sy) * a2;
      ctx.globalAlpha = a2 < 1 ? 0.5 + 0.5 * a2 : 0.8 + 0.2 * Math.sin(relogio * 9 + l.fase);
      ctx.fillStyle = l.cor;
      ctx.beginPath(); ctx.arc(l.x, l.y, 1.35, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (relogio > fimShow && !faiscas.length && !rojoes.length && !letras.length && !eventos.length) {
      if (ro) ro.disconnect();
      canvas.remove();
      return;
    }
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);
})();
