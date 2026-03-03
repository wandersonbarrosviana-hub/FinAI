import React, { useState } from 'react';
import { Search, Loader2, Trash2, TrendingUp, AlertCircle, Info } from 'lucide-react';

const FMP_API_KEY = "gC76KcQcKKVrLRflHPZ8U33OK2KS0Y6P";
const BASE_URL = "https://financialmodelingprep.com/api/v3";

interface StockData {
    symbol: string;
    price: number;
    dividendYield: number; // TTM
    peRatio: number; // P/L TTM
    pbRatio: number; // P/VP TTM
    netIncome: number; // Lucro Líquido TTM
    sharesOutstanding: number; // Quantidade de papéis
    roe: number; // ROE TTM
    name: string;
    changesPercentage: number;
}

export default function InvestmentAnalytics() {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [stocks, setStocks] = useState<StockData[]>([]);
    const [errorMsg, setErrorMsg] = useState('');

    // Pagination State
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchStockData = async (ticker: string) => {
        try {
            setLoading(true);
            setErrorMsg('');

            let b3Ticker = ticker.toUpperCase().trim();
            // Brapi doesn't need .SA for Brazilian stocks, but handles them if present.
            // Best to remove it to ensure clean lookup
            b3Ticker = b3Ticker.replace('.SA', '');

            // Check if already in list to avoid duplicates
            if (stocks.some(s => s.symbol === b3Ticker)) {
                setErrorMsg('Este ativo já está na tabela.');
                setLoading(false);
                setSearchQuery('');
                return;
            }

            // Fetch Basic Quote Data from Brapi (Free tier supported modules only)
            const res = await fetch(`https://brapi.dev/api/quote/${b3Ticker}?modules=summaryProfile&token=eVP75WsHBzT8JMkb8KC94R`);

            if (!res.ok) {
                if (res.status === 404) throw new Error("Ativo não encontrado na B3.");
                throw new Error(`Erro na API (${res.status}) ao buscar cotação.`);
            }

            const rawData = await res.json();

            if (!rawData.results || rawData.results.length === 0) {
                throw new Error('Ativo não encontrado. Verifique o código.');
            }

            const data = rawData.results[0];

            // Fetch Dividends to calculate Yield manually because free tier blocks financialData module
            let dividendYieldComputed = 0;
            try {
                const divRes = await fetch(`https://brapi.dev/api/quote/${b3Ticker}/dividends?token=eVP75WsHBzT8JMkb8KC94R`);
                if (divRes.ok) {
                    const divData = await divRes.json();
                    if (divData.results && divData.results.length > 0) {
                        const dividends = divData.results[0].dividends || [];
                        const oneYearAgo = new Date();
                        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

                        // Sum dividends from last 12 months
                        const ttmDividends = dividends
                            .filter((d: any) => new Date(d.paymentDate) >= oneYearAgo)
                            .reduce((sum: number, d: any) => sum + (d.rate || 0), 0);

                        if (data.regularMarketPrice > 0) {
                            dividendYieldComputed = (ttmDividends / data.regularMarketPrice) * 100;
                        }
                    }
                }
            } catch (e) {
                console.warn("Could not fetch dividends for yield calculation", e);
            }

            // Fallback to 0 if data is missing since free API lacks deep fundamental fields natively
            const newStock: StockData = {
                symbol: data.symbol,
                name: data.longName || data.shortName || data.symbol,
                price: data.regularMarketPrice || 0,
                changesPercentage: data.regularMarketChangePercent || 0,
                sharesOutstanding: 0, // Not available in free tier quote
                dividendYield: dividendYieldComputed,
                peRatio: data.priceEarnings || 0, // Brapi often provides P/E in the root
                pbRatio: 0, // Not available in free tier
                roe: 0, // Not available in free tier
                netIncome: 0 // Not available in free tier
            };

            setStocks(prev => [newStock, ...prev]);
            setSearchQuery('');

        } catch (error: any) {
            console.error("Error fetching stock:", error);
            setErrorMsg(error.message || 'Erro ao buscar dados do ativo.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (searchQuery.trim()) {
            fetchStockData(searchQuery);
        }
    };

    const removeItem = (symbol: string) => {
        setStocks(prev => prev.filter(s => s.symbol !== symbol));
    };

    // Pagination Logic
    const totalPages = Math.ceil(stocks.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedStocks = stocks.slice(startIndex, startIndex + itemsPerPage);

    const formatCurrency = (value: number) => {
        if (value >= 1e9) return `R$ ${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(2)}M`;
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    };

    const formatNumber = (value: number) => {
        if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
        return value.toLocaleString('pt-BR');
    };

    return (
        <div className="flex flex-col h-full max-w-[1440px] mx-auto w-full space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <TrendingUp className="text-sky-600" />
                        Análise de Ativos
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Pesquise empresas na B3 para ver cotações e indicadores fundamentalistas em tempo real.
                    </p>
                </div>

                {/* Search Input */}
                <form onSubmit={handleSearch} className="flex relative items-center max-w-md w-full">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-shadow outline-none text-slate-900 dark:text-white placeholder-slate-400 uppercase font-medium"
                            placeholder="Digite o Ticker (ex: ITUB4, PETR4)..."
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !searchQuery.trim()}
                        className="ml-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl px-5 py-3 text-sm font-bold transition-all shadow-sm shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : 'Adicionar'}
                    </button>
                </form>
            </div>

            {errorMsg && (
                <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 border border-rose-100 dark:border-rose-500/20 animate-in fade-in">
                    <AlertCircle size={16} />
                    {errorMsg}
                    <button onClick={() => setErrorMsg('')} className="ml-auto text-rose-400 hover:text-rose-600">&times;</button>
                </div>
            )}

            {/* Main Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1">
                {/* Table Header Controls */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-500">Mostrar:</span>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            {[10, 20, 30, 40].map(num => (
                                <button
                                    key={num}
                                    onClick={() => { setItemsPerPage(num); setCurrentPage(1); }}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${itemsPerPage === num
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 font-medium">
                        <Info size={14} /> Dados providos por Financial Modeling Prep API
                    </div>
                </div>

                {/* Table Area */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                                <th className="py-4 px-6 font-bold">Ativo</th>
                                <th className="py-4 px-4 font-bold">Cotação Atual</th>
                                <th className="py-4 px-4 font-bold text-right">Div. Yield (12m)</th>
                                <th className="py-4 px-4 font-bold text-right">P/L</th>
                                <th className="py-4 px-4 font-bold text-right">P/VP</th>
                                <th className="py-4 px-4 font-bold text-right">ROE</th>
                                <th className="py-4 px-4 font-bold text-right">Lucro Líquido</th>
                                <th className="py-4 px-4 font-bold text-right">Ações (Mkt)</th>
                                <th className="py-4 px-4 font-bold text-center w-16">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {stocks.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <TrendingUp size={48} className="opacity-20 mb-4" />
                                            <p className="text-base font-semibold text-slate-600 dark:text-slate-300">Nenhum ativo na tabela</p>
                                            <p className="text-sm mt-1">Pesquise por uma empresa acima para adicionar.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedStocks.map((stock) => (
                                    <tr key={stock.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="py-3 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 dark:text-white">{stock.symbol.replace('.SA', '')}</span>
                                                <span className="text-[11px] text-slate-500 font-medium truncate max-w-[150px]">{stock.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-white">R$ {stock.price.toFixed(2)}</span>
                                                <span className={`text-[11px] font-bold ${stock.changesPercentage >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {stock.changesPercentage > 0 ? '+' : ''}{stock.changesPercentage.toFixed(2)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                                            {stock.dividendYield.toFixed(2)}%
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                                            {stock.peRatio.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                                            {stock.pbRatio.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                                            {stock.roe.toFixed(2)}%
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">
                                                {formatCurrency(stock.netIncome)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                                            {formatNumber(stock.sharesOutstanding)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                onClick={() => removeItem(stock.symbol)}
                                                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                                title="Remover"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {stocks.length > 0 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 mt-auto">
                        <span className="text-xs font-semibold text-slate-500">
                            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, stocks.length)} de {stocks.length} ativos
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Anterior
                            </button>
                            <div className="px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                                Página {currentPage} de {totalPages}
                            </div>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
