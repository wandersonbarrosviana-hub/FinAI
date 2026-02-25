
import React, { useState, useEffect, useMemo } from 'react';
import {
    Trophy, TrendingUp, Shield, Brain, Users, ChevronRight,
    Award, Target, Layout, Activity, Star, Info, HelpCircle
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import {
    Transaction, Account, Budget, Debt, FinancialScore,
    RankingEntry, QuizResponse
} from '../types';
import { calculateFinancialScore, saveFinancialScore, getGlobalRanking } from '../scoreService';
import FinancialQuiz from './FinancialQuiz';

interface FinancialAssessmentProps {
    userId: string;
    transactions: Transaction[];
    accounts: Account[];
    budgets: Budget[];
    debts: Debt[];
}

const FinancialAssessment: React.FC<FinancialAssessmentProps> = ({
    userId, transactions, accounts, budgets, debts
}) => {
    const [scoreData, setScoreData] = useState<Partial<FinancialScore> | null>(null);
    const [ranking, setRanking] = useState<RankingEntry[]>([]);
    const [showQuiz, setShowQuiz] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const currentMonth = new Date().toISOString().slice(0, 7);

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // 1. Tentar carregar score existente do banco
            const { data: existingScore } = await supabase
                .from('financial_scores')
                .select('*')
                .eq('user_id', userId)
                .eq('month', currentMonth)
                .single();

            if (existingScore) {
                setScoreData(existingScore);
            } else {
                // Calcular score inicial se não existir
                const newScore = await calculateFinancialScore(userId, transactions, accounts, budgets, debts);
                setScoreData(newScore);
                await saveFinancialScore(newScore);
            }

            // 2. Carregar Ranking
            const rankData = await getGlobalRanking(currentMonth);
            setRanking(rankData);

        } catch (error) {
            console.error('Erro ao carregar avaliação:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCalculate = async () => {
        setIsLoading(true);
        try {
            const newScore = await calculateFinancialScore(userId, transactions, accounts, budgets, debts);
            setScoreData(newScore);
            await saveFinancialScore(newScore);

            // Atualizar Ranking também
            const rankData = await getGlobalRanking(currentMonth);
            setRanking(rankData);
        } catch (error) {
            console.error('Erro ao calcular score:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const scoreLevel = useMemo(() => {
        const s = scoreData?.total_score || 0;
        if (s <= 300) return { label: 'Zona de Risco', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' };
        if (s <= 500) return { label: 'Em Organização', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' };
        if (s <= 700) return { label: 'Financeiramente Estável', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
        if (s <= 850) return { label: 'Estrategista Financeiro', color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' };
        return { label: 'Alta Maturidade Financeira', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' };
    }, [scoreData]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Avaliação Financeira</h2>
                    <p className="text-sm text-slate-500 font-medium">Sua maturidade baseada em comportamento, não em riqueza.</p>
                </div>
                <button
                    onClick={() => setShowQuiz(true)}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-3 active:scale-95 group"
                >
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600">
                        <Brain size={20} />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-black uppercase text-slate-400">Questionário</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600">Psicologia Financeira</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 ml-2" />
                </button>
            </div>

            {/* Main Score Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative mb-6">
                        {/* Circular Progress */}
                        <svg className="w-48 h-48 transform -rotate-90">
                            <circle
                                cx="96" cy="96" r="88"
                                stroke="currentColor" strokeWidth="12" fill="transparent"
                                className="text-slate-50 dark:text-slate-800 shadow-inner"
                            />
                            <circle
                                cx="96" cy="96" r="88"
                                stroke="currentColor" strokeWidth="12" fill="transparent"
                                strokeDasharray={552.9}
                                strokeDashoffset={552.9 - (552.9 * (scoreData?.total_score || 0)) / 1000}
                                className="text-sky-600 transition-all duration-1000 ease-out"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {scoreData?.total_score || 0}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PTS</span>
                        </div>
                    </div>

                    <div className={`px-4 py-1.5 rounded-full ${scoreLevel.bg} ${scoreLevel.color} text-[10px] font-black uppercase tracking-widest border ${scoreLevel.border} mb-2`}>
                        {scoreLevel.label}
                    </div>
                    <p className="text-xs text-slate-500 font-medium max-w-[200px]">
                        Você está no topo <span className="font-bold text-sky-600">22%</span> dos usuários estrategistas.
                    </p>
                </div>

                {/* Dimensions breakdown */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { title: 'Estrutura', icon: Layout, score: scoreData?.structure_score, max: 250, color: 'sky', info: 'Mede organização e frequência de registros, categorização correta e aderência ao orçamento definido.' },
                        { title: 'Estabilidade', icon: Shield, score: scoreData?.stability_score, max: 300, color: 'emerald', info: 'Avalia sua segurança financeira através da reserva de emergência (meses de cobertura) e nível de endividamento.' },
                        { title: 'Comportamento', icon: TrendingUp, score: scoreData?.behavior_score, max: 250, color: 'purple', info: 'Analisa sua capacidade de poupança mensal (sobra real) e a evolução dos seus gastos em relação à renda.' },
                        { title: 'Psicologia', icon: Brain, score: scoreData?.psychology_score, max: 200, color: 'amber', info: 'Baseado na sua autopercepção mensal sobre segurança, controle e ansiedade financeira coletada no Quiz.' },
                    ].map((dim) => (
                        <div key={dim.title} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm group relative">
                            {/* Tooltip Icon */}
                            <div className="absolute top-4 right-4 group/tooltip z-10">
                                <HelpCircle size={14} className="text-slate-300 hover:text-sky-500 cursor-help transition-colors" />
                                <div className="absolute right-0 bottom-full mb-2 w-48 p-3 bg-slate-900 text-white text-[10px] rounded-2xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all shadow-2xl border border-white/10 translate-y-2 group-hover/tooltip:translate-y-0">
                                    <p className="font-bold mb-1 uppercase tracking-widest text-sky-400">O que é?</p>
                                    {dim.info}
                                </div>
                            </div>

                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2.5 rounded-2xl bg-${dim.color}-50 dark:bg-${dim.color}-900/10 text-${dim.color}-600`}>
                                    <dim.icon size={20} />
                                </div>
                                <div className="text-right pr-6">
                                    <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{dim.score}<span className="text-[10px] text-slate-400 ml-1">/ {dim.max}</span></p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{dim.title}</p>
                                </div>
                            </div>
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-${dim.color}-500 transition-all duration-1000 relative overflow-hidden glow-${dim.color}`}
                                    style={{ width: `${(dim.score! / dim.max) * 100}%` }}
                                >
                                    <div className="absolute inset-0 animate-wave"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Guia de Níveis */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl">
                        <Info size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Entenda os Níveis</h3>
                        <p className="text-sm text-slate-500 font-medium">O que seu score diz sobre sua maturidade financeira</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {[
                        { range: '0 - 300', level: 'Zona de Risco', color: 'rose', desc: 'Situação crítica. Gastos superam ganhos e não há reservas.' },
                        { range: '301 - 500', level: 'Instabilidade', color: 'amber', desc: 'Equilíbrio frágil. Qualquer imprevisto pode causar dívidas.' },
                        { range: '501 - 700', level: 'Em Evolução', color: 'emerald', desc: 'Organização em dia e começando a criar hábitos saudáveis.' },
                        { range: '701 - 850', level: 'Maturidade', color: 'sky', desc: 'Controle total, reserva formada e planejamento ativo.' },
                        { range: '851 - 1000', level: 'Excelência', color: 'indigo', desc: 'Maturidade máxima. Patrimônio trabalhando para você.' }
                    ].map((lv) => (
                        <div key={lv.level} className="flex flex-col group">
                            <div className="flex flex-col gap-2 mb-3">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg bg-${lv.color}-50 text-${lv.color}-600 uppercase tracking-widest w-fit`}>
                                    {lv.range}
                                </span>
                                <span className={`text-sm font-black text-${lv.color}-600 uppercase`}>
                                    {lv.level}
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                                {lv.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Global Ranking */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Ranking Global</h3>
                        <p className="text-xs text-slate-500 font-medium">Comunidade FinAI: Maturidade em destaque.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        <Users size={14} />
                        Total: {ranking.length}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                            <tr>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Posição</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Membro</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Nível</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Maturidade</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {ranking.map((entry, index) => (
                                <tr key={entry.user_id} className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${entry.user_id === userId ? 'bg-sky-50/30' : ''}`}>
                                    <td className="px-8 py-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${index === 0 ? 'bg-amber-100 text-amber-600' :
                                            index === 1 ? 'bg-slate-200 text-slate-600' :
                                                index === 2 ? 'bg-orange-100 text-orange-600' :
                                                    'text-slate-400'
                                            }`}>
                                            {index + 1}º
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={entry.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.name)}&background=random`}
                                                className="w-8 h-8 rounded-full border border-white shadow-sm"
                                                alt={entry.name}
                                            />
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{entry.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            {entry.total_score > 850 ? 'Alta Maturidade' : 'Estrategista'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <span className="text-sm font-black text-sky-600">{entry.total_score} pts</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quiz Modal */}
            {showQuiz && (
                <FinancialQuiz
                    userId={userId}
                    onClose={() => setShowQuiz(false)}
                    onComplete={loadData}
                />
            )}
        </div>
    );
};

export default FinancialAssessment;
