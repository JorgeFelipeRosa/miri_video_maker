const db = require("./_db");

exports.handler = async (event, context) => {
  try {
    const idParam = event.queryStringParameters?.id;

    // --- 1. BUSCAR DETALHES (GET COM ID) ---
    if (event.httpMethod === "GET" && idParam) {
        const sqlCapa = `
            SELECT capa.*, clientes.nome_razao_social, clientes.whatsapp 
            FROM orcamentos_capa as capa
            JOIN clientes ON capa.id_cliente = clientes.id
            WHERE capa.id = ?
        `;
        const resCapa = await db.execute({ sql: sqlCapa, args: [idParam] });
        
        if (resCapa.rows.length === 0) return { statusCode: 404, body: "Não encontrado" };

        const sqlItens = `SELECT * FROM orcamentos_itens WHERE id_orcamento_capa = ?`;
        const resItens = await db.execute({ sql: sqlItens, args: [idParam] });

        const orcamentoCompleto = { ...resCapa.rows[0], itens: resItens.rows };
        return { statusCode: 200, body: JSON.stringify(orcamentoCompleto) };
    }

    // --- 2. LISTAR TODOS (GET SEM ID) ---
    if (event.httpMethod === "GET") {
      const limitParam = event.queryStringParameters?.limit;
      
      let sql = `
        SELECT capa.*, clientes.nome_razao_social, status.descricao as status_nome
        FROM orcamentos_capa as capa
        JOIN clientes ON capa.id_cliente = clientes.id 
        JOIN status_orcamento as status ON capa.id_status = status.id
        ORDER BY capa.id DESC
      `;
      
      // Se tiver limite, adiciona no SQL
      if (limitParam) {
          sql += ` LIMIT ${parseInt(limitParam)}`;
      }

      const result = await db.execute(sql);
      return { statusCode: 200, body: JSON.stringify(result.rows) };
    }

    // --- 3. CRIAR OU ATUALIZAR (POST / PUT) ---
    if (event.httpMethod === "POST" || event.httpMethod === "PUT") {
      const dados = JSON.parse(event.body);
      let idOrcamento = dados.id_orcamento; 

      // Lógica de Cliente (Lead)
      let idClienteFinal = dados.cliente_id;
      if (!idClienteFinal && dados.cliente_nome_rapido) {
        const resCli = await db.execute({
            sql: `INSERT INTO clientes (nome_razao_social, whatsapp) VALUES (?, ?)`,
            args: [
                dados.cliente_nome_rapido || "Cliente Novo", 
                dados.cliente_whats_rapido || ""
            ]
        });
        idClienteFinal = resCli.lastInsertRowid.toString();
      }

      if (!idClienteFinal && !idOrcamento) return { statusCode: 400, body: JSON.stringify({error: "Cliente obrigatório"}) };

      // Tratamento de Valores Numéricos (Evitar erro se vier vazio "")
      const dist = parseFloat(dados.distancia) || 0;
      const custoKm = parseFloat(dados.custo_km) || 0;
      const custoLog = parseFloat(dados.custo_logistica) || 0;
      const vServ = parseFloat(dados.valor_servicos) || 0;
      const vTotal = parseFloat(dados.total_geral) || 0;

      if (event.httpMethod === "PUT" && idOrcamento) {
          // --- UPDATE (BLINDADO) ---
          await db.execute({
              sql: `UPDATE orcamentos_capa SET 
                    titulo_evento=?, data_evento=?, local_evento=?, distancia_km=?, 
                    custo_km_aplicado=?, valor_total_logistica=?, valor_total_servicos=?, 
                    valor_total_geral=?, observacoes=?, validade_proposta=?, updated_at=CURRENT_TIMESTAMP
                    WHERE id = ?`,
              args: [
                  dados.titulo || "Evento", 
                  dados.data || null, 
                  dados.local || "", 
                  dist, custoKm, custoLog, vServ, vTotal,
                  dados.observacoes || "", 
                  dados.validade || null, 
                  idOrcamento
              ]
          });
          // Limpa itens antigos para recriar
          await db.execute({ sql: "DELETE FROM orcamentos_itens WHERE id_orcamento_capa = ?", args: [idOrcamento] });
      } else {
          // --- INSERT (BLINDADO) ---
          const res = await db.execute({
            sql: `INSERT INTO orcamentos_capa (
                id_cliente, id_status, titulo_evento, data_evento, local_evento, 
                distancia_km, custo_km_aplicado, valor_total_logistica, 
                valor_total_servicos, valor_total_geral, observacoes, validade_proposta, created_at
            ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            args: [
                idClienteFinal, 
                dados.titulo || "Evento", 
                dados.data || null, 
                dados.local || "", 
                dist, custoKm, custoLog, vServ, vTotal, 
                dados.observacoes || "", 
                dados.validade || null
            ]
          });
          idOrcamento = res.lastInsertRowid.toString();
      }

      // INSERIR ITENS (BLINDADO)
      if (dados.itens_selecionados && dados.itens_selecionados.length > 0) {
          for (const item of dados.itens_selecionados) {
            await db.execute({
                sql: `INSERT INTO orcamentos_itens 
                      (id_orcamento_capa, id_servico_catalogo, nome_item, valor_unitario, valor_total_item) 
                      VALUES (?, ?, ?, ?, ?)`,
                args: [
                    idOrcamento, 
                    item.id || null, // Se não tiver ID do produto, vai NULL (sem erro)
                    item.nome || "Item", 
                    item.preco || 0, 
                    item.preco || 0
                ]
            });
          }
      }

      return { statusCode: 201, body: JSON.stringify({ message: "Salvo!", id: idOrcamento }) };
    }

    return { statusCode: 405, body: "Método não permitido" };

  } catch (error) {
    console.error("Erro Backend:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message || "Erro desconhecido no servidor" }) };
  }
};