/* public/js/controllers/servicos.js - REFATORADO */

import { ServicoService } from '../services/servico_service.js';
import { ListaService } from '../services/lista_service.js'; // Para buscar categorias
import { Modal } from '../modules/modal.js';
import { Toast } from '../modules/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- ELEMENTOS ---
    const listaContainer = document.getElementById('listaServicos');
    const btnNovo = document.getElementById('btnNovoServico');
    const btnSalvar = document.getElementById('btnSalvarServico');
    const modalTitle = document.querySelector('.modal-header h3');
    
    // Inputs
    const inputs = {
        id: null, // Controle de edição
        nome: document.getElementById('servNome'),
        categoria: document.getElementById('servCategoria'),
        preco: document.getElementById('servPreco'),
        descricao: document.getElementById('servDescricao')
    };

    let CACHE_SERVICOS = [];

    // --- 1. INICIALIZAÇÃO ---
    await carregarTela();

    async function carregarTela() {
        // Carrega Categorias no Select
        try {
            const categorias = await ListaService.listar('categorias_servico');
            inputs.categoria.innerHTML = '<option value="">Selecione...</option>';
            categorias.forEach(c => {
                inputs.categoria.innerHTML += `<option value="${c.id}">${c.descricao}</option>`;
            });
        } catch (e) { console.error("Erro categorias", e); }

        // Carrega Lista de Serviços
        await listarServicos();
    }

    async function listarServicos() {
        listaContainer.innerHTML = '<p style="color:#666; padding:20px;">Carregando catálogo...</p>';
        try {
            CACHE_SERVICOS = await ServicoService.listar(); // <--- SERVICE
            renderizar(CACHE_SERVICOS);
        } catch (e) {
            listaContainer.innerHTML = '<p style="color:var(--danger);">Erro ao carregar.</p>';
        }
    }

    function renderizar(lista) {
        listaContainer.innerHTML = '';
        
        if(lista.length === 0) {
            listaContainer.innerHTML = '<p style="color:#666; padding:20px;">Nenhum serviço cadastrado.</p>';
            return;
        }

        lista.forEach(s => {
            const precoFmt = parseFloat(s.preco_base).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
            const card = document.createElement('div');
            card.className = 'service-card';
            card.innerHTML = `
                <div class="card-header-svc">
                    <span class="badge-cat">${s.nome_categoria || 'Geral'}</span>
                    <div class="card-actions">
                        <div class="btn-icon-action" onclick="editar(${s.id})">
                            <i class="ph ph-pencil-simple"></i>
                        </div>
                        <div class="btn-icon-action delete" onclick="deletar(${s.id})">
                            <i class="ph ph-trash"></i>
                        </div>
                    </div>
                </div>
                <h3 class="service-title">${s.nome}</h3>
                <p class="service-desc">${s.descricao_tecnica || 'Sem descrição.'}</p>
                <div class="card-footer-svc">
                    <span class="service-price">${precoFmt}</span>
                </div>
            `;
            listaContainer.appendChild(card);
        });
    }

    // --- 2. AÇÕES (Novo, Editar, Salvar, Deletar) ---

    btnNovo.addEventListener('click', () => {
        inputs.id = null;
        modalTitle.innerText = "Novo Serviço";
        btnSalvar.innerText = "CRIAR SERVIÇO";
        
        // Limpa campos
        Object.values(inputs).forEach(inp => { if(inp && inp.value !== undefined) inp.value = ''; });
        
        Modal.open('modalServico');
    });

    // Função Global para o HTML chamar
    window.editar = (id) => {
        const servico = CACHE_SERVICOS.find(s => s.id === id);
        if(!servico) return;

        inputs.id = id;
        modalTitle.innerText = "Editar Serviço";
        btnSalvar.innerText = "SALVAR ALTERAÇÕES";

        inputs.nome.value = servico.nome;
        inputs.categoria.value = servico.id_categoria || "";
        inputs.preco.value = servico.preco_base;
        inputs.descricao.value = servico.descricao_tecnica || "";

        Modal.open('modalServico');
    };

    window.deletar = async (id) => {
        if(!confirm("Apagar este serviço?")) return;
        try {
            await ServicoService.deletar(id); // <--- SERVICE
            Toast.show("Serviço removido.", "success");
            listarServicos();
        } catch(e) { Toast.show("Erro ao deletar.", "error"); }
    };

    btnSalvar.addEventListener('click', async () => {
        if(!inputs.nome.value || !inputs.preco.value) return Toast.show("Preencha nome e preço", "error");

        const originalText = btnSalvar.innerText;
        btnSalvar.innerText = 'Salvando...';
        btnSalvar.disabled = true;

        try {
            const dados = {
                nome: inputs.nome.value,
                id_categoria: inputs.categoria.value,
                preco: inputs.preco.value,
                descricao: inputs.descricao.value
            };

            if (inputs.id) {
                await ServicoService.atualizar(inputs.id, dados);
            } else {
                await ServicoService.criar(dados);
            }
            
            Toast.show("Salvo com sucesso!", "success");
            Modal.close('modalServico');
            listarServicos();

        } catch (e) {
            Toast.show("Erro ao salvar", "error");
        } finally {
            btnSalvar.innerText = originalText;
            btnSalvar.disabled = false;
        }
    });
});