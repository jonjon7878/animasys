/* Tema de Páscoa — IPC Comercial (cópia local)
 * Um coelho azul, branco e rosa entra pulando pela esquerda, sobe os 3 pauzinhos
 * do logo (barra baixa, barra do meio e a haste do "i"), bota um ovo no lugar do
 * pingo do "i" e volta pulando para a esquerda. O ovo fica como pingo do "i".
 * Roda uma vez por carregamento. Para desligar: ATIVO = false. */
(function () {
  var ATIVO = true;
  // ?tema=... na URL escolhe o tema (para comparar os temas em abas separadas).
  var temaUrl = new URLSearchParams(location.search).get('tema') || location.hash.replace('#', '') || null;
  if (temaUrl) ATIVO = temaUrl === 'pascoa';
  if (!ATIVO) return;

  var ball = document.querySelector('.ipc-logo-ball');
  var header = document.querySelector('#header-main');
  var logo = document.querySelector('.logo img');
  if (!ball || !header || !logo) return;
  var ancora = ball.parentNode;               // o link do logo (position: relative)
  document.body.classList.add('ipc-pascoa');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var OVO_SVG =
    '<svg viewBox="0 0 16 16" aria-hidden="true">' +
      '<defs><clipPath id="ipc-ovo-clip"><ellipse cx="8" cy="9" rx="6" ry="7"/></clipPath></defs>' +
      '<ellipse cx="8" cy="9" rx="6" ry="7" fill="#f783ac"/>' +
      '<g clip-path="url(#ipc-ovo-clip)">' +
        '<path d="M1.5 8.4l1.7-1.5 1.7 1.5 1.7-1.5 1.7 1.5 1.7-1.5 1.7 1.5 1.7-1.5 1.7 1.5" stroke="#fff" stroke-width="1.1" fill="none" stroke-linejoin="round"/>' +
        '<rect x="0" y="10.6" width="16" height="1.8" fill="#74c0fc"/>' +
        '<circle cx="5" cy="13.7" r=".75" fill="#fff"/><circle cx="8" cy="14.4" r=".75" fill="#fff"/><circle cx="11" cy="13.7" r=".75" fill="#fff"/>' +
      '</g>' +
      '<ellipse cx="5.4" cy="5.4" rx="1.1" ry="1.9" fill="#fff" fill-opacity=".55" transform="rotate(20 5.4 5.4)"/>' +
      '<ellipse cx="8" cy="9" rx="6" ry="7" fill="none" stroke="#c2255c" stroke-width=".5"/>' +
    '</svg>';

  // Coelho de perfil virado para a direita; os pés tocam o chão em y = 46.
  var AZUL = '#5aa9e6', AZUL_ESCURO = '#4a97d4', CONTORNO = '#2f6fa8', ROSA = '#f783ac';
  var COELHO_SVG =
    '<svg viewBox="0 0 46 46" aria-hidden="true">' +
      '<g class="orelha orelha-2">' +
        '<ellipse cx="23" cy="11" rx="3" ry="9" fill="' + AZUL_ESCURO + '" stroke="' + CONTORNO + '" stroke-width=".7" transform="rotate(-16 23 18)"/>' +
        '<ellipse cx="23" cy="11.5" rx="1.4" ry="6.3" fill="' + ROSA + '" transform="rotate(-16 23 18)"/>' +
      '</g>' +
      '<circle class="rabo" cx="7" cy="36" r="4.5" fill="#fff" stroke="#cfd8e3" stroke-width=".6"/>' +
      '<ellipse cx="17" cy="35" rx="11" ry="9" fill="' + AZUL + '" stroke="' + CONTORNO + '" stroke-width=".8"/>' +
      '<ellipse cx="12" cy="40" rx="6" ry="5" fill="' + AZUL_ESCURO + '" stroke="' + CONTORNO + '" stroke-width=".7"/>' +
      '<ellipse cx="22" cy="37" rx="6" ry="6" fill="#fff"/>' +
      '<ellipse cx="15" cy="44.2" rx="6.5" ry="1.8" fill="#fff" stroke="#cfd8e3" stroke-width=".6"/>' +
      '<ellipse cx="26" cy="44.3" rx="3" ry="1.6" fill="#fff" stroke="#cfd8e3" stroke-width=".6"/>' +
      '<circle cx="28" cy="23" r="8" fill="' + AZUL + '" stroke="' + CONTORNO + '" stroke-width=".8"/>' +
      '<g class="orelha">' +
        '<ellipse cx="29" cy="9" rx="3.2" ry="9.5" fill="' + AZUL + '" stroke="' + CONTORNO + '" stroke-width=".7" transform="rotate(10 29 17)"/>' +
        '<ellipse cx="29" cy="9.6" rx="1.6" ry="7" fill="' + ROSA + '" transform="rotate(10 29 17)"/>' +
      '</g>' +
      '<ellipse cx="33.5" cy="26" rx="3.6" ry="2.8" fill="#fff"/>' +
      '<circle cx="29.4" cy="26.2" r="1.4" fill="' + ROSA + '" fill-opacity=".7"/>' +
      '<circle cx="31" cy="21" r="1.4" fill="#1c1f26"/>' +
      '<circle cx="31.5" cy="20.5" r=".45" fill="#fff"/>' +
      '<ellipse cx="36.4" cy="24.8" rx="1.3" ry="1" fill="#e64980"/>' +
      '<path d="M35.6 27.1q-.8.9-1.8.4" stroke="#1c1f26" stroke-width=".5" fill="none" stroke-linecap="round"/>' +
      // cesta de vime com 3 ovos (o rosa é o que vai para o pingo do "i")
      '<g class="cesta">' +
        '<ellipse cx="34" cy="32.4" rx="2" ry="2.6" fill="#74c0fc" stroke="#1971c2" stroke-width=".4"/>' +
        '<ellipse class="ovo-cesta" cx="37.6" cy="31.6" rx="2.1" ry="2.8" fill="#f783ac" stroke="#c2255c" stroke-width=".4"/>' +
        '<ellipse cx="41.2" cy="32.4" rx="2" ry="2.6" fill="#b197fc" stroke="#7048e8" stroke-width=".4"/>' +
        '<path d="M31.8 33.6Q37.5 27.2 43.2 33.6" stroke="#8a5a2b" stroke-width="1.1" fill="none"/>' +
        '<path d="M31 34.6h13l-1.6 7.6q-4.9 1.4-9.8 0z" fill="#c68642" stroke="#8a5a2b" stroke-width=".6"/>' +
        '<path d="M31.6 37.2h11.8M32.2 39.8h10.6M35 34.8l.4 7.8M38.5 34.8l-.2 8M41.5 34.8l-.6 7.6" stroke="#8a5a2b" stroke-width=".45" stroke-opacity=".7"/>' +
        '<rect x="30.4" y="33.2" width="14.2" height="2" rx="1" fill="#a86b33" stroke="#8a5a2b" stroke-width=".5"/>' +
      '</g>' +
      // braço segurando a alça da cesta
      '<path d="M23.5 32.5q4 3.2 8.2 1.4" stroke="' + AZUL + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<circle cx="31.8" cy="33.8" r="1.5" fill="#fff" stroke="#cfd8e3" stroke-width=".5"/>' +
    '</svg>';

  // O ovo fica no lugar da bolinha, dentro do link do logo.
  var ovo = document.createElement('span');
  ovo.className = 'ipc-pascoa-ovo';
  ovo.setAttribute('aria-hidden', 'true');
  ovo.innerHTML = OVO_SVG;
  ancora.appendChild(ovo);

  if (reduceMotion) return;
  ovo.style.opacity = '0';

  /* ---------- Geometria em pixels do PNG do logo (205x90) ---------- */
  // Chão = base do logo (y 88). Topos: barra baixa y 66 (x 17–30),
  // barra do meio y 43 (x 34–47), haste do "i" y 24 (x 51–64).
  var CHAO = 88, BARRA1 = [23.5, 66], BARRA2 = [40.5, 43], HASTE = [57.5, 24];

  var lr = logo.getBoundingClientRect();
  var s = lr.width / 205;                     // px de tela por px do PNG
  var black = document.querySelector('#header-main .header-1');
  var topoFaixa = black ? black.getBoundingClientRect().bottom : header.getBoundingClientRect().top;
  // O ponto mais alto permitido (em px do PNG, relativo ao topo do logo): 2 px abaixo do preto.
  var topoPermitido = (topoFaixa + 2 - lr.top) / s;

  var ESTICA = 1.12;                          // o coelho estica no ar
  // Altura do coelho: até 28 px do PNG, menor se não couber em pé sobre a haste.
  var alt = Math.min(28, (HASTE[1] - topoPermitido - 1) / ESTICA);
  var larg = alt;                             // SVG quadrado (46x46) por causa da cesta
  // Os pés ficam em x 20,5 de 46 (a cesta deixa o desenho mais largo na frente).
  var PES = 20.5 / 46;
  var xEntrada = -(lr.left - header.getBoundingClientRect().left) / s - larg;

  var coelho = document.createElement('span');
  coelho.className = 'ipc-pascoa-coelho';
  coelho.setAttribute('aria-hidden', 'true');
  coelho.style.width = larg * s + 'px';
  coelho.style.height = alt * s + 'px';
  coelho.innerHTML = '<span class="ipc-pascoa-coelho-corpo" style="display:block">' + COELHO_SVG + '</span>';
  var corpo = coelho.firstChild;
  ancora.appendChild(coelho);

  /* ---------- Roteiro: pulos, pausa para botar o ovo e volta ---------- */
  // Tempos em segundos (versão mais calma: pulos longos e pausas em cada degrau).
  var roteiro = [
    { pulo: [[xEntrada, CHAO], [-45, CHAO]], dur: 0.7, altura: 9 },
    { espera: 0.12 },
    { pulo: [[-45, CHAO], [4, CHAO]], dur: 0.7, altura: 9 },
    { espera: 0.3 },
    { pulo: [[4, CHAO], BARRA1], dur: 0.65, altura: 8 },
    { espera: 0.35 },
    { pulo: [BARRA1, BARRA2], dur: 0.65, altura: 8 },
    { espera: 0.35 },
    { pulo: [BARRA2, HASTE], dur: 0.65, altura: 8 },
    { bota: 1.4 },
    { espera: 0.2 },
    { vira: true },
    { espera: 0.15 },
    { pulo: [HASTE, [-8, CHAO]], dur: 0.9, altura: 7, soltaOvo: true },
    { espera: 0.2 },
    { pulo: [[-8, CHAO], [-50, CHAO]], dur: 0.7, altura: 9 },
    { espera: 0.12 },
    { pulo: [[-50, CHAO], [xEntrada, CHAO]], dur: 0.7, altura: 9 }
  ];

  var ATRASO = 0.6;
  var FPS = 60;
  var pos = [], pose = [];
  var t = 0, dir = 1, tSoltaOvo = 0, tBota = 0;
  var ultimo = [xEntrada, CHAO];

  function empurra(x, y, sx, sy) {
    pos.push({ x: x, y: y });
    pose.push({ sx: sx * dir, sy: sy });
  }

  roteiro.forEach(function (p) {
    var n, i;
    if (p.espera) {
      n = Math.round(p.espera * FPS);
      for (i = 0; i < n; i++) empurra(ultimo[0], ultimo[1], 1, 1);
    } else if (p.bota) {
      // agacha, treme um pouquinho e mexe o rabo
      tBota = pos.length / FPS;
      n = Math.round(p.bota * FPS);
      for (i = 0; i < n; i++) {
        var u = i / n;
        var agacha = Math.sin(Math.PI * Math.min(1, u * 1.25)) * 0.14;
        var treme = Math.sin(u * 60) * 0.25 * (u > 0.2 && u < 0.8 ? 1 : 0);
        empurra(ultimo[0] + treme, ultimo[1], 1 + agacha * 0.7, 1 - agacha);
      }
    } else if (p.vira) {
      dir = -dir;
    } else if (p.pulo) {
      var a = p.pulo[0], b = p.pulo[1];
      if (p.soltaOvo) tSoltaOvo = pos.length / FPS;
      // ápice: um pouco acima do ponto mais alto, sem passar da faixa amarela
      var apice = Math.min(a[1], b[1]) - p.altura;
      apice = Math.max(apice, topoPermitido + alt * ESTICA);
      apice = Math.min(apice, Math.min(a[1], b[1]));
      var d0 = a[1] - apice, d1 = b[1] - apice;
      var bb = -2 * d0 - 2 * Math.sqrt(Math.max(0, d0 * d1)), aa = (b[1] - a[1]) - bb;
      var nPrep = Math.round(0.1 * FPS), nPouso = Math.round(0.14 * FPS);
      var nVoo = Math.max(6, Math.round(p.dur * FPS) - nPrep - nPouso);
      for (i = 0; i < nPrep; i++) empurra(a[0], a[1], 1.14, 0.84);            // pega impulso
      for (i = 0; i <= nVoo; i++) {
        var v = i / nVoo;
        var subindo = v < 0.5;
        empurra(a[0] + (b[0] - a[0]) * v, aa * v * v + bb * v + a[1],
          subindo ? 0.9 : 0.95, subindo ? ESTICA : 1.05);
      }
      for (i = 0; i < nPouso; i++) {                                           // amassa no pouso
        var w = i / nPouso;
        empurra(b[0], b[1], 1.2 - 0.2 * w, 0.8 + 0.2 * w);
      }
      ultimo = b;
    }
  });

  var DUR = pos.length / FPS;
  var fCorpo = [], fCorpoPose = [];
  for (var k = 0; k < pos.length; k++) {
    var off = k / (pos.length - 1);
    // os pés ficam em PES da largura; virado para a esquerda, espelha
    var pes = (pose[k].sx > 0 ? PES : 1 - PES) * larg;
    fCorpo.push({ offset: off, transform: 'translate(' + ((pos[k].x - pes) * s).toFixed(2) + 'px,' + ((pos[k].y - alt) * s).toFixed(2) + 'px)' });
    fCorpoPose.push({ offset: off, transform: 'scale(' + pose[k].sx.toFixed(3) + ',' + pose[k].sy.toFixed(3) + ')' });
  }
  var opts = { duration: DUR * 1000, delay: ATRASO * 1000, fill: 'both', easing: 'linear' };
  coelho.animate(fCorpo, opts);
  corpo.animate(fCorpoPose, opts);

  // Rabinho mexendo enquanto bota o ovo; no meio disso o ovo rosa sai da cesta.
  setTimeout(function () { coelho.classList.add('botando'); }, (ATRASO + tBota) * 1000);
  setTimeout(function () { coelho.classList.add('sem-ovo'); }, (ATRASO + tBota + 0.7) * 1000);

  /* ---------- O ovo aparece no pingo do "i" quando o coelho sai de cima ---------- */
  ovo.style.opacity = '';
  ovo.animate([
    { offset: 0, opacity: 0, transform: 'scale(.4)' },
    { offset: 0.35, opacity: 1, transform: 'scale(1.2,.9)' },
    { offset: 0.55, transform: 'scale(.92,1.08) rotate(-9deg)' },
    { offset: 0.75, transform: 'scale(1) rotate(6deg)' },
    { offset: 0.9, transform: 'rotate(-3deg)' },
    { offset: 1, opacity: 1, transform: 'none' }
  ], { duration: 700, delay: (ATRASO + tSoltaOvo + 0.12) * 1000, fill: 'both', easing: 'ease-out' });

  setTimeout(function () {
    var cores = ['#f783ac', '#74c0fc', '#ffffff', '#e64980', '#4a97d4'];
    var cx = 57.5 * s, cy = 9.5 * s;
    for (var n = 0; n < 8; n++) {
      var ang = n / 8 * Math.PI * 2;
      var b = document.createElement('span');
      b.className = 'ipc-pascoa-brilho';
      b.textContent = '✦';
      b.style.color = cores[n % cores.length];
      b.style.left = cx + 'px';
      b.style.top = cy + 'px';
      b.style.setProperty('--dx', Math.cos(ang) * 14 + 'px');
      // sem subir muito: o espaço acima do logo é pequeno
      b.style.setProperty('--dy', Math.sin(ang) * (Math.sin(ang) < 0 ? 4 : 10) + 'px');
      ancora.appendChild(b);
      (function (el) { setTimeout(function () { el.remove(); }, 900); })(b);
    }
  }, (ATRASO + tSoltaOvo + 0.2) * 1000);

  setTimeout(function () { coelho.remove(); }, (ATRASO + DUR + 0.3) * 1000);
})();
