/* Tema de Black Friday — IPC Comercial (cópia local)
 * - explosão preta e vermelha de "%" quando a bolinha do logo volta do super impulso
 * - etiquetas "% OFF" pretas e amarelas, entrando com balanço
 * - reflexo de luz passando nos botões "Comprar"
 * As animações rodam uma vez por carregamento.
 * Para desligar: ATIVO = false. */
(function () {
  var ATIVO = false;
  // ?tema=... na URL escolhe o tema (para comparar os temas em abas separadas).
  var temaUrl = new URLSearchParams(location.search).get('tema') || location.hash.replace('#', '') || null;
  if (temaUrl) ATIVO = temaUrl === 'blackfriday';

  if (!ATIVO) return;
  document.body.classList.add('ipc-bf');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function box(el) {
    var r = el.getBoundingClientRect();
    return { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, bottom: r.bottom + window.scrollY };
  }

  // Estoura confetes ("%" e fitinhas) a partir de (cx, cy) dentro de `container`
  // (que precisa ter position e overflow: hidden para recortar os pedaços).
  function explodir(container, cx, cy, o) {
    var onda = document.createElement('span');
    onda.className = 'ipc-bf-onda';
    onda.style.left = cx + 'px';
    onda.style.top = cy + 'px';
    onda.style.animationDelay = o.delay + 's';
    container.appendChild(onda);
    var pecas = [onda];

    for (var i = 0; i < o.qtd; i++) {
      var p = document.createElement('span');
      var fita = i % 3 === 2;
      var cor = o.cores[i % o.cores.length];
      p.className = 'ipc-bf-p' + (fita ? ' fita' : '');
      if (fita) p.style.background = cor;
      else { p.textContent = '%'; p.style.color = cor; p.style.fontSize = 10 + Math.round(Math.random() * 6) + 'px'; }
      var ang = (i / o.qtd) * Math.PI * 2 + Math.random() * 0.35;
      var dist = o.dist * (0.55 + Math.random() * 0.6);
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.setProperty('--dx', Math.cos(ang) * dist * o.sx + 'px');
      p.style.setProperty('--dy', Math.sin(ang) * dist * o.sy + 'px');
      p.style.setProperty('--rot', (Math.random() * 360 - 180) + 'deg');
      p.style.setProperty('--d', o.delay + Math.random() * 0.08 + 's');
      container.appendChild(p);
      pecas.push(p);
    }
    setTimeout(function () {
      pecas.forEach(function (p) { p.remove(); });
    }, (o.delay + 1.4) * 1000);
  }

  /* ---------- 1. Explosão de "%" no logo ---------- */
  (function explosao() {
    var ball = document.querySelector('.ipc-logo-ball');
    if (!ball || reduceMotion) return;

    ball.addEventListener('animationend', function (e) {
      if (e.animationName !== 'ipc-ball-escada') return;
      var header = document.querySelector('#header-main');
      var black = document.querySelector('#header-main .header-1');
      if (!header) return;

      // Camada recortada na faixa amarela: os confetes nunca entram no preto.
      var hb = box(header);
      var top = black ? box(black).bottom : hb.top;
      var layer = document.createElement('div');
      layer.className = 'ipc-bf-burst';
      layer.style.left = hb.left + 'px';
      layer.style.top = top + 'px';
      layer.style.width = hb.width + 'px';
      layer.style.height = hb.bottom - top + 'px';

      var b = box(ball);
      document.body.appendChild(layer);
      explodir(layer, b.left + b.width / 2 - hb.left, (b.top + b.bottom) / 2 - top, {
        qtd: 30, dist: 70, sx: 1.8, sy: 0.75, delay: 0, cores: ['#0b0b0d', '#e03131']
      });
      setTimeout(function () { layer.remove(); }, 1600);
    });
  })();

  /* ---------- 2. Etiquetas "% OFF" ---------- */
  // O selo verde perto do preço é injetado pelo script da loja depois do carregamento,
  // então observa a página por alguns segundos e estiliza o que for aparecendo.
  (function etiquetas() {
    var n = 0;
    function marcar() {
      document.querySelectorAll('.label-promo:not(.ipc-bf-lbl)').forEach(function (el) {
        el.classList.add('ipc-bf-lbl');
        el.style.setProperty('--d', (0.8 + (n++ % 4) * 0.15) + 's');
      });
      document.querySelectorAll('.ipc-card-price span:not(.ipc-bf-off)').forEach(function (el) {
        if (el.children.length || !/%\s*OFF/i.test(el.textContent)) return;
        el.classList.add('ipc-bf-off');
        el.style.setProperty('--d', (1 + (n++ % 4) * 0.12) + 's');
      });
    }
    marcar();
    var mo = new MutationObserver(marcar);
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 8000);
  })();

  /* ---------- 3. Reflexo nos botões "Comprar" (em onda, por coluna) ---------- */
  document.querySelectorAll('.btn-buy-kit').forEach(function (btn, i) {
    btn.style.setProperty('--d', (1.4 + (i % 4) * 0.15) + 's');
  });
})();
