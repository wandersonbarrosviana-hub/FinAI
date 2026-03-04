import React, { useState, useCallback } from 'react';
import { Search, Loader2, Trash2, TrendingUp, AlertCircle, Info, BarChart2, Activity, PieChart, Calculator } from 'lucide-react';
import { supabase } from '../supabaseClient';
import InvestmentDividendChart from './InvestmentDividendChart';
import InvestmentPortfolio from './InvestmentPortfolio';

interface StockData {
    symbol: string;
    price: number;
    dividendYield: number; // TTM
    peRatio: number; // P/L TTM
    pbRatio: number; // P/VP TTM
    netIncome: number; // Lucro Líquido TTM
    sharesOutstanding: number; // Quantidade de papéis
    roe: number; // ROE TTM
    lpa: number; // Lucro por Ação
    vpa: number; // Valor Patrimonial por Ação
    dpa: number; // Dividendo por Ação (12m)
    payout: number; // Payout (%)
    name: string;
    changesPercentage: number;
    historicalDividends: any[]; // Histórico de 6 anos
}

export default function InvestmentAnalytics() {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [stocks, setStocks] = useState<StockData[]>([]);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [activeTab, setActiveTab] = useState<'analysis' | 'portfolio'>('analysis');

    const fetchStockData = async (ticker: string) => {
        try {
            setLoading(true);
            setErrorMsg('');

            let b3Ticker = ticker.toUpperCase().trim();
            b3Ticker = b3Ticker.replace('.SA', '');

            if (stocks.some(s => s.symbol.replace('.SA', '') === b3Ticker)) {
                setErrorMsg('Este ativo já foi adicionado.');
                setLoading(false);
                return;
            }

            const res = await fetch(`https://brapi.dev/api/quote/${b3Ticker}?modules=summaryProfile,dividends&token=eVP75WsHBzT8JMkb8KC94R`);

            if (!res.ok) {
                if (res.status === 404) throw new Error("Ativo não encontrado na B3.");
                throw new Error(`Erro na API (${res.status}) ao buscar cotação.`);
            }

            const rawData = await res.json();
            if (!rawData.results || rawData.results.length === 0) {
                throw new Error('Ativo não encontrado. Verifique o código.');
            }

            const data = rawData.results[0];

            let yfMetrics: any = {};
            let yfDividends: any[] = [];

            try {
                const { data: yfData, error } = await supabase.functions.invoke('yahoo-finance-proxy', {
                    body: { ticker: b3Ticker }
                });
                if (!error && yfData) {
                    yfMetrics = yfData.quoteSummary || {};
                    yfDividends = yfData.dividends || [];
                }
            } catch (e) {
                console.warn("Could not fetch Yahoo Finance proxy", e);
            }

            // Map Brapi Dividends (Priority for Payment Date)
            const brapiDividends = data.dividendsData?.cashDividends?.map((d: any) => ({
                date: d.paymentDate, // Using paymentDate as the primary date
                dividends: d.rate,
                type: d.type
            })) || [];

            const finalDividends = brapiDividends.length > 0 ? brapiDividends : yfDividends;

            const yfFinancial = yfMetrics.financialData || {};
            const yfStats = yfMetrics.defaultKeyStatistics || {};

            let dividendYieldComputed = 0;
            if (finalDividends.length > 0) {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                const ttmDividends = finalDividends
                    .filter((d: any) => new Date(d.date) >= oneYearAgo)
                    .reduce((sum: number, d: any) => sum + (d.dividends || 0), 0);

                if (data.regularMarketPrice > 0) {
                    dividendYieldComputed = (ttmDividends / data.regularMarketPrice) * 100;
                }
            }

            const newStock: StockData = {
                symbol: data.symbol,
                name: data.longName || data.shortName || data.symbol,
                price: data.regularMarketPrice || 0,
                changesPercentage: data.regularMarketChangePercent || 0,
                sharesOutstanding: yfStats.sharesOutstanding || 0,
                dividendYield: dividendYieldComputed || (data.dividendYield || 0),
                peRatio: data.priceEarnings || yfStats.trailingPE || 0,
                pbRatio: yfStats.priceToBook || 0,
                roe: (yfFinancial.returnOnEquity || 0) * 100,
                netIncome: (yfStats.trailingEps || 0) * (yfStats.sharesOutstanding || 0),
                lpa: yfStats.trailingEps || 0,
                vpa: yfStats.bookValue || 0,
                dpa: (dividendYieldComputed / 100) * (data.regularMarketPrice || 0),
                payout: (yfStats.payoutRatio || 0) * 100,
                historicalDividends: finalDividends
            };

            setStocks(prev => {
                const updated = [newStock, ...prev];
                if (updated.length === 1) setSelectedSymbol(newStock.symbol);
                return updated;
            });
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

    const removeItem = useCallback((symbolToRemove: string) => {
        setStocks(prev => {
            const updatedStocks = prev.filter(s => s.symbol !== symbolToRemove);
            if (selectedSymbol === symbolToRemove) {
                setSelectedSymbol(updatedStocks.length > 0 ? updatedStocks[0].symbol : null);
            }
            return updatedStocks;
        });
    }, [selectedSymbol]);

    const formatCurrency = (value: number) => {
        if (Math.abs(value) >= 1e9) return `R$ ${(value / 1e9).toFixed(2)}B`;
        if (Math.abs(value) >= 1e6) return `R$ ${(value / 1e6).toFixed(2)}M`;
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    };

    const selectedStock = stocks.find(s => s.symbol === selectedSymbol) || stocks[0];

    return (
        <div className="flex flex-col h-full max-w-[1440px] mx-auto w-full space-y-6">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[2rem] w-fit mb-8 shadow-sm">
                <button
                    onClick={() => setActiveTab('analysis')}
                    className={`flex items-center gap-2 px-8 py-3 rounded-[1.5rem] text-sm font-black transition-all ${activeTab === 'analysis'
                        ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <Search size={18} />
                    Análise de Ativos
                </button>
                <button
                    onClick={() => setActiveTab('portfolio')}
                    className={`flex items-center gap-2 px-8 py-3 rounded-[1.5rem] text-sm font-black transition-all ${activeTab === 'portfolio'
                        ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <PieChart size={18} />
                    Minha Carteira
                </button>
            </div>

            {activeTab === 'analysis' ? (
                <>
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

                    {stocks.length === 0 ? (
                        <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-24 h-24 bg-sky-50 dark:bg-sky-500/10 rounded-full flex items-center justify-center mb-6">
                                <TrendingUp size={40} className="text-sky-500" />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Comece sua Análise</h2>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium">
                                Adicione ativos da B3 acima para comparar indicadores fundamentais e histórico de dividendos em tempo real.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                            <div className="xl:col-span-1 space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Meus Ativos</h3>
                                <div className="flex flex-col gap-3">
                                    {stocks.map(stock => (
                                        <button
                                            key={stock.symbol}
                                            onClick={() => setSelectedSymbol(stock.symbol)}
                                            className={`flex items-center justify-between p-4 rounded-3xl border transition-all text-left ${selectedSymbol === stock.symbol
                                                ? 'bg-sky-600 border-sky-600 text-white shadow-xl shadow-sky-600/20'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-sky-500'
                                                }`}
                                        >
                                            <div>
                                                <p className="font-black tracking-tight">{stock.symbol.replace('.SA', '')}</p>
                                                <p className={`text-[10px] font-bold uppercase opacity-60 truncate max-w-[120px]`}>{stock.name}</p>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <p className="font-black">R$ {stock.price.toFixed(2)}</p>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeItem(stock.symbol); }}
                                                    className={`p-1 mt-1 rounded-md transition-colors ${selectedSymbol === stock.symbol ? 'hover:bg-white/20' : 'hover:bg-rose-50 text-slate-300 hover:text-rose-500'}`}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="xl:col-span-3 space-y-8">
                                {selectedStock && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h2 className="text-4xl font-black text-slate-930 dark:text-white tracking-tighter uppercase">{selectedStock.symbol.replace('.SA', '')}</h2>
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400`}>Ação</span>
                                                </div>
                                                <p className="text-slate-500 font-bold uppercase text-xs tracking-tight">{selectedStock.name}</p>
                                            </div>
                                            <div className="bg-emerald-50 dark:bg-emerald-500/10 px-8 py-5 rounded-3xl border border-emerald-100 dark:border-emerald-500/20 text-right">
                                                <p className="text-[10px] font-black text-emerald-600/50 uppercase tracking-widest mb-1">Cotação Atual</p>
                                                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">R$ {selectedStock.price.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                                                <div className="flex items-center gap-3 text-sky-500 mb-2">
                                                    <Calculator size={20} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valuation & Lucro</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">LPA</p>
                                                        <p className="text-xl font-black text-slate-900 dark:text-white">R$ {selectedStock.lpa.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">VPA</p>
                                                        <p className="text-xl font-black text-slate-900 dark:text-white">R$ {selectedStock.vpa.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Lucro Líquido (12m)</p>
                                                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedStock.netIncome)}</p>
                                                </div>
                                            </div>

                                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                                                <div className="flex items-center gap-3 text-indigo-500 mb-2">
                                                    <Activity size={20} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Eficiência</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">ROE</p>
                                                        <p className="text-xl font-black text-slate-900 dark:text-white">{selectedStock.roe.toFixed(2)}%</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Payout</p>
                                                        <p className="text-xl font-black text-slate-900 dark:text-white">{selectedStock.payout.toFixed(2)}%</p>
                                                    </div>
                                                </div>
                                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">P/L</p>
                                                        <p className="text-xl font-black text-slate-900 dark:text-white">{selectedStock.peRatio.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 text-right">P/VP</p>
                                                        <p className="text-xl font-black text-slate-900 dark:text-white text-right">{selectedStock.pbRatio.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                                                <div className="flex items-center gap-3 text-emerald-500 mb-2">
                                                    <PieChart size={20} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Proventos</span>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">DPA (12m)</p>
                                                    <p className="text-2xl font-black text-slate-900 dark:text-white">R$ {selectedStock.dpa.toFixed(2)}</p>
                                                </div>
                                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Dividend Yield (12m)</p>
                                                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{selectedStock.dividendYield.toFixed(2)}%</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                                    <BarChart2 className="text-sky-500" /> Histórico de Dividendos
                                                </h3>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    <Info size={14} className="text-slate-300" />
                                                    Análise dos últimos 6 anos
                                                </div>
                                            </div>
                                            <InvestmentDividendChart
                                                dividends={selectedStock.historicalDividends}
                                                currentPrice={selectedStock.price}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                    <InvestmentPortfolio />
            )}
                </div>
            );
}
