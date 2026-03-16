/* public/js/services/lista_service.js */
import { api } from '../config/api.js';

export const ListaService = {
    // Busca dados de qualquer tabela auxiliar (categorias, formas_pagamento, etc)
    async listar(tabela) {
        return await api.get(`manage_lists?table=${tabela}`);
    },

    // Cria um item novo
    async criar(tabela, descricao) {
        return await api.post('manage_lists', { 
            action: 'create', 
            table: tabela, 
            descricao 
        });
    },

    // Deleta um item
    async deletar(tabela, id) {
        return await api.post('manage_lists', { 
            action: 'delete', 
            table: tabela, 
            item_id: id 
        });
    }
};