/* netlify/functions/calendario.js - Eventos por período (orçamentos + pedidos) */
const client = require("./_shared/_db.js");

exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const inicio = event.queryStringParameters?.inicio;
    const fim = event.queryStringParameters?.fim;

    if (!inicio || !fim) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Parâmetros inicio e fim (YYYY-MM-DD) são obrigatórios" }),
      };
    }

    const eventos = [];

    // Eventos de orçamentos (data_evento no período)
    const sqlOrc = `
      SELECT 
        oc.id as id_origem,
        oc.titulo_evento as titulo,
        oc.data_evento,
        oc.id_status,
        'orcamento' as tipo,
        COALESCE(c.nome_razao_social, '') as nome_cliente,
        c.cidade
      FROM orcamentos_capa oc
      LEFT JOIN clientes c ON oc.id_cliente = c.id
      WHERE oc.data_evento IS NOT NULL AND oc.data_evento >= ? AND oc.data_evento <= ?
      ORDER BY oc.data_evento ASC
    `;
    const resOrc = await client.execute({ sql: sqlOrc, args: [inicio, fim] });
    resOrc.rows.forEach((r) => {
      eventos.push({
        tipo: "orcamento",
        id_origem: r.id_origem,
        titulo: r.titulo,
        data_evento: r.data_evento,
        id_status: r.id_status,
        nome_cliente: r.nome_cliente,
        cidade: r.cidade,
      });
    });

    // Eventos de pedidos (data_evento no período)
    const sqlPed = `
      SELECT 
        pc.id as id_origem,
        pc.titulo_evento as titulo,
        pc.data_evento,
        pc.id_status,
        'pedido' as tipo,
        COALESCE(c.nome_razao_social, 'Cliente Desconhecido') as nome_cliente,
        c.cidade
      FROM pedidos_capa pc
      LEFT JOIN clientes c ON pc.id_cliente = c.id
      WHERE pc.data_evento IS NOT NULL AND pc.data_evento >= ? AND pc.data_evento <= ?
      ORDER BY pc.data_evento ASC
    `;
    const resPed = await client.execute({ sql: sqlPed, args: [inicio, fim] });
    resPed.rows.forEach((r) => {
      eventos.push({
        tipo: "pedido",
        id_origem: r.id_origem,
        titulo: r.titulo,
        data_evento: r.data_evento,
        id_status: r.id_status,
        nome_cliente: r.nome_cliente,
        cidade: r.cidade,
      });
    });

    // Ordenar por data
    eventos.sort((a, b) => (a.data_evento > b.data_evento ? 1 : -1));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventos),
    };
  } catch (error) {
    console.error("Erro calendário:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
