import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Tag as TagType } from '../types';
import { CATEGORIES_MAP, INCOME_CATEGORIES_MAP } from '../constants';
import { Calendar, CreditCard, Tag, Plus, Trash2, CheckCircle, Clock, Edit2, Save, X, Repeat, Divide } from 'lucide-react';

interface ExpenseManagerProps {
  transactions: Transaction[];
  onAddTransaction: (t: Partial<Transaction>) => void;
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  type: TransactionType;
  tags: TagType[];
}

const ExpenseManager: React.FC<ExpenseManagerProps> = ({ transactions, onAddTransaction, onUpdateTransaction, onDeleteTransaction, type, tags }) => {
  const filteredTransactions = transactions.filter(t => t.type === type);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const targetMap = type === 'income' ? INCOME_CATEGORIES_MAP : CATEGORIES_MAP;
  const categoriesList = Object.keys(targetMap);

  // Form State
  const [formData, setFormData] = useState<Partial<Transaction>>({
    description: '',
    amount: 0,
    category: categoriesList[0],
    subCategory: targetMap[categoriesList[0]][0],
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    paymentMethod: type === 'income' ? 'PIX' : 'Cartão de Crédito',
    type: type,
    isPaid: type === 'income',
    recurrence: 'one_time',
    installmentCount: 2,
    tags: []
  });

  const [customCategory, setCustomCategory] = useState('');
  const [customSubCategory, setCustomSubCategory] = useState('');

  // Installment Logic State
  const [installmentValueType, setInstallmentValueType] = useState<'total' | 'installment'>('total');
  const [inputValue, setInputValue] = useState<string>(''); // Raw input for amount

  useEffect(() => {
    // Reset defaults when type changes
    setFormData(prev => ({
      ...prev,
      type: type,
      category: categoriesList[0],
      subCategory: targetMap[categoriesList[0]][0],
      isPaid: type === 'income',
      paymentMethod: type === 'income' ? 'PIX' : 'Cartão de Crédito',
      recurrence: 'one_time',
      tags: []
    }));
  }, [type]);

  // Handle Input Value Change
  useEffect(() => {
    if (formData.amount) {
      setInputValue(formData.amount.toString());
    } else if (!editingId) {
      setInputValue('');
    }
  }, [formData.amount, editingId]);

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    setFormData({ ...t });
    setInputValue(t.amount.toString()); // Load amount into input

    if (categoriesList.includes(t.category)) {
      setCustomCategory('');
      setCustomSubCategory('');
    } else {
      setFormData(prev => ({ ...prev, category: 'Outros' }));
      setCustomCategory(t.category);
      setCustomSubCategory(t.subCategory || '');
    }

    // When editing, we usually see the per-installment value
    setInstallmentValueType('installment');

    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalCategory = formData.category;
    let finalSubCategory = formData.subCategory;

    if (formData.category === 'Outros') {
      finalCategory = customCategory || 'Outros';
      finalSubCategory = customSubCategory || 'Diversos';
    }

    // Calculate final monthly amount based on installment logic
    let finalAmount = parseFloat(inputValue);
    let finalInstallmentTotal = undefined;

    if (formData.recurrence === 'installment' && formData.installmentCount && formData.installmentCount > 1) {
      if (installmentValueType === 'total') {
        finalInstallmentTotal = finalAmount;
        finalAmount = finalAmount / formData.installmentCount;
      } else {
        finalInstallmentTotal = finalAmount * formData.installmentCount;
        // finalAmount is already the installment value
      }
    }

    const transactionData: Partial<Transaction> = {
      ...formData,
      amount: finalAmount,
      category: finalCategory,
      subCategory: finalSubCategory,
      installmentTotal: finalInstallmentTotal,
      // Ensure type is correct
      type: type
    };

    if (editingId) {
      onUpdateTransaction(editingId, transactionData);
      setEditingId(null);
    } else {
      onAddTransaction(transactionData);
    }

    setIsFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: 0,
      category: categoriesList[0],
      subCategory: targetMap[categoriesList[0]][0],
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      paymentMethod: type === 'income' ? 'PIX' : 'Cartão de Crédito',
      type: type,
      isPaid: type === 'income',
      recurrence: 'one_time',
      installmentCount: 2,
      tags: []
    });
    setCustomCategory('');
    setCustomSubCategory('');
    setInputValue('');
    setInstallmentValueType('total');
  };

  const toggleStatus = (id: string, currentStatus: boolean) => {
    onUpdateTransaction(id, { isPaid: !currentStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">
          Gerenciar {type === 'expense' ? 'Despesas' : 'Receitas'}
        </h2>
        <button
          onClick={() => {
            if (isFormOpen && editingId) { setIsFormOpen(false); setEditingId(null); resetForm(); }
            else setIsFormOpen(!isFormOpen);
          }}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all shadow-lg ${isFormOpen ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-cyan-600 text-slate-950 font-bold hover:bg-cyan-500 shadow-cyan-900/20'}`}
        >
          {isFormOpen ? <X size={20} /> : <Plus size={20} />}
          <span>{isFormOpen ? 'Cancelar' : 'Novo Lançamento'}</span>
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur-md p-4 md:p-6 rounded-2xl border border-slate-800 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
              {editingId ? <Edit2 size={16} /> : <Plus size={16} />}
              {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Descrição</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium text-slate-200 placeholder:text-slate-600"
                placeholder={type === 'income' ? "Ex: Salário" : "Ex: Compra"}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Recurrence Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Periodicidade</label>
              <div className="flex flex-col sm:flex-row bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 sm:gap-0">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, recurrence: 'one_time' })}
                  className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${formData.recurrence === 'one_time' ? 'bg-slate-800 shadow-sm text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Única
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, recurrence: 'installment' })}
                  className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${formData.recurrence === 'installment' ? 'bg-slate-800 shadow-sm text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Parcelada
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, recurrence: 'fixed' })}
                  className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${formData.recurrence === 'fixed' ? 'bg-slate-800 shadow-sm text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Fixa Mensal
                </button>
              </div>
            </div>

            {/* Installments Logic - Only if Parcelada */}
            {formData.recurrence === 'installment' && (
              <div className="space-y-4 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-cyan-900/10 p-4 rounded-xl border border-cyan-500/20 animate-in fade-in zoom-in duration-300">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-cyan-400 uppercase ml-1">
                    {type === 'income' ? 'Nº de Meses/Vezes' : 'Nº Parcelas'}
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="999"
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-cyan-500/30 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-bold text-cyan-400 text-center"
                    value={formData.installmentCount}
                    onChange={e => setFormData({ ...formData, installmentCount: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-cyan-400 uppercase ml-1">O valor informado é:</label>
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-950/50 p-2 rounded-lg border border-cyan-500/20 hover:bg-slate-900/80 transition-colors">
                      <input
                        type="radio"
                        name="valueType"
                        checked={installmentValueType === 'installment'}
                        onChange={() => setInstallmentValueType('installment')}
                        className="text-cyan-500 focus:ring-cyan-500 bg-slate-800 border-slate-700"
                        style={{ minWidth: '16px' }}
                      />
                      <span className="text-sm font-medium text-slate-300 break-words">
                        {type === 'income' ? 'Valor Mensal' : 'Valor da Parcela'}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-950/50 p-2 rounded-lg border border-cyan-500/20 hover:bg-slate-900/80 transition-colors">
                      <input
                        type="radio"
                        name="valueType"
                        checked={installmentValueType === 'total'}
                        onChange={() => setInstallmentValueType('total')}
                        className="text-cyan-500 focus:ring-cyan-500 bg-slate-800 border-slate-700"
                        style={{ minWidth: '16px' }}
                      />
                      <span className="text-sm font-medium text-slate-300 break-words">
                        {type === 'income' ? 'Valor Total' : 'Valor Total'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Value Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                {formData.recurrence === 'installment'
                  ? (installmentValueType === 'total' ? 'Valor Total (R$)' : 'Valor da Parcela (R$)')
                  : 'Valor (R$)'
                }
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-black text-slate-200 placeholder:text-slate-600"
                placeholder="0.00"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
              />
              {formData.recurrence === 'installment' && inputValue && (
                <div className="text-[10px] font-bold text-cyan-400 text-right px-1">
                  {installmentValueType === 'total'
                    ? `~ R$ ${(parseFloat(inputValue) / (formData.installmentCount || 1)).toFixed(2)} por mês`
                    : `Total: R$ ${(parseFloat(inputValue) * (formData.installmentCount || 1)).toFixed(2)}`
                  }
                </div>
              )}
            </div>

            {/* Category Select */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Categoria</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-slate-200"
                value={formData.category}
                onChange={e => {
                  const cat = e.target.value;
                  setFormData({ ...formData, category: cat, subCategory: targetMap[cat] ? targetMap[cat][0] : '' });
                }}
              >
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Custom Input for 'Outros' */}
            {formData.category === 'Outros' ? (
              <>
                <div className="space-y-1 animate-in fade-in zoom-in duration-300">
                  <label className="text-xs font-bold text-cyan-400 uppercase ml-1">Nome da Categoria</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-cyan-500/30 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-slate-200"
                    placeholder="Digite a categoria..."
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                  />
                </div>
                <div className="space-y-1 animate-in fade-in zoom-in duration-300">
                  <label className="text-xs font-bold text-cyan-400 uppercase ml-1">Nome da Subcategoria</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-cyan-500/30 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-slate-200"
                    placeholder="Digite a subcategoria..."
                    value={customSubCategory}
                    onChange={e => setCustomSubCategory(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Subcategoria</label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-slate-200"
                  value={formData.subCategory}
                  onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                >
                  {targetMap[formData.category as string]?.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Data Lançamento</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-slate-200 schema-dark"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            {type === 'expense' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Data Vencimento</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-slate-200 schema-dark"
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            )}

            {/* Payment Method - Dynamic based on Type */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Método</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-slate-200"
                value={formData.paymentMethod}
                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                {type === 'expense' ? (
                  <>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="PIX">PIX</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Débito">Débito</option>
                    <option value="Transferência">Transferência</option>
                  </>
                ) : (
                  <>
                    <option value="PIX">PIX</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Outros">Outros</option>
                  </>
                )}
              </select>
            </div>

            {/* Paid Toggle */}
            <div className="flex items-end pb-1 md:col-span-2 lg:col-span-1">
              <label className={`flex items-center space-x-3 cursor-pointer p-2.5 rounded-xl border transition-all w-full ${formData.isPaid ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-950 border-slate-800'}`}>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded-lg border-slate-600 bg-slate-800 text-cyan-600 focus:ring-cyan-500 scale-100 accent-emerald-500"
                  checked={formData.isPaid}
                  onChange={e => setFormData({ ...formData, isPaid: e.target.checked })}
                />
                <span className={`text-sm font-bold ${formData.isPaid ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {formData.isPaid
                    ? (type === 'income' ? 'Recebido' : 'Pago')
                    : (type === 'income' ? 'Pendente de Recebimento' : 'Pendente de Pagamento')
                  }
                </span>
              </label>
            </div>

            {/* Tags Selector */}
            <div className="md:col-span-2 lg:col-span-3 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tags</label>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl min-h-[50px]">
                {tags.map(tag => {
                  const isSelected = formData.tags?.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        const currentTags = formData.tags || [];
                        const newTags = isSelected
                          ? currentTags.filter(id => id !== tag.id)
                          : [...currentTags, tag.id];
                        setFormData({ ...formData, tags: newTags });
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-full transition-all border-2 ${isSelected
                        ? 'bg-slate-800 shadow-sm text-white'
                        : 'bg-transparent border-transparent text-slate-600 opacity-60 hover:opacity-100 hover:bg-slate-900'
                        }`}
                      style={{
                        borderColor: isSelected ? tag.color : 'transparent',
                        color: isSelected ? tag.color : undefined,
                        backgroundColor: isSelected ? 'rgba(30, 41, 59, 1)' : 'transparent' // Force dark bg
                      }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
                {tags.length === 0 && (
                  <span className="text-xs text-slate-600 italic">Nenhuma tag criada. Vá em "Tags" para adicionar.</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all"
            >
              <Save size={18} />
              <span>{editingId ? 'Atualizar' : 'Salvar Registro'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/50">
              <tr>
                <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Info</th>
                <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
                <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Recorrência</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Valor</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-cyan-500/5 transition-colors group">
                  <td className="hidden md:table-cell px-6 py-4">
                    <button
                      onClick={() => toggleStatus(t.id, t.isPaid)}
                      className="transition-transform active:scale-95 focus:outline-none"
                      title="Clique para alterar status"
                    >
                      {t.isPaid ? (
                        <div className="flex items-center text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                          <CheckCircle size={14} className="mr-1" /> {type === 'income' ? 'RECEBIDO' : 'PAGO'}
                        </div>
                      ) : (
                        <div className="flex items-center text-amber-500 text-xs font-bold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                          <Clock size={14} className="mr-1" /> PENDENTE
                        </div>
                      )}
                    </button>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="font-bold text-slate-200 text-sm">{t.description}</div>
                    <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                      <span className="md:hidden flex items-center bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                        {t.category}
                      </span>
                      <span className="flex items-center">
                        <CreditCard size={10} className="mr-1" /> {t.paymentMethod}
                      </span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-cyan-500 flex items-center">
                        <Tag size={10} className="mr-1" /> {t.category}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-3.5">{t.subCategory}</span>
                      {t.tags && t.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1 ml-3.5">
                          {t.tags.map(tagId => {
                            const tag = tags.find(tg => tg.id === tagId);
                            if (!tag) return null;
                            return (
                              <span key={tagId} className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white shadow-sm" style={{ backgroundColor: tag.color }}>
                                {tag.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4">
                    {t.recurrence === 'fixed' && (
                      <div className="flex items-center text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg w-fit border border-indigo-500/20">
                        <Repeat size={12} className="mr-1" /> Mensal
                      </div>
                    )}
                    {t.recurrence === 'installment' && (
                      <div className="flex items-center text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg w-fit border border-orange-500/20">
                        <Divide size={12} className="mr-1" /> {t.installmentCount}x
                      </div>
                    )}
                    {(!t.recurrence || t.recurrence === 'one_time') && (
                      <span className="text-xs text-slate-600 font-medium">Única</span>
                    )}
                  </td>
                  <td className={`px-4 md:px-6 py-4 text-sm font-black text-right ${t.type === 'income' ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]' : 'text-rose-400 drop-shadow-[0_0_5px_rgba(251,113,133,0.3)]'}`}>
                    <div>R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <button
                      onClick={() => toggleStatus(t.id, t.isPaid)}
                      className={`md:hidden text-[10px] font-bold px-1.5 py-0.5 rounded border mt-1 ${t.isPaid
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}
                    >
                      {t.isPaid ? 'OK' : 'Pendente'}
                    </button>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-2 text-slate-500 hover:text-cyan-400 transition-colors rounded-lg hover:bg-slate-800"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(t.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-800"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-600 italic">
                    Nenhum registro encontrado para {type === 'income' ? 'receitas' : 'despesas'}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default ExpenseManager;
