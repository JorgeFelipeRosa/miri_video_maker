/* public/js/pages/servicos.js */

document.addEventListener('DOMContentLoaded', async () => {
    
    const listaContainer = document.getElementById('listaServicos');
    const btnNovo = document.getElementById('btnNovoServico');
    const btnSalvar = document.getElementById('btnSalvarServico');
    
    // Modal
    const modal = document.getElementById('modalServico');
    const closeBtns = document.querySelectorAll('.btn-close-modal');
    const modalTitle = document.querySelector('.modal-header h3');
    
    // Inputs
    const inpNome = document.getElementById('servNome');
    const inpCat = document.getElementById('servCategoria');
    const inpPreco = document.getElementById('servPreco');
    const inpDesc = document.getElementById('servDescricao');

    // Variável para controlar Edição (null = novo, número = editando)
    let ID_EDICAO = null;
    let SERVICOS_CACHE = []; // Guarda os dados para facilitar edição

    // 1. CARREGAR DADOS
    async function carregarTela() {
        // A. Carrega Categorias
        try {
            const resCat = await fetch('/.netlify/functions/manage_lists?table=categorias_servico');
            const categorias = await resCat.json();
            inpCat.innerHTML = '<option value="">Selecione...</option>';
            categorias.forEach(c => {
                inpCat.innerHTML += `<option value="${c.id}">${c.descricao}</option>`;
            });
        } catch (e) { console.error("Erro categorias", e); }

        // B. Carrega Serviços
        carregarServicos();
    }

    async function carregarServicos() {
        listaContainer.innerHTML = '<p style="color:#666;">Carregando catálogo...</p>';
        try {
            const res = await fetch('/.netlify/functions/manage_services');
            SERVICOS_CACHE = await res.json();
            
            listaContainer.innerHTML = '';
            
            if(SERVICOS_CACHE.length === 0) {
                listaContainer.innerHTML = '<p style="color:#666;">Nenhum serviço cadastrado.</p>';
                return;
            }

            SERVICOS_CACHE.forEach(s => {
                const card = document.createElement('div');
                card.className = 'service-card';
                card.innerHTML = `
                    <div class="card-header-svc">
                        <span class="badge-cat">${s.nome_categoria || 'Geral'}</span>
                        <div class="card-actions">
                            <div class="btn-icon-action" onclick="abrirEdicao(${s.id})">
                                <i class="ph ph-pencil-simple"></i>
                            </div>
                            <div class="btn-icon-action delete" onclick="deletarServico(${s.id})">
                                <i class="ph ph-trash"></i>
                            </div>
                        </div>
                    </div>
                    <h3 class="service-title">${s.nome}</h3>
                    <p class="service-desc">${s.descricao_tecnica || 'Sem descrição.'}</p>
                    <div class="card-footer-svc">
                        <span class="service-price">${parseFloat(s.preco_base).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span>
                    </div>
                `;
                listaContainer.appendChild(card);
            });

        } catch (e) {
            listaContainer.innerHTML = '<p style="color:var(--danger);">Erro ao carregar.</p>';
        }
    }

    // 2. ABRIR MODAL (NOVO ou EDITAR)
    
    // Novo
    btnNovo.addEventListener('click', () => {
        ID_EDICAO = null; // Limpa ID
        modalTitle.innerText = "Novo Serviço";
        btnSalvar.innerText = "CRIAR SERVIÇO";
        
        // Limpa campos
        inpNome.value = '';
        inpPreco.value = '';
        inpDesc.value = '';
        inpCat.value = '';
        
        openModal();
    });

    // Editar (Função Global para ser chamada no HTML do card)
    window.abrirEdicao = (id) => {
        const servico = SERVICOS_CACHE.find(s => s.id === id);
        if(!servico) return;

        ID_EDICAO = id; // Marca ID
        modalTitle.innerText = "Editar Serviço";
        btnSalvar.innerText = "SALVAR ALTERAÇÕES";

        // Preenche campos
        inpNome.value = servico.nome;
        inpCat.value = servico.id_categoria || "";
        inpPreco.value = servico.preco_base;
        inpDesc.value = servico.descricao_tecnica || "";

        openModal();
    };

    function openModal() { modal.classList.add('active'); }
    function closeModal() { modal.classList.remove('active'); }
    closeBtns.forEach(b => b.addEventListener('click', closeModal));

    // 3. SALVAR (CREATE ou UPDATE)
    btnSalvar.addEventListener('click', async () => {
        const nome = inpNome.value;
        const preco = inpPreco.value;
        const cat = inpCat.value;

        if(!nome || !preco) return alert("Preencha nome e preço");

        const originalText = btnSalvar.innerText;
        btnSalvar.innerText = 'Salvando...';
        btnSalvar.disabled = true;

        try {
            // Define se é CREATE ou UPDATE
            const action = ID_EDICAO ? 'update' : 'create';
            
            const payload = {
                action: action,
                id: ID_EDICAO, // Vai ser null se for novo, ou o ID se for edit
                nome: nome,
                id_categoria: cat,
                preco: preco,
                descricao: inpDesc.value
            };

            await fetch('/.netlify/functions/manage_services', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            closeModal();
            carregarServicos(); // Recarrega a lista

        } catch (e) {
            alert("Erro ao salvar");
        } finally {
            btnSalvar.innerText = originalText;
            btnSalvar.disabled = false;
        }
    });

    // 4. DELETAR
    window.deletarServico = async (id) => {
        if(!confirm("Apagar este serviço?")) return;
        await fetch('/.netlify/functions/manage_services', {
            method: 'POST',
            body: JSON.stringify({ action: 'delete', id: id })
        });
        carregarServicos();
    };

    // START
    carregarTela();
});