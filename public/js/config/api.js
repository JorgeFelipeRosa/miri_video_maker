const BASE_URL = '/.netlify/functions';

export const api = {
    get: async (endpoint, params = '') => {
        try {
            const res = await fetch(`${BASE_URL}/${endpoint}${params}`);
            return await res.json();
        } catch (e) { console.error("API Error:", e); return []; }
    },
    post: async (endpoint, data) => {
        const res = await fetch(`${BASE_URL}/${endpoint}`, { method: 'POST', body: JSON.stringify(data) });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erro ao salvar");
        return json;
    },
    put: async (endpoint, data) => {
        const res = await fetch(`${BASE_URL}/${endpoint}`, { method: 'PUT', body: JSON.stringify(data) });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erro ao atualizar");
        return json;
    }
};