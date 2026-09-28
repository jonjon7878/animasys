/* trilha.lab — textos colados pelo usuário. Carregue antes dos outros scripts.
   ?editar  → clique num texto marcado com data-texto e cole; salva no navegador.
   ?resetar → volta aos textos de exemplo. */
(function () {
  var params = new URLSearchParams(location.search);
  var CHAVE = 'trilha-lab:textos';
  var salvos = {};
  try { salvos = JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) {}
  if (params.has('resetar')) { salvos = {}; try { localStorage.removeItem(CHAVE); } catch (e) {} }
  var editaveis = document.querySelectorAll('[data-texto]');
  editaveis.forEach(function (el) { if (salvos[el.dataset.texto]) el.textContent = salvos[el.dataset.texto]; });

  if (!params.has('editar')) return;
  document.body.classList.add('editando');
  editaveis.forEach(function (el) {
    el.contentEditable = 'plaintext-only';
    if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
    el.addEventListener('paste', function (e) {
      e.preventDefault();
      document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\s+/g, ' ').trim());
    });
    el.addEventListener('input', function () {
      salvos[el.dataset.texto] = el.textContent;
      try { localStorage.setItem(CHAVE, JSON.stringify(salvos)); } catch (e) {}
    });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } e.stopPropagation(); });
    el.addEventListener('click', function (e) { if (el.closest('a, button, label')) e.preventDefault(); });
  });
  var aviso = document.createElement('div');
  aviso.className = 'aviso-editar';
  aviso.innerHTML = 'Modo edição: clique num texto e cole. Salva sozinho.<button type="button">Concluir</button>';
  aviso.querySelector('button').onclick = function () { location.href = location.pathname; };
  document.body.appendChild(aviso);
})();
