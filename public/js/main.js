// public/js/main.js
import { listarClientes, criarCliente } from './api.js';

const form = document.getElementById('form-cliente');
const lista = document.getElementById('lista-clientes');

// 1. Função para carregar a lista na tela
async function carregarTela() {
    lista.innerHTML = '<p>Carregando...</p>';
    
    const clientes = await listarClientes();
    
    lista.innerHTML = ''; // Limpa a lista
    
    if (clientes.length === 0) {
        lista.innerHTML = '<p>Nenhum cliente cadastrado.</p>';
        return;
    }

    // Cria um item para cada cliente
    clientes.forEach(cliente => {
        const item = document.createElement('li');
        item.innerHTML = `
            <strong>${cliente.nome_razao_social}</strong> 
            <small>${cliente.telefone_whatsapp || 'Sem whats'}</small>
        `;
        lista.appendChild(item);
    });
}

// 2. Evento de Enviar o Formulário
form.addEventListener('submit', async (event) => {
    event.preventDefault(); // Não deixa a página recarregar

    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.innerText = "Salvando...";

    // Pega os dados dos inputs
    const novoCliente = {
        nome: document.getElementById('nome').value,
        cpf: document.getElementById('cpf').value,
        whatsapp: document.getElementById('whatsapp').value,
        email: document.getElementById('email').value
    };

    await criarCliente(novoCliente);

    // Limpa o form e recarrega a lista
    form.reset();
    await carregarTela();
    
    btn.disabled = false;
    btn.innerText = "Cadastrar Cliente";
});

// Carrega a lista assim que a página abre
carregarTela();