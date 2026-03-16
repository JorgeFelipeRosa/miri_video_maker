/* public/js/services/orcamento_service.js */
import { api } from '../config/api.js';

export const OrcamentoService = {
    // Lista para a tela principal
    async listar() {
        return await api.get('get_orcamentos');
    },

    // Carrega dados para o Editor (Config, Clientes, Serviços)
    async carregarDadosEditor() {
        return await api.get('load_editor_data');
    },

    // Busca detalhes de um orçamento específico
    async buscarPorId(id) {
        return await api.get(`get_orcamento_detalhes?id=${id}`);
    },

    // Salva (Cria ou Atualiza)
    async salvar(dados) {
        return await api.post('save_orcamento', dados);
    },

    // Deleta
    async deletar(id) {
        return await api.post('delete_orcamento', { id });
    },

    // Aprova (Gera Pedido)
    async aprovar(dados) {
        return await api.post('approve_orcamento', dados);
    },

    // Atualiza status rápido (ex: marcar como enviado)
    async atualizarStatus(id, status) {
        return await api.post('update_orcamento_status', { id, new_status: status });
    }
};