import React, { useState, useEffect, useMemo } from 'react';
import { BudgetWithSpending, Transaction, Budget } from '../types';
import { CATEGORIES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, Wallet } from 'lucide-react';

interface BudgetManagerProps {
    transactions: Transaction[];
    budgets: Budget[];
    onUpdateBudget: (id: string, updates: Partial<Budget>) => void;
    onAddBudget: (budget: Partial<Budget>) => void;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ transactions, budgets: persistedBudgets, onUpdateBudget, onAddBudget }) => {
    const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
    const [currentMonth] = useState(new Date().toISOString().slice(0, 7));
    const [monthlyIncome, setMonthlyIncome] = useState(0);

    useEffect(() => {
        // Filter transactions for current month
        const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));

        // Calculate Total Income
        const income = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        setMonthlyIncome(income);

        // Calculate Spending by Category
        const spendingByCategory: Record<string, number> = {};
        CATEGORIES.forEach(cat => {
            spendingByCategory[cat] = monthTransactions
                .filter(t => t.type === 'expense' && t.category === cat)
                .reduce((sum, t) => sum + t.amount, 0);
        });

        // Initialize or Update Budgets
        // Using persisted budgets from props or defaulting
        setBudgets(prev => {
            return CATEGORIES.map(category => {
                const persisted = persistedBudgets.find(b => b.category === category && (!b.month || b.month === currentMonth));
                const spent = spendingByCategory[category] || 0;

                // If persisted exists, use its amount. Else default relative to income or base.
                const amount = persisted ? persisted.amount : (income > 0 ? income * 0.1 : 500);

                return {
                    id: persisted?.id, // Keep ID for updates
                    category,
                    amount,
                    spent,
                    percentage: amount > 0 ? (spent / amount) * 100 : 0,
                    month: currentMonth
                };
            });
        });
    }, [transactions, currentMonth, persistedBudgets]);

    const handleBudgetChange = (category: string, newAmountStr: string) => {
        const newAmount = parseFloat(newAmountStr);
        if (!isNaN(newAmount) && newAmount >= 0) {
            // Update Local
            setBudgets(prev => prev.map(b =>
                b.category === category
                    ? { ...b, amount: newAmount, percentage: newAmount > 0 ? (b.spent / newAmount) * 100 : 0 }
                    : b
            ));

            const b = budgets.find(b => b.category === category);
            if (b?.id) {
                onUpdateBudget(b.id, { amount: newAmount });
            } else {
                onAddBudget({
                    category,
                    amount: newAmount,
                    month: currentMonth
                });
            }
        }
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            'Alimentação': '🍽️',
            'Transporte': '🚗',
            'Lazer': '🎮',
            'Saúde': '💊',
            'Educação': '📚',
            'Moradia': '🏠',
            'Investimentos': '📈',
            'Outros': '📦'
        };
        return icons[category] || '💰';
    };

    const getSliderMax = () => {
        return monthlyIncome > 0 ? monthlyIncome : 5000;
    };

    // Calculate Totals for Summary
    const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
    const projectedBalance = monthlyIncome - totalBudgeted;
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

    // AI Insight Generator
    const aiInsight = useMemo(() => {
        if (monthlyIncome === 0) return "Defina suas receitas para receber análises precisas.";

        const budgetRatio = totalBudgeted / monthlyIncome;
        const balanceRatio = projectedBalance / monthlyIncome;

        if (projectedBalance < 0) {
            return "⚠️ Atenção Crítica: Seu orçamento planejado excede sua receita mensal! Isso levará a dívidas. Reduza os limites de gastos em categorias não essenciais imediatamente.";
        } else if (balanceRatio < 0.1) {
            return "⚠️ Alerta de Risco: Sua margem de segurança é muito baixa (menos de 10%). Tente reduzir gastos variáveis para criar uma reserva de emergência mais robusta.";
        } else if (balanceRatio >= 0.2) {
            return "✅ Excelente Saúde Financeira: Você está orçando com uma margem de mais de 20% para investimentos e poupança. Considere alocar esse saldo excedente em metas de longo prazo.";
        } else {
            return "ℹ️ Orçamento Equilibrado: Seus gastos planejados estão dentro da receita, mas há pouco espaço para imprevistos. Monitore seus gastos de perto.";
        }
    }, [monthlyIncome, totalBudgeted, projectedBalance]);

    // Chart Data Preparation
    const chartData = budgets.map(b => ({
        name: b.category,
        Orçado: b.amount,
        Realizado: b.spent,
        variance: b.amount - b.spent
    }));

    // Custom Label for Chart
    // Custom Tooltip for Chart
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl shadow-xl text-xs">
                    <p className="font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest">{label}</p>
                    {payload.map((p: any, index: number) => (
                        <p key={index} style={{ color: p.fill }} className="flex items-center gap-2 font-bold">
                            {p.name}: <span className="font-black text-slate-600 dark:text-slate-300">
                                R$ {Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderCustomBarLabel = (props: any) => {
        const { x, y, width, value, index } = props;
        const item = chartData[index];
        const isPositive = item.variance >= 0;
        const percentageDiff = item.Orçado > 0 ? ((item.Realizado - item.Orçado) / item.Orçado) * 100 : 0;

        return (
            <text
                x={x + width / 2}
                y={y - 10}
                fill={isPositive ? "#10b981" : "#ef4444"}
                textAnchor="middle"
                fontSize={10}
                fontWeight="bold"
            >
                {percentageDiff !== 0 ? `${percentageDiff > 0 ? '+' : ''}${percentageDiff.toFixed(0)}%` : ''}
            </text>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Title */}
            <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Painel de Orçamento</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Planejamento estratégico baseado na sua receita real.</p>
            </div>

            {/* Summary Cards */}
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/20 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet size={48} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Receita Total</p>
                    <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300">
                        R$ {monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="bg-sky-50 dark:bg-sky-900/10 p-6 rounded-[2rem] border border-sky-100 dark:border-sky-900/20 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={48} className="text-sky-600 dark:text-sky-400" />
                    </div>
                    <p className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-2">Total Orçado</p>
                    <p className="text-2xl font-black text-sky-800 dark:text-sky-300">
                        R$ {totalBudgeted.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs font-bold text-sky-400 dark:text-sky-500 mt-1">
                        {(monthlyIncome > 0 ? (totalBudgeted / monthlyIncome) * 100 : 0).toFixed(1)}% da Receita
                    </p>
                </div>

                <div className={`p-6 rounded-[2rem] border flex flex-col justify-between relative overflow-hidden group transition-colors duration-500 ${projectedBalance < 0 ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20' : 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20'
                    }`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        {projectedBalance < 0 ? <AlertTriangle size={48} className="text-rose-600 dark:text-rose-400" /> : <Sparkles size={48} className="text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${projectedBalance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        Saldo Projetado
                    </p>
                    <p className={`text-2xl font-black ${projectedBalance < 0 ? 'text-rose-800 dark:text-rose-300' : 'text-indigo-800 dark:text-indigo-300'}`}>
                        R$ {projectedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className={`text-xs font-bold mt-1 ${projectedBalance < 0 ? 'text-rose-400 dark:text-rose-500 text-xs' : 'text-indigo-400 dark:text-indigo-500'}`}>
                        {projectedBalance < 0 ? '⚠️ Orçamento Estourado' : 'Disponível para Metas'}
                    </p>
                </div>
            </div>

            {/* AI Insight Section */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-start gap-4 relative z-10">
                    <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
                        <Sparkles size={24} className="text-sky-300" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sky-300 text-sm uppercase tracking-wider mb-2">FinAI Insights</h4>
                        <p className="text-slate-200 font-medium leading-relaxed">
                            "{aiInsight}"
                        </p>
                    </div>
                </div>
            </div>

            {/* Comparative Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="mb-6 px-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Comparativo: Planejado vs. Real</h3>
                </div>
                <div className="h-64 w-full overflow-x-auto pb-4">
                    <div className="h-full min-w-[600px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(value) => `R$${value / 1000}k`} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="Orçado" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Meta Orçamentária" />
                                <Bar dataKey="Realizado" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Gasto Realizado">
                                    <LabelList dataKey="Realizado" content={renderCustomBarLabel} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Existing Budget Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {budgets.map((budget) => {
                    const sliderMax = getSliderMax();
                    const spendingWidth = Math.min((budget.spent / sliderMax) * 100, 100);
                    const budgetLeft = Math.min((budget.amount / sliderMax) * 100, 100);
                    const isOverBudget = budget.spent > budget.amount;

                    return (
                        <div key={budget.category} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">

                            {/* Header */}
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">{getCategoryIcon(budget.category)}</span>
                                    <div>
                                        <h4 className="font-black text-slate-800 dark:text-white text-lg">{budget.category}</h4>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">
                                            Meta: <span className="text-sky-600 dark:text-sky-400">R$ {budget.amount.toLocaleString('pt-BR')}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Gasto</p>
                                    <p className={`text-xl font-black ${isOverBudget ? 'text-rose-500 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                        R$ {budget.spent.toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </div>

                            {/* Interactive Slider Area */}
                            <div className="relative h-12 flex items-center mb-2">
                                {/* Track Background (represents 0 to 100% of Income) */}
                                <div className="absolute w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    {/* Spending Bar (Fill) */}
                                    <div
                                        className={`h-full transition-all duration-500 ${isOverBudget ? 'bg-rose-400 dark:bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                        style={{ width: `${spendingWidth}%` }}
                                    ></div>
                                </div>

                                {/* The Invisible Range Input */}
                                <input
                                    type="range"
                                    min="0"
                                    max={sliderMax}
                                    step="10"
                                    value={budget.amount}
                                    onChange={(e) => handleBudgetChange(budget.category, e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                                    title={`Definir meta para ${budget.category}`}
                                />

                                {/* The "Stylish Dash" Visual Indicator for the Budget Goal */}
                                <div
                                    className="absolute h-8 w-1.5 bg-black dark:bg-white rounded-full shadow-xl pointer-events-none transition-all duration-75 z-10"
                                    style={{
                                        left: `calc(${budgetLeft}% - 3px)`, /* Center the 1.5 w dash */
                                    }}
                                >
                                    {/* Tooltip above dash */}
                                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                        {(budget.amount / sliderMax * 100).toFixed(1)}%
                                    </div>
                                </div>
                            </div>

                            {/* Footer Info */}
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                <span>0%</span>
                                <span>{isOverBudget ? '⚠️ Orçamento Estourado' : 'Dentro da Meta'}</span>
                                <span>100% Rec.</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div >
    );
};

export default BudgetManager;
