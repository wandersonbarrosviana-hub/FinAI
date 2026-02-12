import React, { useEffect, useState } from 'react';
import AssetCard from './AssetCard';

interface AssetData {
    ticker: string;
    type: string;
    price: number;
    p_vp: number;
    p_l: number;
    dy: number;
    segment: string;
    name: string;
}

const Investments: React.FC = () => {
    const [assets, setAssets] = useState<AssetData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/data/investments.json')
            .then(res => res.json())
            .then(data => {
                setAssets(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching investments:", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center h-full">
                <div className="text-[#00D084] animate-pulse">Carregando investimentos...</div>
            </div>
        );
    }

    const stocks = assets.filter(a => a.type === 'acao');
    const fiis = assets.filter(a => a.type === 'fii');

    return (
        <div className="p-8 h-full overflow-y-auto mb-20 md:mb-0">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Investimentos</h1>
                <p className="text-gray-400">Acompanhe seus ativos de renda variável (Dados via Yahoo Finance)</p>
            </div>

            {/* Ações Section */}
            <div className="mb-10">
                <h2 className="text-xl font-semibold text-white mb-4 pl-2 border-l-4 border-blue-500">Ações</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {stocks.map(asset => (
                        <AssetCard key={asset.ticker} asset={asset} />
                    ))}
                </div>
            </div>

            {/* FIIs Section */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4 pl-2 border-l-4 border-orange-500">Fundos Imobiliários</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {fiis.map(asset => (
                        <AssetCard key={asset.ticker} asset={asset} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Investments;
