
/* public/js/services/pedido_service.js */
import { api } from '../config/api.js';

export const PedidoService = {
    async listar() {
        return await api.get('get_pedidos');
    },

    async buscarPorId(id) {
        return await api.get(`get_pedido_detalhes?id=${id}`);
    },

    // Atualiza status, itens, datas, etc.
    async salvarAcao(payload) {
        return await api.post('manage_pedido_actions', payload);
    }
};