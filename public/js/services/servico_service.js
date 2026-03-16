/* public/js/services/servico_service.js */
import { api } from '../config/api.js';

export const ServicoService = {
    // Listar todos os serviços
    async listar() {
        return await api.get('manage_services');
    },

    // Criar novo serviço
    async criar(dados) {
        return await api.post('manage_services', { action: 'create', ...dados });
    },

    // Atualizar serviço existente
    async atualizar(id, dados) {
        return await api.post('manage_services', { action: 'update', id, ...dados });
    },

    // Deletar serviço
    async deletar(id) {
        return await api.post('manage_services', { action: 'delete', id });
    }
};