/* public/js/controllers/listas.js - REFATORADO */

import { ListaService } from '../services/lista_service.js';
import { Toast } from '../modules/toast.js';

document.addEventListener('DOMContentLoaded', () => {
    
    const tabs = document.querySelectorAll('.menu-tab');
    const listTitle = document.getElementById('listTitle');
    const listaItens = document.getElementById('listaItens');
    const inputNovoItem = document.getElementById('inputNovoItem');
    const btnAddItem = document.getElementById('btnAddItem');

    // Tabela inicial
    let CURRENT_TABLE = 'categorias_servico'; 

    // --- 1. Inicialização ---
    init();

    function init() {
        carregarLista();
        setupTabs();
    }

    // --- 2. Lógica de Abas ---
    function setupTabs() {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Visual
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Dados
                CURRENT_TABLE = tab.dataset.table;
                listTitle.innerText = tab.innerText;
                
                carregarLista();
            });
        });
    }

    // --- 3. Buscar Dados ---
    async function carregarLista() {
        listaItens.innerHTML = '<p class="loading-text">Carregando...</p>';
        
        try {
            const data = await ListaService.listar(CURRENT_TABLE); // <--- SERVICE

            if (!Array.isArray(data)) throw new Error("Lista inválida.");

            listaItens.innerHTML = '';
            
            if(data.length === 0) {
                listaItens.innerHTML = '<p class="loading-text">Nenhum item cadastrado.</p>';
                return;
            }

            data.forEach(item => {
                const div = document.createElement('div');
                div.className = 'list-item';
                const texto = item.descricao || item.nome || "Sem descrição";
                
                div.innerHTML = `
                    <span>${texto}</span>
                    <button class="btn-delete" onclick="deletarItem(${item.id})">
                        <i class="ph ph-trash"></i>
                    </button>
                `;
                listaItens.appendChild(div);
            });

        } catch (error) {
            console.error(error);
            listaItens.innerHTML = `<p class="loading-text" style="color:var(--danger)">Erro ao carregar.</p>`;
        }
    }

    // --- 4. Ações (Adicionar / Deletar) ---

    btnAddItem.addEventListener('click', async () => {
        const descricao = inputNovoItem.value.trim();
        if(!descricao) return Toast.show("Digite um nome.", "error");

        btnAddItem.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';
        btnAddItem.disabled = true;

        try {
            await ListaService.criar(CURRENT_TABLE, descricao); // <--- SERVICE
            Toast.show("Item adicionado!", "success");
            inputNovoItem.value = '';
            carregarLista();
        } catch (error) {
            Toast.show("Erro ao salvar.", "error");
        } finally {
            btnAddItem.innerHTML = '<i class="ph ph-plus"></i>';
            btnAddItem.disabled = false;
        }
    });

    // Função Global
    window.deletarItem = async (id) => {
        if(!confirm("Deseja remover este item?")) return;
        
        try {
            await ListaService.deletar(CURRENT_TABLE, id); // <--- SERVICE
            Toast.show("Item removido.", "success");
            carregarLista();
        } catch (error) {
            Toast.show("Erro ao deletar.", "error");
        }
    };
});