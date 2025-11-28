const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

exports.handler = async function(event) {
  try {
    // Busca os orçamentos juntando com o nome do cliente
    const sql = `
      SELECT 
        oc.id,
        oc.titulo_evento,
        oc.data_evento,
        oc.valor_total_geral,
        oc.id_status,
        c.nome_razao_social as nome_cliente
      FROM orcamentos_capa oc
      LEFT JOIN clientes c ON oc.id_cliente = c.id
      ORDER BY oc.created_at DESC
    `;

    const result = await client.execute(sql);

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows),
    };

  } catch (error) {
    console.error("Erro ao listar:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao buscar orçamentos." }),
    };
  }
};