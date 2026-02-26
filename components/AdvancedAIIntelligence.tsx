
import React, { useState, useEffect } from 'react';
import { Sparkles, Activity, Brain, TrendingUp, Calendar, AlertCircle, AlertTriangle, CheckCircle2, Zap, ArrowRight, Info, ShieldCheck, HeartPulse } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction, Account, Budget, Goal, AdvancedAIInsights } from '../types';
import { getAdvancedAIInsights } from '../aiService';

interface AdvancedAIIntelligenceProps {
    transactions: Transaction[];
    accounts: Account[];
    budgets: Budget[];
    goals: Goal[];
    insights: AdvancedAIInsights | null;
    isLoading: boolean;
    error: string | null;
    onRefresh: () => void;
}

const AdvancedAIIntelligence: React.FC<AdvancedAIIntelligenceProps> = ({
    transactions, accounts, budgets, goals, insights, isLoading, error, onRefresh
}) => {
    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] animate-pulse">
                <div className="relative mb-6">
                    <div className="w-16 h-16 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center text-sky-600 dark:text-sky-400 animate-bounce">
                        <Brain size={32} />
                    </div>
                    <Sparkles className="absolute -top-2 -right-2 text-amber-400 animate-spin-slow" size={24} />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">Analisando sua Mente Financeira</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center max-w-xs">
                    O FinAI está cruzando dados de ${transactions.length} transações para identificar padrões e projetar seu futuro...
                </p>
            </div>
        );
    }

    if (error && !insights) {
        return (
            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                <AlertCircle size={40} className="text-rose-500 mb-4" />
                <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 mb-1">Ops! Algo deu errado</h3>
                <p className="text-sm text-rose-600 dark:text-rose-500 mb-4">{error}</p>
                <button
                    onClick={onRefresh}
                    className="bg-rose-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 dark:shadow-none uppercase text-[10px] tracking-widest"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    if (
        !insights ||
        !insights.healthScore ||
        !insights.emotionalPatterns ||
        !insights.projections ||
        insights.projections.length === 0 ||
        !insights.scenarios ||
        !Array.isArray(insights.scenarios)
    ) {
        return (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                <AlertCircle size={40} className="text-amber-500 mb-4" />
                <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400 mb-1">Análise Incompleta</h3>
                <p className="text-sm text-amber-600 dark:text-amber-500 mb-4">A IA retornou dados incompletos. Isso pode acontecer devido a limites de token ou formato da resposta.</p>
                <button
                    onClick={onRefresh}
                    className="bg-amber-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-200 dark:shadow-none uppercase text-[10px] tracking-widest"
                >
                    Recalcular Insights
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Health Score Gauge */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-sky-500 to-rose-400"></div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 self-start">Saúde Financeira</p>

                    <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="72" cy="72" r="64"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="text-slate-100 dark:text-slate-800"
                            />
                            <circle
                                cx="72" cy="72" r="64"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="10"
                                strokeDasharray={402}
                                strokeDashoffset={402 - (402 * insights.healthScore.score) / 100}
                                strokeLinecap="round"
                                className={`${insights.healthScore.score > 70 ? 'text-emerald-500' : insights.healthScore.score > 40 ? 'text-amber-500' : 'text-rose-500'} transition-all duration-1000 ease-out`}
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-4xl font-black text-slate-900 dark:text-white">{insights.healthScore.score}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Score</span>
                        </div>
                        <HeartPulse
                            size={16}
                            className={`absolute bottom-2 ${insights.healthScore.score > 70 ? 'text-emerald-500 animate-pulse' : 'text-rose-500'}`}
                        />
                    </div>

                    <p className="text-xs font-bold text-center text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                        {insights.healthScore.message}
                    </p>

                    <div className="w-full grid grid-cols-2 gap-2 mt-auto">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Liquidez</p>
                            <div className="flex items-center gap-1.5">
                                <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-sky-500" style={{ width: `${insights.healthScore.liquidity}%` }}></div>
                                </div>
                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400">{insights.healthScore.liquidity}</span>
                            </div>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Reserva</p>
                            <div className="flex items-center gap-1.5">
                                <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${insights.healthScore.reserve}%` }}></div>
                                </div>
                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400">{insights.healthScore.reserve}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Emotional Patterns */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Brain size={80} className="text-sky-600" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Padrões Emocionais</p>

                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">Pico Semanal</p>
                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{insights.emotionalPatterns.peakDay}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-sky-50 dark:bg-sky-900/20 text-sky-600 rounded-xl">
                                <Activity size={18} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">Categoria Gatilho</p>
                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{insights.emotionalPatterns.peakCategory}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Impulsividade</p>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${insights.emotionalPatterns.impulsivityScore > 70 ? 'bg-rose-100 text-rose-600' :
                                    insights.emotionalPatterns.impulsivityScore > 40 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                                    }`}>
                                    {insights.emotionalPatterns.impulsivityScore}%
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                                "{insights.emotionalPatterns.description}"
                            </p>
                        </div>
                    </div>
                </div>

                {/* Balance Projection Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Projeção Inteligente</p>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Próximos 6 Meses</h3>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-900/20 px-3 py-1.5 rounded-full border border-sky-100 dark:border-sky-900/10">
                            <Zap size={12} />
                            Aprendizado Contínuo
                        </div>
                    </div>

                    <div className="flex-1 h-32 mt-2 min-h-[128px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={insights.projections}>
                                <defs>
                                    <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }}
                                    tickFormatter={(val) => {
                                        const d = new Date(val);
                                        return d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    labelFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                    formatter={(val: number) => [`R$ ${val.toLocaleString('pt-BR')}`, 'Saldo Projetado']}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#colorProj)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20 flex items-center gap-3">
                        <div className="p-1.5 bg-indigo-500 text-white rounded-lg shadow-sm">
                            <Info size={14} />
                        </div>
                        <p className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold leading-tight">
                            Com base no seu histórico, o saldo final projetado será de R$ {insights.projections[insights.projections.length - 1]?.amount?.toLocaleString('pt-BR') || 0}.
                        </p>
                    </div>
                </div>
            </div>

            {/* Decision Simulator Section */}
            <div className="bg-slate-900 dark:bg-slate-800/50 rounded-[32px] p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg">
                                <Zap size={18} />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-widest">Simulador de Decisões</h2>
                        </div>
                        <p className="text-slate-400 text-sm font-medium">O que acontece se você mudar hoje? A IA simulou os melhores caminhos.</p>
                    </div>
                    <button
                        onClick={onRefresh}
                        className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-2xl border border-white/10 transition-all active:scale-95"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest">Atualizar Simulação</span>
                        <Sparkles size={16} className="text-amber-400 group-hover:rotate-12 transition-transform" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    {insights.scenarios.map((scenario, idx) => (
                        <div key={idx} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all group/card">
                            <div className="flex justify-between items-start mb-6">
                                <span className="p-2 bg-sky-500/20 text-sky-400 rounded-xl group-hover/card:scale-110 transition-transform">
                                    <Brain size={20} />
                                </span>
                                {scenario.targetObjective && (
                                    <div className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                                        <ShieldCheck size={10} />
                                        Foco: {scenario.targetObjective}
                                    </div>
                                )}
                            </div>

                            <h4 className="text-lg font-black mb-3 leading-tight">{scenario.description}</h4>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                                        <CheckCircle2 size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Ação Sugerida</p>
                                        <p className="text-sm font-bold text-slate-200">{scenario.action}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/10">
                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Impacto Previsto</p>
                                    <p className="text-sm font-black text-white">{scenario.impact}</p>
                                </div>
                            </div>

                            <button className="w-full flex items-center justify-center gap-2 py-3 bg-sky-600 hover:bg-sky-500 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all group/btn active:scale-[0.98]">
                                Aplicar Recomendação
                                <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdvancedAIIntelligence;
