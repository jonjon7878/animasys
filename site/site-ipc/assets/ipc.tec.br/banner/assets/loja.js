/**
 * IPC Banner — o lado da LOJA. Ajusta a altura de todo banner nosso.
 *
 * Cole UMA vez no campo de código da loja, e nunca mais:
 *   <script src="https://ipc.tec.br/banner/assets/loja.js" defer></script>
 *
 * A partir daí, banner novo é só o <iframe>:
 *   <iframe src="https://ipc.tec.br/banner/1.html" width="100%" height="200"
 *           frameborder="0" scrolling="no" title="…"></iframe>
 *
 * O `height` do atributo é só o valor inicial, para não haver salto enquanto o
 * banner carrega. Assim que ele carrega, manda a altura certa e este script
 * aplica.
 *
 * POR QUE ELE EXISTE. Antes, cada banner tinha um script PRÓPRIO aqui dentro,
 * com a proporção chumbada — havia dois, um com 300/1920 e outro com 160/320.
 * Banner novo obrigava a mexer no painel: um lugar sem histórico, sem revisão, e
 * onde ninguém vê o que quebrou. Agora a altura viaja com o banner (ver
 * banner/assets/altura.js) e este arquivo é genérico.
 *
 * ⚠ ELE MORA NO ipc.tec.br DE PROPÓSITO. Colado no painel, corrigir um defeito
 * exigiria abrir o painel de novo — que é exatamente o que ele existe para
 * evitar. Aqui, o conserto é um commit.
 */
(function () {
  'use strict';

  var ORIGEM = 'https://ipc.tec.br';

  window.addEventListener('message', function (e) {
    // A procedência é conferida AQUI, não do outro lado. Qualquer página
    // emoldurada pode mandar mensagem para quem a emoldura; só as nossas
    // podem redimensionar alguma coisa.
    if (e.origin !== ORIGEM) { return; }

    var d = e.data;
    if (!d || d.ipcBanner !== 1) { return; }

    var h = Number(d.altura);
    // Faixa sã. Sem ela, um número absurdo (0, negativo, 100000) viraria um
    // iframe invisível ou uma página infinita — e o defeito não teria como ser
    // atribuído a nada.
    if (!isFinite(h) || h < 20 || h > 2000) { return; }

    var frames = document.querySelectorAll('iframe[src^="' + ORIGEM + '/banner/"]');
    for (var i = 0; i < frames.length; i++) {
      // Casa pela JANELA que enviou, não pelo src. Dois banners iguais na mesma
      // página têm o mesmo src; a janela é o que os separa.
      if (frames[i].contentWindow === e.source) {
        frames[i].style.height  = h + 'px';
        frames[i].style.border  = '0';
        frames[i].style.display = 'block';  // iframe é inline: sem isto sobra a
                                            // folga do descendente embaixo
        frames[i].style.width   = '100%';
      }
    }
  });
})();
