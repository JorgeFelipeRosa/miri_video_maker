/* public/js/controllers/clientes.js */

// ATENÇÃO AOS IMPORTS CORRIGIDOS:
import { ClienteService } from '../services/cliente_service.js';
import { Modal } from '../modules/modal.js';
import { Toast } from '../modules/toast.js'; // Assumindo que toast.js já existe e exporta Toast

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- Elementos e Inputs ---
    const listaContainer = document.getElementById('listaClientes');
    const searchInput = document.getElementById('searchInput');
    const btnNovo = document.getElementById('btnNovoCliente');
    const btnSalvar = document.getElementById('btnSalvarCliente');
    
    const inputs = {
        id: null,
        nome: document.getElementById('cliNome'),
        whatsapp: document.getElementById('cliWhats'),
        origem: document.getElementById('cliOrigem'),
        email: document.getElementById('cliEmail'),
        cpf: document.getElementById('cliCpf'),
        cep: document.getElementById('cliCep'),
        cidade: document.getElementById('cliCidade'),
        rua: document.getElementById('cliRua'),
        num: document.getElementById('cliNum'),
        bairro: document.getElementById('cliBairro'),
        uf: document.getElementById('cliUf')
    };

    let CACHE_CLIENTES = [];

    // --- 1. Inicialização ---
    
    await carregarTela();
    
    // Carrega Select de Origens
    try {
        const res = await fetch('/.netlify/functions/manage_lists?table=origens_contato');
        const origens = await res.json();
        inputs.origem.innerHTML = '<option value="">Selecione...</option>';
        origens.forEach(o => inputs.origem.innerHTML += `<option value="${o.descricao}">${o.descricao}</option>`);
    } catch (e) { console.error("Erro origens", e); }


    // --- 2. Funções de Tela ---

    async function carregarTela() {
        listaContainer.innerHTML = '<p style="text-align:center; color:#666;">Carregando...</p>';
        try {
            CACHE_CLIENTES = await ClienteService.listar(); 
            renderizar(CACHE_CLIENTES);
        } catch (error) {
            console.error(error);
            listaContainer.innerHTML = '<p style="color:var(--danger);">Erro ao carregar lista.</p>';
        }
    }

    function renderizar(lista) {
        listaContainer.innerHTML = '';
        if (!lista || lista.length === 0) {
            listaContainer.innerHTML = '<p style="text-align:center; color:#666;">Nenhum cliente encontrado.</p>';
            return;
        }

        lista.forEach(cli => {
            const inicial = cli.nome_razao_social ? cli.nome_razao_social.charAt(0).toUpperCase() : '?';
            const card = document.createElement('div');
            card.className = 'client-card';
            card.innerHTML = `
                <div class="client-avatar">${inicial}</div>
                <div class="client-info">
                    <div class="client-name">${cli.nome_razao_social}</div>
                    <div class="client-meta">
                        <span><i class="ph ph-whatsapp-logo"></i> ${cli.whatsapp || '-'}</span>
                        <span><i class="ph ph-map-pin"></i> ${cli.cidade || '-'}</span>
                    </div>
                </div>
                <div class="client-actions">
                    <div class="btn-icon-mini" onclick="editar(${cli.id})" title="Editar">
                        <i class="ph ph-pencil-simple"></i>
                    </div>
                </div>
            `;
            listaContainer.appendChild(card);
        });
    }

    // --- 3. Ações ---

    window.editar = (id) => {
        const cli = CACHE_CLIENTES.find(c => c.id === id);
        if(!cli) return;

        inputs.id = id;
        inputs.nome.value = cli.nome_razao_social || '';
        inputs.whatsapp.value = cli.whatsapp || '';
        inputs.email.value = cli.email || '';
        inputs.origem.value = cli.origem_contato || '';
        inputs.cpf.value = cli.cpf_cnpj || '';
        inputs.cep.value = cli.cep || '';
        inputs.cidade.value = cli.cidade || '';
        inputs.rua.value = cli.logradouro || '';
        inputs.num.value = cli.numero || '';
        inputs.bairro.value = cli.bairro || '';
        inputs.uf.value = cli.uf || '';

        Modal.open('modalCliente');
    };

    btnNovo.addEventListener('click', () => {
        inputs.id = null;
        Object.keys(inputs).forEach(k => { if(inputs[k] && inputs[k].value !== undefined) inputs[k].value = ''; });
        Modal.open('modalCliente');
    });

    btnSalvar.addEventListener('click', async () => {
        if (!inputs.nome.value) return Toast.show("Nome é obrigatório", "error");

        const email = (inputs.email.value || "").trim();
        const whatsapp = (inputs.whatsapp.value || "").trim();
        const isNovo = !inputs.id;

        if (isNovo && (email || whatsapp)) {
            const duplicado = await ClienteService.verificarDuplicado(email, whatsapp);
            if (duplicado) {
                Toast.show("Já existe cliente com este e-mail ou WhatsApp.", "error");
                return;
            }
        }

        const btnTxt = btnSalvar.innerText;
        btnSalvar.innerText = "Salvando...";
        btnSalvar.disabled = true;

        try {
            const dados = {
                id: inputs.id,
                nome: inputs.nome.value,
                whatsapp: inputs.whatsapp.value,
                email: inputs.email.value,
                origem: inputs.origem.value,
                cpf: inputs.cpf.value,
                cep: inputs.cep.value,
                cidade: inputs.cidade.value,
                rua: inputs.rua.value,
                numero: inputs.num.value,
                bairro: inputs.bairro.value,
                uf: inputs.uf.value
            };

            await ClienteService.salvar(dados);

            Toast.show("Salvo com sucesso!", "success");
            Modal.close('modalCliente');
            carregarTela();
        } catch (error) {
            Toast.show(error.message || "Erro ao salvar.", "error");
        } finally {
            btnSalvar.innerText = btnTxt;
            btnSalvar.disabled = false;
        }
    });

    searchInput.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const filtrados = CACHE_CLIENTES.filter(c => 
            (c.nome_razao_social && c.nome_razao_social.toLowerCase().includes(termo)) ||
            (c.cidade && c.cidade.toLowerCase().includes(termo))
        );
        renderizar(filtrados);
    });
});