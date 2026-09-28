/* Tema de Natal — IPC Comercial (cópia local)
 * - neve caindo no cabeçalho inteiro (parte preta e amarela), atrás do conteúdo
 *   e sem bloquear cliques; pausa quando o cabeçalho sai da tela
 * - o Papai Noel entra voando pelo canto esquerdo da faixa amarela, desacelera
 *   sobre o logo, solta um presente que cai no lugar do pingo do "i", acena e
 *   vai embora pela direita. O presente fica como pingo do "i".
 * O voo roda uma vez por carregamento. Para desligar: ATIVO = false. */
(function () {
  var ATIVO = false;
  // ?tema=... na URL escolhe o tema (para comparar os temas em abas separadas).
  var temaUrl = new URLSearchParams(location.search).get('tema') || location.hash.replace('#', '') || null;
  if (temaUrl) ATIVO = temaUrl === 'natal';
  if (!ATIVO) return;

  var ball = document.querySelector('.ipc-logo-ball');
  var header = document.querySelector('#header-main');
  if (!ball || !header) return;
  document.body.classList.add('ipc-natal');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var black = document.querySelector('#header-main .header-1');

  var PRESENTE_SVG =
    '<svg viewBox="0 0 16 16" aria-hidden="true">' +
      '<path d="M8 4.3C6 .5 2.6 1.6 4.2 3.6c.8.9 2.4.8 3.8.7zM8 4.3c2-3.8 5.4-2.7 3.8-.7-.8.9-2.4.8-3.8.7z" fill="#2b8a3e" stroke="#1b5e2a" stroke-width=".4"/>' +
      '<rect x="1.5" y="6.4" width="13" height="9.6" rx="1" fill="#c92a2a" stroke="#7a1414" stroke-width=".5"/>' +
      '<rect x=".8" y="4.3" width="14.4" height="3.2" rx=".8" fill="#e03131" stroke="#7a1414" stroke-width=".5"/>' +
      '<rect x="7" y="4.3" width="2" height="11.7" fill="#2b8a3e"/>' +
      '<path d="M2.6 8.2v5" stroke="#fff" stroke-opacity=".35" stroke-width=".8" stroke-linecap="round"/>' +
    '</svg>';

  // Rena com o centro do corpo em (0,0), virada para a direita.
  var RENA =
    '<g class="rena-bob">' +
      '<g class="pernas-tras"><path d="M-7 3l-2 9M-4 3l1 9" stroke="#5c3a1a" stroke-width="1.8" stroke-linecap="round"/></g>' +
      '<g class="pernas-frente"><path d="M5 3l3 9M8 2l3 9" stroke="#5c3a1a" stroke-width="1.8" stroke-linecap="round"/></g>' +
      '<path d="M-11-2l-3-2.5" stroke="#8d5a2b" stroke-width="2" stroke-linecap="round"/>' +
      '<ellipse rx="11" ry="5.5" fill="#8d5a2b"/>' +
      '<ellipse cy="2.2" rx="7" ry="2.4" fill="#b07a45"/>' +
      '<path d="M7-2l5-7" stroke="#8d5a2b" stroke-width="4.5" stroke-linecap="round"/>' +
      '<ellipse cx="14.5" cy="-10" rx="4.2" ry="3" fill="#8d5a2b"/>' +
      '<ellipse cx="12" cy="-12.3" rx="1.6" ry=".8" fill="#6b4420"/>' +
      '<circle cx="18.4" cy="-9.4" r="1.1" fill="#15161a"/>' +
      '<circle cx="14.8" cy="-10.8" r=".6" fill="#15161a"/>' +
      '<path d="M12.5-12.5l-2-5.5m.8 2.7l-2.8-1.2M14.5-12.8l1-5.7m-.4 2.5l2.7-1.2" stroke="#5c3a1a" stroke-width="1.1" stroke-linecap="round" fill="none"/>' +
      '<path d="M6.5-3.5q4 3 8.5-3" stroke="#c92a2a" stroke-width="1.3" fill="none"/>' +
    '</g>';

  var TRENO_SVG =
    '<svg viewBox="0 0 150 48" aria-hidden="true">' +
      // rédeas e tirante com sininhos
      '<path d="M49 16.5Q66 22 80 21.5L118 18.5" stroke="#3b2a1a" stroke-width=".9" fill="none"/>' +
      '<path d="M56 29L77 28.5L114 26.5" stroke="#3b2a1a" stroke-width="1.2" fill="none"/>' +
      '<g class="rena" transform="translate(88 27)">' + RENA + '</g>' +
      '<g class="rena rena-2" transform="translate(126 25)">' + RENA + '</g>' +
      '<g class="sino"><circle cx="66" cy="30.2" r="1.6" fill="#f08c00" stroke="#a35f00" stroke-width=".5"/></g>' +
      '<g class="sino sino-2"><circle cx="103" cy="28.6" r="1.6" fill="#f08c00" stroke="#a35f00" stroke-width=".5"/></g>' +
      // saco de presentes (com um presentinho aparecendo)
      '<g class="saco">' +
        '<rect x="9" y="3.5" width="6" height="5" rx=".6" fill="#2b8a3e" transform="rotate(-12 12 6)"/>' +
        '<path d="M6 21Q3 9 13 6q10 3 7 15z" fill="#8d5a2b" stroke="#5c3a1a" stroke-width=".8"/>' +
        '<path d="M10 8l3-2.2 3 2.2" stroke="#5c3a1a" stroke-width=".9" fill="none"/>' +
      '</g>' +
      // Papai Noel
      '<ellipse cx="33" cy="19" rx="9" ry="7" fill="#c92a2a"/>' +
      '<g class="braco-aceno">' +
        '<path d="M29.5 15.5l-4.5-8" stroke="#c92a2a" stroke-width="3.2" stroke-linecap="round"/>' +
        '<circle cx="24.6" cy="6.6" r="1.8" fill="#15161a"/>' +
      '</g>' +
      '<circle cx="36" cy="10" r="3.6" fill="#f5c9a5"/>' +
      '<circle cx="38.4" cy="11" r="1" fill="#f08c8c" fill-opacity=".8"/>' +
      '<path d="M32.5 10.5Q36 20 40.5 10.5q-2.5 2-4 2t-4-2z" fill="#fff"/>' +
      '<path d="M35.3 11.6q1.6-1 3.6 0q-1.8 1.1-3.6 0z" fill="#f1f3f5"/>' +
      '<path d="M32 8.5q2-7 9-5l-.8 4.5z" fill="#c92a2a"/>' +
      '<rect x="31.6" y="7.3" width="9.2" height="2.2" rx="1.1" fill="#fff"/>' +
      '<circle cx="41.6" cy="3.6" r="1.7" fill="#fff"/>' +
      '<circle cx="37.3" cy="9.6" r=".6" fill="#15161a"/>' +
      '<path d="M38 17l10-.5" stroke="#c92a2a" stroke-width="3.2" stroke-linecap="round"/>' +
      '<circle cx="49" cy="16.5" r="1.8" fill="#15161a"/>' +
      // trenó
      '<path d="M3 12q6-2 8 5l1 4h35q10 0 10 8t-10 8H11q-8 0-8-8z" fill="#c92a2a" stroke="#7a1414"/>' +
      '<path d="M6 25.5h46" stroke="#ffd43b" stroke-width="1.6"/>' +
      '<path d="M16 31.5q3-3.5 6 0t6 0 6 0 6 0" stroke="#ffd43b" stroke-width="1" fill="none"/>' +
      '<path d="M10 37v5M44 37v5" stroke="#3b2a1a" stroke-width="1.6"/>' +
      '<path d="M2 42h50q8 0 8-7q0-3-3-3" stroke="#3b2a1a" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
    '</svg>';

  function box(el) {
    var r = el.getBoundingClientRect();
    return { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height, bottom: r.bottom + window.scrollY };
  }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function smooth(v) { return v * v * (3 - 2 * v); }

  // O presente fica no lugar da bolinha, dentro do link do logo.
  var presente = document.createElement('span');
  presente.className = 'ipc-natal-presente';
  presente.setAttribute('aria-hidden', 'true');
  presente.innerHTML = PRESENTE_SVG;
  ball.parentNode.appendChild(presente);

  /* ================= Bonequinho de login: se veste de Papai Noel ================= */
  // O bonequinho começa preto (o original). Quando o trenó passa, o Papai Noel joga
  // a roupa e ele se veste: casaco, cinto, rosto com barba e, por último, o gorro.
  // O ícone é uma máscara (icon-user.svg, 23x26) em 30x30 com "contain"; a roupa usa
  // o mesmo viewBox, então cobre a silhueta certinho.
  var roupaNoel = (function () {
    var icone = document.querySelector('.user-info .icon-user');
    if (!icone) return null;
    var CORPO = 'M15.925 14.625H15.077C13.9496 15.143 12.6953 15.4375 11.375 15.4375C10.0547 15.4375 8.80547 15.143 7.67305 14.625H6.825C3.05703 14.625 0 17.682 0 21.45V23.5625C0 24.9082 1.0918 26 2.4375 26H20.3125C21.6582 26 22.75 24.9082 22.75 23.5625V21.45C22.75 17.682 19.693 14.625 15.925 14.625Z';
    var svg =
      '<svg class="ipc-natal-user" viewBox="0 0 23 26" aria-hidden="true">' +
        '<defs><clipPath id="ipc-natal-corpo"><path d="' + CORPO + '"/></clipPath></defs>' +
        // casaco vermelho com barra de pelúcia, faixa do meio e cinto
        '<g class="roupa-casaco">' +
          '<path d="' + CORPO + '" fill="#c92a2a"/>' +
          '<g clip-path="url(#ipc-natal-corpo)">' +
            '<rect x="10.1" y="14" width="2.55" height="9" fill="#fff"/>' +
            '<rect x="0" y="19.3" width="22.75" height="2.3" fill="#15161a"/>' +
            '<rect x="0" y="22.7" width="22.75" height="3.3" fill="#fff"/>' +
          '</g>' +
          '<path d="' + CORPO + '" fill="none" stroke="#7a1414" stroke-width=".45"/>' +
        '</g>' +
        '<rect class="fivela" x="9.5" y="18.9" width="3.75" height="3.1" rx=".5" fill="none" stroke="#f2b705" stroke-width=".9"/>' +
        // rosto com barba descendo até o peito, bigode e nariz
        '<g class="roupa-rosto">' +
          '<circle cx="11.375" cy="6.5" r="6.5" fill="#f5c9a5" stroke="#b07a55" stroke-width=".35"/>' +
          '<circle cx="7.9" cy="7.4" r="1" fill="#f08c8c" fill-opacity=".65"/>' +
          '<circle cx="14.85" cy="7.4" r="1" fill="#f08c8c" fill-opacity=".65"/>' +
          '<circle cx="9.1" cy="5.8" r=".62" fill="#15161a"/>' +
          '<circle cx="13.65" cy="5.8" r=".62" fill="#15161a"/>' +
          '<path d="M4.9 6.9Q5.1 15.9 11.375 16.9 17.65 15.9 17.85 6.9 16.3 9.7 14.3 9.3 11.375 11.3 8.45 9.3 6.45 9.7 4.9 6.9z" fill="#fff" stroke="#ced4da" stroke-width=".35"/>' +
          '<path d="M8.1 9.5q1.7-1.3 3.275-.15Q12.95 8.2 14.65 9.5 12.9 10.6 11.375 10 9.85 10.6 8.1 9.5z" fill="#f1f3f5" stroke="#ced4da" stroke-width=".3"/>' +
          '<circle cx="11.375" cy="8.1" r=".95" fill="#e8a07a"/>' +
        '</g>' +
        // gorro com pompom
        '<g class="gorro">' +
          '<path d="M5 3.4Q6.4-4.8 13.4-5.3 19.4-5.2 21-.6 18.6-2.4 16.8-1.2L17.8 3.4z" fill="#c92a2a" stroke="#7a1414" stroke-width=".4"/>' +
          '<g class="pompom"><circle cx="21.2" cy="-.2" r="1.9" fill="#fff" stroke="#ced4da" stroke-width=".35"/></g>' +
          '<rect x="4.1" y="2.2" width="14.6" height="2.7" rx="1.35" fill="#fff" stroke="#ced4da" stroke-width=".35"/>' +
        '</g>' +
      '</svg>';
    icone.insertAdjacentHTML('afterend', svg);
    var boneco = icone.nextElementSibling;

    // Mesma caixa do ícone original (muda nos pontos de quebra do layout).
    function alinhar() {
      boneco.style.left = icone.offsetLeft + 'px';
      boneco.style.top = icone.offsetTop + 'px';
      boneco.style.width = icone.offsetWidth + 'px';
      boneco.style.height = icone.offsetHeight + 'px';
    }
    alinhar();
    window.addEventListener('resize', alinhar);

    function parte(sel) { return boneco.querySelector(sel); }

    // Com "reduzir movimento" (ou se o trenó não passar pelo ícone) já aparece vestido.
    return {
      icone: icone,
      // Veste o bonequinho começando em `t` segundos a partir de agora.
      vestir: function (t) {
        var ms = function (s) { return (t + s) * 1000; };
        var opc = { fill: 'both', easing: 'ease-out' };
        parte('.roupa-casaco').animate([
          { opacity: 0, transform: 'scaleY(0)' },
          { opacity: 1, transform: 'scaleY(1.08)', offset: 0.7 },
          { opacity: 1, transform: 'scaleY(1)' }
        ], Object.assign({ duration: 500, delay: ms(0.05) }, opc));
        parte('.fivela').animate([
          { opacity: 0, transform: 'scale(0)' },
          { opacity: 1, transform: 'scale(1.5)', offset: 0.6 },
          { opacity: 1, transform: 'scale(1)' }
        ], Object.assign({ duration: 300, delay: ms(0.5) }, opc));
        parte('.roupa-rosto').animate([
          { opacity: 0, transform: 'scale(.5)' },
          { opacity: 1, transform: 'scale(1.1)', offset: 0.65 },
          { opacity: 1, transform: 'scale(1)' }
        ], Object.assign({ duration: 450, delay: ms(0.6) }, opc));
        parte('.gorro').animate([
          { opacity: 0, transform: 'translateY(-9px) rotate(-14deg)' },
          { opacity: 1, offset: 0.35 },
          { opacity: 1, transform: 'translateY(0) rotate(0)' }
        ], { duration: 750, delay: ms(1.0), fill: 'both', easing: 'cubic-bezier(.34,1.56,.64,1)' });
        parte('.pompom').animate([
          { transform: 'rotate(0)' }, { transform: 'rotate(22deg)' }, { transform: 'rotate(-14deg)' },
          { transform: 'rotate(7deg)' }, { transform: 'rotate(0)' }
        ], { duration: 1400, delay: ms(1.6), fill: 'both', easing: 'ease-in-out' });
        // pulinho de alegria, com o ícone preto por baixo junto
        [boneco, icone].forEach(function (el) {
          el.animate([
            { transform: 'translateY(0)' }, { transform: 'translateY(-4px)', offset: 0.4 },
            { transform: 'translateY(0)', offset: 0.75 }, { transform: 'translateY(-1.5px)', offset: 0.88 },
            { transform: 'translateY(0)' }
          ], { duration: 550, delay: ms(1.75), easing: 'ease-in-out' });
        });
      }
    };
  })();

  if (reduceMotion) return;

  // A roupa fica escondida até o Papai Noel jogar (as animações começam invisíveis).
  if (roupaNoel) {
    document.querySelectorAll('.ipc-natal-user .roupa-casaco, .ipc-natal-user .fivela, .ipc-natal-user .roupa-rosto, .ipc-natal-user .gorro')
      .forEach(function (el) { el.style.opacity = '0'; });
    // PRÉVIA: por enquanto se veste sozinho; depois quem dispara é a roupa jogada do trenó.
    roupaNoel.vestir(3.5);
  }

  /* ================= Neve no cabeçalho ================= */
  (function neve() {
    // O fundo preto da barra de cima passa a ser pintado pelo próprio cabeçalho
    // (degradê duro preto/amarelo), assim a neve fica entre o fundo e o conteúdo.
    var corPreta = black ? getComputedStyle(black).backgroundColor : '#15161a';
    var corAmarela = getComputedStyle(header).backgroundColor;
    header.style.setProperty('--ipc-preto', corPreta);
    header.style.setProperty('--ipc-amarelo', corAmarela);
    header.classList.add('ipc-natal-hdr');
    if (black) black.classList.add('ipc-natal-transp');

    var canvas = document.createElement('canvas');
    canvas.className = 'ipc-natal-neve';
    canvas.setAttribute('aria-hidden', 'true');
    header.insertBefore(canvas, header.firstChild);
    var ctx = canvas.getContext('2d');

    var W = 0, H = 0, flocos = [];
    function novoFloco(topo) {
      var r = 0.8 + Math.pow(Math.random(), 2) * 2.2;   // poucos flocos grandes
      return {
        base: Math.random() * W,
        y: topo ? -5 : Math.random() * H,
        r: r,
        vy: 12 + r * 11 + Math.random() * 6,          // os maiores caem mais rápido
        amp: 6 + Math.random() * 16,
        freq: 0.4 + Math.random() * 0.8,
        fase: Math.random() * Math.PI * 2,
        a: 0.7 + Math.random() * 0.3
      };
    }
    function medir() {
      var r = header.getBoundingClientRect();
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      header.style.setProperty('--ipc-h1', (black ? black.offsetHeight : 0) + 'px');
      var qtd = Math.max(30, Math.min(160, Math.round(W * H / 1800)));
      while (flocos.length < qtd) flocos.push(novoFloco(false));
      flocos.length = qtd;
    }
    medir();
    if (window.ResizeObserver) new ResizeObserver(medir).observe(header);

    var visivel = true, rodando = false, antes = 0, relogio = 0;
    function quadro(agora) {
      if (!visivel) { rodando = false; return; }
      var dt = Math.min(0.05, (agora - antes) / 1000 || 0);
      antes = agora;
      relogio += dt;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < flocos.length; i++) {
        var f = flocos[i];
        f.y += f.vy * dt;
        f.base += 5 * dt;                            // ventinho leve para a direita
        if (f.y > H + 5) { flocos[i] = f = novoFloco(true); }
        var x = f.base + Math.sin(f.fase + relogio * f.freq) * f.amp;
        if (x > W + 20) f.base -= W + 40;
        // sombrinha para o floco aparecer também no amarelo
        ctx.globalAlpha = f.a * 0.18;
        ctx.fillStyle = '#6b5200';
        ctx.beginPath(); ctx.arc(x + 0.5, f.y + 0.7, f.r, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = f.a;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x, f.y, f.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(quadro);
    }
    function ligar() {
      if (rodando) return;
      rodando = true;
      antes = performance.now();
      requestAnimationFrame(quadro);
    }
    // Só anima enquanto o cabeçalho está na tela.
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (e) {
        visivel = e[0].isIntersecting;
        if (visivel) ligar();
      }).observe(header);
    }
    ligar();
  })();

  /* ================= Voo do Papai Noel ================= */
  function faixa() {
    var hb = box(header);
    var top = black ? box(black).bottom : hb.top;
    return { left: hb.left, top: top, width: hb.width, height: hb.bottom - top };
  }

  var ceu = document.createElement('div');
  ceu.className = 'ipc-natal-ceu';
  var treno = document.createElement('div');
  treno.className = 'ipc-natal-treno';
  treno.innerHTML = TRENO_SVG;
  ceu.appendChild(treno);
  document.body.appendChild(ceu);

  // O cabeçalho ainda muda de posição enquanto a página carrega.
  function place() {
    var f = faixa();
    ceu.style.left = f.left + 'px';
    ceu.style.top = f.top + 'px';
    ceu.style.width = f.width + 'px';
    ceu.style.height = f.height + 'px';
  }
  place();
  var ro = window.ResizeObserver ? new ResizeObserver(place) : null;
  if (ro) ro.observe(document.body);

  /* ---------- Geometria (coordenadas da faixa amarela) ---------- */
  var f = faixa();
  var W = f.width, H = f.height;
  var k = Math.min(1, H / 95);               // escala do trenó para faixas mais baixas
  var sw = 150 * k, sh = 48 * k;
  treno.style.width = sw + 'px';

  var pb = box(presente);
  var ps = pb.width;
  var alvoX = pb.left - f.left + ps / 2;     // centro do pingo do "i"
  var alvoY = pb.top - f.top + ps / 2;

  var SACO = [13, 12];                       // de onde sai o presente (coordenadas do SVG)
  var ARRASTO = 40;                          // quanto o presente ainda anda para a direita depois de solto
  var x0 = -sw - 10, x1 = W + 30;
  var Y0 = H - sh - 1;                       // entra pelo canto de baixo à esquerda
  var Ymin = 3;
  var xTopo = alvoX + 170;                   // já no alto logo depois de passar o logo
  var xSolta = alvoX - ARRASTO - SACO[0] * k;

  function Ybase(X) {
    var sobe = smooth(clamp01((X - x0) / (xTopo - x0)));
    return Y0 + (Ymin + 3 - Y0) * sobe + 3 * Math.sin(X / 55) * sobe;
  }
  // Velocidade: rápido na entrada, desacelera para soltar o presente, acelera para ir embora.
  function vel(X) {
    return 340 * (1 - 0.55 * Math.exp(-Math.pow((X - xSolta) / 110, 2)));
  }
  var Xs = [x0], Ts = [0];
  for (var X = x0; X < x1; X += 2) {
    Ts.push(Ts[Ts.length - 1] + 2 / vel(X + 1));
    Xs.push(X + 2);
  }
  var DUR = Ts[Ts.length - 1];

  function Xem(t) {
    var lo = 0, hi = Ts.length - 1;
    if (t <= 0) return Xs[0];
    if (t >= DUR) return Xs[hi];
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (Ts[m] <= t) lo = m; else hi = m; }
    return Xs[lo] + (Xs[hi] - Xs[lo]) * (t - Ts[lo]) / (Ts[hi] - Ts[lo]);
  }
  // Posição do trenó no tempo t: segue a curva, balança de leve e fica inteiro
  // (já girado) dentro da faixa amarela. Rotação em torno do canto de cima à esquerda.
  function pose(t) {
    var X = Xem(t);
    var ang = Math.atan2(Ybase(X + 2) - Ybase(X - 2), 4) * 180 / Math.PI;
    ang = Math.max(-10, Math.min(10, ang));
    var a = ang * Math.PI / 180;
    var Y = Ybase(X) + 1.4 * Math.sin(t * Math.PI * 2 / 0.55);
    var ys = [0, sw * Math.sin(a), sh * Math.cos(a), sw * Math.sin(a) + sh * Math.cos(a)];
    Y = Math.min(Math.max(Y, 2 - Math.min.apply(null, ys)), H - 1 - Math.max.apply(null, ys));
    return { X: X, Y: Y, ang: ang };
  }
  function pontoDoTreno(t, lx, ly) {
    var p = pose(t), a = p.ang * Math.PI / 180;
    lx *= k; ly *= k;
    return { x: p.X + Math.cos(a) * lx - Math.sin(a) * ly, y: p.Y + Math.sin(a) * lx + Math.cos(a) * ly };
  }

  var ATRASO = 0.8;                          // s depois de carregar

  var frames = [], passos = Math.ceil(DUR * 30);
  for (var i = 0; i <= passos; i++) {
    var p = pose(DUR * i / passos);
    frames.push({ offset: i / passos, transform: 'translate(' + p.X.toFixed(1) + 'px,' + p.Y.toFixed(1) + 'px) rotate(' + p.ang.toFixed(2) + 'deg)' });
  }
  var voo = treno.animate(frames, { duration: DUR * 1000, delay: ATRASO * 1000, fill: 'both', easing: 'linear' });

  /* ---------- O presente sai do saco e cai no pingo do "i" ---------- */
  var QUEDA = 0.85;         // s no ar
  var ASSENTA = 0.75;       // s do pouso (amassa, quica, balança)
  var tSolta = 0;
  for (var s = 0; s <= DUR; s += 1 / 240) {
    if (pontoDoTreno(s, SACO[0], SACO[1]).x >= alvoX - ARRASTO) { tSolta = s; break; }
  }
  var saco = pontoDoTreno(tSolta, SACO[0], SACO[1]);

  // Parábola de (saco) até (alvo) com ápice um pouco acima dos dois,
  // sem passar do topo da faixa amarela.
  var yA = Math.max(2 + ps / 2, Math.min(saco.y, alvoY) - 9);
  if (yA >= Math.min(saco.y, alvoY)) yA = Math.min(saco.y, alvoY) - 0.5;
  var d0 = saco.y - yA, b = -2 * d0 - 2 * Math.sqrt(d0 * (alvoY - yA)), a = (alvoY - saco.y) - b;

  var pf = [];
  var fimQueda = QUEDA / (QUEDA + ASSENTA);
  for (var j = 0; j <= 30; j++) {
    var t = j / 30;
    var px = saco.x + (alvoX - saco.x) * t - alvoX;
    var py = a * t * t + b * t + saco.y - alvoY;
    var giro = -35 * Math.pow(1 - t, 1.5);
    var esc = t < 0.18 ? 0.45 + 0.55 * smooth(t / 0.18) : 1;
    pf.push({
      offset: t * fimQueda,
      opacity: t < 0.08 ? t / 0.08 : 1,
      transform: 'translate(' + px.toFixed(2) + 'px,' + py.toFixed(2) + 'px) rotate(' + giro.toFixed(1) + 'deg) scale(' + esc.toFixed(3) + ')'
    });
  }
  var q = 1 - fimQueda;
  [
    [0.16, 'translate(0,0) rotate(0) scale(1.32,.68)'],
    [0.42, 'translate(0,' + (-ps * 0.38).toFixed(2) + 'px) rotate(-4deg) scale(.94,1.07)'],
    [0.6, 'translate(0,0) rotate(0) scale(1.1,.9)'],
    [0.74, 'translate(0,0) rotate(7deg) scale(1)'],
    [0.87, 'translate(0,0) rotate(-4deg) scale(1)'],
    [1, 'translate(0,0) rotate(0) scale(1)']
  ].forEach(function (k2) {
    pf.push({ offset: fimQueda + q * k2[0], opacity: 1, transform: k2[1] });
  });
  presente.animate(pf, { duration: (QUEDA + ASSENTA) * 1000, delay: (ATRASO + tSolta) * 1000, fill: 'both', easing: 'linear' });

  // Ao soltar: o saco chacoalha e o Papai Noel acena.
  setTimeout(function () { treno.classList.add('soltou'); }, (ATRASO + tSolta) * 1000);

  /* ---------- Brilhos: rastro do trenó e estrelinhas no pouso ---------- */
  var SIMBOLOS = ['✦', '✧', '•'];
  function brilho(x, y, dx, dy, tam) {
    var el = document.createElement('span');
    el.className = 'ipc-natal-brilho';
    el.textContent = SIMBOLOS[Math.floor(Math.random() * SIMBOLOS.length)];
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.fontSize = tam + 'px';
    el.style.setProperty('--dx', dx + 'px');
    el.style.setProperty('--dy', dy + 'px');
    ceu.appendChild(el);
    setTimeout(function () { el.remove(); }, 1000);
  }

  var ultimo = -1;
  function rastro() {
    var tempo = (voo.currentTime || 0) / 1000 - ATRASO;
    if (tempo > DUR || voo.playState === 'finished') return;
    if (tempo >= 0 && tempo - ultimo > 0.045) {
      ultimo = tempo;
      var r = pontoDoTreno(tempo, 1, 36 + Math.random() * 6);
      brilho(r.x, r.y, -12 - Math.random() * 18, 3 + Math.random() * 12, 6 + Math.random() * 6);
    }
    requestAnimationFrame(rastro);
  }
  requestAnimationFrame(rastro);

  setTimeout(function () {
    for (var n = 0; n < 9; n++) {
      var ang = (n / 9) * Math.PI * 2 + Math.random() * 0.3;
      brilho(alvoX, alvoY, Math.cos(ang) * (14 + Math.random() * 6), Math.sin(ang) * (8 + Math.random() * 4), 7 + Math.random() * 4);
    }
  }, (ATRASO + tSolta + QUEDA) * 1000);

  setTimeout(function () {
    if (ro) ro.disconnect();
    ceu.remove();
  }, (ATRASO + DUR + 1.2) * 1000);
})();
