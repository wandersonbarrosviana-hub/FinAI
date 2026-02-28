
import React, { useState, useMemo } from 'react';
import AllTransactions from './AllTransactions';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area, ComposedChart
} from 'recharts';
import { Transaction, Account, Goal, Budget, FinancialScore } from '../types';
import { TrendingUp, TrendingDown, Wallet, PlusCircle, ArrowUpRight, ArrowDownRight, Sparkles, X } from 'lucide-react';
import ChartContainer from './ChartContainer';
import AIInsightsWidget from './AIInsightsWidget';
import AdvancedAIIntelligence from './AdvancedAIIntelligence';
import ChartTransactionModal from './ChartTransactionModal';
import { AdvancedAIInsights, Transaction as TransactionType } from '../types';
import { getAdvancedAIInsights } from '../aiService';
import { Sector } from 'recharts';
import { Trophy, Award } from 'lucide-react';
import TopSummaryCards from './TopSummaryCards';
import SummaryDetailModal from './SummaryDetailModal';

interface DashboardProps {
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  budgets: Budget[];
  customBudgets?: any[];
  onAddClick: () => void;
  tags: any[];
  familyMembers?: Record<string, { name: string, avatar: string }>;
  financialScore?: Partial<FinancialScore> | null;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, accounts, goals, budgets, customBudgets = [], onAddClick, familyMembers, financialScore }) => {
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'intelligence'>('overview');

  // IA State Persistence
  const [aiInsights, setAiInsights] = useState<AdvancedAIInsights | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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
    color: '#0284c7'
  });

  const [summaryModal, setSummaryModal] = useState<{
    isOpen: boolean;
    type: 'accounts' | 'income' | 'expense' | 'transfer';
    title: string;
    color: string;
  }>({
    isOpen: false,
    type: 'accounts',
    title: '',
    color: '#1976D2'
  });

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleSummaryCardClick = (type: 'accounts' | 'income' | 'expense' | 'transfer') => {
    const config = {
      accounts: { title: 'Instituições & Saldos', color: '#1976D2' },
      income: { title: 'Receitas Consolidadas', color: '#0f9d58' },
      expense: { title: 'Despesas Realizadas', color: '#DB4437' },
      transfer: { title: 'Balanço de Movimentações', color: '#F4B400' }
    };
    setSummaryModal({
      isOpen: true,
      type,
      ...config[type]
    });
  };

  const fetchAIInsights = async (force = false) => {
    if (isAILoading) return;
    if (aiInsights && !force) return;
    if (transactions.length < 5) {
      setAiError("Dados insuficientes para análise.");
      return;
    }

    setIsAILoading(true);
    setAiError(null);
    try {
      const data = await getAdvancedAIInsights(transactions, accounts, budgets, goals);
      if (data) setAiInsights(data);
      else setAiError("Erro ao gerar insights.");
    } catch (err: any) {
      if (err.message === "COTA_EXCEDIDA") {
        setAiError("Limite de cota atingido. Tente novamente em alguns minutos.");
      } else {
        setAiError(err.message || "Erro na conexão com IA.");
      }
    } finally {
      setIsAILoading(false);
    }
  };

  const handleTabChange = (tab: 'overview' | 'intelligence') => {
    setActiveTab(tab);
    if (tab === 'intelligence' && !aiInsights) {
      fetchAIInsights();
    }
  };


  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const monthIncome = transactions
    .filter(t => t.type === 'income' && t.isPaid && !t.ignoreInTotals)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthExpense = transactions
    .filter(t => t.type === 'expense' && t.isPaid && !t.ignoreInTotals)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthIncomeForecast = transactions
    .filter(t => t.type === 'income' && !t.ignoreInTotals)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthExpenseForecast = transactions
    .filter(t => t.type === 'expense' && !t.ignoreInTotals)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const transferBalance = transactions
    .filter(t => t.ignoreInTotals && t.type === 'expense') // outbound transfers give volume
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Process Last 7 Days Data (Memoized)
  const last7DaysData = useMemo(() => {
    const today = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayVal = transactions
        .filter(t => t.date === dateStr && t.type === 'expense' && t.isPaid && !t.ignoreInTotals)
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({
        name: `Dia ${String(d.getDate()).padStart(2, '0')}`,
        value: dayVal
      });
    }
    return data;
  }, [transactions]);

  // Process Weekly Data (Memoized)
  const chartData = useMemo(() => {
    const weeks: { [key: string]: { Receitas: number; Despesas: number } } = {};
    for (let i = 1; i <= 4; i++) {
      weeks[`Semana ${i}`] = { Receitas: 0, Despesas: 0 };
    }

    transactions.forEach(t => {
      if (!t.isPaid || t.ignoreInTotals) return;
      const date = new Date(t.date);
      const day = date.getDate();
      let weekKey = 'Semana 1';
      if (day > 21) weekKey = 'Semana 4';
      else if (day > 14) weekKey = 'Semana 3';
      else if (day > 7) weekKey = 'Semana 2';

      if (t.type === 'income') {
        weeks[weekKey].Receitas += t.amount;
      } else {
        weeks[weekKey].Despesas += t.amount;
      }
    });

    return Object.keys(weeks).map(key => ({
      name: key,
      Receitas: weeks[key].Receitas,
      Despesas: weeks[key].Despesas
    }));
  }, [transactions]);

  const pieData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense' && t.isPaid && !t.ignoreInTotals);
    const categoryMap: { [key: string]: number } = {};

    expenses.forEach(t => {
      if (categoryMap[t.category]) {
        categoryMap[t.category] += t.amount;
      } else {
        categoryMap[t.category] = t.amount;
      }
    });

    return Object.keys(categoryMap).map(category => ({
      name: category,
      value: categoryMap[category]
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [transactions]);

  // Custom Budgets Data (Memoized)
  const customBudgetsData = useMemo(() => {
    return customBudgets.map(cb => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.isPaid && cb.categories.includes(t.category))
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        name: cb.name,
        limit: cb.limitValue,
        spent: spent,
        percent: cb.limitValue > 0 ? (spent / cb.limitValue) * 100 : 0
      };
    });
  }, [transactions, customBudgets]);

  // Clean Palette
  const BASE_COLORS = ['#38bdf8', '#fbbf24', '#f87171', '#818cf8', '#34d399', '#f472b6'];
  const COLORS = pieData.length > 0 ? BASE_COLORS.slice(0, pieData.length) : BASE_COLORS;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xl text-xs z-50 animate-in zoom-in-95 duration-200">
          <p className="font-semibold text-slate-900 dark:text-white mb-2 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">{label || payload[0].name}</p>
          {payload.map((p: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.payload.fill }}></div>
              <span className="font-bold text-slate-500 dark:text-slate-400 capitalize">{p.name}:</span>
              <span className="font-semibold text-slate-800 dark:text-white ml-auto">
                R$ {Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
          <p className="text-[8px] font-semibold text-sky-500 mt-2 uppercase tracking-tighter">Clique para ver detalhes</p>
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
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 12}
          outerRadius={outerRadius + 15}
          fill={fill}
          className="opacity-20"
        />
      </g>
    );
  };

  const onPieClick = (data: any, index: number) => {
    const categoryTransactions = transactions.filter(t =>
      t.category === data.name && t.type === 'expense' && t.isPaid && !t.ignoreInTotals
    );
    setSelectedChartData({
      isOpen: true,
      title: `Gastos: ${data.name}`,
      transactions: categoryTransactions,
      color: COLORS[index % COLORS.length]
    });
  };

  return (
    <div className="space-y-6">
      <TopSummaryCards
        totalBalance={totalBalance}
        monthIncome={monthIncome}
        monthExpense={monthExpense}
        transferBalance={transferBalance}
        onCardClick={handleSummaryCardClick}
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Visão Geral</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Resumo financeiro em tempo real</p>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white p-3 sm:px-5 sm:py-2.5 rounded-xl font-medium transition-all shadow-sm active:scale-95 w-full sm:w-auto justify-center text-[13px]"
        >
          <PlusCircle size={20} />
          <span>Lançar Manual</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => handleTabChange('overview')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Resumo Geral
        </button>
        <button
          onClick={() => handleTabChange('intelligence')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'intelligence' ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <Sparkles size={14} className={activeTab === 'intelligence' ? 'text-amber-400' : ''} />
          Inteligência IA
        </button>
      </div>

      {activeTab === 'intelligence' ? (
        <AdvancedAIIntelligence
          transactions={transactions}
          accounts={accounts}
          budgets={budgets}
          goals={goals}
          insights={aiInsights}
          isLoading={isAILoading}
          error={aiError}
          onRefresh={() => fetchAIInsights(true)}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left/Middle: Trend Chart (Weekly) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative z-10">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fluxo de Caixa</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Resumo mensal por semanas</p>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <TrendingDown size={18} className="text-rose-500" />
                </div>
              </div>
              <div className="h-64 mt-4 overflow-x-auto scrollbar-hide">
                <div className="h-full min-w-[600px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <defs>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#0f172a', fontSize: 10, fontWeight: '900' }}
                      />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="Receitas"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        dot={{ fill: '#94a3b8', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#475569', stroke: '#fff', strokeWidth: 2 }}
                        animationDuration={1500}
                        label={(props) => {
                          const { x, y, value } = props;
                          if (value === undefined || value === 0) return null;
                          return (
                            <text x={x} y={y} dy={-10} fill="#64748b" fontSize={10} fontWeight="bold" textAnchor="middle">
                              {`R$${(Number(value) / 1000).toFixed(1)}k`}
                            </text>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Despesas"
                        stroke="#ef4444"
                        strokeWidth={3}
                        fillOpacity={0.1}
                        fill="#ef4444"
                        animationDuration={1500}
                        label={(props) => {
                          const { x, y, value } = props;
                          if (value === undefined || value === 0) return null;
                          return (
                            <text x={x} y={y} dy={20} fill="#ef4444" fontSize={10} fontWeight="bold" textAnchor="middle">
                              {`R$${(Number(value) / 1000).toFixed(1)}k`}
                            </text>
                          );
                        }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right: AI Insights */}
            <div className="pt-6 lg:pt-0 relative z-10 h-full w-full">
              <AIInsightsWidget transactions={transactions} budgets={budgets} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center space-x-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent pointer-events-none"></div>
              <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl border border-sky-100 dark:border-sky-900/10 text-sky-600 dark:text-sky-400">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Patrimônio Total</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center space-x-4 relative overflow-hidden group border-l-4 border-l-indigo-500">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none"></div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <Trophy size={24} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Maturidade Financeira</p>
                <div className="flex items-end gap-2 text-indigo-600 dark:text-indigo-400">
                  <p className="text-2xl font-semibold tracking-tight">{financialScore?.total_score || 0}</p>
                  <p className="text-[10px] font-semibold uppercase pb-1 tracking-widest">PTS</p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[8px] font-semibold uppercase tracking-widest">
                  <Award size={10} />
                  {financialScore?.total_score && financialScore.total_score > 800 ? 'Top 5%' : 'Top 22%'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
            <ChartContainer
              title={
                <span className="flex items-center gap-2">
                  <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                  Meus Orçamentos
                </span>
              }
            >
              <div className="h-full min-h-[300px] w-full overflow-x-auto pb-4 scrollbar-hide">
                <div className="h-full min-w-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={customBudgetsData} layout="vertical" margin={{ left: 20, right: 40, top: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        width={100}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'black' }}
                      />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl shadow-xl z-50">
                                <p className="font-semibold text-[10px] uppercase text-slate-400 mb-1">{data.name}</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">R$ {data.spent.toLocaleString('pt-BR')} / R$ {data.limit.toLocaleString('pt-BR')}</p>
                                <p className="text-[10px] font-bold text-sky-500 mt-1">{data.percent.toFixed(1)}% utilizado</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="spent"
                        radius={[0, 10, 10, 0]}
                        barSize={16}
                      >
                        {customBudgetsData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.percent >= 100 ? '#f43f5e' : entry.percent > 80 ? '#f59e0b' : '#10b981'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </ChartContainer>

            <ChartContainer
              title={
                <span className="flex items-center gap-2">
                  <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                  Gastos por Categoria
                </span>
              }
            >
              <div className="h-full min-h-[300px] w-full flex items-center md:flex-row flex-col">
                <div className="flex-1 h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                        labelLine={false}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                          const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                          const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                          return percent > 0.05 ? (
                            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold">
                              {`${(percent * 100).toFixed(0)}%`}
                            </text>
                          ) : null;
                        }}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4 pr-4 w-full md:w-auto mt-4 md:mt-0">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex flex-col group">
                      <div className="flex items-center">
                        <div className="w-2.5 h-2.5 rounded-full mr-3 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors uppercase text-[10px] tracking-tight">{entry.name}</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 ml-5">
                        R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartContainer>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mt-6">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Últimos Lançamentos</h3>
              <button onClick={() => setShowAllTransactions(true)} className="text-sky-600 dark:text-sky-400 text-sm font-bold hover:text-sky-700 dark:hover:text-sky-300 transition-colors">Ver todos</button>
            </div>
            {/* Responsive List/Table */}
            <div className="relative">
              {/* Mobile View: Cards */}
              <div className="md:hidden divide-y divide-slate-50 dark:divide-slate-800">
                {transactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="p-3 flex flex-col gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {t.description}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded-md text-[8px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-tighter">
                            {t.category}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold">
                            {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-tighter ${t.isPaid
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-900/10 dark:text-amber-400'
                          }`}>
                          {t.isPaid ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {(() => {
                          const acc = accounts.find(a => a.id === t.account);
                          return acc?.bankLogo ? (
                            <img src={acc.bankLogo} className="w-3.5 h-3.5 object-contain opacity-70" alt="Bank" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                              <Wallet size={8} className="text-slate-400" />
                            </div>
                          );
                        })()}
                        <span className="text-[9px] font-bold text-slate-500 truncate">
                          {accounts.find(a => a.id === t.account)?.name || 'Sem conta'}
                        </span>
                      </div>

                      {t.created_by && familyMembers && familyMembers[t.created_by] && (
                        <div className="flex items-center gap-1">
                          <img
                            src={familyMembers[t.created_by].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(familyMembers[t.created_by].name)}&background=random`}
                            alt={familyMembers[t.created_by].name}
                            className="w-3 h-3 rounded-full"
                          />
                          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                            {familyMembers[t.created_by].name.split(' ')[0]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto scrollbar-hide">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Descrição</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Data</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Categoria</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right whitespace-nowrap pr-8">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {transactions.slice(0, 5).map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                              {t.description}
                            </span>
                            {t.created_by && familyMembers && familyMembers[t.created_by] && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <img
                                  src={familyMembers[t.created_by].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(familyMembers[t.created_by].name)}&background=random`}
                                  alt={familyMembers[t.created_by].name}
                                  className="w-3.5 h-3.5 rounded-full"
                                />
                                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                  {familyMembers[t.created_by].name.split(' ')[0]}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(t.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                            {t.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-widest ${t.isPaid
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                            }`}>
                            {t.isPaid ? 'Pago' : 'Pendente'}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm font-semibold text-right whitespace-nowrap pr-8 ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )
      }

      <ChartTransactionModal
        isOpen={selectedChartData.isOpen}
        onClose={() => setSelectedChartData({ ...selectedChartData, isOpen: false })}
        title={selectedChartData.title}
        transactions={selectedChartData.transactions}
        color={selectedChartData.color}
        familyMembers={familyMembers}
      />

      <SummaryDetailModal
        isOpen={summaryModal.isOpen}
        onClose={() => setSummaryModal({ ...summaryModal, isOpen: false })}
        title={summaryModal.title}
        type={summaryModal.type}
        color={summaryModal.color}
        data={{
          accounts: summaryModal.type === 'accounts' ? accounts : [],
          transactions: summaryModal.type === 'income'
            ? transactions.filter(t => t.type === 'income' && t.isPaid && !t.ignoreInTotals)
            : summaryModal.type === 'expense'
              ? transactions.filter(t => t.type === 'expense' && t.isPaid && !t.ignoreInTotals)
              : summaryModal.type === 'transfer'
                ? transactions.filter(t => t.ignoreInTotals)
                : []
        }}
        familyMembers={familyMembers}
      />

      {showAllTransactions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 w-full h-full sm:h-[90vh] sm:max-w-5xl sm:rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ring-1 ring-black/5">
            <button
              onClick={() => setShowAllTransactions(false)}
              className="absolute top-6 right-6 z-[110] p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl text-slate-400 hover:text-rose-600 transition-all shadow-sm border border-slate-100 dark:border-slate-800 active:scale-95 group"
            >
              <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            <div className="p-4 sm:p-10 h-full">
              <AllTransactions
                transactions={transactions}
                familyMembers={familyMembers}
                onBack={() => setShowAllTransactions(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
