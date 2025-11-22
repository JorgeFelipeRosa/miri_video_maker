const db = require("./_db");

exports.handler = async (event, context) => {
  try {
    // 1. BUSCAR SERVIÇOS (GET)
    if (event.httpMethod === "GET") {
      // Traz apenas os ativos
      const result = await db.execute("SELECT * FROM servicos_catalogo WHERE ativo = 1");
      return { statusCode: 200, body: JSON.stringify(result.rows) };
    }

    // 2. CRIAR NOVO SERVIÇO (POST)
    if (event.httpMethod === "POST") {
      const dados = JSON.parse(event.body);
      
      if (!dados.nome || !dados.preco) {
        return { statusCode: 400, body: "Nome e Preço são obrigatórios" };
      }

      // Por padrão, vamos colocar na categoria 1 (Casamento) se não vier nada
      // E descrição técnica
      await db.execute({
        sql: `INSERT INTO servicos_catalogo 
              (nome, descricao_tecnica, preco_base, ativo, id_categoria) 
              VALUES (?, ?, ?, 1, 1)`,
        args: [dados.nome, dados.descricao || "", parseFloat(dados.preco)]
      });

      return { statusCode: 201, body: JSON.stringify({ message: "Serviço criado!" }) };
    }
// ... (Depois do bloco POST e antes do return 405)

    // 3. ATUALIZAR SERVIÇO (PUT)
    if (event.httpMethod === "PUT") {
        const dados = JSON.parse(event.body);
        
        if (!dados.id || !dados.nome || !dados.preco) {
            return { statusCode: 400, body: "ID, Nome e Preço são obrigatórios" };
        }

        await db.execute({
            sql: `UPDATE servicos_catalogo SET nome=?, descricao_tecnica=?, preco_base=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            args: [
                dados.nome, 
                dados.descricao || "", 
                parseFloat(dados.preco), 
                dados.id
            ]
        });

        return { statusCode: 200, body: JSON.stringify({ message: "Serviço atualizado!" }) };
    }
    return { statusCode: 405, body: "Método não permitido" };

  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: "Erro no servidor" }) };
  }
};