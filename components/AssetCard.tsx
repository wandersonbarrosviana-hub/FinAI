import React from 'react';
import { InvestmentData } from '../types';

interface AssetCardProps {
    asset: InvestmentData;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
    const isFii = asset.type === 'fii';
    const i = asset.indicators;

    // Format helpers
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const formatNumber = (val: number) =>
        new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

    return (
        <div className="bg-[#1A1B1E] rounded-xl p-6 border border-[#2C2D33] hover:border-[#00D084] transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#00D084] transition-colors">{asset.ticker}</h3>
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{asset.name}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${isFii ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>
                    {isFii ? 'FII' : 'AÇÃO'}
                </span>
            </div>

            <div className="mb-6">
                <p className="text-sm text-gray-400 mb-1">Cotação</p>
                <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-white">{formatCurrency(asset.price)}</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-[#2C2D33] pt-4">
                <div>
                    <p className="text-xs text-gray-500 mb-1">DY (12M)</p>
                    <p className="text-sm font-semibold text-[#00D084]">{formatNumber(i.dy)}%</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 mb-1">P/L</p>
                    <p className="text-sm font-semibold text-white">{i.pl > 0 ? formatNumber(i.pl) : '-'}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 mb-1">P/VP</p>
                    <p className="text-sm font-semibold text-white">{i.pvp > 0 ? formatNumber(i.pvp) : '-'}</p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#2C2D33] flex justify-between items-center">
                <div>
                    <p className="text-xs text-gray-500">Segmento</p>
                    <p className="text-sm text-gray-300 truncate max-w-[120px]">{asset.segment}</p>
                </div>
                {!isFii && (
                    <div className="text-right">
                        <p className="text-xs text-gray-500">ROE</p>
                        <p className="text-sm text-emerald-400 font-bold">{formatNumber(i.roe)}%</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssetCard;
