/* public/js/controllers/orcamentos.js - REFATORADO */
import { OrcamentoService } from '../services/orcamento_service.js';
// import { Format } from '../utils/format.js'; // Caso precise, mas aqui formatamos manual

document.addEventListener('DOMContentLoaded', async () => {
    
    const listaContainer = document.getElementById('listaOrcamentos');
    const searchInput = document.getElementById('searchInput');
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    let CACHE_DADOS = [];
    let FILTRO_STATUS = 'all'; 

    const STATUS_MAP = {
        1: { texto: 'Rascunho', classe: 'draft' },
        2: { texto: 'Enviado', classe: 'sent' },
        3: { texto: 'Fechado', classe: 'closed' }
    };

    // --- 1. Inicialização ---
    await carregarLista();

    // --- 2. Funções ---
    async function carregarLista() {
        listaContainer.innerHTML = '<p style="text-align:center; margin-top:40px; color:#666;">Carregando...</p>';
        try {
            CACHE_DADOS = await OrcamentoService.listar(); // <--- SERVICE
            renderizar(CACHE_DADOS);
        } catch (error) {
            console.error(error);
            listaContainer.innerHTML = '<p style="text-align:center; color:var(--danger);">Erro ao carregar lista.</p>';
        }
    }

    function renderizar(lista) {
        listaContainer.innerHTML = '';

        if (!lista || lista.length === 0) {
            listaContainer.innerHTML = `
                <div style="text-align:center; padding:40px; color:#666;">
                    <i class="ph ph-files" style="font-size: 2rem; margin-bottom: 10px; display:block;"></i>
                    Nenhum orçamento encontrado.
                </div>`;
            return;
        }

        lista.forEach(orc => {
            const card = criarCard(orc);
            listaContainer.appendChild(card);
        });
    }

    function criarCard(data) {
        // Formatação de Data simples
        let dataFmt = "Data a definir";
        if(data.data_evento) {
            try {
                const [ano, mes, dia] = data.data_evento.split('-');
                const meses = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
                dataFmt = `${dia} ${meses[parseInt(mes)-1]} ${ano.slice(-2)}`;
            } catch(e){}
        }

        const valor = parseFloat(data.valor_total_geral) || 0;
        const valorFmt = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const status = STATUS_MAP[data.id_status] || STATUS_MAP[1];

        const a = document.createElement('a');
        a.href = `editor-orcamento.html?id=${data.id}`;
        a.className = 'quote-card-luxury';
        
        a.innerHTML = `
            <div class="card-header">
                <span class="card-date">${dataFmt}</span>
                <div class="status-pill ${status.classe}">
                    <span class="dot"></span> ${status.texto}
                </div>
            </div>
            <div class="card-body">
                <h3 class="client-name">${data.titulo_evento || "Sem Título"}</h3>
                <p class="service-type">${data.nome_cliente || "Cliente Novo"}</p>
            </div>
            <div class="card-footer">
                <div class="price-box">
                    <span class="value">${valorFmt}</span>
                </div>
                <i class="ph ph-caret-right action-icon"></i>
            </div>
        `;
        return a;
    }

    // --- 3. Filtros ---
    function aplicarFiltros() {
        const termo = searchInput.value.toLowerCase();
        const filtrados = CACHE_DADOS.filter(item => {
            const textoMatch = (item.titulo_evento || "").toLowerCase().includes(termo) || 
                               (item.nome_cliente || "").toLowerCase().includes(termo);
            const statusMatch = FILTRO_STATUS === 'all' || item.id_status == FILTRO_STATUS;
            return textoMatch && statusMatch;
        });
        renderizar(filtrados);
    }

    searchInput.addEventListener('input', aplicarFiltros);

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            FILTRO_STATUS = tab.dataset.filter;
            aplicarFiltros();
        });
    });
});