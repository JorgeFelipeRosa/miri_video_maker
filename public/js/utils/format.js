/* public/js/utils/format.js */

const Format = {
    money(value) {
        const num = parseFloat(value) || 0;
        return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    date(dateString) {
        if (!dateString) return '--/--';
        try {
            const partes = dateString.split('-'); // YYYY-MM-DD
            if (partes.length !== 3) return dateString;
            
            // Retorna DD/MM/YYYY
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        } catch (e) {
            return dateString;
        }
    },
    
    dateShort(dateString) {
        if (!dateString) return '--/--';
        try {
            const partes = dateString.split('-');
            const dia = partes[2];
            const meses = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
            const mes = meses[parseInt(partes[1]) - 1];
            return `${dia} ${mes}`;
        } catch (e) { return dateString; }
    }
};

// Disponibiliza globalmente
window.Format = Format;
// Atalho para compatibilidade com código antigo
window.formatMoney = Format.money;