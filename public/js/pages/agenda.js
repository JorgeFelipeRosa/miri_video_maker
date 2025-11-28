/* public/js/pages/agenda.js */

document.addEventListener('DOMContentLoaded', async () => {
    
    // Elementos
    const grid = document.getElementById('calendarGrid');
    const labelMonth = document.getElementById('currentMonthLabel');
    const btnPrev = document.getElementById('btnPrevMonth');
    const btnNext = document.getElementById('btnNextMonth');
    
    const panelDate = document.getElementById('selectedDateLabel');
    const panelCount = document.getElementById('eventCountLabel');
    const eventsList = document.getElementById('eventsList');

    // Estado
    let currentDate = new Date(); // Data de referência do calendário
    let selectedDate = new Date(); // Dia clicado
    let ALL_EVENTS = []; // Cache dos pedidos

    // Cores dos Dots
    const STATUS_COLORS = {
        1: 'var(--gold-400)', // Agendado
        2: 'var(--warning)',  // Gravando
        3: '#9b59b6',         // Edição
        4: 'var(--success)'   // Entregue
    };

    // 1. BUSCAR PEDIDOS
    async function carregarEventos() {
        try {
            const res = await fetch('/.netlify/functions/get_pedidos');
            ALL_EVENTS = await res.json();
            renderCalendar();
            atualizarPainelDia(new Date()); // Mostra hoje por padrão
        } catch (e) { console.error("Erro agenda", e); }
    }

    // 2. RENDERIZAR CALENDÁRIO
    function renderCalendar() {
        grid.innerHTML = '';
        
        // Configurar Mês
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const meses = ["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
        labelMonth.innerText = `${meses[month]} ${year}`;

        // Lógica de Dias
        const firstDayIndex = new Date(year, month, 1).getDay(); // 0=Dom, 1=Seg...
        const lastDay = new Date(year, month + 1, 0).getDate(); // 30 ou 31
        
        // Espaços vazios antes do dia 1
        for (let i = 0; i < firstDayIndex; i++) {
            const empty = document.createElement('div');
            grid.appendChild(empty);
        }

        // Dias do Mês
        const today = new Date();
        
        for (let d = 1; d <= lastDay; d++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            
            // Data ISO para comparar (YYYY-MM-DD)
            // Nota: o mês no JS é 0-index, no formato precisa ser +1
            const currentDayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            
            // Verifica se é HOJE
            if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayEl.classList.add('today');
            }

            // Verifica se é o SELECIONADO
            if (d === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) {
                dayEl.classList.add('selected');
            }

            // Busca eventos deste dia (Sem fuso horário, string match)
            const eventosDia = ALL_EVENTS.filter(e => e.data_evento === currentDayStr);

            // HTML do Dia
            let dotsHtml = '<div class="day-dots">';
            eventosDia.forEach(ev => {
                const color = STATUS_COLORS[ev.id_status] || '#fff';
                dotsHtml += `<div class="event-dot" style="background:${color}"></div>`;
            });
            dotsHtml += '</div>';

            dayEl.innerHTML = `<span class="day-number">${d}</span>${dotsHtml}`;

            // Clique no Dia
            dayEl.addEventListener('click', () => {
                // Atualiza seleção visual
                document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
                dayEl.classList.add('selected');
                
                // Atualiza estado
                selectedDate = new Date(year, month, d);
                atualizarPainelDia(selectedDate, eventosDia);
            });

            grid.appendChild(dayEl);
        }
    }

    // 3. ATUALIZAR PAINEL LATERAL
    function atualizarPainelDia(date, eventosPreFiltrados = null) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const d = date.getDate();
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

        // Formata Título
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        panelDate.innerText = date.toLocaleDateString('pt-BR', options);

        // Se não passou eventos filtrados (ex: load inicial), filtra agora
        const eventos = eventosPreFiltrados || ALL_EVENTS.filter(e => e.data_evento === dateStr);

        panelCount.innerText = eventos.length === 1 ? '1 evento' : `${eventos.length} eventos`;
        eventsList.innerHTML = '';

        if (eventos.length === 0) {
            eventsList.innerHTML = `
                <div class="empty-state">
                    <i class="ph ph-coffee"></i>
                    <p>Agenda livre.</p>
                </div>`;
            return;
        }

        eventos.forEach(ev => {
            const card = document.createElement('div');
            card.className = `agenda-card status-${ev.id_status || 1}`;
            card.innerHTML = `
                <h4>${ev.titulo_evento}</h4>
                <p><i class="ph ph-user"></i> ${ev.nome_cliente}</p>
                <p><i class="ph ph-map-pin"></i> ${ev.cidade || 'Local a definir'}</p>
            `;
            // Ao clicar, poderia ir para o pedido
            card.addEventListener('click', () => {
                window.location.href = 'pedidos.html'; // Futuramente pode abrir modal direto
            });
            eventsList.appendChild(card);
        });
    }

    // 4. NAVEGAÇÃO
    btnPrev.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    btnNext.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // START
    carregarEventos();
});