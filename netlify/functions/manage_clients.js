/* netlify/functions/manage_clients.js */
const client = require("./_shared/_db.js");

exports.handler = async function(event) {
  try {
    // GET: LISTAR CLIENTES, BUSCAR POR ID ou VERIFICAR DUPLICADO (email/whatsapp)
    if (event.httpMethod === "GET") {
      const q = event.queryStringParameters || {};
      const id = q.id;
      const email = (q.email || "").trim();
      const whatsapp = (q.whatsapp || "").trim().replace(/\D/g, "");

      if (id) {
        const result = await client.execute({
          sql: "SELECT * FROM clientes WHERE id = ? AND ativo = 1",
          args: [id]
        });
        const row = result.rows[0] || null;
        return { statusCode: 200, body: JSON.stringify(row) };
      }

      if (email || whatsapp) {
        const conditions = [];
        const args = [];
        if (email) { conditions.push("email = ?"); args.push(email); }
        if (whatsapp) {
          conditions.push("(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(whatsapp,''),' ',''),'-',''),'(',''),')',''),'+','') = ?)");
          args.push(whatsapp);
        }
        const sqlDup = `SELECT id, nome_razao_social, email, whatsapp FROM clientes WHERE ativo = 1 AND (${conditions.join(" OR ")}) LIMIT 1`;
        const result = await client.execute({ sql: sqlDup, args });
        const row = result.rows[0] || null;
        return { statusCode: 200, body: JSON.stringify(row) };
      }

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