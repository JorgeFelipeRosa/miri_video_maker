/* public/js/modules/modal.js */

export const Modal = {
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            const input = modal.querySelector('input');
            if(input) setTimeout(() => input.focus(), 100);
        }
    },

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    init() {
        // Fecha ao clicar no botão X
        document.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal) this.close(modal.id);
            });
        });

        // Fecha ao clicar fora (no fundo escuro)
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close(overlay.id);
                }
            });
        });
    }
};

// Inicia automaticamente
document.addEventListener('DOMContentLoaded', () => Modal.init());