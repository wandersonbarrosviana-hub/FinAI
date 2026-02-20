
const API_KEY = import.meta.env.VITE_PROFIT_API_KEY;
const BASE_URL = 'https://api.profit.com/v1';

const getFormattedTicker = (ticker: string) => {
    const cleanTicker = ticker.toUpperCase().trim();
    // Se já tem ponto (ex: AAPL.US), não mexe. Se não, assume .SA para B3
    return cleanTicker.includes('.') ? cleanTicker : `${cleanTicker}.SA`;
};

export const searchAssets = async (query: string): Promise<any[]> => {
    if (!query || query.length < 2) return [];
    try {
        // Aproveitando endpoint de busca da Profit (ou similar)
        const response = await fetch(`${BASE_URL}/search?query=${query.toUpperCase()}&apikey=${API_KEY}`);
        const data = await response.json();

        if (data.error) return [];

        // Mapear para um formato padrão se necessário
        return Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
        console.error('Search Assets Error:', error);
        return [];
    }
};

export const getAssetData = async (ticker: string) => {
    try {
        const formattedTicker = getFormattedTicker(ticker);
        const response = await fetch(`${BASE_URL}/quotes?symbol=${formattedTicker}&apikey=${API_KEY}`);
        const data = await response.json();

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
        const response = await fetch(`${BASE_URL}/fundamentals?symbol=${formattedTicker}&apikey=${API_KEY}`);
        const data = await response.json();
        return Array.isArray(data) ? data[0] : data;
    } catch (error) {
        console.error('Profit Fundamentals API Error:', error);
        throw error;
    }
};

export const getHistoricalData = async (ticker: string, period: string = '1y') => {
    try {
        const formattedTicker = getFormattedTicker(ticker);
        const response = await fetch(`${BASE_URL}/historical?symbol=${formattedTicker}&period=${period}&apikey=${API_KEY}`);
        return await response.json();
    } catch (error) {
        console.error('Profit Historical API Error:', error);
        throw error;
    }
};

