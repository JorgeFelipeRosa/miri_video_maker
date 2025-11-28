const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Tabelas permitidas (Segurança para ninguém deletar a tabela errada)
const ALLOWED_TABLES = ["categorias_servico", "formas_pagamento", "origens_contato"];

exports.handler = async function(event) {
  try {
    const { action, table, item_id, descricao } = JSON.parse(event.body || '{}');

    // Se for GET (Listar)
    if (event.httpMethod === "GET") {
      const tableName = event.queryStringParameters.table;
      if (!ALLOWED_TABLES.includes(tableName)) return { statusCode: 400, body: "Tabela inválida" };
      
      const result = await client.execute(`SELECT * FROM ${tableName} WHERE ativo = 1`);
      return { statusCode: 200, body: JSON.stringify(result.rows) };
    }

    // Se for POST (Adicionar/Deletar)
    if (event.httpMethod === "POST") {
      if (!ALLOWED_TABLES.includes(table)) return { statusCode: 400, body: "Tabela inválida" };

      if (action === "create") {
        if (!descricao) return { statusCode: 400, body: "Descrição necessária" };
        const res = await client.execute({
            sql: `INSERT INTO ${table} (descricao, ativo) VALUES (?, 1) RETURNING id`,
            args: [descricao]
        });
        return { statusCode: 200, body: JSON.stringify({ id: res.rows[0]?.id || res.lastInsertRowid }) };
      }

      if (action === "delete") {
        if (!item_id) return { statusCode: 400, body: "ID necessário" };
        // Não deletamos de verdade, só inativamos (Soft Delete) para não quebrar histórico
        await client.execute({
            sql: `UPDATE ${table} SET ativo = 0 WHERE id = ?`,
            args: [item_id]
        });
        return { statusCode: 200, body: JSON.stringify({ message: "Deletado" }) };
      }
    }

    return { statusCode: 405, body: "Method Not Allowed" };

  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};