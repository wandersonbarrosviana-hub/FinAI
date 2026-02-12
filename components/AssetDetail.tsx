import React from 'react';
import { InvestmentData, InvestmentIndicator } from '../types';
import DividendChart from './DividendChart';
import DividendTable from './DividendTable';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Activity, PieChart, Layers } from 'lucide-react';

interface AssetDetailProps {
    asset: InvestmentData;
    onBack: () => void;
}

const IndicatorCard = ({ label, value, suffix = '', prefix = '', color = 'text-slate-900' }: { label: string, value: string | number, suffix?: string, prefix?: string, color?: string }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all ring-1 ring-black/5">
        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">{label}</span>
        <span className={`text-xl font-black ${color} truncate tracking-tight`}>
            {prefix}{typeof value === 'number' ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}{suffix}
        </span>
    </div>
);

const AssetDetail: React.FC<AssetDetailProps> = ({ asset, onBack }) => {
    const i = asset.indicators;
    const isFii = asset.type === 'fii';

    return (
        <div className="animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12">
                <button onClick={onBack} className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-sky-600 hover:shadow-lg transition-all shadow-sm ring-1 ring-black/5">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
                            {asset.ticker}
                        </h1>
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isFii ? 'bg-orange-50 text-orange-600' : 'bg-sky-50 text-sky-600'}`}>
                            {isFii ? 'FII' : 'Ação'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-sm font-bold uppercase tracking-tight">{asset.name}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                        <span className="text-slate-400 text-sm font-bold uppercase tracking-tight">{asset.segment}</span>
                    </div>
                </div>
                <div className="md:text-right bg-sky-50/50 px-8 py-5 rounded-[2.5rem] border border-sky-100/50">
                    <p className="text-sky-600/50 text-[10px] font-black uppercase tracking-widest mb-1">Cotação Atual</p>
                    <p className="text-4xl font-black text-sky-600 tracking-tighter">
                        R$ {asset.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Main Indicators Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-12">
                <IndicatorCard label="Status Atual" value="Tempo Real" color="text-emerald-600" />
                <IndicatorCard label="Dividend Yield" value={i.dy} suffix="%" color="text-emerald-600" />
                <IndicatorCard label="P/L" value={i.pl} />
                <IndicatorCard label="P/VP" value={i.pvp} />
                {!isFii && <IndicatorCard label="ROE" value={i.roe} suffix="%" />}
                {!isFii && <IndicatorCard label="ROIC" value={i.roic} suffix="%" />}
                {!isFii && <IndicatorCard label="CAGR (5A)" value={i.cagr_lucros_5y} suffix="%" />}
                {!isFii && <IndicatorCard label="PAYOUT" value={i.payout} suffix="%" />}
                {!isFii && <IndicatorCard label="M. LÍQUIDA" value={i.margem_liquida} suffix="%" />}
                <IndicatorCard label="VPA" value={i.vpa} prefix="R$ " />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm ring-1 ring-black/5">
                        <DividendChart data={asset.chartData} />
                    </div>
                    <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm ring-1 ring-black/5">
                        <DividendTable dividends={asset.dividends} />
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm ring-1 ring-black/5">
                        <h3 className="text-sm font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-widest">
                            <PieChart size={20} className="text-indigo-500" />
                            Patrimonial
                        </h3>

                        <div className="space-y-6">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Patrimônio Líquido</p>
                                <p className="text-slate-900 font-black tracking-tight text-lg">
                                    {i.patrimonio_liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            {!isFii && (
                                <>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Dívida Líquida</p>
                                        <p className="text-slate-900 font-black tracking-tight text-lg">
                                            {i.divida_liquida.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                        </p>
                                    </div>
                                </>
                            )}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Número de Papéis</p>
                                <p className="text-slate-900 font-black tracking-tight text-lg">
                                    {(i.numero_papeis || 0).toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm ring-1 ring-black/5">
                        <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-widest">
                            <Activity size={20} className="text-sky-500" />
                            Liquidez Diária
                        </h3>
                        <div className="p-4 bg-sky-50 text-sky-600 rounded-2xl font-black text-xl tracking-tighter">
                            {(i.liquidez_media_diaria || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetDetail;
