
import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { Transaction, Account, Goal, Budget } from '../types';
import { TrendingUp, TrendingDown, Wallet, PlusCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import ChartContainer from './ChartContainer';
import AIInsightsWidget from './AIInsightsWidget';

interface DashboardProps {
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  budgets: Budget[];
  onAddClick: () => void;
  tags: any[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, accounts, goals, budgets, onAddClick }) => {


  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const monthIncome = transactions
    .filter(t => t.type === 'income' && t.isPaid)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthExpense = transactions
    .filter(t => t.type === 'expense' && t.isPaid)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Process Last 7 Days Data
  const processLast7Days = () => {
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
        name: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        value: dayVal
      });
    }
    return data;
  };

  const last7DaysData = processLast7Days();

  const processChartData = () => {
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
  };

  const chartData = processChartData();

  const processPieData = () => {
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
  };

  const pieData = processPieData();

  // Clean Palette
  const BASE_COLORS = ['#0284c7', '#059669', '#db2777', '#7c3aed', '#d97706', '#dc2626'];
  const COLORS = pieData.length > 0 ? BASE_COLORS.slice(0, pieData.length) : BASE_COLORS;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center sm:flex-row flex-col gap-4 sm:gap-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Visão Geral</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Resumo financeiro em tempo real</p>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-sky-100 active:scale-95 w-full sm:w-auto justify-center uppercase text-[10px] tracking-widest"
        >
          <PlusCircle size={20} />
          <span>Lançar Manual</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stats Card (Clean White) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-8 relative overflow-hidden group">
          {/* Background Glow - Subtle */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-sky-500/10 transition-all duration-700"></div>

          {/* Vertical Flow */}
          <div className="flex-1 max-w-xs flex flex-col justify-between py-2 relative z-10">
            <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-emerald-100 via-slate-100 to-rose-100 z-0"></div>

            {/* Income */}
            <div className="relative z-10 flex items-center gap-4 group/item">
              <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm transition-all">
                <ArrowUpRight size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Entrada</p>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">R$ {monthIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            {/* Balance (Net) */}
            <div className="relative z-10 flex items-center gap-4 my-6 group/item">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm relative ${monthIncome - monthExpense >= 0 ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'
                }`}>
                <Wallet size={24} className="relative z-10" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Saldo Mensal</p>
                <p className={`text-2xl font-black ${monthIncome - monthExpense >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                  {monthIncome - monthExpense >= 0 ? '+' : ''} R$ {(monthIncome - monthExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Expense */}
            <div className="relative z-10 flex items-center gap-4 group/item">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm transition-all">
                <ArrowDownRight size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Saída</p>
                <p className="text-xl font-black text-rose-600 dark:text-rose-400">R$ {monthExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {/* Middle: Trend Chart (Last 7 Days) */}
          <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Evolução Recente</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Últimos 7 dias</p>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <TrendingDown size={18} className="text-rose-500" />
              </div>
            </div>
            <div className="h-40 w-full overflow-hidden pb-2">
              <div className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={last7DaysData}>
                    <defs>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', color: '#0f172a' }}
                      itemStyle={{ color: '#e11d48' }}
                      labelStyle={{ color: '#64748b', fontWeight: 'bold' }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Despesas']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#e11d48" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title={
            <span className="flex items-center gap-2">
              <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
              Fluxo de Caixa
            </span>
          }
        >
          <div className="h-full min-h-[300px] w-full overflow-x-auto pb-4">
            <div className="h-full min-w-[600px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', color: '#0f172a' }}
                  />
                  <Line type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#fff', strokeWidth: 3 }} activeDot={{ r: 6, fill: '#10b981' }} />
                  <Line type="monotone" dataKey="Despesas" stroke="#f43f5e" strokeWidth={4} dot={{ r: 4, fill: '#fff', strokeWidth: 3 }} activeDot={{ r: 6, fill: '#f43f5e' }} />
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
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
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

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Últimos Lançamentos</h3>
          <button className="text-sky-600 dark:text-sky-400 text-sm font-bold hover:text-sky-700 dark:hover:text-sky-300 transition-colors">Ver todos</button>
        </div>
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {transactions.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">{t.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase tracking-wider transition-all">
                      {t.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-black text-right whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex flex-col divide-y divide-slate-50 dark:divide-slate-800">
          {transactions.slice(0, 5).map((t) => (
            <div key={t.id} className="p-4 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {new Date(t.date).toLocaleDateString('pt-BR')}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{t.description}</span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded w-fit uppercase tracking-wider">
                  {t.category}
                </span>
              </div>
              <div className={`text-sm font-black whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm italic">
              Nenhum lançamento recente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
