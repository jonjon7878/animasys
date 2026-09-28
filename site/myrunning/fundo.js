/* trilha.lab — fundo animado da página Entrar:
   curvas de nível que derivam devagar + uma rota coral que se desenha de tempos em tempos.
   Fica atrás de tudo (pointer-events: none) e some perto do formulário (máscara no CSS). */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var REDUZIR = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fundo = document.createElement('div');
  fundo.className = 'fundo';
  fundo.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(fundo, document.body.firstChild);

  var svg, relevo, rota, brilho, cabeca, W, H, ciclo = 0;

  // morros espalhados pela tela + ondulação suave
  function campo(W, H) {
    var morros = [[.12, .25, .16, 1], [.85, .2, .14, .8], [.9, .78, .18, .95], [.1, .82, .15, .7],
                  [.5, .5, .2, -.5], [.32, .08, .1, .45], [.68, .95, .12, .5]];
    var m = Math.max(W, H);
    return function (x, y) {
      var v = 0;
      for (var i = 0; i < morros.length; i++) {
        var k = morros[i], dx = x - k[0] * W, dy = y - k[1] * H, r = k[2] * m;
        v += k[3] * Math.exp(-(dx * dx + dy * dy) / (2 * r * r));
      }
      return v + .1 * Math.sin(x * .006 + y * .004) + .06 * Math.sin(y * .009 - x * .005 + 1.3);
    };
  }

  // marching squares → um <path> por nível
  function desenhaRelevo() {
    var altura = campo(W, H), PASSO = 9, M = 60;
    var X0 = -M, Y0 = -M, cols = Math.ceil((W + 2 * M) / PASSO) + 1, rows = Math.ceil((H + 2 * M) / PASSO) + 1;
    var g = [];
    for (var j = 0; j < rows; j++) { g.push(new Float32Array(cols)); for (var i = 0; i < cols; i++) g[j][i] = altura(X0 + i * PASSO, Y0 + j * PASSO); }
    relevo.innerHTML = '';
    var n = 0;
    for (var nivel = -.35; nivel <= 1.05; nivel += .1, n++) {
      var d = [];
      for (j = 0; j < rows - 1; j++) for (i = 0; i < cols - 1; i++) {
        var a = g[j][i], b = g[j][i + 1], c = g[j + 1][i + 1], e = g[j + 1][i];
        var caso = (a > nivel ? 8 : 0) | (b > nivel ? 4 : 0) | (c > nivel ? 2 : 0) | (e > nivel ? 1 : 0);
        if (caso === 0 || caso === 15) continue;
        var x = X0 + i * PASSO, y = Y0 + j * PASSO;
        var T = [x + PASSO * (nivel - a) / (b - a), y], R = [x + PASSO, y + PASSO * (nivel - b) / (c - b)];
        var B = [x + PASSO * (nivel - e) / (c - e), y + PASSO], L = [x, y + PASSO * (nivel - a) / (e - a)];
        var segs = {1: [[L, B]], 2: [[B, R]], 3: [[L, R]], 4: [[T, R]], 5: [[T, R], [L, B]], 6: [[T, B]], 7: [[T, L]],
                    8: [[T, L]], 9: [[T, B]], 10: [[T, L], [B, R]], 11: [[T, R]], 12: [[L, R]], 13: [[B, R]], 14: [[L, B]]}[caso];
        for (var s = 0; s < segs.length; s++)
          d.push('M' + segs[s][0][0].toFixed(1) + ' ' + segs[s][0][1].toFixed(1) + 'L' + segs[s][1][0].toFixed(1) + ' ' + segs[s][1][1].toFixed(1));
      }
      if (!d.length) continue;
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('class', n % 4 === 1 ? 'fundo-curva forte' : 'fundo-curva');
      p.setAttribute('d', d.join(''));
      relevo.appendChild(p);
    }
  }

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

  // rota nova a cada ciclo: entra por uma borda e sai pela outra, serpenteando
  function novaRota() {
    // alterna entre a faixa de cima e a de baixo, para nunca cruzar o formulário
    var faixa = ciclo % 2 ? [.72, .9] : [.12, .28], lado = (ciclo >> 1) % 2, pts = [], N = 7;
    ciclo++;
    var sorteia = function () { return H * (faixa[0] + Math.random() * (faixa[1] - faixa[0])); };
    var yIni = sorteia(), yFim = sorteia();
    for (var i = 0; i < N; i++) {
      var f = i / (N - 1);
      var x = -40 + f * (W + 80);
      var y = yIni + (yFim - yIni) * f + Math.sin(f * Math.PI * 2 + Math.random()) * H * .05;
      pts.push([lado ? W - x : x, Math.max(H * faixa[0] - 20, Math.min(H * faixa[1] + 20, y))]);
    }
    return suaviza(pts);
  }

  function monta() {
    W = innerWidth; H = innerHeight;
    fundo.innerHTML = '';
    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.innerHTML =
      '<defs><filter id="fundo-suave" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6"/></filter></defs>' +
      '<g class="fundo-relevo"></g>' +
      '<path class="fundo-brilho"/><path class="fundo-rota"/><circle class="fundo-cabeca" r="4"/>';
    fundo.appendChild(svg);
    relevo = svg.querySelector('.fundo-relevo');
    brilho = svg.querySelector('.fundo-brilho');
    rota = svg.querySelector('.fundo-rota');
    cabeca = svg.querySelector('.fundo-cabeca');
    desenhaRelevo();
  }

  var ficha = 0;
  function espera(ms, f) { return new Promise(function (ok, nao) { setTimeout(function () { f === ficha ? ok() : nao(); }, ms); }); }
  var vaivem = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  function tracaRota(f) {
    var d = novaRota();
    rota.setAttribute('d', d); brilho.setAttribute('d', d);
    var len = rota.getTotalLength();
    [rota, brilho].forEach(function (p) { p.style.strokeDasharray = len + ' ' + len; p.style.strokeDashoffset = len; p.style.opacity = ''; });
    cabeca.style.opacity = 0;
    if (REDUZIR) { rota.style.strokeDashoffset = brilho.style.strokeDashoffset = 0; return Promise.resolve(); }
    var DUR = 5200 + len * 1.2;
    return new Promise(function (ok, nao) {
      var t0 = performance.now();
      (function quadro(t) {
        if (f !== ficha) return nao();
        var p = Math.min(1, (t - t0) / DUR), e = vaivem(p), q = rota.getPointAtLength(len * e);
        rota.style.strokeDashoffset = brilho.style.strokeDashoffset = len * (1 - e);
        cabeca.setAttribute('cx', q.x); cabeca.setAttribute('cy', q.y);
        cabeca.style.opacity = Math.min(1, p * 8, (1 - p) * 8);
        p < 1 ? requestAnimationFrame(quadro) : ok();
      })(t0);
    });
  }

  async function laco(f) {
    await espera(900, f);
    for (;;) {
      await tracaRota(f);
      await espera(2200, f);
      [rota, brilho].forEach(function (p) { p.style.opacity = 0; }); // some devagar (transição no CSS)
      await espera(1600, f);
    }
  }

  function inicia() { ficha++; monta(); if (!REDUZIR) laco(ficha).catch(function () {}); else tracaRota(ficha); }

  var rt;
  addEventListener('resize', function () {
    if (Math.abs(innerWidth - W) < 40 && Math.abs(innerHeight - H) < 120) return; // ignora a barra do celular
    clearTimeout(rt); rt = setTimeout(inicia, 250);
  });

  // leve paralaxe com o mouse (só em telas com ponteiro fino)
  if (!REDUZIR && matchMedia('(pointer: fine)').matches) {
    var alvo = [0, 0], atual = [0, 0], rodando = false;
    addEventListener('pointermove', function (e) {
      alvo = [(e.clientX / innerWidth - .5) * -14, (e.clientY / innerHeight - .5) * -10];
      if (!rodando) { rodando = true; requestAnimationFrame(segue); }
    });
    function segue() {
      atual[0] += (alvo[0] - atual[0]) * .06; atual[1] += (alvo[1] - atual[1]) * .06;
      fundo.style.setProperty('--px', atual[0].toFixed(2) + 'px');
      fundo.style.setProperty('--py', atual[1].toFixed(2) + 'px');
      if (Math.abs(alvo[0] - atual[0]) + Math.abs(alvo[1] - atual[1]) > .05) requestAnimationFrame(segue); else rodando = false;
    }
  }

  inicia();
})();
