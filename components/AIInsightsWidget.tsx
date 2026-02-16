
import React, { useMemo } from 'react';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import { Transaction, Budget } from '../types';

interface AIInsightsWidgetProps {
    transactions: Transaction[];
    budgets: Budget[];
}

const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({ transactions, budgets }) => {
    // Local "AI" Logic
    const insights = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // 1. Filter Current Month Data
        const currentMonthTxs = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const income = currentMonthTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = currentMonthTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        const balance = income - expense;
        const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

        // 2. Category Analysis
        const categoryMap: { [key: string]: number } = {};
        currentMonthTxs.filter(t => t.type === 'expense').forEach(t => {
            categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
        });
        const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
        const topCategory = sortedCategories[0];

        // 3. Determine Status & Mood
        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        let moodMessage = "Suas finanças estão no caminho certo!";
        let tip = "Continue mantendo o controle.";

        if (expense > income) {
            status = 'critical';
            moodMessage = "Cuidado! Seus gastos superaram seus ganhos este mês.";
            tip = "Revise gastos não essenciais e tente cortar desperdícios imediatamente.";
        } else if (savingsRate < 10) {
            status = 'warning';
            moodMessage = "Você está poupando pouco este mês.";
            tip = "Tente aplicar a regra 50/30/20 para garantir pelo menos 20% de economia.";
        } else if (savingsRate > 30) {
            status = 'healthy';
            moodMessage = "Excelente! Você está poupando muito bem.";
            tip = "Considere investir esse excedente em ativos de renda passiva.";
        }

        // 4. Specific Insight
        let detailAnalysis = "";
        if (topCategory) {
            const catPercent = (topCategory[1] / expense) * 100;
            if (catPercent > 40) {
                detailAnalysis = `Notei que ${topCategory[1].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} foram apenas em '${topCategory[0]}'. Isso representa ${catPercent.toFixed(0)}% de tudo que você gastou.`;
            } else {
                detailAnalysis = `Sua maior despesa é com '${topCategory[0]}', mas parece equilibrada em relação ao total.`;
            }
        } else {
            detailAnalysis = "Ainda não há dados suficientes para uma análise detalhada de categorias.";
        }

        return {
            status,
            moodMessage,
            tip,
            detailAnalysis,
            savingsRate
        };
    }, [transactions]);

    return (
        <div className="h-full flex flex-col justify-between relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                    <Sparkles size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">AI Insights</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Análise Inteligente</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col gap-4">
                {/* Status Card */}
                <div className={`p-4 rounded-2xl border ${insights.status === 'healthy' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' :
                        insights.status === 'warning' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30' :
                            'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30'
                    }`}>
                    <div className="flex items-start gap-3">
                        {insights.status === 'healthy' && <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={18} />}
                        {insights.status === 'warning' && <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />}
                        {insights.status === 'critical' && <TrendingDown className="text-rose-500 shrink-0 mt-0.5" size={18} />}

                        <div>
                            <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${insights.status === 'healthy' ? 'text-emerald-700 dark:text-emerald-400' :
                                    insights.status === 'warning' ? 'text-amber-700 dark:text-amber-400' :
                                        'text-rose-700 dark:text-rose-400'
                                }`}>
                                {insights.moodMessage}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {insights.detailAnalysis}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tip Section */}
                <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/20">
                    <Lightbulb size={16} className="text-indigo-500 mt-1 shrink-0" />
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Dica da IA</p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            "{insights.tip}"
                        </p>
                    </div>
                </div>
            </div>

            {/* Background Decor */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
        </div>
    );
};

export default AIInsightsWidget;
