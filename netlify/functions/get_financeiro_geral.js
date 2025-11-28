/* netlify/functions/get_financeiro_geral.js */
const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

exports.handler = async function(event) {
  try {
    // Busca todas as parcelas, trazendo o nome do cliente junto
    const sql = `
      SELECT 
        fp.id,
        fp.descricao,
        fp.valor_parcela,
        fp.data_vencimento,
        fp.pago,
        fp.data_pagamento,
        c.nome_razao_social as cliente,
        pc.titulo_evento
      FROM financeiro_parcelas fp
      JOIN pedidos_capa pc ON fp.id_pedido_capa = pc.id
      JOIN clientes c ON pc.id_cliente = c.id
      ORDER BY fp.data_vencimento ASC
    `;

    const result = await client.execute(sql);

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows),
    };

  } catch (error) {
    console.error("Erro financeiro:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};