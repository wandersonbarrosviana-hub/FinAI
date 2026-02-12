import React from 'react';
import { InvestmentData, InvestmentIndicator } from '../types';
import DividendChart from './DividendChart';
import DividendTable from './DividendTable';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Activity, PieChart, Layers } from 'lucide-react';

interface AssetDetailProps {
    asset: InvestmentData;
    onBack: () => void;
}

const IndicatorCard = ({ label, value, suffix = '', prefix = '', color = 'text-white' }: { label: string, value: string | number, suffix?: string, prefix?: string, color?: string }) => (
    <div className="bg-[#1A1B1E] p-4 rounded-xl border border-[#2C2D33] flex flex-col justify-between hover:border-slate-600 transition-colors">
        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">{label}</span>
        <span className={`text-lg font-bold ${color} truncate`}>
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
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        {asset.ticker}
                        <span className="text-sm font-normal text-slate-400 bg-slate-800 px-3 py-1 rounded-full">{asset.name}</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-500 text-xs font-bold uppercase">{asset.segment}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        <span className="text-emerald-400 text-xs font-bold uppercase animate-pulse">Cotação em Tempo Real</span>
                    </div>
                </div>
                <div className="ml-auto text-right">
                    <p className="text-gray-400 text-xs font-bold uppercase">Preço Atual</p>
                    <p className="text-4xl font-black text-white">
                        R$ {asset.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Main Indicators Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                <IndicatorCard label="Cotação em Tempo Real" value={asset.price} prefix="R$ " color="text-emerald-400" />
                <IndicatorCard label="Dy(12m) %" value={i.dy} suffix="%" color="text-[#00D084]" />
                <IndicatorCard label="P/L" value={i.pl} />
                <IndicatorCard label="P/VP" value={i.pvp} />
                {!isFii && <IndicatorCard label="ROE" value={i.roe} suffix="%" />}
                {!isFii && <IndicatorCard label="ROIC" value={i.roic} suffix="%" />}
                {!isFii && <IndicatorCard label="CAGR DE LUCROS 5ANOS" value={i.cagr_lucros_5y} suffix="%" />}
                {!isFii && <IndicatorCard label="PAYOUT ULTIMOS 12 MESES %" value={i.payout} suffix="%" />}
                {!isFii && <IndicatorCard label="MARGEM LIQUIDA %" value={i.margem_liquida} suffix="%" />}
                {!isFii && <IndicatorCard label="MARGEM BRUTA %" value={i.margem_bruta} suffix="%" />}
                <IndicatorCard label="VPA" value={i.vpa} prefix="R$ " />
                {!isFii && <IndicatorCard label="LPA" value={i.lpa} prefix="R$ " />}
                {!isFii && <IndicatorCard label="MARGEM EBITDA" value={i.margem_ebitda} suffix="%" />}
                {!isFii && <IndicatorCard label="P/EBITDA" value={i.p_ebitda} />}
                {!isFii && <IndicatorCard label="DIVIDA LIQUIDA/EBITDA" value={i.divida_liquida_ebitda} />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 space-y-8">
                    <DividendChart data={asset.chartData} />
                    <DividendTable dividends={asset.dividends} />
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-[#1A1B1E] rounded-xl border border-[#2C2D33] p-6">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <PieChart size={18} className="text-blue-500" />
                            Dados Patrimoniais
                        </h3>

                        <div className="space-y-5">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Patrimônio Líquido</p>
                                <p className="text-white font-semibold">
                                    {i.patrimonio_liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            {!isFii && (
                                <>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Dívida Líquida</p>
                                        <p className="text-white font-semibold">
                                            {i.divida_liquida.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Dívida Bruta</p>
                                        <p className="text-white font-semibold">
                                            {i.divida_bruta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                        </p>
                                    </div>
                                </>
                            )}
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Quantos Papéis</p>
                                <p className="text-white font-semibold">
                                    {(i.numero_papeis || 0).toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Free Float</p>
                                <p className="text-white font-semibold">
                                    {i.free_float.toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1A1B1E] rounded-xl border border-[#2C2D33] p-6">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Activity size={18} className="text-emerald-500" />
                            Liquidez
                        </h3>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Liquidz Media Diraria</p>
                            <p className="text-white font-semibold">
                                {(i.liquidez_media_diaria || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetDetail;
