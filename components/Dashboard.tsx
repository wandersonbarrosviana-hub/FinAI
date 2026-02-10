
import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { Transaction, Account, Goal, Budget } from '../types';
import { TrendingUp, TrendingDown, Wallet, PlusCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthExpense = transactions
    .filter(t => t.type === 'expense')
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
        .filter(t => t.date === dateStr && t.type === 'expense')
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
    const expenses = transactions.filter(t => t.type === 'expense');
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

  // Neon Palette
  const BASE_COLORS = ['#22d3ee', '#34d399', '#f472b6', '#a78bfa', '#fbbf24', '#f87171'];
  const COLORS = pieData.length > 0 ? BASE_COLORS.slice(0, pieData.length) : BASE_COLORS;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center sm:flex-row flex-col gap-4 sm:gap-0">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Visão Geral</h2>
          <p className="text-slate-400">Resumo financeiro em tempo real</p>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] active:scale-95 w-full sm:w-auto justify-center"
        >
          <PlusCircle size={20} />
          <span>Lançar Manual</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stats Card (Glassmorphism) */}
        <div className="lg:col-span-3 bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row gap-8 relative overflow-hidden group">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/15 transition-all duration-700"></div>

          {/* Vertical Flow */}
          <div className="flex-1 max-w-xs flex flex-col justify-between py-2 relative z-10">
            <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-emerald-500/30 via-slate-700 to-rose-500/30 z-0"></div>

            {/* Income */}
            <div className="relative z-10 flex items-center gap-4 group/item">
              <div className="w-10 h-10 rounded-full bg-slate-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover/item:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all">
                <ArrowUpRight size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Entrada</p>
                <p className="text-xl font-black text-emerald-400 drop-shadow-sm">R$ {monthIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            {/* Balance (Net) */}
            <div className="relative z-10 flex items-center gap-4 my-6 group/item">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-slate-700 shadow-2xl relative ${monthIncome - monthExpense >= 0 ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                }`}>
                <div className={`absolute inset-0 rounded-full blur-md opacity-40 ${monthIncome - monthExpense >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                <Wallet size={20} className="relative z-10" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo Mensal</p>
                <p className={`text-2xl font-black drop-shadow-md ${monthIncome - monthExpense >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                  {monthIncome - monthExpense >= 0 ? '+' : ''} R$ {(monthIncome - monthExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Expense */}
            <div className="relative z-10 flex items-center gap-4 group/item">
              <div className="w-10 h-10 rounded-full bg-slate-950 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)] group-hover/item:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all">
                <ArrowDownRight size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saída</p>
                <p className="text-xl font-black text-rose-400 drop-shadow-sm">R$ {monthExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {/* Right: Trend Chart (Last 7 Days) */}
          <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-8 relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Evolução Recente</h3>
                <p className="text-xs text-slate-400">Últimos 7 dias</p>
              </div>
              <div className="p-2 bg-slate-800/50 rounded-lg">
                <TrendingDown size={18} className="text-rose-400" />
              </div>
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7DaysData}>
                  <defs>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', color: '#fff' }}
                    itemStyle={{ color: '#fda4af' }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Despesas']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-slate-800 flex items-center space-x-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent pointer-events-none"></div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Patrimônio Total</p>
            <p className="text-2xl font-black text-white tracking-tight">R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-slate-800">
          <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
            Fluxo de Caixa
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', color: '#fff' }}
                />
                <Line type="monotone" dataKey="Receitas" stroke="#34d399" strokeWidth={3} dot={{ r: 4, fill: '#020617', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#34d399' }} />
                <Line type="monotone" dataKey="Despesas" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#020617', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#f43f5e' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-slate-800">
          <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
            Gastos por Categoria
          </h3>
          <div className="h-[300px] w-full flex items-center">
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
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 pr-4">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center text-sm group">
                  <div className="w-3 h-3 rounded-full mr-3 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: COLORS[index % COLORS.length], color: COLORS[index % COLORS.length] }}></div>
                  <span className="text-slate-300 font-medium group-hover:text-white transition-colors">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Últimos Lançamentos</h3>
          <button className="text-cyan-400 text-sm font-bold hover:text-cyan-300 transition-colors">Ver todos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {transactions.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-cyan-500/5 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-400 group-hover:text-slate-200">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-200 group-hover:text-white">{t.description}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 group-hover:border-cyan-500/30 group-hover:text-cyan-400 transition-all">
                      {t.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
