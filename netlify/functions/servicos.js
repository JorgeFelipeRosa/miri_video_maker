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
      
      // Validação rápida
      if (!dados.nome || !dados.preco) {
        return { statusCode: 400, body: "Nome e Preço são obrigatórios" };
      }

      await db.execute({
        sql: "INSERT INTO servicos_catalogo (nome, descricao, preco_base, ativo) VALUES (?, ?, ?, 1)",
        args: [dados.nome, dados.descricao || "", parseFloat(dados.preco)]
      });

      return { statusCode: 201, body: JSON.stringify({ message: "Serviço criado!" }) };
    }

    return { statusCode: 405, body: "Método não permitido" };

  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: "Erro no servidor" }) };
  }
};