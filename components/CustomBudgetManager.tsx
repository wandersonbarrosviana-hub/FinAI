import React, { useState, useMemo } from 'react';
import { Transaction, CustomBudget } from '../types';
import { CATEGORIES } from '../constants';
import { Plus, Trash2, PieChart, Info, Check, X, Calculator, DollarSign } from 'lucide-react';

interface CustomBudgetManagerProps {
    customBudgets: CustomBudget[];
    transactions: Transaction[];
    monthlyIncome: number;
    onAddCustomBudget: (budget: Partial<CustomBudget>) => Promise<void>;
    onDeleteCustomBudget: (id: string) => Promise<void>;
}

const CustomBudgetManager: React.FC<CustomBudgetManagerProps> = ({
    customBudgets,
    transactions,
    monthlyIncome,
    onAddCustomBudget,
    onDeleteCustomBudget
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<CustomBudget>>({
        name: '',
        categories: [],
        limitType: 'value',
        limitValue: 0
    });

    const categories = CATEGORIES;
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Calculate spent and percentage for each budget
    const enrichedBudgets = useMemo(() => {
        return customBudgets.map(budget => {
            // Filter transactions for current month AND matching categories
            const pertinentTransactions = transactions.filter(t => {
                const isCurrentMonth = t.date.startsWith(currentMonth);
                const isExpense = t.type === 'expense';
                const isInCategory = budget.categories.includes(t.category);
                return isCurrentMonth && isExpense && isInCategory;
            });

            const spent = pertinentTransactions.reduce((acc, t) => acc + t.amount, 0);

            let computedLimit = budget.limitValue;
            if (budget.limitType === 'percentage') {
                computedLimit = (monthlyIncome * budget.limitValue) / 100;
            }

            const percentage = computedLimit > 0 ? (spent / computedLimit) * 100 : 0;

            return {
                ...budget,
                spent,
                computedLimit,
                percentage
            };
        });
    }, [customBudgets, transactions, monthlyIncome, currentMonth]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.categories?.length === 0) {
            alert("Selecione pelo menos uma categoria.");
            return;
        }
        await onAddCustomBudget(formData);
        setIsFormOpen(false);
        setFormData({
            name: '',
            categories: [],
            limitType: 'value',
            limitValue: 0
        });
    };

    const toggleCategory = (cat: string) => {
        setFormData(prev => {
            const cats = prev.categories || [];
            if (cats.includes(cat)) {
                return { ...prev, categories: cats.filter(c => c !== cat) };
            } else {
                return { ...prev, categories: [...cats, cat] };
            }
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Orçamentos Personalizados</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Crie grupos de categorias e defina limites inteligentes.</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 font-bold"
                >
                    {isFormOpen ? <span className="px-2">Fechar</span> : (
                        <>
                            <Plus size={20} />
                            <span>Novo Grupo</span>
                        </>
                    )}
                </button>
            </div>

            {isFormOpen && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 shadow-2xl animate-in zoom-in duration-300 ring-1 ring-black/5 dark:ring-white/5">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Nome do Orçamento</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 dark:text-white"
                                    placeholder="Ex: Custos Essenciais"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Tipo de Limite</label>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, limitType: 'value' })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.limitType === 'value' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                                    >
                                        Valor Fixo (R$)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, limitType: 'percentage' })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.limitType === 'percentage' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                                    >
                                        Percentual (%)
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">
                                    {formData.limitType === 'value' ? 'Valor do Limite (R$)' : 'Percentual da Renda (%)'}
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step={formData.limitType === 'percentage' ? "0.1" : "0.01"}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-black text-slate-700 dark:text-white"
                                    placeholder="0"
                                    value={formData.limitValue === 0 ? '' : formData.limitValue}
                                    onChange={e => setFormData({ ...formData, limitValue: parseFloat(e.target.value) || 0 })}
                                />
                                {formData.limitType === 'percentage' && (
                                    <p className="text-xs font-medium text-indigo-500 ml-1">
                                        Equivale a: R$ {((monthlyIncome * (formData.limitValue || 0)) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Categorias Inclusas</label>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => toggleCategory(cat)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${formData.categories?.includes(cat)
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400'
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all transform active:scale-95 flex items-center gap-2"
                            >
                                <Check size={18} /> Salvar Orçamento
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrichedBudgets.map(budget => {
                    const isOver = budget.spent > budget.computedLimit;
                    const percentageFormatted = Math.min(budget.percentage, 100);

                    return (
                        <div key={budget.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <PieChart size={64} className="text-indigo-600" />
                            </div>

                            <div className="flex justify-between items-start mb-6 z-10 relative">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight">{budget.name}</h3>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {budget.categories.slice(0, 3).map(c => (
                                            <span key={c} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{c}</span>
                                        ))}
                                        {budget.categories.length > 3 && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">+{budget.categories.length - 3}</span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => onDeleteCustomBudget(budget.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="mb-6 z-10 relative">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                                        {budget.percentage.toFixed(0)}%
                                    </span>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Gasto / Limite</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            R$ {budget.spent.toLocaleString('pt-BR', { compactDisplay: "short" })} <span className="text-slate-300">/</span> R$ {budget.computedLimit.toLocaleString('pt-BR', { compactDisplay: "short" })}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${isOver ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                        style={{ width: `${percentageFormatted}%` }}
                                    ></div>
                                </div>
                                {isOver && <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1"><Info size={10} /> Limite excedido em R$ {(budget.spent - budget.computedLimit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>}
                            </div>

                            <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-xs font-medium text-slate-500">
                                <span className="flex items-center gap-1">
                                    {budget.limitType === 'percentage' ? <Calculator size={12} /> : <DollarSign size={12} />}
                                    {budget.limitType === 'percentage' ? `${budget.limitValue}% da Renda` : 'Valor Fixo'}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {enrichedBudgets.length === 0 && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
                        <div className="inline-flex bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-4">
                            <Calculator className="text-slate-300 dark:text-slate-600" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum Orçamento Personalizado</h3>
                        <p className="text-sm text-slate-500 mb-6">Crie grupos de categorias para monitorar seus gastos de forma inteligente.</p>
                        <button onClick={() => setIsFormOpen(true)} className="text-indigo-600 font-bold text-sm hover:underline">
                            Criar Primeiro Grupo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomBudgetManager;
