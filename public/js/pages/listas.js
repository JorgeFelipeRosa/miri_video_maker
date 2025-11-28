/* public/js/pages/listas.js */

document.addEventListener('DOMContentLoaded', () => {
    
    const tabs = document.querySelectorAll('.menu-tab');
    const listTitle = document.getElementById('listTitle');
    const listaItens = document.getElementById('listaItens');
    const inputNovoItem = document.getElementById('inputNovoItem');
    const btnAddItem = document.getElementById('btnAddItem');

    // Define a tabela inicial baseada na primeira aba ativa
    let CURRENT_TABLE = 'categorias_servico'; 

    // 1. Navegação por Abas
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Visual
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Lógica
            CURRENT_TABLE = tab.dataset.table;
            listTitle.innerText = tab.innerText;
            
            // Carrega dados
            carregarLista();
        });
    });

    // 2. Buscar Dados
    async function carregarLista() {
        listaItens.innerHTML = '<p class="loading-text">Carregando...</p>';
        
        try {
            const response = await fetch(`/.netlify/functions/manage_lists?table=${CURRENT_TABLE}`);
            
            // Se o servidor der erro (500), lemos o texto do erro
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || "Erro no servidor");
            }

            const data = await response.json();

            // Proteção: Se data não for lista, lança erro
            if (!Array.isArray(data)) {
                throw new Error("O servidor não retornou uma lista válida.");
            }

            listaItens.innerHTML = '';
            
            if(data.length === 0) {
                listaItens.innerHTML = '<p class="loading-text">Nenhum item cadastrado.</p>';
                return;
            }

            data.forEach(item => {
                const div = document.createElement('div');
                div.className = 'list-item';
                // Verifica se o campo é 'descricao' ou 'nome' (algumas tabelas antigas podem usar nome)
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
            // Mostra o erro na tela para facilitar debug
            listaItens.innerHTML = `<p class="loading-text" style="color:var(--danger)">Erro: ${error.message}</p>`;
        }
    }

    // 3. Adicionar Novo
    btnAddItem.addEventListener('click', async () => {
        const descricao = inputNovoItem.value.trim();
        if(!descricao) return;

        const originalIcon = btnAddItem.innerHTML;
        btnAddItem.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';
        btnAddItem.disabled = true;

        try {
            const response = await fetch('/.netlify/functions/manage_lists', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'create',
                    table: CURRENT_TABLE,
                    descricao: descricao
                })
            });

            if(!response.ok) throw new Error(await response.text());
            
            inputNovoItem.value = '';
            carregarLista();

        } catch (error) {
            alert("Erro ao salvar: " + error.message);
        } finally {
            btnAddItem.innerHTML = '<i class="ph ph-plus"></i>';
            btnAddItem.disabled = false;
        }
    });

    // 4. Deletar
    window.deletarItem = async (id) => {
        if(!confirm("Deseja remover este item?")) return;
        
        try {
            const response = await fetch('/.netlify/functions/manage_lists', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'delete',
                    table: CURRENT_TABLE,
                    item_id: id
                })
            });
            
            if(!response.ok) throw new Error(await response.text());
            carregarLista();

        } catch (error) {
            alert("Erro ao deletar: " + error.message);
        }
    };

    // Inicia
    carregarLista();
});