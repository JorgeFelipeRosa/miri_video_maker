/* public/js/modules/sidebar.js - CARREGADOR AUTOMÁTICO */

document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. Onde vamos colocar a sidebar?
    const placeholder = document.getElementById("sidebar-container");
    
    if (placeholder) {
        try {
            // 2. Busca o arquivo HTML
            const response = await fetch("/components/sidebar.html");
            if (!response.ok) throw new Error("Erro ao carregar sidebar");
            
            // 3. Injeta o HTML na página
            const html = await response.text();
            placeholder.innerHTML = html;

            // 4. Lógica de ATIVO (Qual página estou?)
            highlightActiveLink();

            // 5. Inicializa o Menu Mobile (Só depois que o HTML existir)
            initMobileMenu();

        } catch (error) {
            console.error("Erro sidebar:", error);
        }
    }
});

function highlightActiveLink() {
    // Pega o nome do arquivo atual (ex: orcamentos.html)
    const path = window.location.pathname;
    const page = path.split("/").pop() || "index.html";

    // Procura o link que tem data-page="orcamentos.html"
    const links = document.querySelectorAll(".nav-item");
    
    links.forEach(link => {
        // Remove active de todos primeiro
        link.classList.remove("active");
        
        // Se o link bater com a página atual, adiciona active
        // Verifica também se estamos no editor (que pertence a orçamentos)
        if (link.dataset.page === page) {
            link.classList.add("active");
        } 
        else if (page === "editor-orcamento.html" && link.dataset.page === "orcamentos.html") {
            link.classList.add("active"); // Mantém orçamentos ativo quando está editando
        }
    });
}

function initMobileMenu() {
    const menuBtn = document.getElementById('menu-toggle'); // Esse botão está no Header da página
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });
    }

    // Fechar ao clicar fora
    if (mainContent && sidebar) {
        mainContent.addEventListener('click', () => {
            if (sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });
    }
}