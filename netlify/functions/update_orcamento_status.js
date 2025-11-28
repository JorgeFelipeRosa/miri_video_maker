/* netlify/functions/update_pedido_status.js */
const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { id, new_status } = JSON.parse(event.body);

    if (!id || !new_status) return { statusCode: 400, body: "Dados incompletos" };

    // Atualiza o status
    await client.execute({
        sql: "UPDATE pedidos_capa SET id_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        args: [new_status, id]
    });

    return { statusCode: 200, body: JSON.stringify({ message: "Status atualizado" }) };

  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};