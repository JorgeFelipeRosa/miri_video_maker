/* public/js/pages/orcamentos.js */

document.addEventListener('DOMContentLoaded', async () => {
    
    const listaContainer = document.getElementById('listaOrcamentos');
    const searchInput = document.getElementById('searchInput');
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    // Guarda TODOS os dados aqui para filtrar rápido
    let ALL_DATA = [];
    let CURRENT_FILTER_STATUS = 'all'; // 'all', '1', '2', '3'

    const STATUS_MAP = {
        1: { texto: 'Rascunho', classe: 'draft' },
        2: { texto: 'Enviado', classe: 'sent' },
        3: { texto: 'Fechado', classe: 'closed' }
    };

    // 1. CARREGAR DADOS
    async function carregarOrcamentos() {
        try {
            listaContainer.innerHTML = '<p style="text-align:center; color:#666; margin-top:40px;">Carregando...</p>';

            const response = await fetch('/.netlify/functions/get_orcamentos');
            if (!response.ok) throw new Error("Erro ao buscar dados");
            
            ALL_DATA = await response.json(); // Salva na memória

            renderizarLista(ALL_DATA);

        } catch (error) {
            console.error(error);
            listaContainer.innerHTML = '<p style="text-align:center; color:#e74c3c;">Erro ao carregar lista.</p>';
        }
    }

    // 2. RENDERIZAR (Desenhar os cards)
    function renderizarLista(lista) {
        listaContainer.innerHTML = '';

        if (lista.length === 0) {
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

    // 3. CRIAR HTML DO CARD
    function criarCard(data) {
        // Data
        let dataFormatada = "Data a definir";
        try {
            if(data.data_evento) {
                const partes = data.data_evento.split('-');
                // Cria data UTC para evitar timezone bug
                const dateObj = new Date(partes[0], partes[1]-1, partes[2]); 
                const dia = String(dateObj.getDate()).padStart(2, '0');
                const meses = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
                const mes = meses[dateObj.getMonth()];
                const ano = String(dateObj.getFullYear()).slice(-2);
                dataFormatada = `${dia} ${mes} ${ano}`;
            }
        } catch(e) {}

        // Valor
        const valor = parseFloat(data.valor_total_geral) || 0;
        const valorFormatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Status
        const statusInfo = STATUS_MAP[data.id_status] || STATUS_MAP[1];

        const a = document.createElement('a');
        a.href = `editor-orcamento.html?id=${data.id}`;
        a.className = 'quote-card-luxury';
        
        a.innerHTML = `
            <div class="card-header">
                <span class="card-date">${dataFormatada}</span>
                <div class="status-pill ${statusInfo.classe}">
                    <span class="dot"></span> ${statusInfo.texto}
                </div>
            </div>
            <div class="card-body">
                <h3 class="client-name">${data.titulo_evento || "Sem Título"}</h3>
                <p class="service-type">${data.nome_cliente || "Cliente Novo"}</p>
            </div>
            <div class="card-footer">
                <div class="price-box">
                    <span class="value">${valorFormatado}</span>
                </div>
                <i class="ph ph-caret-right action-icon"></i>
            </div>
        `;
        return a;
    }

    // 4. LÓGICA DE FILTRO E BUSCA
    function aplicarFiltros() {
        const termo = searchInput.value.toLowerCase();
        
        const filtrados = ALL_DATA.filter(item => {
            // Filtro de Texto (Nome ou Título)
            const matchTexto = (item.titulo_evento || "").toLowerCase().includes(termo) || 
                               (item.nome_cliente || "").toLowerCase().includes(termo);
            
            // Filtro de Status (Aba)
            const matchStatus = CURRENT_FILTER_STATUS === 'all' || item.id_status == CURRENT_FILTER_STATUS;

            return matchTexto && matchStatus;
        });

        renderizarLista(filtrados);
    }

    // Evento: Digitar na busca
    searchInput.addEventListener('input', aplicarFiltros);

    // Evento: Clicar nas abas
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active de todos
            filterTabs.forEach(t => t.classList.remove('active'));
            // Adiciona no clicado
            tab.classList.add('active');
            
            // Atualiza filtro
            CURRENT_FILTER_STATUS = tab.dataset.filter;
            aplicarFiltros();
        });
    });

    // INICIALIZAR
    carregarOrcamentos();
});