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
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-sky-100/50 transition-all duration-500 group relative overflow-hidden ring-1 ring-black/5">
            {/* Type Indicator Float */}
            <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest ${isFii ? 'bg-orange-50 text-orange-600' : 'bg-sky-50 text-sky-600'}`}>
                {isFii ? 'FII' : 'Ação'}
            </div>

            <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-900 mb-1 group-hover:text-sky-600 transition-colors tracking-tight">{asset.ticker}</h3>
                <p className="text-xs font-bold text-slate-400 truncate uppercase tracking-tight">{asset.name}</p>
            </div>

            <div className="mb-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cotação Atual</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(asset.price)}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-6">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DY (12M)</p>
                    <p className="text-sm font-black text-emerald-600 tracking-tight">{formatNumber(i.dy)}%</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">P/L</p>
                    <p className="text-sm font-black text-slate-900 tracking-tight">{i.pl > 0 ? formatNumber(i.pl) : '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50 text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">P/VP</p>
                    <p className="text-sm font-black text-slate-900 tracking-tight">{i.pvp > 0 ? formatNumber(i.pvp) : '-'}</p>
                </div>
            </div>

            <div className="mt-4 pt-4 flex justify-between items-center px-1">
                <div>
                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Setor</p>
                    <p className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{asset.segment}</p>
                </div>
                {!isFii && (
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">ROE</p>
                        <p className="text-xs font-black text-emerald-500">{formatNumber(i.roe)}%</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssetCard;
