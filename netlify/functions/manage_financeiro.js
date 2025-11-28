/* netlify/functions/manage_financeiro.js - VERSÃO EXTRATO (TUDO É PAGO) */
const { createClient } = require("@libsql/client");
const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  
  try {
    const data = JSON.parse(event.body);

    // AÇÃO: ADICIONAR PAGAMENTO (JÁ ENTRA COMO PAGO)
    if (data.action === "create") {
        if (!data.id_pedido || !data.valor) {
            return { statusCode: 400, body: JSON.stringify({ error: "Dados incompletos" }) };
        }

        const idForma = data.id_forma_pagamento ? parseInt(data.id_forma_pagamento) : null;

        await client.execute({
            sql: `INSERT INTO financeiro_parcelas (
                    id_pedido_capa, 
                    descricao, 
                    valor_parcela, 
                    data_vencimento, 
                    id_forma_pagamento,
                    pago,
                    data_pagamento
                  ) VALUES (?, ?, ?, ?, ?, 1, ?)`, // <--- FORÇA PAGO = 1
            args: [
                data.id_pedido, 
                data.descricao || "Pagamento", 
                parseFloat(data.valor), 
                data.vencimento,
                idForma,
                data.vencimento // data_pagamento é a mesma do registro
            ]
        });
        return { statusCode: 200, body: JSON.stringify({ message: "Pagamento registrado" }) };
    }
    
    // AÇÃO: DELETAR
    if (data.action === "delete") {
        await client.execute({ sql: "DELETE FROM financeiro_parcelas WHERE id = ?", args: [data.id_parcela] });
        return { statusCode: 200, body: JSON.stringify({ message: "Deletado" }) };
    }

    return { statusCode: 400, body: "Ação inválida" };

  } catch (error) {
    console.error("Erro Financeiro:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};