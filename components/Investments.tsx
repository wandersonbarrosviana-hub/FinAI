import React, { useState, useEffect } from 'react';
import AssetCard from './AssetCard';
import AssetDetail from './AssetDetail';
import { InvestmentData } from '../types';
import { Search } from 'lucide-react';
import { getAssetData, getFundamentalData } from '../src/services/profitService';

const Investments: React.FC = () => {
    const [investments, setInvestments] = useState<InvestmentData[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<InvestmentData | null>(null);

    const filteredInvestments = investments; // Exibe todos os buscados na sessão

    const handleSearch = async (ticker: string) => {
        if (!ticker) return;
        setLoading(true);
        try {
            const quote = await getAssetData(ticker);
            const fundamentals = await getFundamentalData(ticker);

            const newAsset: InvestmentData = {
                ticker: ticker.toUpperCase(),
                name: quote.name || ticker.toUpperCase(),
                price: quote.price,
                type: ticker.length > 5 ? 'fii' : 'acao', // Heurística simples
                segment: fundamentals.sector || 'N/A',
                indicators: {
                    dy: fundamentals.dividendYield * 100 || 0,
                    pl: fundamentals.peRatio || 0,
                    pvp: fundamentals.pbRatio || 0,
                    roe: fundamentals.roe * 100 || 0,
                    roic: fundamentals.roic * 100 || 0,
                    cagr_lucros_5y: fundamentals.cagr5y || 0,
                    payout: fundamentals.payoutRatio * 100 || 0,
                    margem_liquida: fundamentals.netMargin * 100 || 0,
                    margem_bruta: fundamentals.grossMargin * 100 || 0,
                    margem_ebitda: fundamentals.ebitdaMargin * 100 || 0,
                    p_ebitda: fundamentals.priceToEbitda || 0,
                    divida_liquida_ebitda: fundamentals.netDebtToEbitda || 0,
                    vpa: fundamentals.bookValuePerShare || 0,
                    lpa: fundamentals.earningsPerShare || 0,
                    divida_liquida: fundamentals.netDebt || 0,
                    divida_bruta: fundamentals.grossDebt || 0,
                    liquidez_media_diaria: fundamentals.avgDailyVolume || 0,
                    free_float: fundamentals.freeFloat * 100 || 0,
                    patrimonio_liquido: fundamentals.equity || 0,
                    numero_papeis: fundamentals.sharesOutstanding || 0
                },
                chartData: [], // Será carregado no AssetDetail
                dividends: [] // Será carregado no AssetDetail
            };

            setInvestments(prev => {
                const filtered = prev.filter(a => a.ticker !== newAsset.ticker);
                return [newAsset, ...filtered];
            });
        } catch (error) {
            console.error("Erro ao buscar ativo:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Opcional: carregar favoritos/ativos padrões
    }, []);

    const stocks = filteredInvestments.filter(i => i.type === 'acao');
    const fiis = filteredInvestments.filter(i => i.type === 'fii');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full p-20">
                <div className="text-sky-600 animate-pulse text-xl font-bold">Carregando cotações em tempo real...</div>
            </div>
        )
    }

    if (selectedAsset) {
        return (
            <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-8 pb-24">
                <AssetDetail
                    asset={selectedAsset}
                    onBack={() => setSelectedAsset(null)}
                />
            </div>
        )
    }

    return (
        <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12 pb-24">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Investimentos</h2>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Acompanhe seus ativos com dados fundamentalistas e históricos</p>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={20} />
                    <input
                        type="text"
                        placeholder="Pesquisar ativo (ex: PETR4, MXRF11...)"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-slate-700 dark:text-slate-200 font-bold outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 transition-all shadow-sm placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
                    />
                </div>
            </div>

            {stocks.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                        <span className="w-8 h-1 bg-sky-500 rounded-full"></span>
                        Ações
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {stocks.map(asset => (
                            <div key={asset.ticker} onClick={() => setSelectedAsset(asset)} className="cursor-pointer transform hover:scale-[1.02] transition-transform">
                                <AssetCard asset={asset} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {fiis.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                        <span className="w-8 h-1 bg-indigo-500 rounded-full"></span>
                        Fundos Imobiliários
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {fiis.map(asset => (
                            <div key={asset.ticker} onClick={() => setSelectedAsset(asset)} className="cursor-pointer transform hover:scale-[1.02] transition-transform">
                                <AssetCard asset={asset} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {filteredInvestments.length === 0 && (
                <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in">
                    <Search className="mx-auto text-slate-200 dark:text-slate-700 mb-6" size={64} />
                    <p className="text-xl font-black text-slate-900 dark:text-white">Nenhum ativo encontrado</p>
                    <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-2">Tente buscar por ticker ou nome da empresa</p>
                </div>
            )}
        </div>
    );
};

export default Investments;
