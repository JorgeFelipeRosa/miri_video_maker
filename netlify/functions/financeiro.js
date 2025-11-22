const db = require("./_db");

exports.handler = async (event, context) => {
  try {
    // --- LISTAR PAGAMENTOS DE UM PEDIDO (GET) ---
    if (event.httpMethod === "GET") {
      const idPedido = event.queryStringParameters?.id_pedido;
      if (!idPedido) return { statusCode: 400, body: "ID do pedido necessário" };

      const res = await db.execute({
          sql: "SELECT * FROM financeiro_parcelas WHERE id_pedido_capa = ? ORDER BY data_pagamento DESC",
          args: [idPedido]
      });
      return { statusCode: 200, body: JSON.stringify(res.rows) };
    }

    // --- LANÇAR NOVO PAGAMENTO (POST) ---
    if (event.httpMethod === "POST") {
      const dados = JSON.parse(event.body);
      
      await db.execute({
          sql: `INSERT INTO financeiro_parcelas 
                (id_pedido_capa, numero_parcela, valor_parcela, data_pagamento, pago, created_at) 
                VALUES (?, 1, ?, ?, 1, CURRENT_TIMESTAMP)`,
          args: [
              dados.id_pedido,
              dados.valor,
              dados.data || new Date().toISOString().split('T')[0]
          ]
      });

      return { statusCode: 201, body: JSON.stringify({ message: "Pagamento registrado!" }) };
    }

    return { statusCode: 405, body: "Método não permitido" };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};