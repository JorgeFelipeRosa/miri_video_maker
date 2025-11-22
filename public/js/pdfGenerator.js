// public/js/pdfGenerator.js

export async function gerarPDFOrcamento(dados) {
    // 1. Preencher o Template (que deve estar no HTML principal, escondido)
    document.getElementById('pdf-cliente-nome').innerText = dados.cliente_nome_rapido || dados.nome_razao_social || "Cliente";
    document.getElementById('pdf-cliente-whats').innerText = dados.cliente_whats_rapido || dados.whatsapp || "";
    document.getElementById('pdf-evento-titulo').innerText = dados.titulo || dados.titulo_evento;
    
    // Formata datas e valores
    const dataEvento = new Date(dados.data || dados.data_evento).toLocaleDateString('pt-BR');
    const dataValidade = new Date(dados.validade || dados.validade_proposta).toLocaleDateString('pt-BR');
    
    document.getElementById('pdf-evento-data').innerText = dataEvento;
    document.getElementById('pdf-evento-local').innerText = dados.local || dados.local_evento || "";
    document.getElementById('pdf-validade').innerText = dataValidade;
    document.getElementById('pdf-obs').innerText = dados.observacoes || "";
    document.getElementById('pdf-id').innerText = (dados.id || Date.now()).toString().slice(-4);

    // Preencher Itens
    const tbody = document.getElementById('pdf-lista-itens');
    tbody.innerHTML = '';
    
    const lista = dados.itens || dados.itens_selecionados || [];
    lista.forEach(item => {
        const nome = item.nome_item || item.nome;
        const valor = item.valor_total_item || item.preco;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 10px; border-bottom: 1px solid #ccc; color: #000;">${nome}</td>
            <td style="text-align: right; padding: 10px; border-bottom: 1px solid #ccc; color: #000; font-weight:bold;">
                ${valor.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}
            </td>`;
        tbody.appendChild(tr);
    });

    // Logística e Total
    const logistica = dados.valor_total_logistica !== undefined ? dados.valor_total_logistica : dados.custo_logistica;
    const total = dados.valor_total_geral !== undefined ? dados.valor_total_geral : dados.total_geral;

    document.getElementById('pdf-logistica').innerText = parseFloat(logistica).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
    document.getElementById('pdf-total-final').innerText = parseFloat(total).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});

    // 2. Gerar o Arquivo
    const element = document.getElementById('pdf-orcamento-template');
    const opt = {
        margin: 0,
        filename: `Proposta_${(dados.titulo || 'Orcamento').replace(/\s/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Share mobile ou Save desktop
    if (navigator.canShare && navigator.maxTouchPoints > 0) {
        try {
            const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
            const file = new File([pdfBlob], opt.filename, { type: "application/pdf" });
            await navigator.share({ files: [file], title: 'Orçamento', text: 'Segue a proposta.' });
        } catch(e) { console.log("Share cancelado"); }
    } else {
        await html2pdf().set(opt).from(element).save();
    }
}

export async function gerarPDFContrato(cliente, evento) {
    // Preencher Contrato
    document.getElementById('ct-nome').innerText = cliente.nome;
    document.getElementById('ct-cpf').innerText = cliente.cpf || "..................";
    document.getElementById('ct-endereco').innerText = cliente.endereco;
    document.getElementById('ct-evento').innerText = evento.titulo;
    document.getElementById('ct-data').innerText = new Date(evento.data).toLocaleDateString('pt-BR');
    document.getElementById('ct-valor').innerText = evento.valor.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});

    const element = document.getElementById('pdf-contrato-template');
    const opt = {
        margin: 15,
        filename: `Contrato_${cliente.nome.split(' ')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (navigator.canShare && navigator.maxTouchPoints > 0) {
        try {
            const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
            const file = new File([pdfBlob], opt.filename, { type: "application/pdf" });
            await navigator.share({ files: [file] });
        } catch(e) {}
    } else {
        await html2pdf().set(opt).from(element).save();
    }
}