/* netlify/functions/load_editor_data.js */
const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

exports.handler = async function(event, context) {
  try {
    // 1. Busca Configurações (Preço Gasolina, Alimentação Padrão)
    const configResult = await client.execute("SELECT * FROM configuracoes LIMIT 1");
    const config = configResult.rows[0] || { custo_km_padrao: 1.50, custo_alimentacao_padrao: 50 };

    // 2. Busca Serviços do Catálogo (Só os ativos)
    const servicosResult = await client.execute("SELECT * FROM servicos_catalogo WHERE ativo = 1");
    
    // 3. Busca Clientes
    const clientesResult = await client.execute("SELECT id, nome_razao_social, cidade FROM clientes WHERE ativo = 1");

    return {
      statusCode: 200,
      body: JSON.stringify({
        config: config,
        servicos: servicosResult.rows,
        clientes: clientesResult.rows
      }),
    };
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Falha ao buscar dados do banco." }),
    };
  }
};