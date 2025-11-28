/* netlify/functions/manage_clients.js */
const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

exports.handler = async function(event) {
  try {
    // GET: LISTAR CLIENTES
    if (event.httpMethod === "GET") {
      const sql = `SELECT * FROM clientes WHERE ativo = 1 ORDER BY nome_razao_social ASC`;
      const result = await client.execute(sql);
      return { statusCode: 200, body: JSON.stringify(result.rows) };
    }

    // POST: CRIAR, ATUALIZAR, DELETAR
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body);

      // Deletar (Soft Delete)
      if (data.action === "delete") {
        await client.execute({
            sql: "UPDATE clientes SET ativo = 0 WHERE id = ?",
            args: [data.id]
        });
        return { statusCode: 200, body: JSON.stringify({ message: "Deletado" }) };
      }

      // Criar
      if (data.action === "create") {
        const sql = `
            INSERT INTO clientes (nome_razao_social, cpf_cnpj, email, whatsapp, cep, logradouro, numero, bairro, cidade, uf, origem_contato, ativo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `;
        await client.execute({
            sql: sql,
            args: [
                data.nome, data.cpf, data.email, data.whatsapp, 
                data.cep, data.rua, data.numero, data.bairro, data.cidade, data.uf, data.origem
            ]
        });
        return { statusCode: 200, body: JSON.stringify({ message: "Criado" }) };
      }

      // Atualizar
      if (data.action === "update") {
        const sql = `
            UPDATE clientes SET 
            nome_razao_social=?, cpf_cnpj=?, email=?, whatsapp=?, 
            cep=?, logradouro=?, numero=?, bairro=?, cidade=?, uf=?, origem_contato=?
            WHERE id=?
        `;
        await client.execute({
            sql: sql,
            args: [
                data.nome, data.cpf, data.email, data.whatsapp, 
                data.cep, data.rua, data.numero, data.bairro, data.cidade, data.uf, data.origem,
                data.id
            ]
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