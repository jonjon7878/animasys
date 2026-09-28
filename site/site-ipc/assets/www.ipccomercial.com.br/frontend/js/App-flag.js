/**
 * @copyright     D Loja Virtual
 * @link          http://www.dlojavirtual.com
 * @package       app.FrontEnd.Js
 * @since         v 1.0
 * @author        Bruno Lehnen Simões
 *  @description   Revealing modules responsaveis pelo roteamento e pelas requisições aos Web Services
 **/

var AppWidgets = (function () {
  function addClasses(element, classes) {
    if (classes) {
      if (!Array.isArray(classes)) {
        element.addClass(classes);
      } else {
        $.each(classes, function (index, klass) {
          element.addClass(klass);
        });
      }
    }
  }

  function customElement(tag, options) {
    var element = $('<' + tag + ' />', options.options);
    element.append(options.child);

    addClasses(element, options.classes);

    return element;
  }

  function grid(rows, elements, options) {
    return customElement('div', {
      classes: ['grid-' + rows, 'alpha', 'omega'],
      child: elements,
      options: options
    });
  }

  function row(elements, options) {
    return customElement('div', {
      classes: 'row',
      child: elements
    });
  }

  function gridRow(rows, elements, options) {
    var rowList = new Array();
    $.each(elements, function (index, element) {
      rowList.push(row(element));
    });

    return grid(rows, rowList, options);
  }

  function button(title, options, classes) {
    var classes = (!classes) ? new Array() : classes,
      elements = new Array();
    elements.push('<span class="btn-icon"></span>');
    elements.push('<span class="btn-text">' + title + '</span>');
    classes.unshift('btn');

    return customElement('button', {
      child: elements,
      options: options,
      classes: classes
    });
  }

  return {
    row: row,
    grid: grid,
    button: button,
    gridRow: gridRow,
    customElement: customElement
  };

})();

var App = {
  loaded: [],
  current: null,
  currentId: 'cart-products',
  loadImage: null,

  getLoadImage: function () {
    var divImg = $('<div />');
    divImg.addClass('loading-cart');


    return divImg;
  },

  refreshApp: function () {
    $.each($(document.head).children('script'), function (index, element) {
      var clone = $('<script />', {
        'type': element.type,
        'src': element.src
      });

      $(element).remove();
      $(document.head).append(element);
    });
  },

  initJSON: function (callback) {
    if (!window.JSON) {
      App.include('json', callback);
    } else {
      callback.call(this)
    }
  },

  //Init
  init: function () {
    App.initJSON(function () {
      $('.one-step-checkout-item').show();

      //Configura e monitora slides
      App.Slider = $('#one-step-checkout-main').bxSlider({
        mode: 'horizontal',
        captions: false,
        responsive: true,
        auto: false,
        pager: false,
        controls: false,
        touchEnabled: false,
        pagerSelector: null,
        infiniteLoop: false,
        useCSS: false,
        onSlideAfter: App.afterSlideCallback,
        onSlideBefore: App.beforeSlideCallback
      });

      App.beforeSlideCallback(document.getElementById('cart-products'), function () {
        //Eventos genéricos	
        $(document.body).on('click', '.cart-slider-submit', function (e) {
          if (typeof App.current.submit === 'function') {
            App.current.submit.call(this, 'click');
          }
        });

        $(document.body).on('keyup', null, function (e) {
          if (e.which == 13 && App.currentId != 'cart-products' && typeof App.isValidCallback(App.current.submit)) {
            App.current.submit('key');
          }
        });
      });

    });
  },

  //Controladores de slide
  beforeSlideCallback: function (sElement, callback) {
    App.currentId = $(sElement).attr('id');

    App.include('carrinho/' + App.currentId, null,
      function () {
        App.current = window[App.currentId.toCamel()];
        App.loadComponents(App.current, null, function () {
          App.current.box = $(sElement);
          App.current.loading = $(sElement).children('.box-loading');
          App.current.loadingStart = function () {
            App.current.loading.show();
          }
          App.current.loadingComplete = function () {
            App.current.loading.hide();
          }
          App.current.init(callback);
        });
      }
    );
  },

  afterSlideCallback: function (sElement) {
    if (typeof App.current.focusObj !== 'undefined') {
      App.current.focusObj.focus();
    }
  },

  loadComponents: function (controller, beforeCallback, successCallback) {
    if (controller.components && controller.components.length) {
      App.initCallback(beforeCallback);

      (function recursiveLoading() {
        if (controller.components.length) {
          var component = controller.components.shift();
          var fullComponent = component.toCamel() + 'Component';

          App.include(fullComponent, null, function (e) {
            controller[component] = window[fullComponent];
            recursiveLoading();
          });

        } else {
          App.initCallback(successCallback);
        }

      })();

    } else {
      App.initCallback(successCallback);
    }
  },

  //Metodos Utilitarios
  include: function (name, beforeCallback, successCallback) {

    // Versionamentos de JS do carrinho ¯\_(ツ)_/¯		
    if (name == 'carrinho/cart-products') {
      name = 'carrinho/cart-products-flag'
    } else if (name == 'carrinho/cart-email') {
      name = 'carrinho/cart-email.min.8543'
    } else if (name == 'carrinho/cart-final') {
      name = 'carrinho/cart-final'
    } else if (name == 'ShippingComponent') {
      name = 'ShippingComponent'
    } else if (name == 'PaymentComponent') {
      name = 'PaymentComponent'
    }

    var path = base_url + 'frontend/js/' + name + '.js',
      sLen = App.loaded.length;

    for (var i = 0; i < sLen; i++) {
      if (App.loaded[i] == path) {
        App.initCallback(successCallback);
        return true;
      }
    }

    App.initCallback(beforeCallback);

    $.getScript(path, function () {
      App.loaded.push(path);
      App.initCallback(successCallback);
    });

  },

  objLen: function (obj) {
    var count = 0;

    $.each(obj, function (att, current) {
      if (typeof current === 'object' && current !== null) {
        count++;
      }
    });

    return count;
  },

  //Métodos Genéricos
  initCallback: function (callback, data, context) {
    context = (context) ? context : this;

    if (typeof callback == 'function') {
      callback.call(context, data);
    }
  },

  isValidCallback: function (callback) {
    return (typeof callback == 'function');
  },
  emptyCartIcon: function () {
    $('.list-products-shopping-cart ul').children('li').remove();
    $('.shopping-cart-total-products').html('0');
    $('.shopping-cart-total-price, .total-price-shopping-cart').each(function (index, element) {
      $(element).html('Seu carrinho está vazio');
    });
    $('.cart-action-buttons').hide();
  },
  deleteProductIcon: function (cart) {
    comb = $('.cart-comb-' + cart.CatalogoCarrinho.estoque_id).remove();
    App.refreshCartIcon(cart);
  },

  refreshCartIcon: function (cart) {
    var totalProdBox = $('.shopping-cart-total-products'),
      totalItens = $('.list-products-shopping-cart').first().children('ul').children('li').length;
    del = (typeof del === 'undefined') ? false : del;

    if (cart.CatalogoCarrinho) {
      cart.total_carrinho = cart.CatalogoCarrinho.valor_total_produtos;
      cart.estoque_id = cart.CatalogoCarrinho.estoque_id;
    }

    if (totalItens) {
      cart.count_itens = totalItens;
    } else {
      cart.count_itens = '';
    }

    if (cart.count_itens) {
      totalProdBox.html(cart.count_itens);
    } else {
      totalProdBox.html('');
    }

    $('.shopping-cart-total-price,.total-price-shopping-cart').each(function (index, element) {
      $(element).html(cart.total_carrinho);
    });

    $('.cart-action-buttons').show();
  },

  addProductIcon: function (cart, img) {
    if ($(img[0]).parent().hasClass('noimage')) {
      img = $(img[0]).parent();
    }

    //Adapta função para result sets diferentes
    if (cart.CatalogoCarrinho) {
      cart = {
        'nome_produto': cart.CatalogoCarrinhoProduto.nome_produto,
        'total_produto': cart.CatalogoCarrinhoProduto.valor_total,
        'quantidade_produto': cart.CatalogoCarrinhoProduto.quantidade_produto,
        'estoque_id': cart.CatalogoCarrinhoProduto.estoque_id,
        'total_carrinho': cart.CatalogoCarrinho.valor_total_produtos,
        'combinacoes': cart.CatalogoCarrinhoProduto.combinacoes
      }
    }

    var comb = $('.cart-comb-' + cart['estoque_id']);
    img = $(img).clone();

    if (!comb.length) {
      var prodList = $('.list-products-shopping-cart').children('ul');

      var li = document.createElement('li');
      tot = $('.total-price-shopping-cart-wrapper'),
        li.className = 'cart-comb-' + cart['estoque_id'];

      var divImage = document.createElement('div');
      divImage.className = 'img-product-shopping-cart';
      $(divImage).append(img);

      $(li).append(divImage);

      var combinacao = JSON.parse(cart['combinacoes']);

      if (combinacao.length > 0) {

        var conteudo = '<span class="name-product-shopping-cart">' + cart['nome_produto'] + (cart['quantidade_produto'] > 1 ? ' (' + cart['quantidade_produto'] + ')' : '');

        $.each(combinacao, function (index, value) {
          conteudo += '<br/><span>' + value.Combinacao.combinacao + ': ' + value.Combinacao.atributo + '</span>';
        });

        conteudo += '</span>';

        li.innerHTML += conteudo;

      } else {
        li.innerHTML += '<span class="name-product-shopping-cart">' + cart['nome_produto'] + (cart['quantidade_produto'] > 1 ? ' (' + cart['quantidade_produto'] + ')' : '') + '</span>';
      }

      li.innerHTML += '<span class="price-product-shopping-cart">' + cart['total_produto'] + '</span>';

      prodList.append(li);

    } else {

      var combinacao = JSON.parse(cart['combinacoes']);

      if (combinacao.length > 0) {

        var conteudo = cart['nome_produto'] + ' (' + cart['quantidade_produto'] + ')';

        $.each(combinacao, function (index, value) {
          conteudo += '<br/><span>' + value.Combinacao.combinacao + ': ' + value.Combinacao.atributo + '</span>';
        });

        conteudo += '</span>';

        comb.children('.name-product-shopping-cart').html(conteudo);

      } else {
        comb.children('.name-product-shopping-cart').html(cart['nome_produto'] + ' (' + cart['quantidade_produto'] + ')');
      }

      comb.children('.price-product-shopping-cart').html(cart['total_produto']);
    }

    App.refreshCartIcon(cart);
  }
}