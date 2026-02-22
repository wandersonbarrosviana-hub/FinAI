
import { InvestmentData, SearchSuggestion } from '../../types';

// Cache para os dados do scraper
let investmentsCache: InvestmentData[] = [];

const loadInvestments = async () => {
    if (investmentsCache.length > 0) return investmentsCache;
    try {
        const response = await fetch('/data/investments.json');
        if (response.ok) {
            investmentsCache = await response.json();
        }
    } catch (error) {
        console.error("Erro ao carregar investments.json:", error);
    }
    return investmentsCache;
};

/**
 * Busca dados em tempo real de um ativo.
 * Tenta buscar na Brapi para cotação ultra-atualizada.
 */
export const getAssetData = async (ticker: string): Promise<any> => {
    console.log(`Buscando cotação em tempo real para ${ticker}...`);
    const cleanTicker = ticker.replace('.SA', '').toUpperCase();

    // Tenta primeiro via Brapi
    const tryBrapi = async (sym: string) => {
        try {
            const response = await fetch(`https://brapi.dev/api/quote/${sym}`);
            if (response.ok) {
                const data = await response.json();
                const result = data.results?.[0];
                if (result) {
                    return {
                        ticker: cleanTicker,
                        name: result.longName || result.shortName || cleanTicker,
                        price: result.regularMarketPrice,
                        change: result.regularMarketChangePercent
                    };
                }
            }
        } catch (e) {
            console.warn(`Falha ao buscar ${sym} na Brapi`, e);
        }
        return null;
    };

    // Tenta com e sem .SA se necessário
    let bData = await tryBrapi(cleanTicker);
    if (!bData && !ticker.includes('.SA')) {
        bData = await tryBrapi(`${cleanTicker}.SA`);
    }

    if (bData) return bData;

    // Fallback para cache do scraper
    const cache = await loadInvestments();
    const asset = cache.find(a => a.ticker === cleanTicker);
    if (asset) {
        return {
            ticker: asset.ticker,
            name: asset.name,
            price: asset.price,
            change: 0
        };
    }

    throw new Error(`Não foi possível obter dados em tempo real para o ativo ${cleanTicker}.`);
};

/**
 * Busca dados fundamentalistas de um ativo.
 * Usa o investments.json (dados do scraper Yahoo Finance) como fonte primária.
 */
export const getFundamentalData = async (ticker: string): Promise<any> => {
    console.log(`Buscando fundamentos atualizados para ${ticker}...`);
    const cleanTicker = ticker.replace('.SA', '').toUpperCase();

    const cache = await loadInvestments();
    const asset = cache.find(a => a.ticker === cleanTicker);

    if (asset) {
        return {
            ...asset.indicators,
            sector: asset.segment,
            name: asset.name
        };
    }

    // Caso não esteja no cache, retornar erro ou mock (preferível erro para forçar atualização)
    throw new Error("Dados fundamentais não disponíveis em cache. Execute o scraper para este ticker.");
};

/**
 * Pesquisa ativos por ticker ou nome.
 * Usa a lista do investments.json para garantir que temos dados para o que o usuário buscar.
 */
export const searchAssets = async (query: string): Promise<SearchSuggestion[]> => {
    if (query.length < 2) return [];

    const cache = await loadInvestments();
    const results = cache.filter(a =>
        a.ticker.toLowerCase().includes(query.toLowerCase()) ||
        a.name.toLowerCase().includes(query.toLowerCase())
    ).map(a => ({
        ticker: a.ticker,
        name: a.name,
        exchange: 'B3'
    }));

    // Se não houver nada no cache, tentar busca básica na Brapi
    if (results.length === 0) {
        try {
            const response = await fetch(`https://brapi.dev/api/available?search=${query}`);
            if (response.ok) {
                const data = await response.json();
                return data.stocks.map((s: string) => ({
                    ticker: s.replace('.SA', ''),
                    name: s,
                    exchange: 'B3'
                })).slice(0, 10);
            }
        } catch (e) {
            console.error("Erro na busca remota:", e);
        }
    }

    return results.slice(0, 10);
};
