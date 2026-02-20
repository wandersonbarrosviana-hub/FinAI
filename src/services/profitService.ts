
const API_KEY = import.meta.env.VITE_PROFIT_API_KEY;
const BASE_URL = 'https://api.profit.com/v1'; // Baseado na documentação padrão de APIs financeiras similares

export const getAssetData = async (ticker: string) => {
    try {
        // Nota: A API da Profit costuma usar o formato TICKER.SA para ativos brasileiros
        const formattedTicker = ticker.includes('.') ? ticker : `${ticker}.SA`;

        const response = await fetch(`${BASE_URL}/quotes?symbol=${formattedTicker}&apikey=${API_KEY}`);
        const data = await response.json();

        if (!data || data.error) {
            throw new Error(data.error || 'Falha ao buscar dados');
        }

        return data;
    } catch (error) {
        console.error('Profit API Error:', error);
        throw error;
    }
};

export const getFundamentalData = async (ticker: string) => {
    try {
        const formattedTicker = ticker.includes('.') ? ticker : `${ticker}.SA`;
        const response = await fetch(`${BASE_URL}/fundamentals?symbol=${formattedTicker}&apikey=${API_KEY}`);
        return await response.json();
    } catch (error) {
        console.error('Profit Fundamentals API Error:', error);
        throw error;
    }
};

export const getHistoricalData = async (ticker: string, period: string = '1y') => {
    try {
        const formattedTicker = ticker.includes('.') ? ticker : `${ticker}.SA`;
        const response = await fetch(`${BASE_URL}/historical?symbol=${formattedTicker}&period=${period}&apikey=${API_KEY}`);
        return await response.json();
    } catch (error) {
        console.error('Profit Historical API Error:', error);
        throw error;
    }
};
