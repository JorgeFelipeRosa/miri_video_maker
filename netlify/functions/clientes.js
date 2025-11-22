// netlify/functions/clientes.js
const db = require("./_db"); // Importa a conexão que criamos acima

exports.handler = async (event, context) => {
  // O Netlify chama essa função quando alguém acessa /api/clientes

  try {
    // 1. Se for um GET (buscar clientes)
    if (event.httpMethod === "GET") {
      const resultado = await db.execute("SELECT * FROM clientes ORDER BY id DESC");
      
      return {
        statusCode: 200,
        body: JSON.stringify(resultado.rows),
      };
    }

    // 2. Se for um POST (criar novo cliente)
    if (event.httpMethod === "POST") {
      const dados = JSON.parse(event.body);
      
      // Validação simples
      if (!dados.nome) {
        return { statusCode: 400, body: "Nome é obrigatório" };
      }

      const query = `
        INSERT INTO clientes (nome_razao_social, cpf_cnpj, telefone_whatsapp, email)
        VALUES (?, ?, ?, ?)
      `;
      
      await db.execute({
        sql: query,
        args: [dados.nome, dados.cpf, dados.whatsapp, dados.email]
      });

      return {
        statusCode: 201,
        body: JSON.stringify({ message: "Cliente criado com sucesso!" }),
      };
    }

    // Se não for nem GET nem POST
    return { statusCode: 405, body: "Método não permitido" };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno no servidor" }),
    };
  }
};