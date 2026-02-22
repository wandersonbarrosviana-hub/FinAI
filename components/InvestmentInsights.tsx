import React, { useEffect, useState } from 'react';
import { getInvestmentAnalysis } from '../aiService';
import { Brain, TrendingUp, ShieldCheck, AlertCircle, ShoppingCart, Info, Activity, DollarSign } from 'lucide-react';

interface InvestmentInsightsProps {
    investment: any;
}

const InvestmentInsights: React.FC<InvestmentInsightsProps> = ({ investment }) => {
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (investment) {
            fetchAnalysis();
        }
    }, [investment]);

    const fetchAnalysis = async () => {
        setLoading(true);
        try {
            const data = await getInvestmentAnalysis(investment);
            setAnalysis(data);
        } catch (error) {
            console.error("Failed to fetch IA analysis:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-3xl p-8 animate-pulse">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-xl"></div>
                    <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                </div>
                <div className="space-y-4">
                    <div className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-full"></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-2xl"></div>
                        <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-2xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!analysis) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'good': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'bad': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            default: return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        }
    };

    return (
        <div className="w-full space-y-6">
            {/* Main Insights Header */}
            <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-8 shadow-2xl shadow-indigo-500/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Brain size={120} className="text-indigo-500 animate-pulse" />
                </div>

                <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-indigo-500 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                                    <Brain size={20} />
                                </span>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Análise Inteligente FinAI</h3>
                            </div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Processado via Gemini AI Pro em Tempo Real</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score do Ativo</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{analysis.score}/10</span>
                                </div>
                            </div>
                            <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
                            <div className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm ${analysis.recommendation === 'Compre' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                                    analysis.recommendation === 'Neutro' ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
                                }`}>
                                {analysis.recommendation}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Analysis Text */}
                        <div className="space-y-6">
                            <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-6 border border-white/50 dark:border-slate-700/50">
                                <div className="flex items-center gap-2 mb-4">
                                    <Activity size={16} className="text-indigo-500" />
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Resumo Fundamentalista</h4>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium italic">
                                    "{analysis.iaInsight}"
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <TrendingUp size={14} className="text-emerald-500" />
                                        <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Pontos Fortes</h4>
                                    </div>
                                    <ul className="space-y-2">
                                        {analysis.strengths.map((s: string, i: number) => (
                                            <li key={i} className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                                <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 shrink-0"></div>
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertCircle size={14} className="text-rose-500" />
                                        <h4 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Riscos</h4>
                                    </div>
                                    <ul className="space-y-2">
                                        {analysis.weaknesses.map((w: string, i: number) => (
                                            <li key={i} className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                                <div className="w-1 h-1 bg-rose-500 rounded-full mt-1.5 shrink-0"></div>
                                                {w}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Visual Indicators */}
                        <div className="space-y-4">
                            <div className="bg-white/30 dark:bg-slate-800/30 rounded-2xl p-6 border border-white/50 dark:border-slate-700/50">
                                <div className="flex items-center gap-2 mb-6">
                                    <TrendingUp size={16} className="text-indigo-500" />
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Checklist de Qualidade</h4>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {Object.entries(analysis.indicatorsVisual).map(([key, info]: [string, any]) => (
                                        <div key={key} className={`flex items-center justify-between p-3 rounded-xl border transition-all hover:scale-[1.02] ${getStatusColor(info.status)}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                                                    {key === 'valuation' && <DollarSign size={14} />}
                                                    {key === 'efficiency' && <Activity size={14} />}
                                                    {key === 'dividend' && <TrendingUp size={14} />}
                                                    {key === 'debt' && <ShieldCheck size={14} />}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{key}</span>
                                            </div>
                                            <span className="text-[11px] font-bold">{info.message}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart size={14} className="text-indigo-500" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço Teto Est.</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{analysis.fairValue}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 px-4">
                <Info size={12} className="text-slate-400" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Aviso: Esta análise é gerada por inteligência artificial e não constitui recomendação de investimento.
                </p>
            </div>
        </div>
    );
};

export default InvestmentInsights;
