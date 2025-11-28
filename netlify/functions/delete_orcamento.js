/* netlify/functions/delete_orcamento.js */
const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { id } = JSON.parse(event.body);

    if (!id) return { statusCode: 400, body: "ID necessário" };

    // 1. Apaga os itens primeiro (Boa prática)
    await client.execute({
        sql: "DELETE FROM orcamentos_itens WHERE id_orcamento_capa = ?",
        args: [id]
    });

    // 2. Apaga a capa
    await client.execute({
        sql: "DELETE FROM orcamentos_capa WHERE id = ?",
        args: [id]
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Deletado com sucesso" }),
    };

  } catch (error) {
    console.error("Erro ao deletar:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};