/* public/js/pages/clientes.js */

document.addEventListener('DOMContentLoaded', async () => {
    
    const listaContainer = document.getElementById('listaClientes');
    const searchInput = document.getElementById('searchInput');
    const btnNovo = document.getElementById('btnNovoCliente');
    const btnSalvar = document.getElementById('btnSalvarCliente');
    
    // Modal
    const modal = document.getElementById('modalCliente');
    const closeBtns = document.querySelectorAll('.btn-close-modal');
    
    // Campos
    const inputs = {
        nome: document.getElementById('cliNome'),
        whatsapp: document.getElementById('cliWhats'),
        origem: document.getElementById('cliOrigem'), // Agora é um SELECT
        email: document.getElementById('cliEmail'),
        cpf: document.getElementById('cliCpf'),
        cep: document.getElementById('cliCep'),
        cidade: document.getElementById('cliCidade'),
        rua: document.getElementById('cliRua'),
        num: document.getElementById('cliNum'),
        bairro: document.getElementById('cliBairro'),
        uf: document.getElementById('cliUf')
    };

    let CLIENTES_CACHE = [];
    let ID_EDICAO = null;

    // 1. CARREGAR LISTAS AUXILIARES (Origens)
    async function carregarOrigens() {
        try {
            // Chama a função que lista as tabelas auxiliares
            const response = await fetch('/.netlify/functions/manage_lists?table=origens_contato');
            const origens = await response.json();
            
            // Limpa e adiciona opção padrão
            inputs.origem.innerHTML = '<option value="">Selecione...</option>';
            
            // Preenche o Select
            if (Array.isArray(origens)) {
                origens.forEach(item => {
                    // Salvamos a descrição no value também para facilitar a leitura no banco
                    const option = document.createElement('option');
                    option.value = item.descricao; 
                    option.innerText = item.descricao;
                    inputs.origem.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Erro ao carregar origens:", error);
            inputs.origem.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }

    // 2. CARREGAR CLIENTES
    async function carregarClientes() {
        if(!listaContainer) return;
        listaContainer.innerHTML = '<p style="text-align:center; color:#666;">Carregando contatos...</p>';
        try {
            const res = await fetch('/.netlify/functions/manage_clients');
            CLIENTES_CACHE = await res.json();
            renderizarLista(CLIENTES_CACHE);
        } catch (e) {
            console.error(e);
            listaContainer.innerHTML = '<p style="color:var(--danger);">Erro ao carregar.</p>';
        }
    }

    // 3. RENDERIZAR
    function renderizarLista(lista) {
        listaContainer.innerHTML = '';
        if (!lista || lista.length === 0) {
            listaContainer.innerHTML = '<p style="text-align:center; color:#666;">Nenhum cliente encontrado.</p>';
            return;
        }

        lista.forEach(cli => {
            const inicial = cli.nome_razao_social ? cli.nome_razao_social.charAt(0).toUpperCase() : '?';
            const whatsLink = cli.whatsapp ? `https://wa.me/55${cli.whatsapp.replace(/\D/g,'')}` : '#';
            
            const card = document.createElement('div');
            card.className = 'client-card';
            card.innerHTML = `
                <div class="client-avatar">${inicial}</div>
                <div class="client-info">
                    <div class="client-name">${cli.nome_razao_social || 'Sem Nome'}</div>
                    <div class="client-meta">
                        <span><i class="ph ph-whatsapp-logo"></i> ${cli.whatsapp || '-'}</span>
                        <span><i class="ph ph-share-network"></i> ${cli.origem_contato || 'N/A'}</span>
                    </div>
                </div>
                <div class="client-actions">
                    <a href="${whatsLink}" target="_blank" class="btn-icon-mini whatsapp" title="Chamar no Whats">
                        <i class="ph ph-whatsapp-logo"></i>
                    </a>
                    <div class="btn-icon-mini" onclick="editarCliente(${cli.id})" title="Editar">
                        <i class="ph ph-pencil-simple"></i>
                    </div>
                </div>
            `;
            listaContainer.appendChild(card);
        });
    }

    // 4. MODAIS E EVENTOS
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase();
            const filtrados = CLIENTES_CACHE.filter(c => 
                (c.nome_razao_social && c.nome_razao_social.toLowerCase().includes(termo)) || 
                (c.cidade && c.cidade.toLowerCase().includes(termo))
            );
            renderizarLista(filtrados);
        });
    }

    function openModal() { if(modal) modal.classList.add('active'); }
    function closeModal() { if(modal) modal.classList.remove('active'); }
    
    if(btnNovo) {
        btnNovo.addEventListener('click', () => {
            ID_EDICAO = null;
            Object.values(inputs).forEach(inp => { if(inp) inp.value = ''; });
            openModal();
        });
    }

    closeBtns.forEach(b => b.addEventListener('click', closeModal));

    // 5. EDITAR (Global)
    window.editarCliente = (id) => {
        const cli = CLIENTES_CACHE.find(c => c.id === id);
        if(!cli) return;
        
        ID_EDICAO = id;
        if(inputs.nome) inputs.nome.value = cli.nome_razao_social || '';
        if(inputs.whatsapp) inputs.whatsapp.value = cli.whatsapp || '';
        if(inputs.email) inputs.email.value = cli.email || '';
        
        // Aqui o select seleciona a opção correta automaticamente
        if(inputs.origem) inputs.origem.value = cli.origem_contato || '';
        
        if(inputs.cpf) inputs.cpf.value = cli.cpf_cnpj || '';
        if(inputs.cep) inputs.cep.value = cli.cep || '';
        if(inputs.cidade) inputs.cidade.value = cli.cidade || '';
        if(inputs.rua) inputs.rua.value = cli.logradouro || '';
        if(inputs.num) inputs.num.value = cli.numero || '';
        if(inputs.bairro) inputs.bairro.value = cli.bairro || '';
        if(inputs.uf) inputs.uf.value = cli.uf || '';

        openModal();
    };

    // 6. SALVAR
    if(btnSalvar) {
        btnSalvar.addEventListener('click', async () => {
            if(!inputs.nome || !inputs.nome.value) return alert("Nome é obrigatório");

            const originalText = btnSalvar.innerText;
            btnSalvar.innerText = "Salvando...";
            btnSalvar.disabled = true;

            try {
                const payload = {
                    action: ID_EDICAO ? 'update' : 'create',
                    id: ID_EDICAO,
                    nome: inputs.nome.value,
                    whatsapp: inputs.whatsapp.value,
                    email: inputs.email.value,
                    origem: inputs.origem.value, // Pega o valor selecionado no dropdown
                    cpf: inputs.cpf.value,
                    cep: inputs.cep.value,
                    cidade: inputs.cidade.value,
                    rua: inputs.rua.value,
                    numero: inputs.num.value,
                    bairro: inputs.bairro.value,
                    uf: inputs.uf.value
                };

                const res = await fetch('/.netlify/functions/manage_clients', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                if(!res.ok) throw new Error(await res.text());

                closeModal();
                carregarClientes();

            } catch (e) {
                alert("Erro ao salvar: " + e.message);
            } finally {
                btnSalvar.innerText = originalText;
                btnSalvar.disabled = false;
            }
        });
    }

    // START
    carregarOrigens(); // Carrega o dropdown primeiro
    carregarClientes(); // Carrega a lista
});