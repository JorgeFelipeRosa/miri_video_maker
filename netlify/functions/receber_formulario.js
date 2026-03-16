/* netlify/functions/receber_formulario.js - Formulário público de captação de leads */
const client = require("./_shared/_db.js");

const ORIGEM_FORM = "Formulário site";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const data = JSON.parse(event.body || "{}");
    const nome = (data.nome || "").trim();
    const email = (data.email || "").trim();
    const whatsapp = (data.whatsapp || "").trim().replace(/\D/g, "");
    const tipo_evento = (data.tipo_evento || "").trim() || null;
    const data_desejada = data.data_desejada || null;
    const mensagem = (data.mensagem || "").trim() || null;

    if (!nome) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Nome é obrigatório" }),
      };
    }
    if (!email && !whatsapp) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Informe e-mail ou WhatsApp" }),
      };
    }

    // Verifica duplicado (e-mail ou WhatsApp)
    if (email || whatsapp) {
      const conditions = [];
      const args = [];
      if (email) {
        conditions.push("email = ?");
        args.push(email);
      }
      if (whatsapp) {
        conditions.push("whatsapp = ?");
        args.push(whatsapp);
      }
      const sqlDup = `SELECT id FROM clientes WHERE ativo = 1 AND (${conditions.join(" OR ")}) LIMIT 1`;
      const resDup = await client.execute({ sql: sqlDup, args });
      if (resDup.rows.length > 0) {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({
            existing: true,
            id: resDup.rows[0].id,
            message: "Já temos seu contato. Em breve entraremos em contato!",
          }),
        };
      }
    }

    // Origem: tenta usar "Formulário site" (id ou descrição conforme o banco)
    let origemVal = ORIGEM_FORM;
    try {
      const resOrig = await client.execute(
        "SELECT id, descricao FROM origens_contato WHERE ativo = 1"
      );
      const rowForm = resOrig.rows.find((r) => (r.descricao || "").toLowerCase().includes("formulário") || (r.descricao || "").toLowerCase().includes("formulario"));
      if (rowForm && rowForm.id != null) origemVal = rowForm.id;
    } catch (_) {}

    const sqlCli = `
      INSERT INTO clientes (nome_razao_social, cpf_cnpj, email, whatsapp, cep, logradouro, numero, bairro, cidade, uf, origem_contato, ativo)
      VALUES (?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, ?, 1)
    `;
    await client.execute({
      sql: sqlCli,
      args: [nome, null, email || null, whatsapp || null, origemVal],
    });

    const resId = await client.execute({
      sql: "SELECT id FROM clientes WHERE nome_razao_social = ? ORDER BY id DESC LIMIT 1",
      args: [nome],
    });
    const idCliente = resId.rows[0]?.id;

    if (idCliente && (tipo_evento || data_desejada || mensagem)) {
      try {
        await client.execute({
          sql: `INSERT INTO formulario_entradas (id_cliente, tipo_evento, data_desejada, mensagem) VALUES (?, ?, ?, ?)`,
          args: [idCliente, tipo_evento, data_desejada, mensagem],
        });
      } catch (e) {
        if (!e.message || !e.message.includes("no such table")) console.error("formulario_entradas", e);
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        message: "Recebemos seu contato! Em breve entraremos em contato.",
        id: idCliente,
      }),
    };
  } catch (error) {
    console.error("receber_formulario:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Erro ao processar. Tente novamente." }),
    };
  }
};
