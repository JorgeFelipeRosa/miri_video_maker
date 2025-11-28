/* netlify/functions/get_orcamento_detalhes.js */
const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

exports.handler = async function(event) {
  try {
    const { id } = event.queryStringParameters;

    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ error: "ID não fornecido" }) };
    }

    // 1. Busca a Capa e dados do Cliente
    const sqlCapa = `
      SELECT 
        oc.*,
        c.nome_razao_social,
        c.whatsapp,
        c.cidade
      FROM orcamentos_capa oc
      JOIN clientes c ON oc.id_cliente = c.id
      WHERE oc.id = ?
    `;
    const resultCapa = await client.execute({ sql: sqlCapa, args: [id] });

    if (resultCapa.rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: "Orçamento não encontrado" }) };
    }

    const orcamento = resultCapa.rows[0];

    // 2. Busca os Itens
    const sqlItens = `SELECT * FROM orcamentos_itens WHERE id_orcamento_capa = ?`;
    const resultItens = await client.execute({ sql: sqlItens, args: [id] });

    // Retorna tudo junto
    return {
      statusCode: 200,
      body: JSON.stringify({
        capa: orcamento,
        itens: resultItens.rows
      }),
    };

  } catch (error) {
    console.error("Erro ao buscar detalhes:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};