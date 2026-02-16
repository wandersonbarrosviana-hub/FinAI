
import React, { useState } from 'react';
import { Goal, Transaction, Account } from '../types';
import { Target, Plus, TrendingUp, Calendar, Trash2 } from 'lucide-react';

interface GoalManagerProps {
  goals: Goal[];
  transactions: Transaction[];
  accounts: Account[];
  onAddGoal: (goal: Partial<Goal>) => void;
  onDeleteGoal: (id: string) => void;
}

const GoalManager: React.FC<GoalManagerProps> = ({ goals, transactions, accounts, onAddGoal, onDeleteGoal }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Goal>>({
    title: '',
    target: 0,
    current: 0,
    deadline: new Date().toISOString().split('T')[0],
    category: 'Investimentos'
  });

  // Calculate current month's surplus
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const surplus = monthlyIncome - monthlyExpenses;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddGoal(formData);
    setIsFormOpen(false);
    setFormData({ title: '', target: 0, current: 0, deadline: new Date().toISOString().split('T')[0], category: 'Investimentos' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Metas de Longo Prazo</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Transformando sua sobra mensal em patrimônio real.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-sky-600 text-white px-8 py-4 rounded-[1.5rem] hover:bg-sky-700 transition-all shadow-xl shadow-sky-100 font-extrabold text-sm uppercase tracking-widest"
        >
          {isFormOpen ? <Trash2 size={20} /> : <Plus size={20} />}
          <span>{isFormOpen ? 'Fechar' : 'Nova Meta'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Surplus Analysis Card */}
        <div className="col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden relative group">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                <TrendingUp size={24} />
              </div>
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Análise de Sobra</span>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-1">Este Mês</p>
                <p className={`text-4xl font-black ${surplus >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} tracking-tight`}>
                  R$ {surplus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 space-y-3 shadow-inner dark:shadow-none">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400 dark:text-slate-500">GANHOS</span>
                  <span className="text-emerald-600 dark:text-emerald-400">+R$ {monthlyIncome.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400 dark:text-slate-500">GASTOS</span>
                  <span className="text-rose-500 dark:text-rose-400">-R$ {monthlyExpenses.toLocaleString('pt-BR')}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-2">PROJEÇÃO ANUAL</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">R$ {(surplus * 12).toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-2 font-medium">Baseado na média de sobra do mês atual.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl animate-in zoom-in duration-300 max-w-2xl mx-auto ring-1 ring-black/5 dark:ring-white/5">
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Nova Meta Financeira</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Título da Meta</label>
              <input
                type="text" required
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 transition-all text-slate-700 dark:text-white font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600"
                placeholder="Ex: Viagem Japão 2026"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Valor Objetivo (R$)</label>
              <input
                type="number" required
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 transition-all text-slate-700 dark:text-white font-bold"
                value={formData.target || ''}
                onChange={e => setFormData({ ...formData, target: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Data Limite</label>
              <input
                type="date" required
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 transition-all text-slate-700 dark:text-white font-bold"
                value={formData.deadline}
                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
              <select
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/50 transition-all text-slate-700 dark:text-white font-bold appearance-none"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Viagens">Viagens</option>
                <option value="Imóveis">Imóveis</option>
                <option value="Veículos">Veículos</option>
                <option value="Aposentadoria">Aposentadoria</option>
                <option value="Reserva">Reserva de Emergência</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>
          <div className="mt-10 flex justify-end gap-6">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-8 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-all">Cancelar</button>
            <button type="submit" className="bg-sky-600 text-white px-12 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-sky-700 shadow-xl shadow-sky-100 transition-all">Criar Meta</button>
          </div>
        </form>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = Math.min((goal.current / goal.target) * 100, 100);

          return (
            <div key={goal.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-sky-100 dark:hover:shadow-none transition-all group overflow-hidden relative group">
              <div className="flex justify-between items-start mb-10">
                <div className="p-5 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 rounded-[1.5rem] group-hover:scale-110 transition-all duration-500 border border-sky-100 dark:border-sky-900/30 shadow-sm">
                  <Target size={32} />
                </div>
                <button
                  onClick={() => onDeleteGoal(goal.id)}
                  className="p-3 text-slate-200 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 transition-all hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
                >
                  <Trash2 size={24} />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest">{goal.category}</p>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">{goal.title}</h4>
                <div className="flex justify-between items-end">
                  <p className="text-sm font-black text-slate-400 dark:text-slate-500 tracking-tight">R$ <span className="text-slate-900 dark:text-white">{goal.current.toLocaleString()}</span> / <span className="text-slate-300 dark:text-slate-600">R$ {goal.target.toLocaleString()}</span></p>
                  <span className="text-sm font-black text-sky-600 dark:text-sky-400">{progress.toFixed(0)}%</span>
                </div>
              </div>

              <div className="mt-6 h-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-full overflow-hidden shadow-inner dark:shadow-none">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full transition-all duration-1000 shadow-lg shadow-sky-500/30"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
                  <Calendar size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">Até {new Date(goal.deadline).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-800 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <Target size={48} className="opacity-10 mb-4" />
            <p className="font-bold">Nenhuma meta ativa.</p>
            <p className="text-sm">Defina objetivos.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalManager;
