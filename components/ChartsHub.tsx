
import React, { useState, useMemo } from 'react';
import ChartContainer from './ChartContainer';
import {
    BarChart2,
    PieChart as PieChartIcon,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Percent,
    CreditCard,
    Wallet,
    Radar as RadarIcon,
    Activity,
    Zap,
    Brain,
    Target
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
    Area,
    ComposedChart,
    LabelList,
    Sector
} from 'recharts';
import { Transaction as TransactionType } from '../types';
import ChartTransactionModal from './ChartTransactionModal';

interface ChartsHubProps {
    transactions: Transaction[];
}

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

const ChartsHub: React.FC<ChartsHubProps> = ({ transactions }) => {
    const [expenseMode, setExpenseMode] = useState<'value' | 'percent'>('value');

    // Chart Interaction State
    const [selectedChartData, setSelectedChartData] = useState<{
        isOpen: boolean;
        title: string;
        transactions: TransactionType[];
        color: string;
    }>({
        isOpen: false,
        title: '',
        transactions: [],
        color: '#06b6d4'
    });

    const [activePieIndex, setActivePieIndex] = useState<Record<string, number | null>>({});

    // --- Data Processing & Logic ---

    // 1. Expense Structure Data (Fixed vs Installments vs One-off)
    const expenseStructureData = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const total = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

        const structure = {
            fixed: 0,
            installment: 0,
            one_time: 0
        };

        expenses.forEach(t => {
            const val = Number(t.amount);
            // Assuming recurrence field exists and is populated correctly
            // types: 'one_time' | 'fixed' | 'installment'
            const type = t.recurrence || 'one_time';
            if (structure[type] !== undefined) {
                structure[type] += val;
            } else {
                structure.one_time += val; // Fallback
            }
        });

        return [
            { name: 'Fixas', value: structure.fixed, color: '#06b6d4', share: total ? (structure.fixed / total) * 100 : 0 },
            { name: 'Parceladas', value: structure.installment, color: '#f43f5e', share: total ? (structure.installment / total) * 100 : 0 },
            { name: 'Variáveis/À Vista', value: structure.one_time, color: '#3b82f6', share: total ? (structure.one_time / total) * 100 : 0 }
        ].filter(item => item.value > 0);
    }, [transactions]);

    // 2. Pareto Analysis (80/20 Rule)
    const paretoData = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const categoryTotals: Record<string, number> = {};
        let totalExpense = 0;

        expenses.forEach(t => {
            const val = Number(t.amount);
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + val;
            totalExpense += val;
        });

        const sorted = Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        let cumulative = 0;
        return sorted.map(item => {
            cumulative += item.value;
            return {
                ...item,
                cumulativePercent: totalExpense > 0 ? Math.round((cumulative / totalExpense) * 100) : 0
            };
        }).slice(0, 10); // Top 10 categories
    }, [transactions]);

    // 3. Expenses by Category (Existing)
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
            .sort((a, b) => b.value - a.value);
    }, [transactions]);

    // 4. Payment Methods (Existing)
    const paymentMethodData = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const methodTotals: Record<string, number> = {};
        expenses.forEach(t => {
            const method = t.paymentMethod || 'Outros';
            methodTotals[method] = (methodTotals[method] || 0) + Number(t.amount);
        });
        return Object.entries(methodTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [transactions]);

    // 5. Daily Trend (Existing)
    const dailyTrendData = useMemo(() => {
        if (transactions.length === 0) return [];
        const dailyMap: Record<string, { day: string, income: number, expense: number, balance: number }> = {};

        // Initialize with numeric keys for sorting
        transactions.forEach(t => {
            const day = t.date.split('-')[2];
            if (!dailyMap[day]) dailyMap[day] = { day, income: 0, expense: 0, balance: 0 };
            const val = Number(t.amount);
            if (t.type === 'income') dailyMap[day].income += val;
            if (t.type === 'expense') dailyMap[day].expense += val;
        });

        // Calculate cumulative balance or just net? sticking to flow
        return Object.values(dailyMap).sort((a, b) => Number(a.day) - Number(b.day));
    }, [transactions]);

    // --- AI Insights Generation ---
    const aiInsight = useMemo(() => {
        if (transactions.length === 0) return { title: "Sem dados suficientes", text: "Lance suas transações para receber insights da IA.", sentiment: 'neutral' };

        const income = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);

        if (expense > income) {
            return {
                title: "Alerta de Déficit",
                text: `Seus gastos superaram seus ganhos em ${(expense - income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Foque no gráfico de Pareto para cortar as despesas de maior impacto.`,
                sentiment: 'negative'
            };
        }

        if (paretoData.length > 0 && paretoData[0].cumulativePercent > 30) {
            return {
                title: "Concentração de Gastos",
                text: `A categoria '${paretoData[0].name}' consome sozinha mais de 30% do seu orçamento. Tente renegociar ou otimizar essa área.`,
                sentiment: 'warning'
            };
        }

        return {
            title: "Saúde Financeira Estável",
            text: "Seus fluxos estão equilibrados. Ótimo momento para analisar o Radar Financeiro e buscar aumentar seus investimentos.",
            sentiment: 'positive'
        };

    }, [transactions, paretoData]);

    // --- Custom Tooltip ---
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xl text-xs z-50 animate-in zoom-in-95 duration-200">
                    <p className="font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">{label || payload[0].name}</p>
                    {payload.map((p: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.payload.fill || p.payload.color }}></div>
                            <span className="font-bold text-slate-500 dark:text-slate-400 capitalize">{p.name}:</span>
                            <span className="font-black text-slate-800 dark:text-white ml-auto">
                                {p.dataKey === 'percent' || p.dataKey === 'cumulativePercent' || p.name === 'A'
                                    ? `${Number(p.value).toFixed(1)}%`
                                    : `R$ ${Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </span>
                        </div>
                    ))}
                    <p className="text-[8px] font-black text-sky-500 mt-2 uppercase tracking-tighter">Clique para ver detalhes</p>
                </div>
            );
        }
        return null;
    };

    const renderActiveShape = (props: any) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
        return (
            <g>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + 8}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                    className="filter drop-shadow-md transition-all duration-300"
                />
            </g>
        );
    };

    const handleChartClick = (data: any, titlePrefix: string, filterFn: (t: TransactionType) => boolean, color: string) => {
        const filtered = transactions.filter(filterFn);
        setSelectedChartData({
            isOpen: true,
            title: `${titlePrefix}: ${data.name}`,
            transactions: filtered,
            color
        });
    };

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-full">
                    <BarChart2 size={48} className="text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Sem dados para análise</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md">Comece a lançar suas receitas e despesas para gerar gráficos inteligentes sobre sua vida financeira.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-32 animate-in fade-in duration-500">
            {/* Header with AI Insight */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
                                <Brain size={24} className="text-indigo-300" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">Análise Inteligente</h2>
                        </div>
                        <p className="text-indigo-200 font-medium text-sm max-w-xl leading-relaxed">
                            {aiInsight.text}
                        </p>
                    </div>
                    <div className={`px-6 py-3 rounded-2xl backdrop-blur-md border flex items-center gap-3 shadow-lg ${aiInsight.sentiment === 'negative' ? 'bg-rose-500/20 border-rose-500/30 text-rose-200' :
                        aiInsight.sentiment === 'warning' ? 'bg-amber-500/20 border-amber-500/30 text-amber-200' :
                            'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
                        }`}>
                        {aiInsight.sentiment === 'negative' ? <TrendingDown size={24} /> :
                            aiInsight.sentiment === 'warning' ? <Activity size={24} /> : <Zap size={24} />}
                        <div className="text-left">
                            <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">Status</p>
                            <p className="font-black text-sm">{aiInsight.title}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Expense Structure (Donut) - NEW */}
                <ChartContainer
                    title={
                        <span className="flex items-center gap-2">
                            <PieChartIcon size={18} className="text-fuchsia-500" /> Estrutura de Gastos
                        </span>
                    }
                >
                    <div className="h-[350px] w-full flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={expenseStructureData}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                    activeIndex={activePieIndex['structure'] !== null ? activePieIndex['structure'] : undefined}
                                    activeShape={renderActiveShape}
                                    onMouseEnter={(_, index) => setActivePieIndex({ ...activePieIndex, structure: index })}
                                    onMouseLeave={() => setActivePieIndex({ ...activePieIndex, structure: null })}
                                    onClick={(data) => handleChartClick(
                                        data,
                                        'Estrutura',
                                        (t) => (t.recurrence || 'one_time') === (data.name === 'Fixas' ? 'fixed' : data.name === 'Parceladas' ? 'installment' : 'one_time') && t.type === 'expense',
                                        data.color
                                    )}
                                    className="cursor-pointer"
                                    label={({ x, y, cx, percent }) => (
                                        <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-slate-900 dark:text-white" style={{ fontSize: '9px', fontWeight: '900' }}>
                                            {`${(percent * 100).toFixed(0)}%`}
                                        </text>
                                    )}
                                    labelLine={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '3 3' }}
                                >
                                    {expenseStructureData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity outline-none" />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    iconSize={10}
                                    formatter={(value, entry: any) => (
                                        <span className="text-slate-600 dark:text-slate-300 font-bold ml-1 text-xs">
                                            {value}
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-6 text-center pointer-events-none">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Total</p>
                            <p className="text-sm font-black text-slate-800 dark:text-white">
                                {expenseStructureData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                    </div>
                </ChartContainer>

                {/* 2. Pareto Chart (80/20 Rule) - NEW */}
                <ChartContainer
                    title={
                        <span className="flex items-center gap-2">
                            <Target size={18} className="text-indigo-500" /> Análise de Pareto (80/20)
                        </span>
                    }
                >
                    <div className="h-[350px] w-full overflow-x-auto scrollbar-hide">
                        <div className="h-full min-w-[600px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={paretoData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                                    <CartesianGrid stroke="#f1f5f9" vertical={false} strokeDasharray="3 3" />
                                    <XAxis dataKey="name" scale="band" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" orientation="left" stroke="#94a3b8" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val / 1000}k`} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Bar
                                        yAxisId="left"
                                        dataKey="value"
                                        name="Valor Gasto"
                                        barSize={30}
                                        fill="#6366f1"
                                        radius={[4, 4, 0, 0]}
                                        className="cursor-pointer"
                                        onClick={(data) => handleChartClick(
                                            data,
                                            'Pareto',
                                            (t) => t.category === data.name && t.type === 'expense',
                                            '#6366f1'
                                        )}
                                    >
                                        <LabelList dataKey="value" position="top" formatter={(val: number) => `R$${(val / 1000).toFixed(1)}k`} style={{ fill: 'currentColor', fontSize: '9px', fontWeight: '900' }} className="text-slate-900 dark:text-white" />
                                    </Bar>
                                    <Line yAxisId="right" type="monotone" dataKey="cumulativePercent" name="% Acumulado" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </ChartContainer>
            </div>

            {/* 3. Expenses by Category (Existing Refined) */}
            <ChartContainer
                title={
                    <span className="flex items-center gap-2">
                        <PieChartIcon size={18} className="text-rose-400" /> Detalhe por Categoria
                    </span>
                }
                headerAction={
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setExpenseMode('value')}
                            className={`p-1.5 px-3 rounded-lg transition-all text-xs font-bold ${expenseMode === 'value' ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-400'}`}
                        >
                            R$
                        </button>
                        <button
                            onClick={() => setExpenseMode('percent')}
                            className={`p-1.5 px-3 rounded-lg transition-all text-xs font-bold ${expenseMode === 'percent' ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-400'}`}
                        >
                            %
                        </button>
                    </div>
                }
            >
                <div className="h-[400px] w-full overflow-x-auto scrollbar-hide">
                    <div className="h-full min-w-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={expenseByCategoryData} layout="vertical" margin={{ left: 10, right: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={120}
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey={expenseMode === 'value' ? 'value' : 'percent'}
                                    name={expenseMode === 'value' ? 'Valor' : 'Percentual'}
                                    radius={[0, 6, 6, 0]}
                                    barSize={24}
                                    className="cursor-pointer"
                                    onClick={(data, index) => handleChartClick(
                                        data,
                                        'Categoria',
                                        (t) => t.category === data.name && t.type === 'expense',
                                        COLORS[index % COLORS.length]
                                    )}
                                >
                                    {expenseByCategoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />
                                    ))}
                                    <LabelList
                                        dataKey={expenseMode === 'value' ? 'value' : 'percent'}
                                        position="right"
                                        formatter={(val: number) => expenseMode === 'value' ? `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : `${val.toFixed(1)}%`}
                                        style={{ fill: 'currentColor', fontSize: '10px', fontWeight: '900' }}
                                        className="text-slate-900 dark:text-white"
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </ChartContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 4. Payment Methods */}
                <ChartContainer
                    title={
                        <span className="flex items-center gap-2">
                            <CreditCard size={18} className="text-emerald-400" /> Meios de Pagamento
                        </span>
                    }
                >
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentMethodData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                    activeIndex={activePieIndex['payment'] !== null ? activePieIndex['payment'] : undefined}
                                    activeShape={renderActiveShape}
                                    onMouseEnter={(_, index) => setActivePieIndex({ ...activePieIndex, payment: index })}
                                    onMouseLeave={() => setActivePieIndex({ ...activePieIndex, payment: null })}
                                    onClick={(data, index) => handleChartClick(
                                        data,
                                        'Pagamento',
                                        (t) => (t.paymentMethod || 'Outros') === data.name && t.type === 'expense',
                                        COLORS[index % COLORS.length]
                                    )}
                                    className="cursor-pointer"
                                    label={({ x, y, cx, percent }) => (
                                        <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-slate-900 dark:text-white" style={{ fontSize: '9px', fontWeight: '900' }}>
                                            {`${(percent * 100).toFixed(0)}%`}
                                        </text>
                                    )}
                                    labelLine={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '3 3' }}
                                >
                                    {paymentMethodData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pr-32 md:pr-32">
                            <Wallet className="text-slate-300 dark:text-slate-600 mx-auto mb-1" size={24} />
                        </div>
                    </div>
                </ChartContainer>

                {/* 5. Daily Flow */}
                <ChartContainer
                    title={
                        <span className="flex items-center gap-2">
                            <TrendingUp size={18} className="text-sky-400" /> Fluxo Diário (Mês)
                        </span>
                    }
                >
                    <div className="h-[300px] w-full overflow-x-auto scrollbar-hide">
                        <div className="h-full min-w-[500px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} interval={2} />
                                    <YAxis hide />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="income" name="Receitas" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                                    <Area type="monotone" dataKey="expense" name="Despesas" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </ChartContainer>
            </div>

            {/* Chart Detail Modal */}
            <ChartTransactionModal
                isOpen={selectedChartData.isOpen}
                onClose={() => setSelectedChartData({ ...selectedChartData, isOpen: false })}
                title={selectedChartData.title}
                transactions={selectedChartData.transactions}
                color={selectedChartData.color}
            />

        </div>
    );
};

export default ChartsHub;
