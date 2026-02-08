
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Metas de Longo Prazo</h2>
          <p className="text-slate-500 text-sm font-medium">Transformando sua sobra mensal em patrimônio real.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-2xl hover:bg-sky-700 transition-all shadow-xl shadow-sky-100 font-bold"
        >
          <Plus size={20} />
          <span>{isFormOpen ? 'Fechar' : 'Nova Meta'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Surplus Analysis Card */}
        <div className="col-span-1 bg-white p-6 rounded-[2.5rem] border border-sky-100 shadow-sm flex flex-col justify-between overflow-hidden relative group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                <TrendingUp size={20} />
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Análise de Sobra</span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 font-medium">Este Mês</p>
                <p className={`text-3xl font-black ${surplus >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  R$ {surplus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">GANHOS</span>
                  <span className="text-emerald-600 font-bold">+R$ {monthlyIncome.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">GASTOS</span>
                  <span className="text-rose-500 font-bold">-R$ {monthlyExpenses.toLocaleString('pt-BR')}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 font-bold mb-1">PROJEÇÃO ANUAL</p>
                <p className="text-xl font-extrabold text-slate-700">R$ {(surplus * 12).toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-slate-400 italic mt-1">Baseado na média de sobra do mês atual.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-sky-100 shadow-2xl animate-in zoom-in duration-300 max-w-2xl mx-auto">
          <h3 className="text-xl font-black text-slate-800 mb-6">Nova Meta Financeira</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Título da Meta</label>
              <input
                type="text" required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Ex: Viagem Japão 2026"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Valor Objetivo (R$)</label>
              <input
                type="number" required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                value={formData.target || ''}
                onChange={e => setFormData({ ...formData, target: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Data Limite</label>
              <input
                type="date" required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                value={formData.deadline}
                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
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
          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 text-slate-400 font-bold hover:text-slate-600">Cancelar</button>
            <button type="submit" className="bg-sky-600 text-white px-10 py-3 rounded-2xl font-bold hover:bg-sky-700 shadow-xl shadow-sky-100">Criar Meta</button>
          </div>
        </form>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = Math.min((goal.current / goal.target) * 100, 100);

          return (
            <div key={goal.id} className="bg-white p-6 rounded-[2.5rem] border border-sky-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-sky-50 text-sky-600 rounded-3xl group-hover:scale-110 transition-transform duration-500">
                  <Target size={28} />
                </div>
                <button
                  onClick={() => onDeleteGoal(goal.id)}
                  className="p-2 text-slate-200 hover:text-rose-500 transition-colors hover:bg-rose-50 rounded-xl"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest">{goal.category}</p>
                <h4 className="text-xl font-black text-slate-800 truncate">{goal.title}</h4>
                <div className="flex justify-between items-end">
                  <p className="text-sm font-bold text-slate-400">R$ {goal.current.toLocaleString()} / <span className="text-slate-800">R$ {goal.target.toLocaleString()}</span></p>
                  <span className="text-xs font-black text-sky-600">{progress.toFixed(0)}%</span>
                </div>
              </div>

              <div className="mt-4 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar size={14} />
                  <span className="text-xs font-bold">{new Date(goal.deadline).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
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
