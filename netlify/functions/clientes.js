const db = require("./_db");

exports.handler = async (event, context) => {
  try {
    
    // --- LISTAR (GET) ---
    if (event.httpMethod === "GET") {
      const idParam = event.queryStringParameters?.id;
      
      if (idParam) {
          const res = await db.execute({ 
              sql: "SELECT * FROM clientes WHERE id = ?", 
              args: [idParam] 
          });
          return { statusCode: 200, body: JSON.stringify(res.rows[0] || {}) };
      }
      
      const result = await db.execute("SELECT * FROM clientes ORDER BY id DESC");
      return { statusCode: 200, body: JSON.stringify(result.rows) };
    }

    // --- CRIAR (POST) ---
    if (event.httpMethod === "POST") {
      const dados = JSON.parse(event.body);
      
      // CORREÇÃO: Coluna 'whatsapp' em vez de 'telefone_whatsapp'
      await db.execute({
        sql: `INSERT INTO clientes (
            nome_razao_social, cpf_cnpj, whatsapp, email, 
            cep, logradouro, numero, bairro, cidade, uf
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
            dados.nome || "Sem Nome",
            dados.cpf || null,
            dados.whatsapp || "",
            dados.email || "",
            dados.cep || "",
            dados.logradouro || "",
            dados.numero || "",
            dados.bairro || "",
            dados.cidade || "",
            dados.uf || ""
        ]
      });
      return { statusCode: 201, body: JSON.stringify({ message: "Cliente criado" }) };
    }

    // --- ATUALIZAR (PUT) ---
    if (event.httpMethod === "PUT") {
        const dados = JSON.parse(event.body);
        
        if (!dados.id) {
            return { statusCode: 400, body: JSON.stringify({ error: "ID do cliente é obrigatório" }) };
        }

        // CORREÇÃO: Coluna 'whatsapp' corrigida aqui também
        await db.execute({
            sql: `UPDATE clientes SET 
                  nome_razao_social=?, cpf_cnpj=?, whatsapp=?, email=?, 
                  cep=?, logradouro=?, numero=?, bairro=?, cidade=?, uf=?, 
                  updated_at=CURRENT_TIMESTAMP
                  WHERE id=?`,
            args: [
                dados.nome || "",
                dados.cpf || null,
                dados.whatsapp || "",
                dados.email || "",
                dados.cep || "",
                dados.logradouro || "",
                dados.numero || "",
                dados.bairro || "",
                dados.cidade || "",
                dados.uf || "",
                dados.id
            ]
        });

        return { statusCode: 200, body: JSON.stringify({ message: "Dados atualizados com sucesso!" }) };
    }

    return { statusCode: 405, body: "Método não permitido" };

  } catch (error) {
    console.error("ERRO NO BACKEND CLIENTES:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};