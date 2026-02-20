
const PROXY_URL = 'https://ndsngskwlgqkbgejuyrv.supabase.co/functions/v1/profit-proxy';

const safeJson = async (response: Response) => {
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Resposta inválida do servidor (não é JSON). Status: ${response.status}. Início da resposta: ${text.slice(0, 50)}`);
    }
    return response.json();
};

const getFormattedTicker = (ticker: string) => {
    const cleanTicker = ticker.toUpperCase().trim();
    // Se já tem ponto (ex: AAPL.US), não mexe. Se não, assume .SA para B3
    return cleanTicker.includes('.') ? cleanTicker : `${cleanTicker}.SA`;
};

export const searchAssets = async (query: string): Promise<any[]> => {
    if (!query || query.length < 2) return [];
    try {
        const response = await fetch(`${PROXY_URL}?endpoint=search&query=${encodeURIComponent(query.toUpperCase())}`);
        const data = await safeJson(response);
        if (data.error) return [];
        return Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
        console.error('Search Assets Error:', error);
        return [];
    }
};

export const getAssetData = async (ticker: string) => {
    try {
        const formattedTicker = getFormattedTicker(ticker);
        const response = await fetch(`${PROXY_URL}?endpoint=quotes&symbol=${encodeURIComponent(formattedTicker)}`);
        const data = await safeJson(response);

        if (!data || data.error || (Array.isArray(data) && data.length === 0)) {
            throw new Error(data?.error || 'Ativo não encontrado na base da Profit');
        }

        return Array.isArray(data) ? data[0] : data;
    } catch (error) {
        console.error('Profit API Error:', error);
        throw error;
    }
};

export const getFundamentalData = async (ticker: string) => {
    try {
        const formattedTicker = getFormattedTicker(ticker);
        const response = await fetch(`${PROXY_URL}?endpoint=fundamentals&symbol=${encodeURIComponent(formattedTicker)}`);
        const data = await safeJson(response);
        return Array.isArray(data) ? data[0] : data;
    } catch (error) {
        console.error('Profit Fundamentals API Error:', error);
        throw error;
    }
};

export const getHistoricalData = async (ticker: string, period: string = '1y') => {
    try {
        const formattedTicker = getFormattedTicker(ticker);
        const response = await fetch(`${PROXY_URL}?endpoint=historical&symbol=${encodeURIComponent(formattedTicker)}&period=${period}`);
        return await safeJson(response);
    } catch (error) {
        console.error('Profit Historical API Error:', error);
        throw error;
    }
};

