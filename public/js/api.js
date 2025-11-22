// public/js/api.js

// Essa url "/.netlify/functions" é mágica. Funciona tanto no seu PC quanto online.
const API_URL = '/.netlify/functions';

export async function listarClientes() {
    try {
        const response = await fetch(`${API_URL}/clientes`);
        return await response.json();
    } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        return [];
    }
}

export async function criarCliente(cliente) {
    try {
        const response = await fetch(`${API_URL}/clientes`, {
            method: 'POST',
            body: JSON.stringify(cliente)
        });
        return await response.json();
    } catch (error) {
        console.error("Erro ao criar cliente:", error);
        return { error: "Erro de conexão" };
    }
}