/**
	 * @copyright     D Loja Virtual
	 * @link          http://www.dlojavirtual.com
	 * @package       app.FrontEnd.Js
	 * @since         v 1.0
	 * @author        José Pineda
**/

/**
	* Model de integração com WebServices do Frontend
**/
var ProductModel = {
	__imgCache: {},
	__imgDefaults: {},


	/**
	  * Coloca imagem no cache
	  * @param name : nome da imagem
	  * @param loadCallback (false) : Objeto Function que será chamado quando a imagem carregar
	**/
	__cacheImg: function (name, element, loadCallback) {
		var self = this;

		if (typeof this.__imgCache[name] == 'undefined') {

			if (!element) {
				self.__imgCache[name] = document.createElement('img');

				if (App.isValidCallback(loadCallback)) {
					$(self.__imgCache[name]).on('load', function () { loadCallback(self.__imgCache[name]); });
				}

				self.__imgCache[name].src = base_url_image + '/sku/thumb_' + name;
			} else {
				self.__imgCache[name] = $.clone(element);
			}


		} else if (App.isValidCallback(loadCallback)) {
			loadCallback(this.__imgCache[name]);
		}


	},

	/**
		* Extrai id da combinação do atributo "name" do respectivo elemento
		* @param element : elemento a ser parseado
		* @return : id da combinação
	**/
	__getCombination: function (element) {
		var comb = element.name.split('[');
		return comb[4].slice(0, -1);
	},

	/**
		* Extrai id do produto do atributo "name" do respectivo elemento
		* @param element : elemento a ser parseado
		* @return : id da combinação
	**/
	__getProductId: function (element) {
		var comb = element.name.split('[');
		return comb[3].slice(0, -1);
	},

	/**
		* Define imagem padrão do produto
		* @param id : id do produto
		* @param name : nome da imagem
	**/
	__setDefaultImg: function (id, name) {
		this.__imgDefaults[id] = name;
	},


	/**
		* Monta as informações básicas para o funcionamento do objeto:
		* Armazena no cache as imagens já carregadas
		* Define as imagens padrões dos parodutos
	**/
	init: function () {
		var self = this,
			gift = 0,
			payLater = 0,
			imgs = $('.product-image');

		imgs.each(function (index, element) {
			var id = $(element.parentNode.parentNode).data('id'),
				amount = 1;

			/** Webp */
			if ($(this).children('a').children('picture').children('img').length > 0) {

				/** Lazy load **/
				if (typeof $(this).children('a').children('picture').first().children('img').attr('src') !== 'undefined')
					var name = $(this).children('a').children('picture').first().children('img').attr('src').split('/').pop().split('_').pop();
				else
					var name = false;

			} else {

				if ($(this).children('a').children('img').attr('src') == null) {
					var name = $(this).children('a').children('img').attr('data-src').split('/').pop().split('_').pop();
				} else {
					var name = $(this).children('a').children('img').attr('src').split('/').pop().split('_').pop();
				}
			}

			if (name !== false) {
				self.__cacheImg(name, element);
				self.__setDefaultImg(id, name);
			}
		});
	},

	/**
		* Busca imagem armazenada no cache
		* @param name : nome da imagem
		* @return : Objeto HTMLImageElement da imagem correspondente
	**/
	getCacheImg: function (name) {
		return this.__imgCache[name];
	},

	/**
		* Busca a imagem padrão do produto
		* @param id : id do produto
		* @param getObj (false) : define o tipo de retorno; True para HTMLImageElement False para string contendo o nome
		* @return : HTMLImageElement ou String com o nome
	**/
	getDefaultImg: function (id, getObj) {
		if (typeof getObj == 'undefined' || !getObj) {
			return this.__imgDefaults[id];
		}
		else {
			return this.getCacheImg(this.__imgDefaults[id]);
		}
	},

	/**
		* Busca campos preenchidos das perguntas customizadas
		* @return Array de Objetos id e valores informados pelo usuário
	**/
	getQuestions: function (custom_questions) {
		var questions = new Array();
		var error = new Array();

		if (custom_questions.length > 0) {
			custom_questions.each(function (index, element) {

				var tipo = $(element).prop('alt');
				var minimo = $(element).attr('data-minlength');
				var limite = $(element).attr('data-length');
				var valor = $(element).val();
				var valueNotBlank = valor !== ""

				if (tipo == 'float-two') {
					tipo = 'number';
					valor = parseFloat(valor.replace(',', '.')) || "";
					minimo = parseFloat(minimo);
					limite = parseFloat(limite);

				} else if ((tipo == 'number') || (tipo == 'integer')) {
					valor = parseInt(valor) || "";
					minimo = parseInt(minimo);
					limite = parseInt(limite);

				} else {
					minimo = parseInt(minimo);
					limite = parseInt(limite);
				}

				if (((tipo == 'number') || (tipo == 'integer')) && minimo != 0 && (valor < minimo || valor < 0)) {
					var perguntaLabel = $(element).closest('.row').children('.product-question-item-title').html();

					if (typeof perguntaLabel == 'undefined')
						perguntaLabel = $(element).closest('.product-question-action').children('.product-question-item-title').html();

					if (valueNotBlank) {
						error[0] = {
							'error': true,
							'msg': 'O valor mínimo para ' + perguntaLabel + ' é ' + minimo
						}
					}

				} else if (((tipo == 'number') || (tipo == 'integer')) && limite != 0 && (valor > limite || valor < 0)) {
					/*** Valor Maximo **/
					var perguntaLabel = $(element).closest('.row').children('.product-question-item-title').html();

					if (typeof perguntaLabel == 'undefined')
						perguntaLabel = $(element).closest('.product-question-action').children('.product-question-item-title').html();

					if (valueNotBlank) {
						error[0] = {
							'error': true,
							'msg': 'O valor máximo para ' + perguntaLabel + ' é ' + limite
						}
					}

				} else if (limite != 0 && valor.length > limite) {
					var perguntaLabel = $(element).closest('.row').children('.product-question-item-title').html();

					if (valueNotBlank) {
						error[0] = {
							'error': true,
							'msg': 'O tamanho máximo para ' + perguntaLabel + ' é ' + limite
						}
					}

				} else {

					if ($(element).val() !== '') {
						var selectedValue = $(element).val();
						var selectedOption = $(element).find('option[value="' + selectedValue + '"]');
						var answer = selectedOption.data('answer');

						var questionObject = {
							'id': $(element).data('question-id'),
							'pergunta': $(element).data('question'),
							'valor': $(element).val()
						};

						//Resposta aparece apenas em pergunta fechada
						if (typeof answer !== 'undefined') {
							questionObject.resposta = `${answer}`;
						}

						questions[questions.length] = questionObject;
					}
				}
			});
		}

		if (error.length > 0)
			return error

		else
			return questions;
	},

	/**
		* Busca atributos marcados do produto (this.id)
		* @return Array de Objetos Literais contendo id dos atributos e combinações
	**/
	getChecked: function (produto) {
		var self = this,
			buffer = new Array();

		$(produto).children('li').children('input:checked').each(function (index, element) {
			buffer[buffer.length] = {
				'produto_id': self.__getProductId(element),
				'order': $(element).data('order'),
				'atributo_id': element.value,
				'combinacao_id': self.__getCombination(element),
				'muda_vitrine': $(element).hasClass('active-combination')
			}
		});

		return buffer;
	},

	getSelected: function(comb) {

		var atributos_selecionados = new Array();

		$(comb).each(function (index, element) {
			if ($(element).val() != '0') {

				atributos_selecionados[atributos_selecionados.length] = {
					'produto_id': ProductModel.id,
					'order': $(element).attr('data-order'),
					'atributo_id': $(element).val(),
					'combinacao_id': $(element).attr('data-comb'),
					'muda_vitrine': 1
				}
			}
		});

		return atributos_selecionados;
	},

	getCombinations: function() {

		var combinations = new Array();

		// Esta habilitado compra multipla para o produto
		if ($('#main-product-combination-select').length > 0) {

			var comb = $('#main-product-combination-select').find('.product-combination-select');
			var atributos_selecionados = ProductModel.getSelected(comb);
			var divCombination = $('#main-product-combination-select').offset();

		} else {

			// Cair aqui seria o padrao com os radio inputs
			var comb = $('#main-product-combination-list').find('.product-combination-list');
			var atributos_selecionados = ProductModel.getChecked(comb);
			var divCombination = $('#main-product-combination-list').offset();
		}

		combinations = {
			'comb': comb,
			'checked': atributos_selecionados,
			'divCombination': divCombination
		}

		return combinations;
	},

	/**
		* Busca os kits pelos atributos marcados em cada um
		* @return Array com produto e produto estoque id
	**/
	getKitChecked: function (kits, produtoKitId) {
		var self = this,
			buffer = new Array();

		$.each(kits, function (index, element) {

			buffer[buffer.length] = {
				'id': $(element).attr('data-id'),
				'produto_id': $(element).attr('data-product'),
				'produto_estoque_id': $(element).attr('data-stock'),
				'clicado': ((produtoKitId == $(element).attr('data-id')) ? true : false)
			}
		});

		return buffer;
	},

	/**
		* Busca assíncrona dos dados das combinações do produto no web service "/frontend/webservices/vitrine/{:id}"
		* @param postIds : Array de Objetos Literais contendo id dos atributos e combinações
		* @param beforeCallback : Objeto Function a ser chamado durante carregamento da requisição e imagem
			* @param xmlHttpRequest : Objeto XmlHttpRequest com dados da requisição
		* @param successCallback : Objeto Function a ser chamado após o carregamento da requisição e imagem
			* @param successCallback : Objeto literal contendo a quantidade e imagem da combinação ou imagem padrão se a combinação não tiver imagem
	**/
	find: function (postIds, beforeCallback, successCallback) {
		var self = this,
			ids = JSON.stringify(postIds),
			route = WsRouter.generateRoute(null, 'produto', 'readVitrine', self.id);

		WsDispatcher.postRequest(route, { 'CombinacaoAtributo': ids }, beforeCallback, function (data) {

			if (App.isValidCallback(successCallback)) {
				data['img'] = data['img'] ?? self.getDefaultImg(self.id);

				if (data['img']) {
					self.__cacheImg(data['img'], null, function (img) {

						// Hack p/ duplicação elemento imagem
						if ($(img).hasClass('product-image')) {

							elementImg = document.createElement('img');
							elementImg.src = base_url_image + '/sku/thumb_' + data['img'];
							data['img'] = elementImg;

						} else {
							data['img'] = img;
						}

						successCallback.call(self, data);
					});
				} else {
					successCallback.call(self, data);
				}
			}
		});
	},

	/**
	* Método para consulta no detalhamento do produto.
	*/
	find_det: function (postIds, beforeCallback, successCallback) {
		var self = this,
			ids = JSON.stringify(postIds),
			reqId = self.id,
			route = WsRouter.generateRoute('produto', 'combinacao', 'readDetalhamento', reqId);

		WsDispatcher.postRequest(route, { 'CombinacaoAtributo': ids }, beforeCallback, successCallback);
	},

	/**
	* Método para consulta no detalhamento do Kit.
	*/
	findKit: function (postIds, postItens, produtoKit, beforeCallback, successCallback) {
		var self = this,
			ids = JSON.stringify(postIds),
			idsItens = JSON.stringify(postItens),
			produtoKit = JSON.stringify(produtoKit)
		reqId = self.id,
			route = WsRouter.generateRoute('produto', 'combinacao', 'readKit', [reqId, self.amount]);

		WsDispatcher.postRequest(route, { 'CombinacaoAtributo': ids, 'Itens': idsItens, 'ProdutoKit': produtoKit }, beforeCallback, successCallback);
	},

	/*
	* Método para consulta no detalhamento do produto - Unidade de Medida.
	*/
	find_detUnidade: function (postId, quantidade, beforeCallback, successCallback) {
		var self = this,
			route = WsRouter.generateRoute(null, 'produto', 'readDetalhamentoUnidade', postId);

		WsDispatcher.postRequest(route, { 'quantidade': quantidade }, beforeCallback, successCallback);
	},

	/**
	* Método para consulta dinâmica no Web Service de produtos
	**/
	hint: function (text, beforeCallback, successCallback) {
		var pixelAtivo = (typeof fbq !== 'undefined');
		var self = this,
			data = JSON.stringify({ 'key': text }),
			route = WsRouter.generateRoute(null, 'produto', 'hint');

		WsDispatcher.postRequest(route, { 'CatalogoProduto': data }, beforeCallback, function (data) {
			CurrencyBehavior.formatProduct(data);
			App.initCallback(successCallback, data, this);

			if (data['pixelData'] && typeof data['pixelData']['evento_id'] !== 'undefined' && data['pixelData']['evento_id']) {

				var contentIds = new Array();

				// Objeto contentIds
				$.each(data['pixelData']['produtos'], function (index, element) {

					if (element.Estoque && typeof element.Estoque.id !== 'undefined')
						contentIds[contentIds.length] = parseInt(element.Estoque.id);
					else
						contentIds[contentIds.length] = parseInt(element.CatalogoProduto.id);
				});

				if (typeof fbq !== 'undefined') {
					fbq('track', 'Search', {
						search_string: data['pixelData']['busca'],
						content_ids: contentIds,
					}, { eventID: data['pixelData']['evento_id'] });
				}
			}
		});
	},

	/**
	* Método para exportar produtos do Kit para o formato do carrinho
	**/
	cartCreateProductKit: function (checked, questions, beforeCallback, successCallback) {
		var pixelAtivo = (typeof fbq !== 'undefined');
		var self = this,
			ids = JSON.stringify(checked),
			questions = JSON.stringify(questions),
			reqId = self.id,
			kitId = self.kitId;
		route = WsRouter.generateRoute(null, 'carrinhos', 'createProductKit', [reqId, kitId, self.amount]);

		WsDispatcher.postRequest(route, { 'CombinacaoAtributo': ids, 'Pergunta': questions }, beforeCallback, function (data) {
			if (App.isValidCallback(successCallback) && data) {
				data = { 'CatalogoCarrinho': data };
				CurrencyBehavior.formatCart(data);

				if (pixelAtivo && data['CatalogoCarrinho']['seo_facebook_dpa']) {
					var contentIds = new Array();
					contentIds[contentIds.length] = data.CatalogoCarrinho.estoque_id;

					if (typeof data['CatalogoCarrinho']['facebook_event_id'] != 'undefined' && data['CatalogoCarrinho']['facebook_event_id']) {

						fbq('track', 'AddToCart', {
							content_ids: contentIds,
							content_type: 'product',
							value: data.CatalogoCarrinho.total_produto.replace('R$ ', '').replace('.', '').replace(',', '.'),
							currency: 'BRL'
						}, { eventID: data['CatalogoCarrinho']['facebook_event_id'] });
					}
				}

				if (data['CatalogoCarrinho']['script_pinterest_ativo']) {

					pintrk('track', 'addtocart', {
						currency: 'BRL',
						value: data.CatalogoCarrinho.total_produto.replace('R$ ', '').replace('.', '').replace(',', '.'),
						line_items: [{
							product_category: data.CatalogoCarrinho.nome_produto,
							product_id: data.CatalogoCarrinho.produto_id,
							product_variant_id: data.CatalogoCarrinho.estoque_id
						}]
					});
				}

				successCallback.call(self, data.CatalogoCarrinho);
			}
		});

	},

	datalayer_pdp_add_to_cart: function (catalogoCarrinho) {
		return new Promise(function (resolve, reject) {
			try {
				var { checked } = ProductModel.getCombinations();
				if (checked.length == 0) {
					window.dispatchEvent(new CustomEvent("pdp_add_to_cart", {
						detail: {
							catalogoCarrinho: catalogoCarrinho
						}
					}));
					return resolve();
				} else {
					ProductModel.find(checked, null, function (prod) {
						window.dispatchEvent(new CustomEvent("pdp_add_to_cart", {
							detail: {
								productSelected: prod,
								catalogoCarrinho: catalogoCarrinho
							}
						}));
						return resolve();
					});
				}
			} catch (error) {
				return reject(error);
			}
	});
},



	datalayer_spot_add_to_cart: function (catalogoCarrinho) {
		return new Promise(function (resolve, reject) {
			try {
				window.dispatchEvent(
					new CustomEvent("spot_add_to_cart", {
						detail: {
							catalogoCarrinho: catalogoCarrinho,
						},
					})
				);
				return resolve();
			} catch (error) {
				return reject(error);
			}
		})
	},

	/**
	* Metodo para exportar produtos do Kit para o formato do carrinho em chamada unica
	**/
	cartCreateProductKitUnique: function (checked, beforeCallback, successCallback) {
		var gaAtivo = (typeof gtag !== 'undefined');
		var pixelAtivo = (typeof fbq !== 'undefined');
		var self = this,
			reqId = self.id,
			kitId = self.kitId;
		route = WsRouter.generateRoute(null, 'carrinhos', 'createProductKitUnique', [kitId, self.amount]);

		WsDispatcher.postRequest(route, { 'Estoque': checked }, beforeCallback, function (data) {
			if (App.isValidCallback(successCallback) && data) {
				data = { 'CatalogoCarrinho': data };
				CurrencyBehavior.formatCart(data);

				if (!data['CatalogoCarrinho']['alerta_quantidade']) {

					if (gaAtivo) {

						data.CatalogoCarrinho.quantidade_produto = parseInt(data.CatalogoCarrinho.quantidade_produto);

						gtag('event', 'add_to_cart', {
							currency: 'BRL',
							value: data.CatalogoCarrinho.valor_unitario,
							items: [{
								item_id: data.CatalogoCarrinho.estoque_id,
								item_name: data.CatalogoCarrinho.nome_produto,
								currency: 'BRL',
								price: data.CatalogoCarrinho.valor_unitario,
								quantity: data.CatalogoCarrinho.quantidade_produto
							}]
						});
					}

					if (pixelAtivo && data['CatalogoCarrinho']['seo_facebook_dpa']) {
						var contentIds = new Array();
						contentIds[contentIds.length] = data.CatalogoCarrinho.estoque_id;

						fbq('track', 'AddToCart', {
							content_ids: contentIds,
							content_type: 'product',
							value: data.CatalogoCarrinho.total_produto.replace('R$ ', '').replace('.', '').replace(',', '.'),
							currency: 'BRL'
						}, { eventID: data['CatalogoCarrinho']['facebook_event_id'] });
					}

					if (data['CatalogoCarrinho']['script_pinterest_ativo']) {

						pintrk('track', 'addtocart', {
							currency: 'BRL',
							value: data.CatalogoCarrinho.total_produto.replace('R$ ', '').replace('.', '').replace(',', '.'),
							line_items: [{
								product_category: data.CatalogoCarrinho.nome_produto,
								product_id: data.CatalogoCarrinho.produto_id,
								product_variant_id: data.CatalogoCarrinho.estoque_id
							}]
						});
					}

					ProductModel.datalayer_pdp_add_to_cart(data.CatalogoCarrinho)
						.then(function () {
							console.log("Sucesso ao disparar a tag add_to_cart");
						})
						.catch(function (error) {
							console.error("Erro ao disparar a tag add_to_cart: ", error);
						})
						.finally(function () {
							successCallback.call(self, data.CatalogoCarrinho);
						});
				}
			}
		});
	},

	/**
	* Método para exportar produto para o formato do carrinho
	**/
	cartCreateProduct: function (checked, questions, beforeCallback, successCallback) {
		var gaAtivo = (typeof gtag !== 'undefined');
		var pixelAtivo = (typeof fbq !== 'undefined');
		var self = this,
			ids = JSON.stringify(checked),
			questions = JSON.stringify(questions),
			reqId = self.id,
			giftList = self.gift,
			later = self.payLater,
			route = WsRouter.generateRoute(null, 'carrinhos', 'createProduct', [reqId, self.amount]);

		WsDispatcher.postRequest(route, { 'CombinacaoAtributo': ids, 'Pergunta': questions, 'Lista': giftList, 'Depois': later }, beforeCallback, function (data) {
			if (App.isValidCallback(successCallback) && data) {
				data = { 'CatalogoCarrinho': data };
				CurrencyBehavior.formatCart(data);

				if (!data['CatalogoCarrinho']['alerta_quantidade']) {


					if (gaAtivo) {

						data.CatalogoCarrinho.quantidade_produto = parseInt(data.CatalogoCarrinho.quantidade_produto);

						gtag('event', 'add_to_cart', {
							currency: 'BRL',
							value: data.CatalogoCarrinho.valor_unitario,
							items: [{
								item_id: data.CatalogoCarrinho.estoque_id,
								item_name: data.CatalogoCarrinho.nome_produto,
								currency: 'BRL',
								price: data.CatalogoCarrinho.valor_unitario,
								quantity: data.CatalogoCarrinho.quantidade_produto
							}]
						});

					}


					if (pixelAtivo && data['CatalogoCarrinho']['seo_facebook_dpa']) {
						var contentIds = new Array();
						contentIds[contentIds.length] = data.CatalogoCarrinho.estoque_id;

						fbq('track', 'AddToCart', {
							content_ids: contentIds,
							content_type: 'product',
							value: data.CatalogoCarrinho.total_produto.replace('R$ ', '').replace('.', '').replace(',', '.'),
							currency: 'BRL'
						}, { eventID: data['CatalogoCarrinho']['facebook_event_id'] });
					}

					if (data['CatalogoCarrinho']['script_pinterest_ativo']) {

						pintrk('track', 'addtocart', {
							currency: 'BRL',
							value: data.CatalogoCarrinho.total_produto.replace('R$ ', '').replace('.', '').replace(',', '.'),
							line_items: [{
								product_category: data.CatalogoCarrinho.nome_produto,
								product_id: data.CatalogoCarrinho.produto_id,
								product_variant_id: data.CatalogoCarrinho.estoque_id
							}]
						});
					}

					const isPageProduct = $("body").hasClass("pagina-produto");

					const addToCartEvent = isPageProduct
						? ProductModel.datalayer_pdp_add_to_cart
						: ProductModel.datalayer_spot_add_to_cart;

					addToCartEvent(data.CatalogoCarrinho).then(function () {
						console.log("Sucesso ao disparar a tag add_to_cart");
					})
					.catch(function (error) {
						console.error("Erro ao disparar a tag add_to_cart: ", error);
					})
					.finally(function () {
						successCallback.call(self, data.CatalogoCarrinho);
					});
				}
			}
		});

	},

	/**
	* Método para enviar produto para a lista de favoritos
	*/
	favoriteProduct: function (stock, beforeCallback, successCallback) {
		var self = this,
			reqId = self.id,
			product = JSON.stringify({ 'produto_id': reqId, 'produto_estoque_id': stock }),
			route = WsRouter.generateRoute(null, 'clientes', 'favoriteProduct', []);

		WsDispatcher.postRequest(route, {'Produto' : product}, beforeCallback, function(data){
			if (data?.logado) {
				if(typeof DataLayerEvents !== 'undefined' && typeof DataLayerEvents.add_to_wishlist === 'function'){
					const productId = String(reqId);
					const stockId = String(stock);
					DataLayerEvents.add_to_wishlist(productId, stockId);
				}
			}

			successCallback.call(self, data);
		});
	}
}
