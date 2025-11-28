/* netlify/functions/manage_services.js */
const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

exports.handler = async function(event) {
  try {
    // GET: LISTAR
    if (event.httpMethod === "GET") {
      const sql = `
        SELECT s.id, s.nome, s.descricao_tecnica, s.preco_base, s.id_categoria, c.descricao as nome_categoria
        FROM servicos_catalogo s
        LEFT JOIN categorias_servico c ON s.id_categoria = c.id
        WHERE s.ativo = 1
        ORDER BY s.nome ASC
      `;
      const result = await client.execute(sql);
      return { statusCode: 200, body: JSON.stringify(result.rows) };
    }

    // POST: CRIAR, ATUALIZAR OU DELETAR
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body);

      if (data.action === "delete") {
        await client.execute({
            sql: "UPDATE servicos_catalogo SET ativo = 0 WHERE id = ?",
            args: [data.id]
        });
        return { statusCode: 200, body: JSON.stringify({ message: "Deletado" }) };
      }

      if (data.action === "create") {
        await client.execute({
            sql: `INSERT INTO servicos_catalogo (nome, id_categoria, preco_base, descricao_tecnica, ativo) VALUES (?, ?, ?, ?, 1)`,
            args: [data.nome, data.id_categoria, data.preco, data.descricao]
        });
        return { statusCode: 200, body: JSON.stringify({ message: "Criado" }) };
      }

      if (data.action === "update") {
        await client.execute({
            sql: `UPDATE servicos_catalogo SET nome=?, id_categoria=?, preco_base=?, descricao_tecnica=? WHERE id=?`,
            args: [data.nome, data.id_categoria, data.preco, data.descricao, data.id]
        });
        return { statusCode: 200, body: JSON.stringify({ message: "Atualizado" }) };
      }
    }

    return { statusCode: 405, body: "Method Not Allowed" };

  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};