
import React, { useState, useMemo } from 'react';
import AllTransactions from './AllTransactions';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { Transaction, Account, Goal, Budget } from '../types';
import { TrendingUp, TrendingDown, Wallet, PlusCircle, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import ChartContainer from './ChartContainer';
import AIInsightsWidget from './AIInsightsWidget';
import AdvancedAIIntelligence from './AdvancedAIIntelligence';
import { AdvancedAIInsights } from '../types';
import { getAdvancedAIInsights } from '../aiService';

interface DashboardProps {
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  budgets: Budget[];
  onAddClick: () => void;
  tags: any[];
  familyMembers?: Record<string, { name: string, avatar: string }>;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, accounts, goals, budgets, onAddClick, familyMembers }) => {
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'intelligence'>('overview');

  // IA State Persistence
  const [aiInsights, setAiInsights] = useState<AdvancedAIInsights | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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
    .filter(t => t.type === 'income' && t.isPaid)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthExpense = transactions
    .filter(t => t.type === 'expense' && t.isPaid)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthIncomeForecast = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthExpenseForecast = transactions
    .filter(t => t.type === 'expense')
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
        .filter(t => t.date === dateStr && t.type === 'expense' && t.isPaid)
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
      if (!t.isPaid) return;
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

  // Process Category Data (Memoized)
  const pieData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense' && t.isPaid);
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

  // Clean Palette
  const BASE_COLORS = ['#0284c7', '#059669', '#db2777', '#7c3aed', '#d97706', '#dc2626'];
  const COLORS = pieData.length > 0 ? BASE_COLORS.slice(0, pieData.length) : BASE_COLORS;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xl text-xs z-50">
          <p className="font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">{label}</p>
          {payload.map((p: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
              <span className="font-bold text-slate-500 dark:text-slate-400 capitalize">{p.name}:</span>
              <span className="font-black text-slate-800 dark:text-white ml-auto">
                R$ {Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Visão Geral</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Resumo financeiro em tempo real</p>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white p-3 sm:px-5 sm:py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-sky-100 active:scale-95 w-full sm:w-auto justify-center uppercase text-[10px] tracking-widest"
        >
          <PlusCircle size={20} />
          <span>Lançar Manual</span>
        </button>
      </div>

      {/* Modern Tabs - Fluid Width */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full sm:w-fit overflow-x-auto scrollbar-hide">
        <button
          onClick={() => handleTabChange('overview')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Resumo Geral
        </button>
        <button
          onClick={() => handleTabChange('intelligence')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'intelligence' ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
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
            {/* Main Stats Card (Clean White) */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 sm:gap-8 relative overflow-hidden group">
              {/* Background Glow - Subtle */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-sky-500/10 transition-all duration-700"></div>

              {/* Vertical Flow - Adaptive Width */}
              <div className="w-full md:max-w-xs flex flex-col justify-between py-2 relative z-10 gap-6">
                <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-emerald-100 via-slate-100 to-rose-100 z-0 hidden xs:block"></div>

                {/* Income */}
                <div className="relative z-10 flex items-center gap-4 group/item">
                  <div className="w-10 h-10 flex-shrink-0 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                    <ArrowUpRight size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Entrada</p>
                    <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 truncate">R$ {monthIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
                      Previsto: R$ {monthIncomeForecast.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Balance (Net) */}
                <div className="relative z-10 flex items-center gap-4 group/item">
                  <div className={`w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center border shadow-sm ${monthIncome - monthExpense >= 0 ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'}`}>
                    <Wallet size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Saldo Mensal</p>
                    <p className={`text-xl sm:text-2xl font-black truncate ${monthIncome - monthExpense >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {monthIncome - monthExpense >= 0 ? '+' : ''} R$ {(monthIncome - monthExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
                      Previsto: {monthIncomeForecast - monthExpenseForecast >= 0 ? '+' : ''} R$ {(monthIncomeForecast - monthExpenseForecast).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Expense */}
                <div className="relative z-10 flex items-center gap-4 group/item">
                  <div className="w-10 h-10 flex-shrink-0 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
                    <ArrowDownRight size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Saída</p>
                    <p className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 truncate">R$ {monthExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
                      Previsto: R$ {monthExpenseForecast.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Middle: Trend Chart (Weekly) */}
              <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 relative z-10">
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
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                        />
                        <YAxis hide />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="Receitas"
                          stroke="#10b981"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorIncome)"
                          animationDuration={1500}
                        />
                        <Area
                          type="monotone"
                          dataKey="Despesas"
                          stroke="#f43f5e"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorExpense)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Right: AI Insights */}
              <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 relative z-10">
                <AIInsightsWidget transactions={transactions} budgets={budgets} />
              </div>
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
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
            <ChartContainer
              title={
                <span className="flex items-center gap-2">
                  <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
                  Fluxo de Caixa
                </span>
              }
            >
              <div className="h-full min-h-[300px] w-full overflow-x-auto pb-4 scrollbar-hide">
                <div className="h-full min-w-[600px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', color: '#0f172a' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Receitas"
                        stroke="#10b981"
                        strokeWidth={4}
                        dot={{ r: 4, fill: '#fff', strokeWidth: 3 }}
                        activeDot={{ r: 6, fill: '#10b981' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Despesas"
                        stroke="#f43f5e"
                        strokeWidth={4}
                        dot={{ r: 4, fill: '#fff', strokeWidth: 3 }}
                        activeDot={{ r: 6, fill: '#f43f5e' }}
                      />
                    </LineChart>
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
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        label={({ x, y, cx, name, percent }) => (
                          <text x={x} y={y} fill="#1e293b" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: '10px', fontWeight: '800' }}>
                            {`${name} ${(percent * 100).toFixed(0)}%`}
                          </text>
                        )}
                        labelLine={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '3 3' }}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ outline: 'none' }} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', color: '#0f172a' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 pr-4 w-full md:w-auto mt-4 md:mt-0">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center text-sm group">
                      <div className="w-2.5 h-2.5 rounded-full mr-3" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-slate-500 dark:text-slate-400 font-bold group-hover:text-slate-900 dark:group-hover:text-white transition-colors uppercase text-[10px] tracking-tight">{entry.name}</span>
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
                  <div key={t.id} className="p-4 flex flex-col gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                          {t.description}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                            {t.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(t.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${t.isPaid
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                          }`}>
                          {t.isPaid ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const acc = accounts.find(a => a.id === t.account);
                          return acc?.bankLogo ? (
                            <img src={acc.bankLogo} className="w-5 h-5 object-contain opacity-70" alt="Bank" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                              <Wallet size={10} className="text-slate-400" />
                            </div>
                          );
                        })()}
                        <span className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">
                          {accounts.find(a => a.id === t.account)?.name || 'Sem conta'}
                        </span>
                      </div>

                      {t.created_by && familyMembers && familyMembers[t.created_by] && (
                        <div className="flex items-center gap-1.5">
                          <img
                            src={familyMembers[t.created_by].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(familyMembers[t.created_by].name)}&background=random`}
                            alt={familyMembers[t.created_by].name}
                            className="w-4 h-4 rounded-full"
                          />
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
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
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${t.isPaid
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                            }`}>
                            {t.isPaid ? 'Pago' : 'Pendente'}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm font-black text-right whitespace-nowrap pr-8 ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
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
      )}

      {/* All Transactions Modal */}
      {showAllTransactions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 w-full h-full sm:h-[90vh] sm:max-w-5xl sm:rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ring-1 ring-black/5">
            {/* Desktop/Mobile Close Button */}
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
