/* public/js/pages/pedidos.js */

document.addEventListener('DOMContentLoaded', async () => {

    const colunas = { 1: document.getElementById('col-agendado'), 2: document.getElementById('col-gravando'), 3: document.getElementById('col-edicao'), 4: document.getElementById('col-entregue') };
    const contadores = { 1: document.querySelector('.header-agendado .count'), 2: document.querySelector('.header-gravando .count'), 3: document.querySelector('.header-edicao .count'), 4: document.querySelector('.header-entregue .count') };
    
    const modal = document.getElementById('modalPedido');
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const filtroInput = document.getElementById('filtroKanban'); // Input de Busca
    
    let cardArrastado = null;
    let PEDIDO_ATUAL_ID = null;
    let CLIENTE_ATUAL_ID = null;
    let FORMAS_PAGAMENTO = [];

    // INIT
    await carregarFormasPagamento();
    carregarPedidos();

    async function carregarFormasPagamento() {
        try {
            const res = await fetch('/.netlify/functions/manage_lists?table=formas_pagamento');
            FORMAS_PAGAMENTO = await res.json();
            const select = document.getElementById('novaParcelaMetodo');
            if (select) {
                select.innerHTML = '<option value="">Forma...</option>';
                if(Array.isArray(FORMAS_PAGAMENTO)) {
                    FORMAS_PAGAMENTO.forEach(f => select.innerHTML += `<option value="${f.id}">${f.descricao}</option>`);
                }
            }
        } catch (e) { console.error("Erro formas pgto", e); }
    }

    async function carregarPedidos() {
        try {
            const res = await fetch('/.netlify/functions/get_pedidos');
            const pedidos = await res.json();
            Object.values(colunas).forEach(col => col.innerHTML = '');
            const counts = { 1:0, 2:0, 3:0, 4:0 };

            pedidos.forEach(p => {
                const card = criarCard(p);
                const s = p.id_status || 1;
                if(colunas[s]) { colunas[s].appendChild(card); counts[s]++; }
            });
            atualizarContadores(counts);
            configurarDragAndDrop();
        } catch (e) { console.error(e); }
    }

    function criarCard(data) {
        let dataTexto = "Data a definir";
        let isAtrasado = false;

        if(data.data_evento) {
            try {
                const partes = data.data_evento.toString().split('-');
                const dia = partes[2].substring(0, 2);
                const meses = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
                dataTexto = `${dia} ${meses[parseInt(partes[1]) - 1]}`;

                // Verifica Atraso (Se não estiver entregue e data < hoje)
                if (data.id_status < 4) {
                    const hoje = new Date();
                    hoje.setHours(0,0,0,0);
                    const dataEvento = new Date(partes[0], parseInt(partes[1])-1, dia);
                    if (dataEvento < hoje) isAtrasado = true;
                }
            } catch (e) {}
        }
        
        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.dataset.id = data.id;
        card.draggable = true;
        if(data.id_status === 3) card.classList.add('active-work');
        if(data.id_status === 4) card.classList.add('finished');

        const prevBtn = data.id_status > 1 ? `<i class="ph ph-caret-left nav-btn" onclick="moverStatus(${data.id}, ${data.id_status - 1}, event)"></i>` : '<span></span>';
        const nextBtn = data.id_status < 4 ? `<i class="ph ph-caret-right nav-btn" onclick="moverStatus(${data.id}, ${data.id_status + 1}, event)"></i>` : '<span></span>';

        // Ícone de Atraso
        const warningIcon = isAtrasado ? '<i class="ph ph-warning" style="color:var(--danger); margin-left:5px;" title="Atrasado"></i>' : '';
        const dateColor = isAtrasado ? 'color:var(--danger);' : '';

        card.innerHTML = `
            <div class="card-top">
                <span class="card-date" style="${dateColor}"><i class="ph ph-calendar"></i> ${dataTexto} ${warningIcon}</span>
                <i class="ph ph-dots-three-vertical options-icon"></i>
            </div>
            <h3 class="card-title">${data.titulo_evento || 'Sem Título'}</h3>
            <p class="card-local"><i class="ph ph-user"></i> ${data.nome_cliente || '?'}</p>
            
            <div class="card-nav" style="display:flex; justify-content:space-between; margin-top:10px; border-top:1px solid rgba(255,255,255,0.1); padding-top:8px;">
                ${prevBtn}
                ${nextBtn}
            </div>
        `;
        card.addEventListener('click', (e) => { if(!e.target.classList.contains('nav-btn')) abrirDetalhes(data.id); });
        return card;
    }

    // LÓGICA DE FILTRO / BUSCA
    if (filtroInput) {
        filtroInput.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase();
            document.querySelectorAll('.kanban-card').forEach(card => {
                const texto = card.innerText.toLowerCase();
                card.style.display = texto.includes(termo) ? 'block' : 'none';
            });
        });
    }

    window.moverStatus = async (id, novoStatus, e) => {
        if(e) e.stopPropagation();
        try {
            await fetch('/.netlify/functions/manage_pedido_actions', { method: 'POST', body: JSON.stringify({ action: 'update_status_data', id_pedido: id, id_status: novoStatus }) });
            carregarPedidos();
        } catch(err) { alert("Erro ao mover"); }
    };

    function atualizarContadores(c) { Object.keys(c).forEach(k => { if(contadores[k]) contadores[k].innerText = c[k]; }); }

    // --- MODAL DETALHES ---
    async function abrirDetalhes(id) {
        PEDIDO_ATUAL_ID = id;
        modal.classList.add('active');
        trocarAba('tab-info'); 
        await atualizarDadosModal(id);
    }

    async function atualizarDadosModal(id) {
        try {
            const res = await fetch(`/.netlify/functions/get_pedido_detalhes?id=${id}`);
            const data = await res.json();
            CLIENTE_ATUAL_ID = data.pedido.id_cliente;

            document.getElementById('detalheTitulo').innerText = data.pedido.titulo_evento;
            document.getElementById('detalheCliente').value = data.pedido.nome_razao_social;
            document.getElementById('detalheStatus').value = data.pedido.id_status;
            document.getElementById('detalheData').value = data.pedido.data_evento;

            const listaItens = document.getElementById('listaEditavelItens');
            listaItens.innerHTML = '';
            data.itens.forEach(i => adicionarItemEditavel(i.nome_item, i.valor_final));

            const p = data.pedido;
            document.getElementById('endCep').value = p.cep || '';
            document.getElementById('endCidade').value = p.cidade || '';
            document.getElementById('endRua').value = p.logradouro || '';
            document.getElementById('endNum').value = p.numero || '';
            document.getElementById('endBairro').value = p.bairro || '';
            document.getElementById('endUf').value = p.uf || '';

            preencherFinanceiro(data);

        } catch (e) { console.error("Erro ao atualizar modal:", e); }
    }

    // --- FINANCEIRO ---
    function preencherFinanceiro(data) {
        const parcelas = data.financeiro;
        const lista = document.getElementById('listaParcelas');
        lista.innerHTML = '';
        
        let totalPago = 0;
        let totalContrato = parseFloat(data.pedido.valor_contrato_final) || 0;

        parcelas.forEach(p => {
            const valor = parseFloat(p.valor_parcela || p.valor) || 0; 
            totalPago += valor;
            
            const formaObj = FORMAS_PAGAMENTO.find(f => f.id === p.id_forma_pagamento);
            const nomeForma = formaObj ? formaObj.descricao : '...';

            const div = document.createElement('div');
            div.className = 'payment-item';
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px;">
                    <div class="pay-check paid"><i class="ph ph-check"></i></div>
                    <div>
                        <strong style="display:block; color:#fff;">${p.descricao || 'Parcela'}</strong>
                        <small style="color:#888;">${new Date(p.data_vencimento).toLocaleDateString('pt-BR')} • <span style="color:var(--gold-400)">${nomeForma}</span></small>
                    </div>
                </div>
                <div style="text-align:right;">
                    <span style="color:var(--gold-400); font-weight:700;">${valor.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span>
                    <i class="ph ph-trash" style="color:var(--danger); cursor:pointer; margin-left:10px;" onclick="deletarParcela(${p.id})"></i>
                </div>
            `;
            lista.appendChild(div);
        });

        document.getElementById('finTotal').innerText = totalContrato.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
        document.getElementById('finPago').innerText = totalPago.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
        
        const falta = totalContrato - totalPago;
        document.getElementById('finFalta').innerText = falta.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
        
        if(falta <= 0) {
            document.getElementById('finFalta').style.color = 'var(--success)';
            document.getElementById('finFalta').innerText = "QUITADO";
        } else {
            document.getElementById('finFalta').style.color = 'var(--danger)';
        }
    }

    window.deletarParcela = async (id) => {
        if(!confirm("Apagar?")) return;
        await fetch('/.netlify/functions/manage_financeiro', { method: 'POST', body: JSON.stringify({ action: 'delete', id_parcela: id }) });
        atualizarDadosModal(PEDIDO_ATUAL_ID);
    };
    
    document.getElementById('btnAddParcela').addEventListener('click', async () => {
        const desc = document.getElementById('novaParcelaDesc').value;
        const valor = document.getElementById('novaParcelaValor').value;
        const data = document.getElementById('novaParcelaData').value;
        const metodo = document.getElementById('novaParcelaMetodo').value;
        
        if(!desc || !valor || !data) return alert("Preencha os dados");

        const btn = document.getElementById('btnAddParcela');
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';

        try {
            await fetch('/.netlify/functions/manage_financeiro', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'create',
                    id_pedido: PEDIDO_ATUAL_ID,
                    descricao: desc,
                    valor: valor,
                    vencimento: data,
                    id_forma_pagamento: metodo,
                    ja_pago: true // Sempre pago agora
                })
            });
            
            document.getElementById('novaParcelaDesc').value = '';
            document.getElementById('novaParcelaValor').value = '';
            atualizarDadosModal(PEDIDO_ATUAL_ID);

        } catch(e) {
            console.error(e);
        } finally {
            btn.innerHTML = original;
        }
    });

    // --- SALVAMENTOS OUTROS ---
    document.getElementById('btnSalvarResumo').onclick = async () => {
        await salvarGeral({ action: 'update_status_data', id_pedido: PEDIDO_ATUAL_ID, id_status: document.getElementById('detalheStatus').value, data_evento: document.getElementById('detalheData').value });
    };
    document.getElementById('btnSalvarEndereco').onclick = async () => {
        await salvarGeral({ action: 'update_address', id_cliente: CLIENTE_ATUAL_ID, cep: document.getElementById('endCep').value, cidade: document.getElementById('endCidade').value, rua: document.getElementById('endRua').value, num: document.getElementById('endNum').value, bairro: document.getElementById('endBairro').value, uf: document.getElementById('endUf').value });
    };
    document.getElementById('btnAddItemExtra').onclick = () => adicionarItemEditavel("Novo Item", 0);
    document.getElementById('btnSalvarItens').onclick = async () => {
        const itens = [];
        document.querySelectorAll('.item-edit-row').forEach(row => { itens.push({ nome: row.querySelector('.name-input').value, valor: row.querySelector('.val-input').value }); });
        await salvarGeral({ action: 'update_items', id_pedido: PEDIDO_ATUAL_ID, itens: itens });
    };
    function adicionarItemEditavel(nome, valor) {
        const div = document.createElement('div');
        div.className = 'item-edit-row';
        div.style.cssText = "display:flex; gap:8px; align-items:center;";
        div.innerHTML = `<input type="text" class="input-glass name-input" value="${nome}" style="flex:2;"><input type="number" class="input-glass val-input" value="${valor}" style="flex:1;"><i class="ph ph-trash" style="color:var(--danger); cursor:pointer;" onclick="this.parentElement.remove()"></i>`;
        document.getElementById('listaEditavelItens').appendChild(div);
    }
    async function salvarGeral(payload) {
        try {
            const res = await fetch('/.netlify/functions/manage_pedido_actions', { method: 'POST', body: JSON.stringify(payload) });
            if(!res.ok) throw new Error("Erro");
            alert("Salvo com sucesso!");
            carregarPedidos();
            if(payload.action === 'update_items') atualizarDadosModal(PEDIDO_ATUAL_ID);
        } catch(e) { alert("Erro ao salvar"); }
    }

    function trocarAba(tabId) {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
    }
    tabs.forEach(t => t.addEventListener('click', () => trocarAba(t.dataset.tab)));
    document.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', () => modal.classList.remove('active')));

    function configurarDragAndDrop() {
        const cards = document.querySelectorAll('.kanban-card');
        const dropzones = document.querySelectorAll('.column-body');
        cards.forEach(card => {
            card.addEventListener('dragstart', () => { cardArrastado = card; card.classList.add('dragging'); });
            card.addEventListener('dragend', () => { card.classList.remove('dragging'); cardArrastado = null; });
        });
        dropzones.forEach(zone => {
            zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
            zone.addEventListener('dragleave', () => { zone.classList.remove('drag-over'); });
            zone.addEventListener('drop', async (e) => {
                e.preventDefault(); zone.classList.remove('drag-over');
                if (cardArrastado) {
                    zone.appendChild(cardArrastado);
                    let novoStatus = 1;
                    if(zone.id === 'col-gravando') novoStatus = 2;
                    if(zone.id === 'col-edicao') novoStatus = 3;
                    if(zone.id === 'col-entregue') novoStatus = 4;
                    await fetch('/.netlify/functions/manage_pedido_actions', { method: 'POST', body: JSON.stringify({ action: 'update_status_data', id_pedido: cardArrastado.dataset.id, id_status: novoStatus }) });
                    carregarPedidos();
                }
            });
        });
    }
});