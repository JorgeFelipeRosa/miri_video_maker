/* public/js/controllers/dashboard.js */
import { DashboardService } from '../services/dashboard_service.js';

document.addEventListener('DOMContentLoaded', async () => {
    const kpiFat = document.getElementById('kpiFaturamento');
    const kpiEdicao = document.getElementById('kpiEdicao');
    const kpiOrc = document.getElementById('kpiOrcamentos');
    const headerDate = document.getElementById('headerDate');
    const eventosSemanaList = document.getElementById('eventosSemanaList');
    const eventosSemanaEmpty = document.getElementById('eventosSemanaEmpty');

    // Data no header (HOJE · 16 mar)
    if (headerDate) {
        const hoje = new Date();
        const dia = hoje.getDate();
        const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        headerDate.innerHTML = `<span>HOJE · ${dia} ${meses[hoje.getMonth()]}</span>`;
    }

    try {
        const [financas, orcamentos, pedidos] = await Promise.all([
            DashboardService.getFinanceiro(),
            DashboardService.getOrcamentos(),
            DashboardService.getPedidos()
        ]);

        const arrFin = Array.isArray(financas) ? financas : [];
        const arrPed = Array.isArray(pedidos) ? pedidos : [];
        const arrOrc = Array.isArray(orcamentos) ? orcamentos : [];
        const totalMes = arrFin.reduce((acc, item) => acc + (item.valor_parcela || 0), 0);
        const emEdicao = arrPed.filter(p => p.id_status === 3).length;
        const abertos = arrOrc.filter(o => o.id_status === 1).length;

        if (kpiFat) kpiFat.innerText = totalMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        if (kpiEdicao) kpiEdicao.innerText = `${emEdicao} Vídeo${emEdicao !== 1 ? 's' : ''}`;
        if (kpiOrc) kpiOrc.innerText = `${abertos} Proposta${abertos !== 1 ? 's' : ''}`;
    } catch (e) {
        console.error("Erro dashboard", e);
    }

    // Eventos desta semana (segunda a domingo)
    const hoje = new Date();
    const dayOfWeek = hoje.getDay();
    const diffSegunda = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const seg = new Date(hoje);
    seg.setDate(hoje.getDate() + diffSegunda);
    const dom = new Date(seg);
    dom.setDate(seg.getDate() + 6);

    const fmt = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };
    const inicio = fmt(seg);
    const fim = fmt(dom);

    try {
        const eventos = await DashboardService.getEventosSemana(inicio, fim);
        const arr = Array.isArray(eventos) ? eventos : [];

        if (eventosSemanaEmpty) eventosSemanaEmpty.remove();
        if (eventosSemanaList) {
            const hojeStr = fmt(hoje);
            const amanha = new Date(hoje);
            amanha.setDate(hoje.getDate() + 1);
            const amanhaStr = fmt(amanha);

            if (arr.length === 0) {
                eventosSemanaList.innerHTML = '<p class="dashboard-events-empty">Nenhum evento esta semana.</p>';
            } else {
                eventosSemanaList.innerHTML = arr.map(ev => {
                    const labelData = ev.data_evento === hojeStr ? 'Hoje' : ev.data_evento === amanhaStr ? 'Amanhã' : (typeof Format !== 'undefined' ? Format.dateShort(ev.data_evento) : ev.data_evento);
                    const tipo = ev.tipo === 'pedido' ? 'Pedido' : 'Orçamento';
                    const titulo = ev.titulo || 'Evento';
                    const cliente = ev.nome_cliente ? ` · ${ev.nome_cliente}` : '';
                    const href = ev.tipo === 'pedido' ? `pedidos.html` : `orcamentos.html`;
                    return `<a href="${href}" class="dashboard-event-item" title="${titulo}${cliente}">
                        <span class="dashboard-event-date">${labelData}</span>
                        <span class="dashboard-event-title">${titulo}</span>
                        <span class="dashboard-event-meta">${tipo}${cliente}</span>
                    </a>`;
                }).join('');
            }
        }
    } catch (e) {
        console.error("Erro eventos semana", e);
        if (eventosSemanaEmpty) eventosSemanaEmpty.textContent = 'Não foi possível carregar os eventos.';
    }
});