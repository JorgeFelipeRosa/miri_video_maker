const { createClient } = require("@libsql/client");
const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const data = JSON.parse(event.body);
    const { action, id_pedido } = data;

    // AÇÃO 1: ATUALIZAR STATUS OU DATA (Usado pelo Kanban e Modal)
    if (action === "update_status_data") {
        const updates = [];
        const args = [];

        if (data.id_status) { updates.push("id_status = ?"); args.push(data.id_status); }
        if (data.data_evento) { updates.push("data_evento = ?"); args.push(data.data_evento); }

        if (updates.length === 0) return { statusCode: 200, body: "Nada a fazer" };

        args.push(id_pedido);
        await client.execute({
            sql: `UPDATE pedidos_capa SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            args: args
        });
        return { statusCode: 200, body: JSON.stringify({ message: "Atualizado" }) };
    }
    
    // AÇÃO 2: ATUALIZAR ITENS (Usado na aba Itens)
    if (action === "update_items") {
        await client.execute({ sql: "DELETE FROM pedidos_itens WHERE id_pedido_capa = ?", args: [id_pedido] });
        
        let novoTotal = 0;
        if (data.itens && Array.isArray(data.itens)) {
            for (const item of data.itens) {
                const val = parseFloat(item.valor) || 0;
                novoTotal += val;
                await client.execute({
                    sql: "INSERT INTO pedidos_itens (id_pedido_capa, nome_item, valor_final) VALUES (?, ?, ?)",
                    args: [id_pedido, item.nome, val]
                });
            }
        }
        await client.execute({ sql: "UPDATE pedidos_capa SET valor_contrato_final = ? WHERE id = ?", args: [novoTotal, id_pedido] });
        return { statusCode: 200, body: JSON.stringify({ message: "Itens Salvos", novo_total: novoTotal }) };
    }

    // AÇÃO 3: ATUALIZAR ENDEREÇO (Usado na aba Endereço)
    if (action === "update_address") {
        await client.execute({
            sql: `UPDATE clientes SET cep=?, logradouro=?, numero=?, bairro=?, cidade=?, uf=? WHERE id=?`,
            args: [data.cep, data.rua, data.num, data.bairro, data.cidade, data.uf, data.id_cliente]
        });
        return { statusCode: 200, body: JSON.stringify({ message: "Endereço Salvo" }) };
    }

    return { statusCode: 400, body: "Ação desconhecida" };

  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};