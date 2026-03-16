/* public/js/controllers/agenda.js - Usa endpoint calendário (orçamentos + pedidos) */

import { api } from '../config/api.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    const grid = document.getElementById('calendarGrid');
    const labelMonth = document.getElementById('currentMonthLabel');
    const btnPrev = document.getElementById('btnPrevMonth');
    const btnNext = document.getElementById('btnNextMonth');
    
    const panelDate = document.getElementById('selectedDateLabel');
    const panelCount = document.getElementById('eventCountLabel');
    const eventsList = document.getElementById('eventsList');

    let currentDate = new Date(); 
    let selectedDate = new Date();
    let ALL_EVENTS = []; 

    const STATUS_COLORS = {
        1: 'var(--gold-400)', // Agendado
        2: 'var(--warning)',  // Gravando
        3: '#9b59b6',         // Edição
        4: 'var(--success)'   // Entregue
    };

    await carregarEventos();

    async function carregarEventos() {
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const inicio = `${year}-${String(month + 1).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month + 1, 0).getDate();
            const fim = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            const data = await api.get('calendario', `?inicio=${inicio}&fim=${fim}`);
            ALL_EVENTS = Array.isArray(data) ? data : [];
            renderCalendar();
            atualizarPainelDia(selectedDate);
        } catch (e) { 
            console.error("Erro ao carregar agenda", e);
            ALL_EVENTS = [];
            renderCalendar();
            atualizarPainelDia(selectedDate);
        }
    }

    // --- 2. RENDERIZAÇÃO DO CALENDÁRIO ---
    function renderCalendar() {
        grid.innerHTML = '';
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const meses = ["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
        labelMonth.innerText = `${meses[month]} ${year}`;

        // Dia da semana do 1º dia (0=Dom, 1=Seg...)
        const firstDayIndex = new Date(year, month, 1).getDay(); 
        const lastDay = new Date(year, month + 1, 0).getDate(); 
        
        // Espaços vazios
        for (let i = 0; i < firstDayIndex; i++) {
            const empty = document.createElement('div');
            grid.appendChild(empty);
        }

        const today = new Date();
        
        // Preenche os dias
        for (let d = 1; d <= lastDay; d++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            
            // String YYYY-MM-DD para comparação
            const currentDayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            
            // Marca Hoje
            if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayEl.classList.add('today');
            }

            // Marca Selecionado
            if (d === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) {
                dayEl.classList.add('selected');
            }

            const eventosDia = ALL_EVENTS.filter(e => e.data_evento === currentDayStr);

            let dotsHtml = '<div class="day-dots">';
            eventosDia.forEach(ev => {
                const color = STATUS_COLORS[ev.id_status] || (ev.tipo === 'orcamento' ? 'var(--gold-300)' : '#fff');
                dotsHtml += `<div class="event-dot" style="background:${color}"></div>`;
            });
            dotsHtml += '</div>';

            dayEl.innerHTML = `<span class="day-number">${d}</span>${dotsHtml}`;

            // Clique
            dayEl.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
                dayEl.classList.add('selected');
                
                selectedDate = new Date(year, month, d);
                atualizarPainelDia(selectedDate, eventosDia);
            });

            grid.appendChild(dayEl);
        }
    }

    // --- 3. PAINEL LATERAL ---
    function atualizarPainelDia(date, eventosPreFiltrados = null) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const d = date.getDate();
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        panelDate.innerText = date.toLocaleDateString('pt-BR', options);

        // Filtra se não veio pronto
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
            const titulo = ev.titulo || ev.titulo_evento || 'Evento';
            const card = document.createElement('div');
            card.className = `agenda-card status-${ev.id_status || 1}`;
            card.innerHTML = `
                <h4>${ev.tipo === 'orcamento' ? '<i class="ph ph-file-text"></i> ' : ''}${titulo}</h4>
                <p><i class="ph ph-user"></i> ${ev.nome_cliente || ''}</p>
                <p><i class="ph ph-map-pin"></i> ${ev.cidade || 'Local a definir'}</p>
            `;
            card.addEventListener('click', () => {
                if (ev.tipo === 'orcamento') window.location.href = `editor-orcamento.html?id=${ev.id_origem}`;
                else window.location.href = 'pedidos.html';
            });
            eventsList.appendChild(card);
        });
    }

    btnPrev.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        carregarEventos();
    });

    btnNext.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        carregarEventos();
    });
});