
import React, { useState, useMemo } from 'react';
import {
    BarChart2,
    PieChart as PieChartIcon,
    TrendingUp,
    DollarSign,
    Percent,
    CreditCard,
    Wallet
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend,
    AreaChart,
    Area
} from 'recharts';
import { Transaction } from '../types';

interface ChartsHubProps {
    transactions: Transaction[];
}

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

const ChartsHub: React.FC<ChartsHubProps> = ({ transactions }) => {
    const [expenseMode, setExpenseMode] = useState<'value' | 'percent'>('value');

    // --- Data Processing ---

    // 1. Expenses by Category
    const expenseByCategoryData = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

        const categoryTotals: Record<string, number> = {};
        expenses.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
        });

        return Object.entries(categoryTotals)
            .map(([name, value]) => ({
                name,
                value,
                percent: totalExpenses ? (value / totalExpenses) * 100 : 0
            }))
            .sort((a, b) => b.value - a.value); // Sort descending
    }, [transactions]);

    // 2. Payment Methods (Pie)
    const paymentMethodData = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense'); // Usually payment methods are relevant for spending
        const methodTotals: Record<string, number> = {};

        expenses.forEach(t => {
            const method = t.paymentMethod || 'Outros';
            methodTotals[method] = (methodTotals[method] || 0) + Number(t.amount);
        });

        return Object.entries(methodTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [transactions]);

    // 3. Monthly Trend (Income vs Expense) - Current Month Daily View
    // Since we receive 'transactions' filtered by month, this shows daily evolution within the month
    const dailyTrendData = useMemo(() => {
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(); // Approximate default, better to use tx dates
        // Actually, get range from transactions
        if (transactions.length === 0) return [];

        const dailyMap: Record<string, { day: string, income: number, expense: number }> = {};

        transactions.forEach(t => {
            const day = t.date.split('-')[2]; // Extract DD
            if (!dailyMap[day]) dailyMap[day] = { day, income: 0, expense: 0 };

            if (t.type === 'income') dailyMap[day].income += Number(t.amount);
            if (t.type === 'expense') dailyMap[day].expense += Number(t.amount);
        });

        return Object.values(dailyMap).sort((a, b) => Number(a.day) - Number(b.day));
    }, [transactions]);


    // --- Custom Tooltips ---
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs">
                    <p className="font-bold text-slate-100 mb-1">{label}</p>
                    {payload.map((p: any, index: number) => (
                        <p key={index} style={{ color: p.color }} className="flex items-center gap-1">
                            {p.name}: <span className="font-mono font-bold">
                                {p.dataKey === 'percent'
                                    ? `${Number(p.value).toFixed(1)}%`
                                    : `R$ ${Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 pb-24">
            {/* Header */}
            <div className="flex flex-col items-center justify-center space-y-2 sticky top-0 bg-slate-950/80 backdrop-blur-md z-10 py-4 -mx-4 px-4 border-b border-slate-800">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <BarChart2 className="text-cyan-400" />
                    Central de Gráficos
                </h2>
            </div>

            {/* Chart 1: Expenses by Category */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 relative">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2">
                        <PieChartIcon size={18} className="text-rose-400" /> Despesas por Categoria
                    </h3>

                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                            onClick={() => setExpenseMode('value')}
                            className={`p-2 rounded-lg transition-all ${expenseMode === 'value' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            title="Ver em R$"
                        >
                            <DollarSign size={16} />
                        </button>
                        <button
                            onClick={() => setExpenseMode('percent')}
                            className={`p-2 rounded-lg transition-all ${expenseMode === 'percent' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            title="Ver em %"
                        >
                            <Percent size={16} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="h-[300px] w-[600px] sm:w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={expenseByCategoryData} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey={expenseMode === 'value' ? 'value' : 'percent'}
                                    name={expenseMode === 'value' ? 'Valor' : 'Percentual'}
                                    radius={[0, 4, 4, 0]}
                                    barSize={20}
                                >
                                    {expenseByCategoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>

            {/* Chart 2: Payment Methods (Pie) */ }
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                        <h3 className="font-bold text-slate-200 flex items-center gap-2 mb-6">
                            <CreditCard size={18} className="text-emerald-400" /> Métodos de Pagamento
                        </h3>
                        <div className="h-[250px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={paymentMethodData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {paymentMethodData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        layout="vertical"
                                        verticalAlign="middle"
                                        align="right"
                                        iconType="circle"
                                        iconSize={8}
                                        wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pr-24 md:pr-24">
                                {/* Padding adjustment for legend */}
                                <div className="text-xs text-slate-500 font-bold">Total</div>
                            </div>
                        </div>
                    </div>

                    {/* Chart 3: Income vs Expense Trend */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                        <h3 className="font-bold text-slate-200 flex items-center gap-2 mb-6">
                            <TrendingUp size={18} className="text-sky-400" /> Fluxo Diário
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyTrendData}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="income"
                                        name="Receitas"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorIncome)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="expense"
                                        name="Despesas"
                                        stroke="#f43f5e"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorExpense)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800 text-center">
                    <p className="text-xs text-slate-500 italic">
                        * Os gráficos mostram dados do mês selecionado no topo da tela.
                    </p>
                </div>
            </div >
            );
};

export default ChartsHub;
