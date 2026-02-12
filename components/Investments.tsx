import React, { useState, useEffect } from 'react';
import AssetCard from './AssetCard';
import AssetDetail from './AssetDetail';
import { InvestmentData } from '../types';
import { Search } from 'lucide-react';

const Investments: React.FC = () => {
    const [investments, setInvestments] = useState<InvestmentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<InvestmentData | null>(null);

    useEffect(() => {
        fetch('/data/investments.json')
            .then(res => res.json())
            .then(data => {
                setInvestments(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error loading investments:", err);
                setLoading(false);
            });
    }, []);

    // Filter logic
    const filteredInvestments = investments.filter(inv =>
        inv.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Investimentos</h2>
                    <p className="text-sm font-medium text-slate-500">Acompanhe seus ativos com dados fundamentalistas e históricos</p>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                        type="text"
                        placeholder="Pesquisar ativo (ex: PETR4, MXRF11...)"
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-slate-700 font-bold outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 transition-all shadow-sm placeholder:text-slate-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm animate-in fade-in">
                    <Search className="mx-auto text-slate-200 mb-6" size={64} />
                    <p className="text-xl font-black text-slate-900">Nenhum ativo encontrado</p>
                    <p className="text-sm font-medium text-slate-400 mt-2">Tente buscar por ticker ou nome da empresa</p>
                </div>
            )}
        </div>
    );
};

export default Investments;
