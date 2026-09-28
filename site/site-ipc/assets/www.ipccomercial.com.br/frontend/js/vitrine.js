$(function () {
	const searchParams = new URLSearchParams(window.location.search);
	const addToCartSuccess = searchParams.get('addToCartSuccess');

	let pluginMessageCarregado = setInterval(function () {
		if ($.message) {
			if (addToCartSuccess) {
				$.message.show('success', { vars: { title: 'Produto adicionado com sucesso!' }, idleTime: 4000 });
			}
			clearInterval(pluginMessageCarregado);
		}
	}, 1000);

	//Inicia cache e define imagens padrões
	ProductModel.init();

	//Evento que controla marcação de checkboxes por produtos
	$(document).on('click', '.product-combination-item', function (e) {

		e.preventDefault();

		$(this).find('.product-comb-attribute').prop('checked', true);

		var value = $(this).find('.product-comb-attribute').val();
		var prodClass = '.' + this.className.split(' ').pop();
		var combClass = this.className.split(' ').shift();

		$(this).closest('.product-combination-list').find('.product-comb-attribute[value="' + value + '"]').prop('checked', true).parent().addClass('product-combination-active');
		$(this).closest('.product-combination-list').find('.product-comb-attribute[value!="' + value + '"]').prop('checked', false).parent().removeClass('product-combination-active');
		$(this).closest('.wrapper-product-combination').addClass('product-combination-loading');

		if ($(this).find('.product-comb-attribute').hasClass('active-combination')) {
			active_combination($(this));
		} else {
			non_active_combination($(this));
		}
	});

	$(document).on('click', '.btn-disabled', function () {
		return false;
	});

	$(document).on('click', '.btn-buy', function (e) {
		const element = $(this);
		const productListItem = element.closest('.product-list-item');


		//Caso o produto seja composto por variações e esteja em um carrousel, redireciona para o produto
		const isCarrousel = element.closest('.bx-viewport').length > 0;
		const isProductCoumpounded = element.closest('.product-compounded').length > 0;
		if (isCarrousel && isProductCoumpounded) {
			console.warn("Produtos com variações em carrousel vão direto para o produto.");
			const hrefProduct = element.closest('.product-compounded').find(".product-link").attr('href');
			window.location = hrefProduct;
			return;
		}

		//Verifica se o produto tem condição de venda
		const conditionalData = productListItem.data('conditional');
		const conditionalProduct = conditionalData == 1;
		if (conditionalProduct) {
			showModalConditionalProduct(productListItem);
			return;
		}

		addToCart($(this));
	});

	$(document).on('click', '.btn-tell-me', function (e) {
		var element = $(this),
			btnText = element.children('.btn-text'),
			produto = element.closest('.product-list-item');
		ProductModel.id = produto.data('id');
		var comb = get_comb_by_product(produto);
		var perguntasArray = new Array();
		var checked = ProductModel.getChecked(comb),
			combsCount = get_comb_by_product(produto).length;
		var produtoId = $(this).closest('.product-list-item').data('id');
		var produtoImg = $(this).closest('.product-list-item-inner').find('.product-image img').first().attr('src');
		var produtoNome = $(this).closest('.product-list-item-inner').find('.product-name').children('a').html();
		var produtoSku = $(this).closest('.product-list-item').data('sku');

		var modalImg = $('.modal-product-image').children('img');
		var modalNome = $('.modal-product-info').children('.product-name');
		var modalSku = $('.modal-product-info').children('.product-price');

		modalImg.attr('src', produtoImg);
		modalNome.html(produtoNome);
		modalSku.html(produtoSku);

		$('#tellme-sku').val(produtoSku);
		$('#tellme-produto-id').val(produtoId);

		if (combsCount == checked.length) {
			$.modal.show(null, 'modal-tell-me');
		} else {
			$.message.show('error', { vars: { title: 'Você precisa selecionar todas as combinações.' }, idleTime: 4000 });
		}
	});

	$(document).on('click', '.btn-budget', function () {
		var form = $('#form-budget'),
			produtoInner = $(this).closest('.product-list-item-inner'),
			produtoId = $(this).closest('.product-list-item').data('id'),
			produtoEstoque = $(this).closest('.product-list-item').data('sku'),
			modalImg = $('.modal-product-image').children('img'),
			modalNome = $('.modal-product-info').children('.product-name'),
			produtoImg = produtoInner.find('.product-image').children('a').children('img').attr('src'),
			produtoNome = produtoInner.find('.product-name').children('a').html();

		form.find('#CotacaoProdutoId').val(produtoId);
		form.find('#CotacaoEstoqueId').val(produtoEstoque);
		modalImg.attr('src', produtoImg);
		modalNome.html(produtoNome);

		$.modal.show(null, 'modal-budget');
	});

	$(document).on('click', '#budget-btn', function () {
		var valid = $('#form-budget').valid();
		if (valid) {

			var reCaptcha = $('#g-recaptcha-response').val();
			if (reCaptcha.length > 0) {

				var cotacao = {};
				var route = WsRouter.generateRoute(null, 'produto', 'cotacaoProduto', null);

				cotacao = {
					clienteNome: $('#CotacaoNome').val(),
					clienteEmail: $('#CotacaoEmail').val(),
					clienteTelefone: $('#CotacaoTelefone').val(),
					clienteObservacao: $('#CotacaoObservacao').val(),
					clienteLogradouro: $('#CotacaoLogradouro').val(),
					clienteNumero: $('#CotacaoNumero').val(),
					clienteComplemento: $('#CotacaoComplemento').val(),
					clienteBairro: $('#CotacaoBairro').val(),
					clienteCidade: $('#CotacaoCidade').val(),
					clienteEstado: $('#CotacaoEstado').val(),
					clienteCep: $('#CotacaoCep').val(),
					produtoId: $('#CotacaoProdutoId').val(),
					produtoEstoqueId: $('#CotacaoEstoqueId').val(),
					quantidade: $('#CotacaoQuantidade').val(),
					recaptcha_response: reCaptcha
				};

				WsDispatcher.postRequest(route, { 'VendaCotacao': JSON.stringify(cotacao) }, null, function (data) {
					if (data.status == 1) {
						$.modal.hide('fadeInUp', 'modal-budget');
						$.message.show('success', { vars: { title: data.message }, idleTime: 4000 });
					} else {
						$.message.show('error', { vars: { title: data.message }, idleTime: 4000 });
					}
				});

			} else {
				var error = '<label id="g-recaptcha-response-error" class="error" for="g-recaptcha-response">Você precisa completar o Captcha de segurança.</label>';
				$('#g-recaptcha-response-error').remove();
				$('#div-captcha-budget').append(error);
			}
		}
	});

	function get_comb_by_product(prod) {
		return prod.children('.product-list-item-inner').children('.wrapper-product-combination').find('.product-combination-list');
	}

	function show_product_add_message() {
		$.message.show('product-add');
	};

	function active_combination(self, label_comprar) {

		// Botão Buy ou Tellme
		var btn = self.closest('.product-list-item').find('.wrapper-btn-product');

		//Recolhe os dados necessários para as operações no Model do produto
		var prod = self.closest('.product-list-item');
		var divImg = self.closest('.product-list-item-inner').find('.product-image');

		//Define o estado do model (produto em questão)
		ProductModel.id = prod.data('id');

		//Busca atributos selecionados
		var attributes = ProductModel.getChecked(get_comb_by_product(prod));

		if (self.find('.product-comb-attribute').prop('checked')) {

			//Busca dados do web service
			ProductModel.find(attributes,
				function () {
					//Before Send
				},
				//Success
				function (data) {

					update_unavailable_product(self, 0, divImg);
					var img = divImg.children('a');

					if (data.id !== null) {

						update_product_original_price(self, data);
						update_tag_progressive_discount(self, data);
						update_product_price(self, data['valor_venda_unitario']);
						update_product_parcelled(self, data['parcelas'], data['valor_parcelado']);
						update_price_off(self, data['desconto_avista'], data['valor_avista']);

						update_combinations(self, data['combinacoes']);
						update_tellme_price(self, null, 0);
						update_button_tellme(btn, self, 0, data);

						$(data['img']).css('opacity', 1);

						if (data['disponivel'] !== true) {
							update_unavailable_product(self, 1, divImg);
							update_tellme_price(self, data, 1);
							update_button_tellme(btn, self, 1, data);
							$(data['img']).css('opacity', 0.5);
						}

						$(data['img']).fadeIn(500);
						img.children('img').remove();
						img.append(data['img']);

						if (data['imgsec'] != false) {
							img.children('img:first-child').addClass('image-main');

							var imgsec = document.createElement('img');
							imgsec.src = base_url_image + '/sku/thumb_' + data['imgsec'];
							imgsec.style.cssText = 'display:none;';
							imgsec.setAttribute("class", "image-over");
							img.append(imgsec);
						}

					} else {
						update_unavailable_product(self, 1, divImg);
						update_tellme_price(self, data, 1);
						update_button_tellme(btn, self, 1, data);
					}
				}
			);
		}
	}

	function non_active_combination(self, label_comprar) {

		var btn = self.closest('.product-list-item').find('.wrapper-btn-product');

		//Recolhe os dados necessários para as operações no Model do produto
		var prod = self.closest('.product-list-item'),
			divImg = $(prod).find('.product-image'),
			img = divImg.children('a').children('img');

		ProductModel.id = prod.data('id');

		//Busca atributos selecionados
		var attributes = ProductModel.getChecked(get_comb_by_product(prod));

		if (self.find('.product-comb-attribute').prop('checked')) {

			//Busca dados do web service
			ProductModel.find(
				attributes,
				null,
				//Success
				function (data) {

					update_unavailable_product(self, 0, divImg);

					if (data.id !== null) {

						update_product_original_price(self, data);
						update_tag_progressive_discount(self, data);
						update_product_price(self, data['valor_venda_unitario']);
						update_product_parcelled(self, data['parcelas'], data['valor_parcelado']);
						update_price_off(self, data['desconto_avista'], data['valor_avista']);

						update_combinations(self, data['combinacoes']);
						update_unavailable_product(self, 0, divImg);
						update_tellme_price(self, null, 0);
						update_button_tellme(btn, self, 0, data);

						if (data['disponivel'] !== true) {
							update_unavailable_product(self, 1, divImg);
							update_tellme_price(self, data, 1);
							update_button_tellme(btn, self, 1, data);
							$(data['img']).css('opacity', 0.5);
						}

					} else {
						update_unavailable_product(self, 1, divImg);
						update_tellme_price(self, data, 1);
						update_button_tellme(btn, self, 1, data);
						$(prod).addClass('comb-unavailable');
					}
				}
			);
		}
	}

	function update_product_original_price(self, product) {

		var wrapper = self.closest('.product-list-item-inner'),
			oldPrice = wrapper.find('.product-old-price'),
			labelPromo = self.closest('.product-list-item-inner').find('.label-promo');

		if (product['promocao'] && product['valor_original'] !== null) {
			oldPrice.show();
			labelPromo.html(product['percentual_promocao']);
			labelPromo.show();
			oldPrice.removeClass('product-price');
			oldPrice.children('span:nth-child(1)').html('de ');
			oldPrice.children('span:nth-child(2)').html(accounting.formatMoney(product['valor_original']));
			oldPrice.children('span:nth-child(2)').attr('class', 'product-strikethrough-price');
		} else {
			oldPrice.find('span').html('');
			labelPromo.hide();
			oldPrice.hide();
		}
	}

	function update_product_price(self, valor_venda) {


		var wrapper = self.closest('.product-list-item-inner');
		var price = wrapper.find('.product-sell-price');

		price.children('span:nth-child(1)').html('Por ');
		price.children('span:nth-child(2)').html('');
		price.children('span:nth-child(2)').html(accounting.formatMoney(valor_venda));
		price.children('span:nth-child(2)').attr('class', 'product-big-price');
	}

	function update_product_parcelled(self, parcelas, valor_parcelado) {

		var wrapper = self.closest('.product-list-item-inner');
		var parcelled = wrapper.find('.product-parcelled-price');

		parcelled.children('.product-number-parcels').html('');
		parcelled.children('.product-number-parcels').html(parcelas + 'x');
		parcelled.children('.product-big-price').html('');
		parcelled.children('.product-big-price').html(accounting.formatMoney(valor_parcelado));
	}

	function update_price_off(self, desconto, valor_avista) {
		if (desconto > 0) {

			var wrapper = self.closest('.product-list-item-inner');
			var cash = wrapper.find('.product-cash-price');

			cash.children('.product-big-price').html('');
			cash.children('.product-big-price').html(accounting.formatMoney(valor_avista));

			cash.children('.product-price-off').html('');
			cash.children('.product-price-off').html(desconto + '%');
		}
	}

	function update_combinations(self, combinacoes) {

		var wrapper = $(self).closest('.wrapper-product-combination');
		wrapper.html('');

		var html_combinacoes = '';

		$.each(combinacoes, function (idx, combinacao) {

			html_combinacoes +=
				'<span class="product-combination-title">' + combinacao.label + '</span>' +
				'<ul class="product-combination-list">';

			$.each(combinacao.CombinacaoAtributo, function (idx2, atributo) {

				var disponivel = ((atributo.disponivel == true) ? '' : ' product-combination-unavailable'),
					selecionado = ((atributo.selecionado == true) ? ' product-combination-active' : ''),
					atributo_ativo = ((combinacao.mostra_vitrine == true) ? ' active-combination' : ''),
					selected = ((atributo.selecionado == true) ? ' checked="checked" ' : ''),
					atributo_tipo = __update_combinations_type(atributo);

				html_combinacoes +=
					'<li class="product-combination-item' + disponivel + selecionado + ' ' + combinacao.classes_adicionais + '">' +
					'<label for="CatalogoCombinacaoAtributoId' + combinacao.produto_id + combinacao.id + atributo.id + '" title="' + atributo.nome + '">' +
					atributo_tipo +
					'</label>' +
					((atributo.disponivel == true) ? '' : '<span class="label-product-combination-unavailable">x</span>') +
					'<input type="hidden" name="data[CatalogoCombinacaoAtributo][id][' + combinacao.produto_id + '][' + combinacao.id + '][' + atributo.id + ']" id="CatalogoCombinacaoAtributoId' + combinacao.produto_id + combinacao.id + atributo.id + '_" value="0">' +
					'<input type="checkbox" name="data[CatalogoCombinacaoAtributo][id][' + combinacao.produto_id + '][' + combinacao.id + '][' + atributo.id + ']" value="' + atributo.id + '"' + selected + 'class="comb-' + combinacao.id + ' product-comb-attribute' + atributo_ativo + ' prod-' + combinacao.produto_id + '" data-order="' + combinacao.ordem + '" id="CatalogoCombinacaoAtributoId' + combinacao.produto_id + combinacao.id + atributo.id + '">' +
					'</li>';

			});

			html_combinacoes +=
				'</ul>';

		});

		wrapper.html(html_combinacoes);
		wrapper.removeClass('product-combination-loading');
	}

	function update_tag_progressive_discount(self, product) {
		var wrapper = self.closest('.product-list-item-inner');
		if (product['progressive_discount_message'] == "") {
			wrapper.find('.product-tag-progressiveDiscount').addClass('tag-hidden');
		} else {
			wrapper.find('.product-tag-progressiveDiscount').removeClass('tag-hidden');
		}
	}

	function update_button_tellme(btn, self, opt, data) {
		if (opt == 1) {
			var btn_html =
				'<div class="wrapper-btn-buy">' +
				'<a href="javascript:;" class="btn btn-tell-me">' +
				'<span class="icon-buy icon-tell-me btn-icon"></span>' +
				'<span class="btn-text">' + data['msg_aviseme'] + '</span>' +
				'</a>' +
				'</div>';
		} else if (opt == 0) {
			var btn_html =
				'<div class="wrapper-btn-buy">' +
				'<a href="javascript:;" class="btn btn-buy">' +
				'<span class="icon-buy btn-icon"></span>' +
				'<span class="btn-text">' + data['label_comprar'] + '</span>' +
				'</a>' +
				'</div>';
		}

		btn.html(btn_html);
	}

	function update_tellme_price(self, data, opt) {
		if (opt == 1) {
			if (data['exibe_preco_aviseme'] == '0')
				__clear_price(self);

			var modalSku = $('.modal-product-info').children('.product-price');
			modalSku.html(data['sku']);
			$('#tellme-sku').val(data['id']);
			self.closest('.product-list-item').attr('data-sku', $('#tellme-sku').val());

		} else if (opt == 0) {
			var price_info = $(self).closest('.product-list-item-inner').children('.product-info');
			price_info.find('p').show();
			price_info.find('.product-sku').hide();
		}
	}

	function update_available_product(self) {
		var inner_div = $(self).parent().parent().parent().parent();
	}

	function update_unavailable_product(self, opt, divImg) {
		var link = divImg.children('a').attr('href');
		var html_unavailable = '<a class="label-product label-unavailable" href="' + link + '">Produto Indisponível</a>';

		if (opt == 1) {
			divImg.find('.label-unavailable').remove();
			$(divImg).append(html_unavailable);
		} else if (opt == 0) {
			divImg.find('.label-unavailable').remove();
		}
	}

	function uncheckedatrributesLabels(self) {
		var labelMessage = new Array();
		var label = '';

		self.closest('.product-list-item').find('.product-combination-list').each(function () {
			label = $(this).prev().text();
			labelMessage[labelMessage.length] = label;
		});

		return labelMessage;
	}

	function __clear_price(self) {
		var price_info = $(self).closest('.product-list-item-inner').children('.product-info');
		price_info.find('p').hide();
		price_info.find('.product-name').show();
	}

	function __update_combinations_type(atributo) {
		var atributo_tipo = '';

		if (atributo.tipo_capa == 'imagem') {
			atributo_tipo = '<div class="combination-image"><img src="' + base_url_image + '/combinacao_atributo/thumb_' + atributo.name + '" alt=""></div>';
		} else if (atributo.tipo_capa == 'cor') {
			atributo_tipo = '<div style="background-color:#' + atributo.cor_primaria.replace('#', '') + '" >';

			if (atributo.cor_secundaria != null && atributo.cor_secundaria != '')
				atributo_tipo += '<span style="border-color:#' + atributo.cor_secundaria.replace('#', '') + '"></span>';

			atributo_tipo += '</div>';
		} else {
			atributo_tipo = '<div>' + atributo.nome + '</div>';
		}

		return atributo_tipo;
	}

	function showModalConditionalProduct(product) {
		const preSaleDateShipping = $(product).data('pre-sale-shipping');
		const preSaleDateFormat = (new Date(preSaleDateShipping)).toLocaleDateString('pt-br', { month: 'numeric', day: 'numeric' });
		const productName = $(product).find('.product-name').text();
		const modal = $('#modal-conditions-add');
		const modalElements = {
			title: $('#modal-conditions-add .modal-header-title'),
			conditionTitle: $('#modal-conditions-add .condition-title'),
			conditionDesc: $('#modal-conditions-add .condition-description'),
		};
		const btnAddToCart = modal.find('.msg-link-cart');
		const btnContinueBuy = modal.find('.msg-link-close');

		let conditionCheckbox = modal.find('#condition-accept');
		let conditionalTitle = $(product).data('conditional-title');
		let conditionalDesc = $(product).data('conditional-desc');

		modalElements.title.text('Comprar ' + productName);
		modalElements.conditionTitle.html(conditionalTitle);
		modalElements.conditionDesc.html(conditionalDesc);

		if (preSaleDateShipping) {
			let conditionalTitleReplaced = conditionalTitle.replace('%prazo_envio%', `${preSaleDateFormat}`);
			let conditionalDescReplaced = conditionalDesc.replace('%prazo_envio%', `${preSaleDateFormat}`);

			modalElements.conditionTitle.html(conditionalTitleReplaced);
			modalElements.conditionDesc.html(conditionalDescReplaced);
		}

		conditionCheckbox.prop('checked', false);
		$.modal.show('fadeInDown', 'modal-conditions-add');

		conditionCheckbox.on('change', function () {
			if ($(this).is(':checked')) {
				modal.find('.msg-link-cart').attr('disabled', false);
				modal.find('.msg-link-close').attr('disabled', false);
				return;
			}

			modal.find('.msg-link-cart').attr('disabled', true);
			modal.find('.msg-link-close').attr('disabled', true);
		});

		conditionCheckbox.trigger('change');

		btnAddToCart.click(function () {
			addToCart(product, 'goToCheckout');
		});

		btnContinueBuy.click(function () {
			addToCart(product, 'continueShopping');
		});
	}

	function addToCart(product, action) {
		var element = product,
			btnText = element.children('.btn-text'),
			produto = element.closest('.product-list-item');
		ProductModel.id = produto.data('id');

		const conditionalData = produto.data('conditional');
		const conditionalProduct = conditionalData == 1;

		let btnContinueBuyData = produto.data('btn-continue-buy');

		var comb = get_comb_by_product(produto);
		var perguntasArray = new Array();
		var checked = ProductModel.getChecked(comb),
			combsCount = get_comb_by_product(produto).length;

		if (combsCount == checked.length) {
			var self = this;

			// Previne clique duplo (soh libera o botao depois de executar o ajax)
			if (!element.hasClass('btn-disabled')) {

				element.addClass('btn-disabled');
				btnText.addClass('loading-button');
				$('.loading-page').show();

				ProductModel.cartCreateProduct(checked, perguntasArray,
					function () {
						//beforeSave
					},
					function (cart) {
						if (!cart['alerta_quantidade']) {
							var el = $('.shopping-cart-total-price'),
								img = produto.find('.product-image img:eq(0)');

							if (cart.acao_comprar == '3' || cart.acao_comprar == '4' || action == 'goToCheckout') {
								var uri = base_url + 'carrinho';
								$(location).attr("href", uri);
							} else {
								if (action == 'continueShopping' && btnContinueBuyData == '1') {
									const urlContinueBuy = base_url + '?addToCartSuccess=1';
									$(location).attr("href", urlContinueBuy);
									return;
								}

								$('.loading-page').hide();
								btnText.removeClass('loading-button');
								if (conditionalProduct) {
									$.modal.hide('fadeOutUp', 'modal-conditions-add');
									$.message.show('success', { vars: { title: 'Produto adicionado com sucesso!' }, idleTime: 4000 });
								} else {
									$.message.show(cart.continuar_comprando);
								}
							}

							App.refreshCartIcon(cart);
							App.addProductIcon(cart, img);

						} else if (cart['alerta_quantidade'] == true) {

							$('.loading-page').hide();
							btnText.removeClass('loading-button');
							$.message.show('error', { vars: { title: 'Produto indisponível' }, idleTime: 4000 });

						} else {

							$('.loading-page').hide();
							btnText.removeClass('loading-button');
							$.message.show('error', { vars: { title: cart['alerta_quantidade'].replace(".", ",") }, idleTime: 4000 });
						}

						setTimeout(function () {
							element.removeClass('btn-disabled');
						}, 1100);
					}
				);
			}

		} else {
			var labelMessage = uncheckedatrributesLabels(element);
			$.message.show('error', { vars: { title: 'Você precisa selecionar as combinações:<br/>' + labelMessage.join(", ") }, idleTime: 4000 });
		}
	}
});

let executedTellMeShop = false;

function submitTellMeShop(token) {
	const siteKey = $('#tellme-btn').data('site-key');
	const loading = $('#modal-tell-me').find('.modal-loading');

	if (!executedTellMeShop) {
		executedTellMeShop = true;

		loading.show();

		grecaptcha.enterprise.ready(function () {
			grecaptcha.enterprise.execute(siteKey, { action: 'submit' }).then(function (tokenRecaptcha) {
				$.ajax({
					url: base_url + 'produto/aviseme/add2',
					data: {
						'nome': $('#tellme-nome').val(),
						'email': $('#tellme-email').val(),
						'produto_id': $('#tellme-produto-id').val(),
						'produto_estoque_id': $('#tellme-sku').val(),
						'g-recaptcha-response': tokenRecaptcha,
					},
					dataType: 'json',
					type: 'POST',
					success: function (data) {
						$('#tellme-btn').find('.btn-text').removeClass('loading-button');
						if (data['id'] == -1) {
							$.message.show('error', { vars: { title: data['mensagem'] }, idleTime: 3500 });
						} else {
							$('.modal-mask').hide();
							$('.modal').hide();
							$.message.show('success', { vars: { title: 'Aviso cadastrado com sucesso!', idleTime: 3500 } });
						}

						loading.hide();
						executedTellMeShop = false;
					}
				});
			});
		});
	}
}
