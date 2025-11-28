/* netlify/functions/get_pedidos.js - VERSÃO BLINDADA */
const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

exports.handler = async function(event) {
  try {
    // Usamos LEFT JOIN: Traz o pedido MESMO SE o cliente não existir mais
    const sql = `
      SELECT 
        pc.id,
        pc.titulo_evento,
        pc.data_evento,
        pc.id_status,
        pc.valor_contrato_final,
        COALESCE(c.nome_razao_social, 'Cliente Desconhecido') as nome_cliente,
        c.cidade
      FROM pedidos_capa pc
      LEFT JOIN clientes c ON pc.id_cliente = c.id
      ORDER BY pc.data_evento ASC
    `;

    const result = await client.execute(sql);

    console.log("Pedidos encontrados no banco:", result.rows.length);

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows),
    };

  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};