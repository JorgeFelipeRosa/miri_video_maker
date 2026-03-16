/* public/js/services/financeiro_service.js */
import { api } from '../config/api.js';

export const FinanceiroService = {
    // Busca o extrato geral (para a tela Financeiro.html)
    async listarGeral() {
        return await api.get('get_financeiro_geral');
    },

    // Salva/Remove parcelas (para o modal de Pedidos)
    async salvar(dados) {
        // dados espera: { action: 'create'|'delete', ... }
        return await api.post('manage_financeiro', dados);
    }
};