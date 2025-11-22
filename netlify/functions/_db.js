// netlify/functions/_db.js

// --- LINHA MÁGICA: Carrega as senhas do arquivo .env ---
require("dotenv").config(); 
// -------------------------------------------------------

const { createClient } = require("@libsql/client");

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

// DEBUG: Mostra no terminal se achou (sem mostrar a senha real)
console.log("--- DIAGNÓSTICO DE CONEXÃO ---");
console.log("URL do Banco:", url ? "✅ Carregada" : "❌ UNDEFINED (Erro aqui)");
console.log("Token:", authToken ? "✅ Carregado" : "❌ UNDEFINED (Erro aqui)");

if (!url || !authToken) {
    console.error("ERRO FATAL: As variáveis de ambiente não foram carregadas.");
    throw new Error("URL ou TOKEN do banco estão vazios.");
}

// Tratamento para garantir que o Turso aceite a conexão
const finalUrl = url.replace("libsql://", "https://");

const client = createClient({
  url: finalUrl,
  authToken: authToken,
});

module.exports = client;