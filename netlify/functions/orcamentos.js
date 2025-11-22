const db = require("./_db");

exports.handler = async (event, context) => {
  try {
// 1. LISTAR ORÇAMENTOS (GET)
    if (event.httpMethod === "GET") {
      // ADICIONEI O CAMPO: clientes.telefone_whatsapp
      const sql = `
        SELECT projetos.*, clientes.nome_razao_social, clientes.telefone_whatsapp
        FROM projetos 
        JOIN clientes ON projetos.cliente_id = clientes.id 
        ORDER BY projetos.id DESC
      `;
      const result = await db.execute(sql);
      return { statusCode: 200, body: JSON.stringify(result.rows) };
    }

    // 2. CRIAR NOVO ORÇAMENTO (POST)
    if (event.httpMethod === "POST") {
      const dados = JSON.parse(event.body);

      // a) Inserir o Projeto (Cabeçalho)
      const sqlProjeto = `
        INSERT INTO projetos (
            cliente_id, titulo_evento, data_evento, local_evento, 
            distancia_km, custo_logistica_total, 
            valor_servicos, valor_total_contrato, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ORCAMENTO')
      `;
      
      const resultProjeto = await db.execute({
        sql: sqlProjeto,
        args: [
            dados.cliente_id, 
            dados.titulo, 
            dados.data, 
            dados.local,
            dados.distancia, 
            dados.custo_logistica, 
            dados.valor_servicos, 
            dados.total_geral
        ]
      });

      // Pega o ID do orçamento que acabou de ser criado
      const idOrcamento = resultProjeto.lastInsertRowid.toString();

      // b) Inserir os Itens (Serviços selecionados)
      // Vamos fazer um loop para salvar cada serviço escolhido
      for (const servico of dados.itens_selecionados) {
        await db.execute({
            sql: "INSERT INTO projeto_itens (projeto_id, servico_nome, valor_cobrado) VALUES (?, ?, ?)",
            args: [idOrcamento, servico.nome, servico.preco]
        });
      }

      return { statusCode: 201, body: JSON.stringify({ message: "Orçamento salvo com sucesso!" }) };
    }

    return { statusCode: 405, body: "Método não permitido" };

  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};