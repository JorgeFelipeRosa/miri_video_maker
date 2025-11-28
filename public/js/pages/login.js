/* public/js/pages/login.js */

// 1. Captura o formulário
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
        // 2. Impede que a página recarregue (padrão do HTML)
        event.preventDefault();

        // 3. (Futuro) Aqui faremos a chamada para a API checar a senha...
        // Por enquanto, vamos simular que deu certo:
        
        const email = loginForm.querySelector('input[type="email"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;

        if(email && password) {
            // Efeito visual de carregando (opcional)
            const btn = loginForm.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = "Entrando...";
            btn.style.opacity = "0.8";

            // 4. Redireciona para o Dashboard após 1 segundinho (charme)
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 800);
        } else {
            alert("Por favor, preencha os campos (qualquer coisa serve por enquanto).");
        }
    });
}