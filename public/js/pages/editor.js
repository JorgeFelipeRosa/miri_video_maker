/* public/js/pages/editor.js - CORREÇÃO: TRAVA DE APROVAÇÃO DUPLICADA */

document.addEventListener('DOMContentLoaded', async () => {

    let DB_CLIENTES = [];
    let DB_SERVICOS = [];
    let PRECO_POR_KM = 1.50; 
    let ALIMENTACAO_PADRAO = 50;
    
    let CLIENTE_SELECIONADO_ID = null; 
    let ORCAMENTO_STATUS = 1; // 1=Rascunho, 2=Enviado, 3=Fechado

    const els = {
        headerTitle: document.getElementById('pageTitle'),
        inputTitulo: document.getElementById('inputTitulo'),
        inputNome: document.getElementById('inputNome'),
        inputWhatsapp: document.getElementById('inputWhatsapp'),
        inputLocal: document.getElementById('inputLocal'),
        inputData: document.getElementById('inputData'),
        inputValidade: document.getElementById('inputValidade'),
        inputObs: document.getElementById('inputObs'),
        inputKm: document.getElementById('inputKm'),
        inputAlim: document.getElementById('inputAlimentacao'),
        inputHosp: document.getElementById('inputHospedagem'),
        displayGasolina: document.getElementById('custoGasolina'),
        displayTotal: document.getElementById('valorTotalGeral'),
        listaItens: document.getElementById('listaItens'),
        btnBuscaCliente: document.getElementById('btnBuscaCliente'),
        btnOpenService: document.getElementById('btnOpenServiceModal'),
        btnSalvar: document.getElementById('btnSalvar'),
        modalCliente: document.getElementById('modalCliente'),
        modalServico: document.getElementById('modalServicos'),
        modalSucesso: document.getElementById('modalSucesso'),
        modalContrato: document.getElementById('modalContrato'),
        closeBtns: document.querySelectorAll('.btn-close-modal'),
        contratoCpf: document.getElementById('contratoCpf'),
        contratoCep: document.getElementById('contratoCep'),
        contratoRua: document.getElementById('contratoRua'),
        contratoNum: document.getElementById('contratoNum'),
        contratoBairro: document.getElementById('contratoBairro'),
        contratoCidade: document.getElementById('contratoCidade'),
        contratoUF: document.getElementById('contratoUF'),
        btnConfirmarContrato: document.getElementById('btnConfirmarContrato'),
        btnGerarPDFFinal: document.getElementById('btnGerarPDFFinal'),
        btnVoltarSucesso: document.getElementById('btnVoltarSucesso'),
        searchClientInput: document.getElementById('searchClientInput'),
        resultsCliente: document.getElementById('resultsCliente'),
        searchServiceInput: document.getElementById('searchServiceInput'),
        resultsServico: document.getElementById('resultsServico')
    };

    // --- CRIAÇÃO DOS BOTÕES EXTRAS NO RODAPÉ ---
    
    // 1. Botão Aprovar (Verde)
    const btnAprovar = document.createElement('button');
    btnAprovar.innerHTML = '<i class="ph ph-check-circle"></i> FECHAR CONTRATO';
    btnAprovar.style.cssText = `background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: #fff; border: none; border-radius: 8px; padding: 12px 20px; font-weight: 700; font-family: 'Inter', sans-serif; cursor: pointer; display: none; align-items: center; gap: 8px; margin-left: 10px; box-shadow: 0 0 15px rgba(46, 204, 113, 0.4);`;
    
    // 2. Badge de "Já Fechado" (Aviso Visual)
    const badgeFechado = document.createElement('div');
    badgeFechado.innerHTML = '<i class="ph ph-lock-key"></i> CONTRATO FECHADO';
    badgeFechado.style.cssText = `background: rgba(255, 255, 255, 0.1); color: var(--text-secondary); border: 1px solid var(--glass-border); border-radius: 8px; padding: 12px 20px; font-weight: 700; font-size: 0.8rem; display: none; align-items: center; gap: 8px; margin-left: 10px;`;

    if(els.btnSalvar && els.btnSalvar.parentNode) {
        els.btnSalvar.parentNode.appendChild(btnAprovar);
        els.btnSalvar.parentNode.appendChild(badgeFechado);
    }

    // --- LÓGICA INTELIGENTE DO BOTÃO ---
    function atualizarBotoesAcao() {
        // Reset
        btnAprovar.style.display = 'none';
        badgeFechado.style.display = 'none';

        // Se não tiver ID (é novo), não mostra nada extra
        if (!window.ORCAMENTO_ATUAL_ID) return;

        // Se já estiver fechado (Status 3)
        if (ORCAMENTO_STATUS === 3) {
            badgeFechado.style.display = 'flex';
            // Opcional: Poderíamos esconder o btnSalvar também para travar edição
        } else {
            // Se estiver aberto (Status 1 ou 2), mostra o botão de fechar
            btnAprovar.style.display = 'flex';
        }
    }

    btnAprovar.addEventListener('click', (e) => {
        e.preventDefault();
        if(els.inputLocal.value) els.contratoCidade.value = els.inputLocal.value;
        openModal(els.modalContrato);
    });

    if(els.btnConfirmarContrato) {
        els.btnConfirmarContrato.addEventListener('click', async () => {
            const cpf = els.contratoCpf.value;
            if(!cpf) return alert("CPF/CNPJ é obrigatório.");
            const originalText = els.btnConfirmarContrato.innerHTML;
            els.btnConfirmarContrato.innerHTML = "Processando...";
            els.btnConfirmarContrato.disabled = true;
            try {
                const payload = {
                    id_orcamento: window.ORCAMENTO_ATUAL_ID,
                    dados_cliente: {
                        cpf: els.contratoCpf.value, cep: els.contratoCep.value, logradouro: els.contratoRua.value,
                        numero: els.contratoNum.value, bairro: els.contratoBairro.value, cidade: els.contratoCidade.value, uf: els.contratoUF.value
                    }
                };
                const response = await fetch('/.netlify/functions/approve_orcamento', { method: 'POST', body: JSON.stringify(payload) });
                if(!response.ok) throw new Error("Erro ao processar");
                
                alert("SUCESSO! Pedido gerado.");
                window.location.href = 'pedidos.html';
            } catch(e) { console.error(e); alert("Erro: " + e.message); els.btnConfirmarContrato.innerHTML = originalText; els.btnConfirmarContrato.disabled = false; }
        });
    }

    async function init() {
        try {
            const response = await fetch('/.netlify/functions/load_editor_data');
            const data = await response.json();
            if(data.config) { PRECO_POR_KM = data.config.custo_km_padrao; ALIMENTACAO_PADRAO = data.config.custo_alimentacao_padrao; }
            if(data.clientes) DB_CLIENTES = data.clientes.map(c => ({ id: c.id, nome: c.nome_razao_social, local: c.cidade || "", whatsapp: c.whatsapp || "" }));
            if(data.servicos) DB_SERVICOS = data.servicos; // Carrega serviços
            
            if(els.inputAlim && !els.inputAlim.value) els.inputAlim.value = ALIMENTACAO_PADRAO;
            
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('id')) await carregarOrcamentoParaEdicao(urlParams.get('id'));
        } catch (error) { console.error("Erro init:", error); PRECO_POR_KM = 1.50; }
    }
    await init(); 

    async function carregarOrcamentoParaEdicao(id) {
        try {
            if(els.headerTitle) els.headerTitle.innerText = "Editando Orçamento";
            
            if(!document.getElementById('btnDeleteHeader')) {
                const headerContainer = document.querySelector('.header-std .header-left');
                if(headerContainer) {
                    const btnDel = document.createElement('button');
                    btnDel.id = 'btnDeleteHeader';
                    btnDel.innerHTML = '<i class="ph ph-trash"></i>';
                    btnDel.style.cssText = "background:rgba(231, 76, 60, 0.1); color:var(--danger); border:1px solid var(--danger); padding:8px; border-radius:50%; width:40px; height:40px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:1.2rem; margin-left: 10px;";
                    btnDel.onclick = deletarOrcamentoAtual;
                    headerContainer.appendChild(btnDel);
                }
            }

            const response = await fetch(`/.netlify/functions/get_orcamento_detalhes?id=${id}`);
            const dados = await response.json();
            const capa = dados.capa;
            
            window.ORCAMENTO_ATUAL_ID = capa.id;
            CLIENTE_SELECIONADO_ID = capa.id_cliente;
            ORCAMENTO_STATUS = capa.id_status; // SALVA O STATUS
            
            els.inputTitulo.value = capa.titulo_evento;
            els.inputNome.value = capa.nome_razao_social;
            els.inputWhatsapp.value = capa.whatsapp || "";
            els.inputLocal.value = capa.local_evento;
            els.inputData.value = capa.data_evento;
            els.inputObs.value = capa.observacoes;
            els.inputKm.value = capa.distancia_km;
            els.inputAlim.value = capa.custo_alimentacao;
            els.inputHosp.value = capa.custo_hospedagem;
            
            if (capa.validade_proposta) {
                const diffTime = Math.abs(new Date(capa.validade_proposta) - new Date());
                els.inputValidade.value = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 15;
            }
            
            els.listaItens.innerHTML = '';
            dados.itens.forEach(item => adicionarItemNaTela(item.nome_item, item.valor_unitario, item.id_servico_catalogo));
            
            calcularTotal();
            els.btnSalvar.innerHTML = '<span>ATUALIZAR</span> <i class="ph ph-floppy-disk"></i>';
            
            atualizarBotoesAcao(); // VERIFICA SE MOSTRA O BOTÃO

        } catch (error) { console.error(error); }
    }

    async function deletarOrcamentoAtual(e) {
        e.preventDefault();
        if(confirm("Tem certeza que deseja EXCLUIR?")) {
            await fetch('/.netlify/functions/delete_orcamento', { method: 'POST', body: JSON.stringify({ id: window.ORCAMENTO_ATUAL_ID }) });
            window.location.href = 'orcamentos.html';
        }
    }

    function calcularTotal() {
        const km = parseFloat(els.inputKm.value) || 0;
        const alim = parseFloat(els.inputAlim.value) || 0;
        const hosp = parseFloat(els.inputHosp.value) || 0;
        const gas = km * PRECO_POR_KM;
        els.displayGasolina.value = formatMoney(gas);
        let totalServicos = 0;
        document.querySelectorAll('.price-edit-input').forEach(input => totalServicos += parseFloat(input.value) || 0);
        const totalFinal = gas + alim + hosp + totalServicos;
        if(els.displayTotal) els.displayTotal.innerText = formatMoney(totalFinal);
    }
    [els.inputKm, els.inputAlim, els.inputHosp].forEach(el => { if(el) el.addEventListener('input', calcularTotal); });

    function openModal(modal) { if(modal) modal.classList.add('active'); }
    function closeModal(modal) { if(modal) modal.classList.remove('active'); }
    
    // CORREÇÃO CRÍTICA: Removi o evento 'input' que zerava o CLIENTE_SELECIONADO_ID
    // els.inputNome.addEventListener('input', () => { CLIENTE_SELECIONADO_ID = null; atualizarBotaoAprovar(); }); <-- REMOVIDO

    els.btnBuscaCliente.addEventListener('click', () => { openModal(els.modalCliente); renderClientes(DB_CLIENTES); setTimeout(() => els.searchClientInput.focus(), 100); });
    
    els.btnOpenService.addEventListener('click', () => { 
        openModal(els.modalServico); 
        renderServicos(DB_SERVICOS); 
        setTimeout(() => els.searchServiceInput.focus(), 100); 
    });
    
    els.closeBtns.forEach(btn => btn.addEventListener('click', (e) => closeModal(e.target.closest('.modal-overlay'))));

    function renderClientes(lista) {
        els.resultsCliente.innerHTML = '';
        lista.forEach(c => {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.innerHTML = `<div><strong>${c.nome}</strong><br><small>${c.local}</small></div><div class="btn-add-result">OK</div>`;
            div.onclick = () => {
                els.inputNome.value = c.nome; els.inputLocal.value = c.local; els.inputWhatsapp.value = c.whatsapp;
                CLIENTE_SELECIONADO_ID = c.id;
                if(!els.inputTitulo.value) els.inputTitulo.value = `Evento ${c.nome}`;
                closeModal(els.modalCliente);
            };
            els.resultsCliente.appendChild(div);
        });
    }
    if(els.searchClientInput) els.searchClientInput.addEventListener('input', (e) => { renderClientes(DB_CLIENTES.filter(c => c.nome.toLowerCase().includes(e.target.value.toLowerCase()))); });

    function renderServicos(lista) {
        const list = document.getElementById('resultsServico');
        list.innerHTML = '';
        
        lista.forEach(s => {
            const div = document.createElement('div');
            div.className = 'result-item';
            const preco = s.preco_base || s.preco;
            div.innerHTML = `<div><strong>${s.nome}</strong><br><small>${formatMoney(preco)}</small></div><div class="btn-add-result">+</div>`;
            div.onclick = () => { 
                adicionarItemNaTela(s.nome, preco, s.id); 
                closeModal(els.modalServico); 
            };
            list.appendChild(div);
        });
    }
    
    if(els.searchServiceInput) els.searchServiceInput.addEventListener('input', (e) => { 
        const termo = e.target.value.toLowerCase();
        renderServicos(DB_SERVICOS.filter(s => s.nome.toLowerCase().includes(termo)));
    });

    function adicionarItemNaTela(nome, preco, idServico = null) {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.dataset.idServico = idServico;
        
        div.innerHTML = `<div class="item-info"><span>${nome}</span><small>Valor Editável</small></div><input type="number" class="price-edit-input" value="${preco}"><button type="button" class="btn-remove"><i class="ph ph-trash"></i></button>`;
        div.querySelector('.price-edit-input').addEventListener('input', calcularTotal);
        div.querySelector('.btn-remove').addEventListener('click', () => { div.remove(); calcularTotal(); });
        els.listaItens.appendChild(div);
        calcularTotal();
    }

    if(els.btnSalvar) {
        els.btnSalvar.addEventListener('click', async () => {
            const nomeCliente = els.inputNome.value.trim();
            const tituloEvento = els.inputTitulo.value.trim();
            if(!nomeCliente) return alert("Preencha o Cliente.");
            
            const originalText = els.btnSalvar.innerHTML;
            els.btnSalvar.innerHTML = 'Salvando...';
            els.btnSalvar.disabled = true;

            try {
                const km = parseFloat(els.inputKm.value) || 0;
                const alim = parseFloat(els.inputAlim.value) || 0;
                const hosp = parseFloat(els.inputHosp.value) || 0;
                const gas = km * PRECO_POR_KM;
                let totalServicos = 0;
                const itens = [];
                
                document.querySelectorAll('.cart-item').forEach(d => {
                    const v = parseFloat(d.querySelector('input').value);
                    totalServicos += v;
                    const sId = d.dataset.idServico || null;
                    itens.push({ id_servico: sId, nome: d.querySelector('span').innerText, valor: v });
                });
                
                const totalGeral = gas + alim + hosp + totalServicos;
                
                const dias = parseInt(els.inputValidade.value) || 15;
                const data = new Date(); data.setDate(data.getDate() + dias);
                const dataFormatada = data.toISOString().split('T')[0]; // Define variável
                
                const payload = {
                    id_orcamento: window.ORCAMENTO_ATUAL_ID,
                    id_cliente: CLIENTE_SELECIONADO_ID, 
                    
                    novo_cliente_dados: { 
                        nome: nomeCliente, 
                        whatsapp: els.inputWhatsapp.value, 
                        cidade: els.inputLocal.value 
                    },
                    
                    titulo_evento: tituloEvento, 
                    data_evento: els.inputData.value, 
                    validade_proposta: dataFormatada, 
                    local_evento: els.inputLocal.value, 
                    distancia_km: km, custo_gasolina: gas, custo_alimentacao: alim, custo_hospedagem: hosp, 
                    total_logistica: (gas+alim+hosp), total_servicos: totalServicos, total_geral: totalGeral, 
                    observacoes: els.inputObs.value, itens: itens
                };

                const res = await fetch('/.netlify/functions/save_orcamento', { method: 'POST', body: JSON.stringify(payload) });
                if(!res.ok) throw new Error(await res.text());
                const json = await res.json();
                
                window.ORCAMENTO_ATUAL_ID = json.id;
                ORCAMENTO_STATUS = 1; // Reset status visual se salvou novo
                
                atualizarBotoesAcao();
                openModal(els.modalSucesso);

            } catch (e) { console.error(e); alert(e.message); } 
            finally { els.btnSalvar.innerHTML = originalText; els.btnSalvar.disabled = false; }
        });
    }

    function gerarPDF() {
        document.getElementById('pdfTituloEvento').innerText = els.inputTitulo.value || "ORÇAMENTO";
        document.getElementById('pdfNomeCliente').innerText = els.inputNome.value;
        document.getElementById('pdfTotalGeral').innerText = els.displayTotal.innerText;
        const tbody = document.getElementById('pdfListaItens'); tbody.innerHTML = '';
        document.querySelectorAll('.cart-item').forEach(d => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${d.querySelector('span').innerText}</td><td style="text-align:right">${formatMoney(parseFloat(d.querySelector('input').value))}</td>`;
            tbody.appendChild(tr);
        });

        const el = document.getElementById('pdf-template');
        el.style.display = 'block';
        const opt = { margin: 0, filename: `Orcamento.pdf`, image: { type: 'jpeg', quality: 1 }, html2canvas: { scale: 2, backgroundColor: '#0f0f10' }, jsPDF: { unit: 'mm', format: 'a4' } };

        html2pdf().set(opt).from(el).save().then(async () => {
            if (window.ORCAMENTO_ATUAL_ID && ORCAMENTO_STATUS !== 3) {
                if (confirm("PDF Gerado!\nDeseja marcar como 'ENVIADO'?")) {
                    try { 
                        await fetch('/.netlify/functions/update_orcamento_status', { method: 'POST', body: JSON.stringify({ id: window.ORCAMENTO_ATUAL_ID, status: 2 }) }); 
                        ORCAMENTO_STATUS = 2;
                    } catch (e) {}
                }
            }
            el.style.display = 'none';
            closeModal(els.modalSucesso);
            limparTela();
        });
    }
    if(els.btnGerarPDFFinal) els.btnGerarPDFFinal.addEventListener('click', gerarPDF);
    if(els.btnVoltarSucesso) els.btnVoltarSucesso.addEventListener('click', () => location.href='orcamentos.html');

    function limparTela() {
        if(els.inputTitulo) els.inputTitulo.value = "";
        if(els.inputNome) els.inputNome.value = "";
        if(els.inputWhatsapp) els.inputWhatsapp.value = "";
        if(els.inputLocal) els.inputLocal.value = "";
        if(els.inputData) els.inputData.value = "";
        if(els.inputObs) els.inputObs.value = "";
        if(els.inputKm) els.inputKm.value = "";
        if(els.inputHosp) els.inputHosp.value = "";
        if(els.inputAlim) els.inputAlim.value = ALIMENTACAO_PADRAO; 
        if(els.inputValidade) els.inputValidade.value = "15"; 
        CLIENTE_SELECIONADO_ID = null;
        window.ORCAMENTO_ATUAL_ID = null;
        ORCAMENTO_STATUS = 1;
        
        const btnDel = document.getElementById('btnDeleteHeader');
        if(btnDel) btnDel.remove();
        
        if(els.headerTitle) els.headerTitle.innerText = "Novo Orçamento";
        els.btnSalvar.innerHTML = '<span>SALVAR</span> <i class="ph ph-floppy-disk"></i>';
        
        atualizarBotoesAcao();

        if(els.listaItens) els.listaItens.innerHTML = '';
        window.history.pushState({}, document.title, window.location.pathname);
        calcularTotal();
    }
});