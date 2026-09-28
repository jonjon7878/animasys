/* Tema de Halloween — IPC Comercial (cópia local)
 * - a bolinha do logo vira uma abóbora (só CSS, veja halloween.css)
 * - 3 morcegos atravessam a faixa amarela do cabeçalho
 * - uma aranha desce pelo fio logo abaixo do menu e sobe de volta
 * Tudo roda uma vez por carregamento. Para desligar: ATIVO = false. */
(function () {
  var ATIVO = false;
  // ?tema=... na URL escolhe o tema (para comparar os temas em abas separadas).
  var temaUrl = new URLSearchParams(location.search).get('tema') || location.hash.replace('#', '') || null;
  if (temaUrl) ATIVO = temaUrl === 'halloween';
  if (!ATIVO) return;

  document.body.classList.add('ipc-halloween');
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var BAT_SVG =
    '<svg viewBox="0 0 64 30" aria-hidden="true">' +
      '<path class="asa-e" d="M28.5 12C23 5 13 3.5 1.5 8.5c5 1.5 7.5 5 7 9.5 3.5-2.5 7.5-2 10 1.5 2.5-3 6.5-3.5 10-1.5z"/>' +
      '<path class="asa-d" d="M35.5 12C41 5 51 3.5 62.5 8.5c-5 1.5-7.5 5-7 9.5-3.5-2.5-7.5-2-10 1.5-2.5-3-6.5-3.5-10-1.5z"/>' +
      '<ellipse cx="32" cy="15" rx="4.5" ry="7"/>' +
      '<path d="M28.6 10.5l.7-5 1.9 3.1h1.6l1.9-3.1.7 5z"/>' +
      '<circle cx="30.4" cy="12" r="1" fill="#ffd700"/><circle cx="33.6" cy="12" r="1" fill="#ffd700"/>' +
    '</svg>';

  var SPIDER_SVG =
    '<svg viewBox="0 0 32 30" aria-hidden="true" fill="none" stroke="#15161a" stroke-width="1.6" stroke-linecap="round">' +
      '<g class="pernas-e"><path d="M13 13Q7 8 3 11M13 15Q6 13 2 17M13 17Q7 18 3 23M14 19Q9 23 6 28"/></g>' +
      '<g class="pernas-d"><path d="M19 13Q25 8 29 11M19 15Q26 13 30 17M19 17Q25 18 29 23M18 19Q23 23 26 28"/></g>' +
      '<g stroke="none">' +
        '<circle cx="16" cy="18.5" r="6" fill="#15161a"/>' +
        '<circle cx="16" cy="11" r="3.8" fill="#15161a"/>' +
        '<circle cx="14.6" cy="10.6" r="1.2" fill="#fff"/><circle cx="17.4" cy="10.6" r="1.2" fill="#fff"/>' +
        '<circle cx="14.8" cy="10.9" r=".55" fill="#15161a"/><circle cx="17.2" cy="10.9" r=".55" fill="#15161a"/>' +
      '</g>' +
    '</svg>';

  // Morcegos: tamanho (px), altura na faixa (%), duração e atraso (s).
  var BATS = [
    { size: 34, top: 24, dur: 5.2, delay: 1.0 },
    { size: 24, top: 60, dur: 6.4, delay: 1.7 },
    { size: 28, top: 40, dur: 5.8, delay: 2.6 }
  ];

  function box(el) {
    var r = el.getBoundingClientRect();
    return { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, bottom: r.bottom + window.scrollY };
  }

  function start() {
    var header = document.querySelector('#header-main');
    if (!header) return;
    var black = document.querySelector('#header-main .header-1');
    var nav = document.querySelector('#nav-main') || header;

    var layer = document.createElement('div');
    layer.className = 'ipc-hw-bats';
    BATS.forEach(function (b) {
      var bat = document.createElement('div');
      bat.className = 'ipc-bat';
      bat.style.top = 'calc(' + b.top + '% - ' + b.size / 4 + 'px)';
      bat.style.setProperty('--size', b.size + 'px');
      bat.style.setProperty('--dur', b.dur + 's');
      bat.style.setProperty('--delay', b.delay + 's');
      bat.innerHTML = '<div class="ipc-bat-bob">' + BAT_SVG + '</div>';
      layer.appendChild(bat);
    });
    document.body.appendChild(layer);

    var spider = document.createElement('div');
    spider.className = 'ipc-hw-spider';
    spider.innerHTML =
      '<div class="ipc-spider-sway"><div class="ipc-spider-drop">' +
        '<div class="ipc-spider-fio"></div>' + SPIDER_SVG +
      '</div></div>';
    document.body.appendChild(spider);

    // O layout do cabeçalho ainda muda enquanto a página carrega (fontes,
    // scripts da loja), então reposiciona sempre que o tamanho mudar.
    function place() {
      var hb = box(header);
      // Faixa amarela = do fim da barra preta até o fim do cabeçalho.
      var yellowTop = black ? box(black).bottom : hb.top;
      layer.style.top = yellowTop + 'px';
      layer.style.left = hb.left + 'px';
      layer.style.width = hb.width + 'px';
      layer.style.height = hb.bottom - yellowTop + 'px';
      layer.style.setProperty('--ipc-lw', hb.width + 'px');

      // Aranha: pendurada logo abaixo do menu branco, do lado direito.
      var nb = box(nav);
      spider.style.top = nb.bottom + 'px';
      spider.style.left = nb.left + nb.width * 0.8 - 45 + 'px';
    }
    place();
    var ro = window.ResizeObserver ? new ResizeObserver(place) : null;
    if (ro) ro.observe(document.body);
    window.addEventListener('load', place);

    // Limpa tudo quando as animações terminam.
    setTimeout(function () {
      if (ro) ro.disconnect();
      window.removeEventListener('load', place);
      layer.remove();
      spider.remove();
    }, 10000);
  }

  // O script fica no fim do <body>, então o cabeçalho já existe aqui.
  start();
})();
