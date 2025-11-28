/* netlify/functions/save_orcamento.js */
const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const safe = (val, isNumber = false) => {
    if (val === undefined || val === null || val === "") return null;
    if (isNumber) { const num = Number(val); return isNaN(num) ? 0 : num; }
    return val;
};

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const data = JSON.parse(event.body);
    let finalClienteId = data.id_cliente;
    let orcamentoId = data.id_orcamento;

    // 1. LÓGICA DE CLIENTE
    if (finalClienteId) {
        // --- ATUALIZAÇÃO DE CLIENTE EXISTENTE ---
        // Se veio ID e dados novos, atualizamos o cadastro
        if (data.novo_cliente_dados) {
            console.log(`Atualizando dados do cliente #${finalClienteId}...`);
            await client.execute({
                sql: `UPDATE clientes SET 
                      nome_razao_social = ?, 
                      whatsapp = ?, 
                      cidade = ? 
                      WHERE id = ?`,
                args: [
                    data.novo_cliente_dados.nome,
                    data.novo_cliente_dados.whatsapp,
                    data.novo_cliente_dados.cidade,
                    finalClienteId
                ]
            });
        }
    } else if (data.novo_cliente_dados) {
        // --- CRIAÇÃO DE CLIENTE NOVO ---
        console.log("Cadastrando novo cliente...");
        const sqlNovoCliente = `INSERT INTO clientes (nome_razao_social, whatsapp, cidade, ativo) VALUES (?, ?, ?, 1) RETURNING id`;
        const resCliente = await client.execute({ 
            sql: sqlNovoCliente, 
            args: [data.novo_cliente_dados.nome, data.novo_cliente_dados.whatsapp, data.novo_cliente_dados.cidade] 
        });
        finalClienteId = resCliente.rows[0]?.id || resCliente.lastInsertRowid;
    }

    if (!finalClienteId) throw new Error("Erro ao identificar cliente.");

    // 2. ORÇAMENTO (CAPA): INSERT ou UPDATE
    if (orcamentoId) {
        console.log(`Atualizando orçamento #${orcamentoId}...`);
        const sqlUpdate = `
            UPDATE orcamentos_capa SET
                id_cliente = ?, titulo_evento = ?, data_evento = ?, validade_proposta = ?,
                local_evento = ?, distancia_km = ?, custo_km_aplicado = ?,
                custo_alimentacao = ?, custo_hospedagem = ?,
                valor_total_logistica = ?, valor_total_servicos = ?, valor_total_geral = ?,
                observacoes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        const argsUpdate = [
            finalClienteId, safe(data.titulo_evento), safe(data.data_evento), safe(data.validade_proposta),
            safe(data.local_evento), safe(data.distancia_km, true), safe(data.custo_gasolina, true),
            safe(data.custo_alimentacao, true), safe(data.custo_hospedagem, true),
            safe(data.total_logistica, true), safe(data.total_servicos, true), safe(data.total_geral, true),
            safe(data.observacoes), orcamentoId
        ];
        await client.execute({ sql: sqlUpdate, args: argsUpdate });
        await client.execute({ sql: "DELETE FROM orcamentos_itens WHERE id_orcamento_capa = ?", args: [orcamentoId] });

    } else {
        console.log("Criando novo orçamento...");
        const sqlInsert = `
            INSERT INTO orcamentos_capa (
                id_cliente, id_status, titulo_evento, data_evento, validade_proposta,
                local_evento, distancia_km, custo_km_aplicado, custo_alimentacao, custo_hospedagem,
                valor_total_logistica, valor_total_servicos, valor_total_geral, observacoes
            ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
        `;
        const argsInsert = [
            finalClienteId, safe(data.titulo_evento) || "Novo Orçamento", safe(data.data_evento), safe(data.validade_proposta),
            safe(data.local_evento), safe(data.distancia_km, true), safe(data.custo_gasolina, true),
            safe(data.custo_alimentacao, true), safe(data.custo_hospedagem, true),
            safe(data.total_logistica, true), safe(data.total_servicos, true), safe(data.total_geral, true),
            safe(data.observacoes)
        ];
        const result = await client.execute({ sql: sqlInsert, args: argsInsert });
        orcamentoId = result.rows[0]?.id || result.lastInsertRowid;
    }

    // 3. ITENS
    if (data.itens && data.itens.length > 0) {
        for (const item of data.itens) {
            await client.execute({
                sql: `INSERT INTO orcamentos_itens (id_orcamento_capa, id_servico_catalogo, nome_item, valor_unitario, valor_total_item) VALUES (?, ?, ?, ?, ?)`,
                args: [orcamentoId, safe(item.id_servico), safe(item.nome), safe(item.valor, true), safe(item.valor, true)]
            });
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Salvo com sucesso!", id: orcamentoId }),
    };

  } catch (error) {
    console.error("Erro backend:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};