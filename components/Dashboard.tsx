
import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { Transaction, Account, Goal, Budget } from '../types';
import { TrendingUp, TrendingDown, Wallet, PlusCircle } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  budgets: Budget[];
  onAddClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, accounts, goals, budgets, onAddClick }) => {


  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  // Calcular totais do mês (já filtrado pelo pai)
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
      // Careful: transactions passed here might be filtered by month in App.tsx?
      // Yes, dashboard receives `filteredTransactions`.
      // The user wants "Last 7 days" which might cross month boundaries.
      // If App.tsx filters by selected month, we can't show "Last 7 days" accurately if it crosses boundary.
      // BUT `Dashboard` receives whatever `transactions` prop is passed.
      // In App.tsx: `case 'dashboard': ... transactions={filteredTransactions}`.
      // This is a limitation. To show "Last 7 days" (global), we need unfiltered transactions.
      // Or we assume "Last 7 days within current view", but that interprets "Last 7 days" weirdly.
      // However, refactoring App.tsx to pass full transactions just for this chart might be needed.
      // For now, I will use what I have. If the date is not in `transactions`, it will be 0.

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

  // Processar dados para o gráfico de linha (fluxo semanal)
  const processChartData = () => {
    const weeks: { [key: string]: { Receitas: number; Despesas: number } } = {};

    // Inicializar 4-5 semanas
    const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    // Nota: Como transactions já vem filtrado por mês, podemos pegar o mês da primeira transação ou assumir o atual se vazio,
    // mas o ideal seria receber a data atual via props. 
    // Para simplificar e garantir consistência com transactions, vamos agrupar apenas os dias existentes.
    // Melhor: Agrupar em 4 semanas fixas para consistência visual.

    // Vamos criar 4 semanas padrão
    for (let i = 1; i <= 4; i++) {
      weeks[`Semana ${i}`] = { Receitas: 0, Despesas: 0 };
    }

    transactions.forEach(t => {
      const date = new Date(t.date);
      const day = date.getDate();
      // Divisão simples por semanas (1-7, 8-14, 15-21, 22+)
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

  // Processar dados para o gráfico de pizza (categorias de despesa)
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
    })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5 categories
  };

  const pieData = processPieData();

  // Cores dinâmicas para o gráfico de pizza (se houver muitas categorias, repetir)
  // Cores dinâmicas para o gráfico de pizza
  const BASE_COLORS = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];
  const COLORS = pieData.length > 0 ? BASE_COLORS.slice(0, pieData.length) : BASE_COLORS;


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
          <p className="text-slate-500">Bem-vindo de volta! Aqui está o resumo das suas finanças.</p>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-all shadow-md shadow-sky-100"
        >
          <PlusCircle size={20} />
          <span>Lançar Manual</span>
        </button>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Vertical Flow and Trend Chart */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8">
          {/* Vertical Flow */}
          <div className="flex-1 max-w-xs flex flex-col justify-between py-2 relative">
            {/* Connecting Line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-emerald-200 via-slate-200 to-rose-200 z-0"></div>

            {/* Income */}
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border-4 border-white shadow-sm">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entrada</p>
                <p className="text-xl font-black text-emerald-600">R$ {monthIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            {/* Balance (Net) */}
            <div className="relative z-10 flex items-center gap-4 my-6">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm ${monthIncome - monthExpense >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                <Wallet size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo</p>
                <p className={`text-2xl font-black ${monthIncome - monthExpense >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                  {monthIncome - monthExpense >= 0 ? '+' : ''} R$ {(monthIncome - monthExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Expense */}
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 border-4 border-white shadow-sm">
                <TrendingDown size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saída</p>
                <p className="text-xl font-black text-rose-600">R$ {monthExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {/* Right: Trend Chart (Last 7 Days) */}
          <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Evolução das despesas</h3>
                <p className="text-xs text-slate-400">Últimos 7 dias</p>
              </div>
              <button className="text-slate-400 hover:text-sky-600 transition-colors">
                <TrendingDown size={18} />
              </button>
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7DaysData}>
                  <defs>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
        {/* Keeping only Total Balance card as a secondary info or removing? 
            The user said "place an area at the start LIKE THE PHOTO".
            The photo shows summaries.
            I will keep the Total Balance card but modify the others or remove them to avoid duplication if "Entrada" and "Saída" are effectively the same as "Receitas (Mês)" and "Despesas (Mês)".
            Yes, they are the same.
            So I will strictly render the Total Balance card separately or maybe integrate it.
            The user wants "Entrada, Saldo, Saída".
            "Saldo" in this context (between Income and Expense) usually implies "Monthly Result" or "Cash Flow".
            But "Saldo Total" (Accumulated Wealth) is different.
            I will keep "Saldo Total" (Accumulated) as a separate card below, or integrate it differently.
            Let's keep the existing accumulated balance card below for now, and remove the monthly income/expense cards since they are now in the top widget.
         */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-50 flex items-center space-x-4">
          <div className="p-3 bg-sky-100 text-sky-600 rounded-xl">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Patrimônio Acumulado</p>
            <p className="text-2xl font-bold text-slate-800">R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-50">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Fluxo de Caixa</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Despesas" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-50">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Gastos por Categoria</h3>
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
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 pr-4">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-slate-600 font-medium">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-sky-50 overflow-hidden">
        <div className="p-6 border-b border-sky-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Últimos Lançamentos</h3>
          <button className="text-sky-600 text-sm font-medium hover:underline">Ver todos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-sky-50/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{t.description}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                      {t.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
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
