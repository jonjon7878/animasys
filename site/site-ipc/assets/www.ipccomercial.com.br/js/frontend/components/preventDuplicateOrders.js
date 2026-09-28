// Variável global para verificar se o pedido já foi processado
var isOrderProcessed = false;

// Objeto para evitar pedidos duplicados
const preventDuplicateOrders = {
    init: function() {
        $(document).on("submit", "#PedidoAddForm", function(event) {
            // Verifica se o pedido já foi processado
            if (isOrderProcessed) {
                event.preventDefault();
                return false;
            } else {
                isOrderProcessed = true;

                //Datalayer
                window.dispatchEvent(new CustomEvent("add_payment_info"));
                window.dispatchEvent(new CustomEvent("add_shipping_info"));
            }
        });
    }
};

$(document).ready(function() {
    preventDuplicateOrders.init();
});
