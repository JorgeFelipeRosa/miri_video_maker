/* public/js/pages/financeiro.js */

document.addEventListener('DOMContentLoaded', async () => {
    
    const listContainer = document.getElementById('listaTransacoes');
    const lblMonth = document.getElementById('labelMonth');
    const kpiTotal = document.getElementById('kpiTotal');
    const kpiRecebido = document.getElementById('kpiRecebido');
    const kpiPendente = document.getElementById('kpiPendente');

    let ALL_DATA = [];
    let currentDate = new Date(); // Data do filtro

    // 1. CARREGAR DADOS
    async function carregarDados() {
        try {
            listContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Carregando finanças...</p>';
            
            const res = await fetch('/.netlify/functions/get_financeiro_geral');
            ALL_DATA = await res.json();
            
            renderizarTela();

        } catch (e) {
            console.error(e);
            listContainer.innerHTML = '<p style="color:var(--danger); text-align:center;">Erro ao carregar.</p>';
        }
    }

    // 2. FILTRAR E RENDERIZAR
    function renderizarTela() {
        // Filtra pelo Mês/Ano selecionado
        const mesAlvo = currentDate.getMonth();
        const anoAlvo = currentDate.getFullYear();

        // Atualiza Label
        const nomesMeses = ["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
        lblMonth.innerText = `${nomesMeses[mesAlvo]} ${anoAlvo}`;

        // Filtra itens
        const itensMes = ALL_DATA.filter(item => {
            // Usa data de vencimento como referência
            if(!item.data_vencimento) return false;
            // Corrige bug de timezone criando data com horas zeradas
            const d = new Date(item.data_vencimento + "T12:00:00"); 
            return d.getMonth() === mesAlvo && d.getFullYear() === anoAlvo;
        });

        // Calcula Totais
        let total = 0;
        let recebido = 0;
        
        listContainer.innerHTML = '';
        
        if (itensMes.length === 0) {
            listContainer.innerHTML = '<p style="text-align:center; padding:40px; color:#666;">Nenhum lançamento neste mês.</p>';
        } else {
            itensMes.forEach(item => {
                const valor = item.valor_parcela || 0;
                total += valor;
                if (item.pago === 1) recebido += valor;

                // Cria linha HTML
                const d = new Date(item.data_vencimento + "T12:00:00");
                const dia = String(d.getDate()).padStart(2,'0');
                const mesAbrev = nomesMeses[d.getMonth()].substring(0,3);
                
                const div = document.createElement('div');
                div.className = 'trans-row';
                div.innerHTML = `
                    <div class="trans-date">
                        <span class="trans-day">${dia}</span>
                        <span class="trans-month">${mesAbrev}</span>
                    </div>
                    <div class="trans-info">
                        <span class="trans-desc">${item.descricao}</span>
                        <span class="trans-client">${item.cliente} • ${item.titulo_evento}</span>
                    </div>
                    <div class="trans-value">
                        <span class="amount ${item.pago === 1 ? 'paid' : 'pending'}">
                            ${valor.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}
                        </span>
                        <span class="status-badge ${item.pago === 1 ? 'paid' : 'pending'}">
                            ${item.pago === 1 ? 'RECEBIDO' : 'PENDENTE'}
                        </span>
                    </div>
                `;
                // Futuramente: Adicionar clique para ir ao pedido
                div.addEventListener('click', () => {
                    // window.location.href = `pedidos.html` // (Opcional)
                });
                
                listContainer.appendChild(div);
            });
        }

        // Atualiza KPIs
        kpiTotal.innerText = total.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
        kpiRecebido.innerText = recebido.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
        kpiPendente.innerText = (total - recebido).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
    }

    // 3. BOTÕES DE NAVEGAÇÃO
    document.getElementById('btnPrevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderizarTela();
    });

    document.getElementById('btnNextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderizarTela();
    });

    // Start
    carregarDados();
});