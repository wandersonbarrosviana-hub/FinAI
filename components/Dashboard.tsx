
import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { Transaction, Account, Goal, Budget } from '../types';
import { TrendingUp, TrendingDown, Wallet, PlusCircle, Sparkles } from 'lucide-react';
import { chatWithFinancialAssistant } from '../geminiService';

interface DashboardProps {
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  budgets: Budget[];
  onAddClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, accounts, goals, budgets, onAddClick }) => {
  const [aiAdvice, setAiAdvice] = useState<string>('');

  React.useEffect(() => {
    const fetchAdvice = async () => {
      // Simple cache or check if already fetched? 
      // For now, fetch on mount.
      if (transactions.length > 0) {
        const advice = await chatWithFinancialAssistant(
          "Analise meu estado financeiro atual brevemente (máx 3 frases) e me dê um insight valioso.",
          transactions,
          accounts,
          goals,
          budgets
        );
        setAiAdvice(advice);
      }
    };
    fetchAdvice();
  }, [transactions, accounts]);

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  // Calcular totais do mês (já filtrado pelo pai)
  const monthIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

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

      {aiAdvice && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={64} />
          </div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Sparkles size={24} className="text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Insight FinAI</h3>
              <div className="text-indigo-100 text-sm leading-relaxed prose prose-invert max-w-none">
                {/* Render basic markdown if needed or just text */}
                {aiAdvice.split('\n').map((line, i) => (
                  <p key={i} className="mb-1">{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-50 flex items-center space-x-4">
          <div className="p-3 bg-sky-100 text-sky-600 rounded-xl">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Saldo Total</p>
            <p className="text-2xl font-bold text-slate-800">R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-50 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Receitas (Mês)</p>
            <p className="text-2xl font-bold text-emerald-600">R$ {monthIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-50 flex items-center space-x-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Despesas (Mês)</p>
            <p className="text-2xl font-bold text-rose-600">R$ {monthExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
