/* public/js/controllers/pedidos.js - REFATORADO */

import { PedidoService } from '../services/pedido_service.js';
import { FinanceiroService } from '../services/financeiro_service.js';
import { ListaService } from '../services/lista_service.js';
import { Modal } from '../modules/modal.js';
import { Toast } from '../modules/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Iniciando Pedidos Controller...");

    // --- ELEMENTOS ---
    const colunas = { 
        1: document.getElementById('col-agendado'), 
        2: document.getElementById('col-gravando'), 
        3: document.getElementById('col-edicao'), 
        4: document.getElementById('col-entregue') 
    };
    
    const contadores = { 
        1: document.querySelector('.header-agendado .count'), 
        2: document.querySelector('.header-gravando .count'), 
        3: document.querySelector('.header-edicao .count'), 
        4: document.querySelector('.header-entregue .count') 
    };
    
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const filtroInput = document.getElementById('filtroKanban');

    // Estado
    let cardArrastado = null;
    let PEDIDO_ATUAL_ID = null;
    let CLIENTE_ATUAL_ID = null;
    let FORMAS_PAGAMENTO = [];

    // --- 1. INICIALIZAÇÃO ---
    await carregarFormasPagamento();
    await carregarPedidos();

    // --- 2. KANBAN (Listagem) ---
    async function carregarPedidos() {
        try {
            const pedidos = await PedidoService.listar(); // <--- SERVICE
            
            // Limpa colunas
            Object.values(colunas).forEach(col => { if(col) col.innerHTML = ''; });
            const counts = { 1:0, 2:0, 3:0, 4:0 };

            if (Array.isArray(pedidos)) {
                pedidos.forEach(p => {
                    const card = criarCard(p);
                    const s = p.id_status || 1; 
                    if(colunas[s]) { 
                        colunas[s].appendChild(card); 
                        counts[s]++; 
                    }
                });
            }

            atualizarContadores(counts);
            configurarDragAndDrop();
            
        } catch (e) { 
            console.error("Erro Kanban:", e);
            Toast.show("Erro ao carregar pedidos", "error");
        }
    }

    function criarCard(data) {
        let dataTexto = "Data a definir";
        let isAtrasado = false;

        if(data.data_evento) {
            try {
                const [ano, mes, dia] = data.data_evento.split('-');
                const meses = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
                dataTexto = `${dia} ${meses[parseInt(mes)-1]}`;

                const hoje = new Date().toISOString().split('T')[0];
                if (data.data_evento < hoje && data.id_status < 4) isAtrasado = true;
            } catch (e) {}
        }

        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.dataset.id = data.id;
        card.draggable = true;
        
        if(data.id_status === 3) card.classList.add('active-work');
        if(data.id_status === 4) card.classList.add('finished');

        const warning = isAtrasado ? '<i class="ph ph-warning" style="color:var(--danger); margin-left:5px;"></i>' : '';
        const dateStyle = isAtrasado ? 'color:var(--danger)' : '';

        // Botões de Navegação (< >) agora chamam função global que usa o Service
        const prevBtn = data.id_status > 1 ? `<i class="ph ph-caret-left nav-btn" onclick="moverCard(${data.id}, ${data.id_status - 1})"></i>` : '<span></span>';
        const nextBtn = data.id_status < 4 ? `<i class="ph ph-caret-right nav-btn" onclick="moverCard(${data.id}, ${data.id_status + 1})"></i>` : '<span></span>';

        card.innerHTML = `
            <div class="card-top">
                <span class="card-date" style="${dateStyle}"><i class="ph ph-calendar"></i> ${dataTexto} ${warning}</span>
                <i class="ph ph-dots-three-vertical options-icon"></i>
            </div>
            <h3 class="card-title">${data.titulo_evento || 'Sem Título'}</h3>
            <p class="card-local"><i class="ph ph-user"></i> ${data.nome_cliente || '?'}</p>
            
            <div class="card-nav" style="display:flex; justify-content:space-between; margin-top:10px; border-top:1px solid rgba(255,255,255,0.1); padding-top:8px;">
                ${prevBtn}
                ${nextBtn}
            </div>
        `;
        
        card.addEventListener('click', (e) => { 
            if(!e.target.classList.contains('nav-btn')) abrirDetalhes(data.id); 
        });

        return card;
    }

    function atualizarContadores(c) { 
        Object.keys(c).forEach(k => { if(contadores[k]) contadores[k].innerText = c[k]; }); 
    }

    // Função de mover card (Setas ou DragDrop)
    window.moverCard = async (id, novoStatus) => {
        try {
            await PedidoService.salvarAcao({ 
                action: 'update_status_data', 
                id_pedido: id, 
                id_status: novoStatus 
            });
            carregarPedidos(); 
        } catch(err) { Toast.show("Erro ao mover", "error"); }
    };

    // --- 3. MODAL DETALHES ---
    async function abrirDetalhes(id) {
        PEDIDO_ATUAL_ID = id;
        Modal.open('modalPedido'); // <--- MODAL
        trocarAba('tab-info'); 
        await atualizarDadosModal(id);
    }

    async function atualizarDadosModal(id) {
        try {
            const data = await PedidoService.buscarPorId(id); // <--- SERVICE
            
            CLIENTE_ATUAL_ID = data.pedido.id_cliente;

            // Resumo
            document.getElementById('detalheTitulo').innerText = data.pedido.titulo_evento;
            document.getElementById('detalheCliente').value = data.pedido.nome_razao_social;
            document.getElementById('detalheStatus').value = data.pedido.id_status;
            document.getElementById('detalheData').value = data.pedido.data_evento;

            // Itens
            const listaItens = document.getElementById('listaEditavelItens');
            listaItens.innerHTML = '';
            if (data.itens) {
                data.itens.forEach(i => adicionarItemEditavel(i.nome_item, i.valor_final));
            }

            // Endereço
            const p = data.pedido;
            document.getElementById('endCep').value = p.cep || '';
            document.getElementById('endCidade').value = p.cidade || '';
            document.getElementById('endRua').value = p.logradouro || '';
            document.getElementById('endNum').value = p.numero || '';
            document.getElementById('endBairro').value = p.bairro || '';
            document.getElementById('endUf').value = p.uf || '';

            // Financeiro
            preencherFinanceiro(data);

        } catch (e) { console.error(e); Toast.show("Erro ao abrir detalhes", "error"); }
    }

    // --- 4. FINANCEIRO E LISTAS ---
    async function carregarFormasPagamento() {
        try {
            FORMAS_PAGAMENTO = await ListaService.listar('formas_pagamento'); // <--- SERVICE
            const select = document.getElementById('novaParcelaMetodo');
            if (select) {
                select.innerHTML = '<option value="">Forma...</option>';
                FORMAS_PAGAMENTO.forEach(f => select.innerHTML += `<option value="${f.id}">${f.descricao}</option>`);
            }
        } catch (e) { console.error(e); }
    }

    function preencherFinanceiro(data) {
        const parcelas = data.financeiro || [];
        const lista = document.getElementById('listaParcelas');
        lista.innerHTML = '';
        
        let totalPago = 0;
        let totalContrato = parseFloat(data.pedido.valor_contrato_final) || 0;

        parcelas.forEach(p => {
            const valor = parseFloat(p.valor_parcela || p.valor) || 0; 
            totalPago += valor; // Modo extrato: tudo é pago
            
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
        const elFalta = document.getElementById('finFalta');
        elFalta.innerText = falta.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
        
        if(falta <= 0) {
            elFalta.style.color = 'var(--success)';
            elFalta.innerText = "QUITADO";
        } else {
            elFalta.style.color = 'var(--danger)';
        }
    }

    window.deletarParcela = async (id) => {
        if(!confirm("Remover este pagamento?")) return;
        await FinanceiroService.salvar({ action: 'delete', id_parcela: id }); // <--- SERVICE
        atualizarDadosModal(PEDIDO_ATUAL_ID);
    };
    
    document.getElementById('btnAddParcela').addEventListener('click', async () => {
        const desc = document.getElementById('novaParcelaDesc').value;
        const valor = document.getElementById('novaParcelaValor').value;
        const data = document.getElementById('novaParcelaData').value;
        const metodo = document.getElementById('novaParcelaMetodo').value;
        
        if(!desc || !valor || !data) return Toast.show("Preencha todos os campos", "error");

        const btn = document.getElementById('btnAddParcela');
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';

        try {
            await FinanceiroService.salvar({ // <--- SERVICE
                action: 'create',
                id_pedido: PEDIDO_ATUAL_ID,
                descricao: desc,
                valor: valor,
                vencimento: data,
                id_forma_pagamento: metodo
            });
            
            document.getElementById('novaParcelaDesc').value = '';
            document.getElementById('novaParcelaValor').value = '';
            
            atualizarDadosModal(PEDIDO_ATUAL_ID);

        } catch(e) { Toast.show("Erro ao adicionar", "error"); } 
        finally { btn.innerHTML = original; }
    });

    // --- 5. SALVAR DADOS GERAIS ---
    
    // Status/Data
    document.getElementById('btnSalvarResumo').onclick = async () => {
        await salvarGeral({ 
            action: 'update_status_data', 
            id_pedido: PEDIDO_ATUAL_ID, 
            id_status: document.getElementById('detalheStatus').value, 
            data_evento: document.getElementById('detalheData').value 
        });
    };

    // Endereço
    document.getElementById('btnSalvarEndereco').onclick = async () => {
        await salvarGeral({ 
            action: 'update_address', 
            id_cliente: CLIENTE_ATUAL_ID, 
            cep: document.getElementById('endCep').value, 
            cidade: document.getElementById('endCidade').value, 
            rua: document.getElementById('endRua').value, 
            num: document.getElementById('endNum').value, 
            bairro: document.getElementById('endBairro').value, 
            uf: document.getElementById('endUf').value 
        });
    };

    // Itens
    document.getElementById('btnAddItemExtra').onclick = () => adicionarItemEditavel("Novo Item", 0);
    document.getElementById('btnSalvarItens').onclick = async () => {
        const itens = [];
        document.querySelectorAll('.item-edit-row').forEach(row => { 
            itens.push({ 
                nome: row.querySelector('.name-input').value, 
                valor: row.querySelector('.val-input').value 
            }); 
        });
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
            const res = await PedidoService.salvarAcao(payload); // <--- SERVICE
            Toast.show("Salvo com sucesso!", "success");
            carregarPedidos();
            if(payload.action === 'update_items') atualizarDadosModal(PEDIDO_ATUAL_ID);
        } catch(e) { Toast.show("Erro ao salvar", "error"); }
    }

    // --- UTILS E DRAG & DROP ---
    function trocarAba(tabId) {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
    }
    tabs.forEach(t => t.addEventListener('click', () => trocarAba(t.dataset.tab)));
    
    // Filtro
    if (filtroInput) {
        filtroInput.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase();
            document.querySelectorAll('.kanban-card').forEach(card => {
                const txt = card.innerText.toLowerCase();
                card.style.display = txt.includes(termo) ? 'block' : 'none';
            });
        });
    }

    // Drag & Drop
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
                    
                    await window.moverCard(cardArrastado.dataset.id, novoStatus); // Reutiliza função
                }
            });
        });
    }
});