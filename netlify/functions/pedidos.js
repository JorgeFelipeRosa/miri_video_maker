const db = require("./_db");

exports.handler = async (event, context) => {
  try {
    const idParam = event.queryStringParameters?.id;

    // --- DETALHES DO PEDIDO (GET COM ID) ---
    if (event.httpMethod === "GET" && idParam) {
        // JOIN poderoso para pegar Local do Orçamento + Dados Completos do Cliente
        const resCapa = await db.execute({
            sql: `SELECT 
                    p.*, 
                    c.nome_razao_social, c.whatsapp, c.email, c.cpf_cnpj, c.logradouro, c.numero, c.cidade,
                    o.local_evento, o.observacoes as obs_orcamento
                  FROM pedidos_capa p 
                  JOIN clientes c ON p.id_cliente = c.id 
                  JOIN orcamentos_capa o ON p.id_orcamento_origem = o.id
                  WHERE p.id = ?`,
            args: [idParam]
        });
        
        if(resCapa.rows.length === 0) return { statusCode: 404, body: "Não encontrado" };

        const resItens = await db.execute({ sql: "SELECT * FROM pedidos_itens WHERE id_pedido_capa = ?", args: [idParam] });
        const resFin = await db.execute({ sql: "SELECT * FROM financeiro_parcelas WHERE id_pedido_capa = ?", args: [idParam] });

        return { statusCode: 200, body: JSON.stringify({ ...resCapa.rows[0], itens: resItens.rows, financeiro: resFin.rows }) };
    }

    // --- LISTAR KANBAN (GET SEM ID) ---
    if (event.httpMethod === "GET") {
      const sql = `SELECT p.*, c.nome_razao_social FROM pedidos_capa p JOIN clientes c ON p.id_cliente = c.id ORDER BY p.data_evento ASC`;
      const result = await db.execute(sql);
      return { statusCode: 200, body: JSON.stringify(result.rows) };
    }

    // --- CRIAR PEDIDO (POST) ---
    if (event.httpMethod === "POST") {
      const dados = JSON.parse(event.body);
      const idOrcamento = dados.id_orcamento;

      const resOrc = await db.execute({ sql: "SELECT * FROM orcamentos_capa WHERE id = ?", args: [idOrcamento] });
      const orcamento = resOrc.rows[0];

      const resPedido = await db.execute({
          sql: `INSERT INTO pedidos_capa (id_orcamento_origem, id_cliente, id_status, titulo_evento, data_evento, valor_contrato_final, created_at) VALUES (?, ?, 1, ?, ?, ?, CURRENT_TIMESTAMP)`,
          args: [idOrcamento, orcamento.id_cliente, orcamento.titulo_evento, orcamento.data_evento, orcamento.valor_total_geral]
      });
      const idPedido = resPedido.lastInsertRowid.toString();

      const resItens = await db.execute({ sql: "SELECT * FROM orcamentos_itens WHERE id_orcamento_capa = ?", args: [idOrcamento] });
      for (const item of resItens.rows) {
          await db.execute({
              sql: "INSERT INTO pedidos_itens (id_pedido_capa, nome_item, valor_final) VALUES (?, ?, ?)",
              args: [idPedido, item.nome_item, item.valor_total_item]
          });
      }

      if (dados.valor_entrada > 0) {
          await db.execute({
              sql: "INSERT INTO financeiro_parcelas (id_pedido_capa, valor_parcela, data_pagamento, pago, created_at) VALUES (?, ?, CURRENT_DATE, 1, CURRENT_TIMESTAMP)",
              args: [idPedido, parseFloat(dados.valor_entrada)]
          });
      }

      await db.execute({ sql: "UPDATE orcamentos_capa SET id_status = 3 WHERE id = ?", args: [idOrcamento] });
      return { statusCode: 201, body: JSON.stringify({ message: "Pedido Gerado!" }) };
    }

    // --- ATUALIZAR STATUS/LINK (PUT) ---
    if (event.httpMethod === "PUT") {
        const dados = JSON.parse(event.body);
        if(dados.acao === 'status') await db.execute({ sql: "UPDATE pedidos_capa SET id_status = ? WHERE id = ?", args: [dados.id_status, dados.id] });
        if(dados.acao === 'link') await db.execute({ sql: "UPDATE pedidos_capa SET link_drive_final = ? WHERE id = ?", args: [dados.link, dados.id] });
        return { statusCode: 200, body: JSON.stringify({ message: "Ok" }) };
    }

    return { statusCode: 405, body: "Erro" };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};