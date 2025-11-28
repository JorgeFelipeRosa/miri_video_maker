/* netlify/functions/get_pedido_detalhes.js */
const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

exports.handler = async function(event) {
  try {
    const { id } = event.queryStringParameters;
    if (!id) return { statusCode: 400, body: "ID necessário" };

    // 1. Capa + Cliente (Incluindo Endereço Completo)
    const sqlCapa = `
        SELECT 
            pc.*, 
            c.nome_razao_social, c.whatsapp, c.email, c.cpf_cnpj,
            c.cep, c.logradouro, c.numero, c.bairro, c.cidade, c.uf
        FROM pedidos_capa pc
        JOIN clientes c ON pc.id_cliente = c.id
        WHERE pc.id = ?
    `;
    const resCapa = await client.execute({ sql: sqlCapa, args: [id] });
    
    if (resCapa.rows.length === 0) return { statusCode: 404, body: "Não encontrado" };

    // 2. Itens
    const resItens = await client.execute({ 
        sql: "SELECT * FROM pedidos_itens WHERE id_pedido_capa = ?", 
        args: [id] 
    });

    // 3. Financeiro
    const resFin = await client.execute({ 
        sql: "SELECT * FROM financeiro_parcelas WHERE id_pedido_capa = ? ORDER BY data_vencimento ASC", 
        args: [id] 
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        pedido: resCapa.rows[0],
        itens: resItens.rows,
        financeiro: resFin.rows
      }),
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};