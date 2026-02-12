import React from 'react';

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

interface AssetCardProps {
    asset: AssetData;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
    const isFii = asset.type === 'fii';

    // Format helpers
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const formatNumber = (val: number) =>
        new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

    return (
        <div className="bg-[#1A1B1E] rounded-xl p-6 border border-[#2C2D33] hover:border-[#00D084] transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">{asset.ticker}</h3>
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{asset.name}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${isFii ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>
                    {isFii ? 'FII' : 'AÇÃO'}
                </span>
            </div>

            <div className="mb-6">
                <p className="text-sm text-gray-400 mb-1">Cotação</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(asset.price)}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-[#2C2D33] pt-4">
                <div>
                    <p className="text-xs text-gray-500 mb-1">DY (12M)</p>
                    <p className="text-sm font-semibold text-[#00D084]">{formatNumber(asset.dy)}%</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 mb-1">P/L</p>
                    <p className="text-sm font-semibold text-white">{asset.p_l > 0 ? formatNumber(asset.p_l) : '-'}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 mb-1">P/VP</p>
                    <p className="text-sm font-semibold text-white">{asset.p_vp > 0 ? formatNumber(asset.p_vp) : '-'}</p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#2C2D33]">
                <p className="text-xs text-gray-500">Segmento</p>
                <p className="text-sm text-gray-300">{asset.segment}</p>
            </div>
        </div>
    );
};

export default AssetCard;
