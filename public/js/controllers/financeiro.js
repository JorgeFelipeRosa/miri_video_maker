/* public/js/controllers/financeiro.js - REFATORADO */

import { FinanceiroService } from '../services/financeiro_service.js';
import { Format } from '../utils/format.js'; // Opcional, se quiser usar formatação centralizada

document.addEventListener('DOMContentLoaded', async () => {
    
    const listContainer = document.getElementById('listaTransacoes');
    const lblMonth = document.getElementById('labelMonth');
    const kpiTotal = document.getElementById('kpiTotal');
    const kpiRecebido = document.getElementById('kpiRecebido');
    const kpiPendente = document.getElementById('kpiPendente');

    let ALL_DATA = [];
    let currentDate = new Date();

    // --- 1. Inicialização ---
    await carregarDados();

    async function carregarDados() {
        try {
            listContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Carregando finanças...</p>';
            
            ALL_DATA = await FinanceiroService.listarGeral(); // <--- SERVICE
            
            renderizarTela();

        } catch (e) {
            console.error(e);
            listContainer.innerHTML = '<p style="color:var(--danger); text-align:center;">Erro ao carregar dados.</p>';
        }
    }

    // --- 2. Renderização e Filtros ---
    function renderizarTela() {
        const mesAlvo = currentDate.getMonth();
        const anoAlvo = currentDate.getFullYear();

        const nomesMeses = ["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
        lblMonth.innerText = `${nomesMeses[mesAlvo]} ${anoAlvo}`;

        // Filtra itens do mês
        const itensMes = ALL_DATA.filter(item => {
            if(!item.data_vencimento) return false;
            const d = new Date(item.data_vencimento + "T12:00:00"); 
            return d.getMonth() === mesAlvo && d.getFullYear() === anoAlvo;
        });

        // Totais
        let total = 0;
        let recebido = 0;
        
        listContainer.innerHTML = '';
        
        if (itensMes.length === 0) {
            listContainer.innerHTML = '<p style="text-align:center; padding:40px; color:#666;">Nenhum lançamento neste mês.</p>';
        } else {
            itensMes.forEach(item => {
                const valor = parseFloat(item.valor_parcela) || 0;
                total += valor;
                if (item.pago === 1) recebido += valor;

                // Data formatada
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
                        <span class="trans-client">${item.cliente || 'Cliente'} • ${item.titulo_evento || '-'}</span>
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
                
                // Opcional: Link para o pedido ao clicar
                if(item.id_pedido_capa) {
                    div.style.cursor = 'pointer';
                    // div.onclick = () => window.location.href = `pedidos.html?id=${item.id_pedido_capa}`; // Se quiser habilitar
                }
                
                listContainer.appendChild(div);
            });
        }

        // Atualiza KPIs
        kpiTotal.innerText = total.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
        kpiRecebido.innerText = recebido.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
        kpiPendente.innerText = (total - recebido).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
    }

    // --- 3. Navegação ---
    document.getElementById('btnPrevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderizarTela();
    });

    document.getElementById('btnNextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderizarTela();
    });
});