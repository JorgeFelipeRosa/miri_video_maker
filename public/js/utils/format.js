/* public/js/utils/format.js */
function formatMoney(value) {
    if (!value) return "R$ 0,00";
    return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
