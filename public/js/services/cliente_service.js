/* public/js/services/cliente_service.js */
import { api } from '../config/api.js';

export const ClienteService = {
    async listar() {
        return await api.get('manage_clients');
    },

    async buscarPorId(id) {
        return await api.get(`manage_clients?id=${id}`);
    },

    /** Verifica se já existe cliente com este e-mail ou WhatsApp (retorna o cliente ou null). */
    async verificarDuplicado(email, whatsapp) {
        if (!email && !whatsapp) return null;
        const params = new URLSearchParams();
        if (email) params.set('email', email);
        if (whatsapp) params.set('whatsapp', whatsapp.replace(/\D/g, ''));
        const res = await api.get('manage_clients', '?' + params.toString());
        return res && (res.id || res.nome_razao_social) ? res : null;
    },

    async salvar(dados) {
        const action = dados.id ? 'update' : 'create';
        return await api.post('manage_clients', { 
            action, 
            ...dados 
        });
    },

    async deletar(id) {
        return await api.post('manage_clients', { 
            action: 'delete', 
            id 
        });
    }
};