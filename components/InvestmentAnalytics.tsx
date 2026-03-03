import React, { useState, useMemo } from 'react';
import { Search, Loader2, TrendingUp, AlertCircle, Info, BarChart2, DollarSign, PieChart, Activity, Globe } from 'lucide-react';
import { supabase } from '../supabaseClient';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface StockData {
    symbol: string;
    price: number;
    dividendYield: number;
    peRatio: number;
    pbRatio: number;
    netIncome: number;
    sharesOutstanding: number;
    roe: number;
    name: string;
    changesPercentage: number;
    historicalDividends: any[];
}

export default function InvestmentAnalytics() {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchStockData = async (ticker: string) => {
        try {
            setLoading(true);
            setErrorMsg('');

            let b3Ticker = ticker.toUpperCase().trim();
            b3Ticker = b3Ticker.replace('.SA', '');

            // Fetch Basic Quote Data from Brapi
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

            // Fetch Yahoo Finance Supplemental Data
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

            const yfFinancial = yfMetrics.financialData || {};
            const yfStats = yfMetrics.defaultKeyStatistics || {};

            // Calculate Yield TTM
            let dividendYieldComputed = 0;
            if (yfDividends.length > 0) {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                const ttmDividends = yfDividends
                    .filter((d: any) => new Date(d.date) >= oneYearAgo)
                    .reduce((sum: number, d: any) => sum + (d.dividends || 0), 0);

                if (data.regularMarketPrice > 0) {
                    dividendYieldComputed = (ttmDividends / data.regularMarketPrice) * 100;
                }
            }

            // Fallback for Net Income since it often comes zerado from some sources
            const netIncome = yfFinancial.netIncomeToCommon || yfFinancial.netIncome || yfStats.netIncome || 0;

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
                netIncome: netIncome,
                historicalDividends: yfDividends
            };

            setSelectedStock(newStock);
            setSearchQuery('');

        } catch (error: any) {
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

    const formatCurrency = (value: number) => {
        if (Math.abs(value) >= 1e9) return `R$ ${(value / 1e9).toFixed(2)}B`;
        if (Math.abs(value) >= 1e6) return `R$ ${(value / 1e6).toFixed(2)}M`;
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    };

    // Process dividends for chart (per year)
    const annualDividends = useMemo(() => {
        if (!selectedStock?.historicalDividends) return [];

        const years: Record<number, number> = {};
        selectedStock.historicalDividends.forEach(d => {
            const year = new Date(d.date).getFullYear();
            years[year] = (years[year] || 0) + (d.dividends || 0);
        });

        return Object.entries(years)
            .map(([year, total]) => ({ year, total }))
            .sort((a, b) => Number(a.year) - Number(b.year))
            .slice(-6); // Last 6 years
    }, [selectedStock]);

    return (
        <div className="flex flex-col h-full max-w-6xl mx-auto w-full space-y-8 p-4 md:p-0">
            {/* Header and Search */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-sky-500/10 rounded-xl">
                            <TrendingUp className="text-sky-600" size={28} />
                        </div>
                        Análise Fundamentalista
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        Pesquise um ativo da B3 para visualizar indicadores e dividendos.
                    </p>
                </div>

                <form onSubmit={handleSearch} className="flex relative items-center max-w-md w-full">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={20} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-base focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400 uppercase font-bold shadow-sm"
                            placeholder="Ex: ITUB4, VALE3..."
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !searchQuery.trim()}
                        className="ml-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl px-8 py-4 text-base font-black transition-all shadow-lg shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                    >
                        {loading ? <Loader2 size={24} className="animate-spin" /> : 'Analisar'}
                    </button>
                </form>
            </div>

            {errorMsg && (
                <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 border-2 border-rose-100 dark:border-rose-500/20 animate-in slide-in-from-top-2 duration-300">
                    <AlertCircle size={20} />
                    {errorMsg}
                    <button onClick={() => setErrorMsg('')} className="ml-auto text-rose-400 hover:text-rose-600 font-black text-xl">&times;</button>
                </div>
            )}

            {!selectedStock && !loading && (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <Activity size={64} className="opacity-10 mb-6" />
                    <p className="text-xl font-bold text-slate-500 dark:text-slate-400">Nenhum ativo selecionado</p>
                    <p className="text-sm mt-2">Digite o código do ativo acima para começar a análise.</p>
                </div>
            )}

            {selectedStock && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Main Info Card */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <TrendingUp size={120} />
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                                        {selectedStock.symbol.replace('.SA', '')}
                                    </span>
                                    <div className={`px-4 py-1.5 rounded-full text-sm font-black ${selectedStock.changesPercentage >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                                        {selectedStock.changesPercentage > 0 ? '+' : ''}{selectedStock.changesPercentage.toFixed(2)}%
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-slate-500 flex items-center gap-2">
                                    <Globe size={18} /> {selectedStock.name}
                                </h2>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Cotação Atual</p>
                                <p className="text-5xl font-black text-sky-600 dark:text-sky-400 tabular-nums">
                                    R$ {selectedStock.price.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                            <MetricCard
                                label="Dividend Yield (12m)"
                                value={`${selectedStock.dividendYield.toFixed(2)}%`}
                                icon={<DollarSign className="text-emerald-500" />}
                                subtitle="Retorno em Proventos"
                            />
                            <MetricCard
                                label="Preço / Lucro (P/L)"
                                value={selectedStock.peRatio.toFixed(2)}
                                icon={<Activity className="text-blue-500" />}
                                subtitle="Tempo de Payback"
                            />
                            <MetricCard
                                label="Preço / V.P (P/VP)"
                                value={selectedStock.pbRatio.toFixed(2)}
                                icon={<PieChart className="text-orange-500" />}
                                subtitle="Valor Patrimonial"
                            />
                            <MetricCard
                                label="ROE"
                                value={`${selectedStock.roe.toFixed(2)}%`}
                                icon={<TrendingUp className="text-purple-500" />}
                                subtitle="Retorno sobre Patrimônio"
                            />
                            <MetricCard
                                label="Lucro Líquido (TTM)"
                                value={formatCurrency(selectedStock.netIncome)}
                                icon={<BarChart2 className="text-pink-500" />}
                                subtitle="Resultado dos 12 meses"
                                highlight={selectedStock.netIncome > 0}
                            />
                            <MetricCard
                                label="Total de Ações"
                                value={`${(selectedStock.sharesOutstanding / 1e6).toFixed(2)}M`}
                                icon={<Info className="text-slate-500" />}
                                subtitle="Quantidade de Papéis"
                            />
                        </div>
                    </div>

                    {/* Dividend History Chart */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <BarChart2 className="text-sky-500" /> Histórico de Dividendos Anuais
                                </h3>
                                <p className="text-slate-500 mt-1 font-medium">Evolução dos pagamentos nos últimos 6 anos.</p>
                            </div>
                        </div>

                        <div className="h-[400px] w-full mt-4">
                            {annualDividends.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={annualDividends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                        <XAxis
                                            dataKey="year"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94A3B8', fontSize: 13, fontWeight: 700 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94A3B8', fontSize: 12 }}
                                            tickFormatter={(val) => `R$ ${val.toFixed(2)}`}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(14, 165, 233, 0.05)', radius: 12 }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700">
                                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                                                            <p className="text-xl font-bold text-sky-400">R$ {Number(payload[0].value).toFixed(2)}</p>
                                                            <p className="text-[10px] text-slate-500 mt-1">Total acumulado no ano</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar
                                            dataKey="total"
                                            radius={[10, 10, 10, 10]}
                                            barSize={60}
                                        >
                                            {annualDividends.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={index === annualDividends.length - 1 ? '#0EA5E9' : '#94A3B8'}
                                                    fillOpacity={index === annualDividends.length - 1 ? 1 : 0.3}
                                                    className="transition-all duration-500"
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                    <Info size={48} className="mb-4" />
                                    <p className="text-lg font-bold">Sem dados de dividendos disponíveis</p>
                                    <p className="text-sm">A empresa pode não ter pago dividendos no período.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MetricCard({ label, value, icon, subtitle, highlight = false }: { label: string, value: string, icon: React.ReactNode, subtitle: string, highlight?: boolean }) {
    return (
        <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl border-2 border-transparent hover:border-sky-500/20 transition-all group">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            </div>
            <p className={`text-2xl font-black tabular-nums transition-colors ${highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                {value}
            </p>
            <p className="text-xs font-bold text-slate-500 mt-1.5 uppercase tracking-tight opacity-70">
                {subtitle}
            </p>
        </div>
    );
}
