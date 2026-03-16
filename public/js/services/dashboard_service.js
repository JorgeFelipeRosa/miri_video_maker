/* public/js/services/dashboard_service.js */
import { api } from '../config/api.js';

export const DashboardService = {
    async getFinanceiro() {
        return await api.get('get_financeiro_geral');
    },

    async getOrcamentos() {
        return await api.get('get_orcamentos');
    },

    async getPedidos() {
        return await api.get('get_pedidos');
    },

    /** Eventos do calendário (orçamentos + pedidos) no período. inicio/fim: YYYY-MM-DD */
    async getEventosSemana(inicio, fim) {
        return await api.get('calendario', `?inicio=${inicio}&fim=${fim}`);
    }
};