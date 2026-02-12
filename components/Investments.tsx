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
                <div className="text-emerald-400 animate-pulse text-xl font-bold">Carregando cotações em tempo real...</div>
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
                    <h2 className="text-3xl font-bold text-white mb-2">Investimentos</h2>
                    <p className="text-slate-400">Acompanhe seus ativos com dados fundamentalistas e históricos</p>
                </div>

                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10" size={20} />
                    <input
                        type="text"
                        placeholder="Pesquisar ativo (ex: PETR4, MXRF11...)"
                        className="relative z-10 w-full bg-[#1A1B1E] border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#00D084] placeholder-slate-600 transition-all shadow-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {stocks.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#00D084] rounded-full shadow-[0_0_10px_#00D084]"></span>
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
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_#3B82F6]"></span>
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
                <div className="text-center py-20 bg-[#1A1B1E] rounded-xl border border-dashed border-slate-700 animate-in fade-in">
                    <Search className="mx-auto text-slate-600 mb-4" size={48} />
                    <p className="text-slate-400 text-lg">Nenhum ativo encontrado para "{searchTerm}"</p>
                    <p className="text-slate-600 text-sm mt-2">Tente buscar por ticker ou nome da empresa</p>
                </div>
            )}
        </div>
    );
};

export default Investments;
