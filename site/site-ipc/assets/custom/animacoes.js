/* Animações de teste — IPC Comercial (cópia local)
 * Clique em "Comprar" na vitrine: a imagem voa até a sacola, o contador sobe
 * e o ícone da sacola pula.
 * Obs.: é só visual — na cópia local nada é enviado ao carrinho real. */
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Logo: limita a altura dos pulos da bolinha ao espaço amarelo acima dela,
  // para ela nunca invadir a faixa preta (.header-1).
  (function fitLogoBall() {
    var ball = document.querySelector('.ipc-logo-ball');
    if (!ball) return;
    var blackBar = document.querySelector('#header-main .header-1');
    var r = ball.getBoundingClientRect();
    var d = r.width;
    if (!d) return;
    var limit = blackBar ? blackBar.getBoundingClientRect().bottom : r.top - d;
    var margin = 4;
    // No ápice a bolinha estica 8% para cima (scale 1.08 com origem embaixo).
    var room = r.top - limit - margin - d * 0.08;
    var apex = Math.max(-330, Math.min(0, -room / d * 100));
    var hop = Math.max(apex, -70);
    ball.style.setProperty('--ipc-ball-apex', apex.toFixed(1) + '%');
    ball.style.setProperty('--ipc-ball-hop', hop.toFixed(1) + '%');
  })();

  function parsePrice(text) {
    var m = /R\$\s*([\d.]+,\d{2})/.exec(text || '');
    return m ? parseFloat(m[1].replace(/\./g, '').replace(',', '.')) : 0;
  }

  function formatPrice(v) {
    return 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function visibleCartIcon() {
    var icons = document.querySelectorAll('.link-shopping-cart .icon-shopping-cart');
    for (var i = 0; i < icons.length; i++) {
      var r = icons[i].getBoundingClientRect();
      if (r.width && r.height) return icons[i];
    }
    return icons[0];
  }

  function flyToCart(img, done) {
    var target = visibleCartIcon();
    if (!img || !target || reduceMotion) return done();

    var from = img.getBoundingClientRect();
    var to = target.getBoundingClientRect();
    var clone = img.cloneNode();
    clone.removeAttribute('srcset');
    clone.className = 'ipc-fly-img';
    var size = Math.min(from.width, from.height, 140);
    clone.style.width = size + 'px';
    clone.style.height = size + 'px';
    clone.style.left = from.left + (from.width - size) / 2 + 'px';
    clone.style.top = from.top + (from.height - size) / 2 + 'px';
    document.body.appendChild(clone);

    var dx = to.left + to.width / 2 - (parseFloat(clone.style.left) + size / 2);
    var dy = to.top + to.height / 2 - (parseFloat(clone.style.top) + size / 2);

    var anim = clone.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(' + dx * 0.5 + 'px,' + (dy * 0.5 - 120) + 'px) scale(.6)', opacity: 1, offset: 0.5 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.12)', opacity: .6 }
    ], { duration: 800, easing: 'cubic-bezier(.45,0,.25,1)' });

    // Fallback timer: onfinish never fires if the tab is hidden mid-animation.
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      clone.remove();
      done();
    }
    anim.onfinish = finish;
    setTimeout(finish, 900);
  }

  function bumpCart(price) {
    document.querySelectorAll('.link-shopping-cart').forEach(function (cart) {
      cart.classList.remove('ipc-cart-bump');
      void cart.offsetWidth;
      cart.classList.add('ipc-cart-bump');
    });
    document.querySelectorAll('.shopping-cart-total-products').forEach(function (el) {
      el.textContent = (parseInt(el.textContent, 10) || 0) + 1;
      el.classList.remove('ipc-count-pop');
      void el.offsetWidth;
      el.classList.add('ipc-count-pop');
    });
    document.querySelectorAll('.shopping-cart-total-price').forEach(function (el) {
      el.textContent = formatPrice(parsePrice(el.textContent) + price);
    });
  }


  // Capture phase so the site's own handlers and the link navigation don't run.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.btn-buy-kit');
    if (!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();

    var card = btn.closest('.product-list-item-inner') || btn.parentElement;
    var img = card.querySelector('.product-image img');
    var nameEl = card.querySelector('.product-name');
    var name = nameEl ? nameEl.textContent.trim() : '';
    var priceEl = card.querySelector('.ipc-card-price') || card.querySelector('[class*=price]');
    var price = parsePrice(priceEl ? priceEl.textContent : '');

    var label = btn.querySelector('.btn-text');
    btn.classList.add('ipc-added');
    if (label) label.textContent = 'Adicionado ✓';
    setTimeout(function () {
      btn.classList.remove('ipc-added');
      if (label) label.textContent = 'Comprar';
    }, 1800);

    flyToCart(img, function () {
      bumpCart(price);
    });
  }, true);
})();
