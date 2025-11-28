/* netlify/functions/approve_orcamento.js - CORRIGIDO (COPIA ITENS) */
const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Função de segurança para evitar nulos
const safe = (val) => (val === undefined || val === null) ? null : val;

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { id_orcamento, dados_cliente } = JSON.parse(event.body);

    if (!id_orcamento) return { statusCode: 400, body: "ID obrigatório" };

    // 1. BUSCA O ORÇAMENTO (CAPA)
    const resOrc = await client.execute({ 
        sql: "SELECT * FROM orcamentos_capa WHERE id = ?", 
        args: [id_orcamento] 
    });
    
    if (resOrc.rows.length === 0) return { statusCode: 404, body: "Orçamento não encontrado" };
    const orc = resOrc.rows[0];

    // 2. ATUALIZA DADOS DO CLIENTE (SE HOUVER)
    if (dados_cliente) {
        try {
            await client.execute({
                sql: `UPDATE clientes SET 
                      cpf_cnpj = ?, cep = ?, logradouro = ?, numero = ?, 
                      bairro = ?, cidade = ?, uf = ?
                      WHERE id = ?`,
                args: [
                    safe(dados_cliente.cpf), safe(dados_cliente.cep), safe(dados_cliente.logradouro),
                    safe(dados_cliente.numero), safe(dados_cliente.bairro), safe(dados_cliente.cidade),
                    safe(dados_cliente.uf), orc.id_cliente
                ]
            });
        } catch (errClient) {
            console.error("Erro ao atualizar cliente:", errClient);
        }
    }

    // 3. CRIA A CAPA DO PEDIDO
    const sqlPedido = `
        INSERT INTO pedidos_capa (
            id_orcamento_origem, id_cliente, id_status, 
            titulo_evento, data_evento, valor_contrato_final
        ) VALUES (?, ?, 1, ?, ?, ?) 
        RETURNING id
    `;
    
    const resPed = await client.execute({ 
        sql: sqlPedido, 
        args: [orc.id, orc.id_cliente, safe(orc.titulo_evento), safe(orc.data_evento), safe(orc.valor_total_geral)] 
    });
    
    const novoIdPedido = resPed.rows[0]?.id || resPed.lastInsertRowid;

    // ==================================================================================
    // 4. COPIA OS ITENS (O QUE ESTAVA FALTANDO)
    // ==================================================================================
    
    // A. Busca os itens do orçamento original
    const resItensOrc = await client.execute({
        sql: "SELECT * FROM orcamentos_itens WHERE id_orcamento_capa = ?",
        args: [id_orcamento]
    });

    // B. Insere cada um na tabela de pedidos_itens
    if (resItensOrc.rows.length > 0) {
        for (const item of resItensOrc.rows) {
            await client.execute({
                sql: `INSERT INTO pedidos_itens (id_pedido_capa, nome_item, valor_final) VALUES (?, ?, ?)`,
                args: [
                    novoIdPedido, 
                    item.nome_item, 
                    item.valor_total_item // Usa o valor total do item
                ]
            });
        }
    }
    // ==================================================================================


    // 5. FECHA O ORÇAMENTO (Muda Status para 3 - Aprovado/Fechado)
    await client.execute({ 
        sql: "UPDATE orcamentos_capa SET id_status = 3 WHERE id = ?", 
        args: [id_orcamento] 
    });

    return { statusCode: 200, body: JSON.stringify({ message: "Aprovado!", id_pedido: novoIdPedido }) };

  } catch (error) {
    console.error("Erro crítico:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};