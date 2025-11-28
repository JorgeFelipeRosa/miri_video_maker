import { api } from '../config/api.js';
import { toMoney, toDate } from '../utils/format.js';

let todosOrcamentos = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Busca TODOS (sem limit)
        const res = await api.get('orcamentos');
        todosOrcamentos = res || [];
        renderizar(todosOrcamentos);

        // Configura busca
        document.getElementById('busca-orcamento').onkeyup = filtrar;
    } catch (e) {
        console.error(e);
    }
});

function renderizar(lista) {
    const div = document.getElementById('lista-completa');
    div.innerHTML = '';

    if (lista.length === 0) {
        div.innerHTML = '<p style="text-align:center; color:#666; margin-top: 20px;">Nenhum orçamento encontrado.</p>';
        return;
    }

    lista.forEach(orc => {
        const el = document.createElement('div');
        // Reutilizando estilos do components.css e global
        el.style.cssText = "background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 15px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;";
        
        // Ao clicar, manda para a edição
        el.onclick = () => window.location.href = `orcamentos.html?edit_id=${orc.id}`;

        el.innerHTML = `
            <div style="flex:1; overflow:hidden; margin-right:10px;">
                <div style="font-weight:600; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${orc.titulo_evento}</div>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">${toDate(orc.data_evento)} • ${orc.nome_razao_social}</div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="color:var(--gold); font-weight:700; font-family:'Playfair Display'">${toMoney(orc.valor_total_geral)}</div>
                <i class="ph ph-caret-right" style="color:#666"></i>
            </div>
        `;
        div.appendChild(el);
    });
}

function filtrar() {
    const termo = document.getElementById('busca-orcamento').value.toLowerCase();
    const filtrados = todosOrcamentos.filter(o => 
        (o.titulo_evento || "").toLowerCase().includes(termo) || 
        (o.nome_razao_social || "").toLowerCase().includes(termo)
    );
    renderizar(filtrados);
}