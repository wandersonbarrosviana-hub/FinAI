import React from 'react';
import { InvestmentData } from '../types';
import DividendChart from './DividendChart';
import DividendTable from './DividendTable';
import InvestmentInsights from './InvestmentInsights';
import { ArrowLeft, Activity, PieChart, TrendingUp, DollarSign, Percent, BarChart3, Shield, BarChart } from 'lucide-react';

interface AssetDetailProps {
    asset: InvestmentData;
    onBack: () => void;
}

const IndicatorCard = ({ label, value, suffix = '', prefix = '', color = 'text-slate-900 dark:text-white', icon: Icon }: { label: string, value: string | number, suffix?: string, prefix?: string, color?: string, icon?: any }) => (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col hover:shadow-xl hover:shadow-sky-500/5 transition-all group ring-1 ring-black/5 dark:ring-white/5 h-full">
        <div className="flex items-center gap-2 mb-4">
            {Icon && <Icon size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-sky-500 transition-colors" />}
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">{label}</span>
        </div>
        <div className="mt-auto">
            <span className={`text-2xl font-black ${color} tracking-tighter truncate block`}>
                {prefix}{typeof value === 'number' ?
                    (Math.abs(value) < 0.01 && value !== 0 ? value.toFixed(4) : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                    : value}{suffix}
            </span>
        </div>
    </div>
);

const AssetDetail: React.FC<AssetDetailProps> = ({ asset, onBack }) => {
    const i = asset.indicators;
    const isFii = asset.type === 'fii';

    return (
        <div className="animate-in slide-in-from-right duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12">
                <button onClick={onBack} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:shadow-lg transition-all shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                            {asset.ticker}
                        </h1>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isFii ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400'}`}>
                            {isFii ? 'FII' : 'Ação'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-tight">{asset.name}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                        <span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-tight">{asset.segment}</span>
                    </div>
                </div>
                <div className="md:text-right bg-sky-50 dark:bg-sky-900/10 px-10 py-6 rounded-[3rem] border border-sky-100 dark:border-sky-900/20 shadow-sm shadow-sky-500/5">
                    <p className="text-sky-600/50 dark:text-sky-400/50 text-[10px] font-black uppercase tracking-widest mb-1">Cotação Atual</p>
                    <p className="text-5xl font-black text-sky-600 dark:text-sky-400 tracking-tighter">
                        R$ {asset.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* AI Insights Section */}
            <div className="mb-12">
                <InvestmentInsights investment={asset} />
            </div>

            {/* Main Indicators Grid */}
            <div className="mb-12">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                    <span className="w-8 h-1 bg-sky-500 rounded-full"></span>
                    Indicadores Fundamentalistas
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <IndicatorCard label="Dividend Yield" value={i.dy} suffix="%" color="text-emerald-600 dark:text-emerald-400" icon={DollarSign} />
                    <IndicatorCard label="P/L" value={i.pl} icon={TrendingUp} />
                    <IndicatorCard label="P/VP" value={i.pvp} icon={PieChart} />
                    <IndicatorCard label="VPA" value={i.vpa} prefix="R$ " icon={Shield} />
                    <IndicatorCard label="LPA" value={i.lpa} prefix="R$ " icon={BarChart3} />
                    {!isFii && (
                        <>
                            <IndicatorCard label="ROE" value={i.roe} suffix="%" color="text-emerald-500" icon={Percent} />
                            <IndicatorCard label="ROIC" value={i.roic} suffix="%" color="text-sky-500" icon={Activity} />
                            <IndicatorCard label="EBITDA" value={i.ebitda} prefix="R$ " icon={BarChart} />
                            <IndicatorCard label="M. Líquida" value={i.margem_liquida} suffix="%" icon={Activity} />
                            <IndicatorCard label="M. Bruta" value={i.margem_bruta} suffix="%" icon={Activity} />
                            <IndicatorCard label="M. EBITDA" value={i.margem_ebitda} suffix="%" icon={Activity} />
                            <IndicatorCard label="EV/EBITDA" value={i.p_ebitda} icon={BarChart3} />
                            <IndicatorCard label="Dív.Líq/EBITDA" value={i.divida_liquida_ebitda} icon={Activity} />
                            <IndicatorCard label="CAGR Lucro" value={i.cagr_lucros_5y} suffix="%" icon={TrendingUp} />
                        </>
                    )}
                    <IndicatorCard label="Mkt Cap" value={i.market_cap} prefix="R$ " icon={DollarSign} />
                    <IndicatorCard label="Free Float" value={i.free_float} suffix="%" icon={Shield} />
                    <IndicatorCard label="Liq. Diária" value={i.liquidez_media_diaria} prefix="R$ " icon={Activity} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                <Activity className="text-sky-500" /> Histórico de Dividendos
                            </h3>
                        </div>
                        <DividendChart data={asset.chartData} />
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-widest">
                            <PieChart size={20} className="text-indigo-500 dark:text-indigo-400" />
                            Patrimonial
                        </h3>

                        <div className="space-y-6">
                            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-1">Patrimônio Líquido</p>
                                <p className="text-slate-900 dark:text-white font-black tracking-tighter text-2xl">
                                    {i.patrimonio_liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-1">Número de Papéis</p>
                                <p className="text-slate-900 dark:text-white font-black tracking-tighter text-2xl">
                                    {(i.numero_papeis || 0).toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm ring-1 ring-black/5 dark:ring-white/5 mb-12">
                <DividendTable dividends={asset.dividends} />
            </div>
        </div>
    );
};

export default AssetDetail;
