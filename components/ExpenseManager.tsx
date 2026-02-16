import React, { useState, useEffect } from 'react';
import DailyHistory from './DailyHistory';
import { Transaction, TransactionType, Tag as TagType, Account } from '../types';
import { CATEGORIES_MAP, INCOME_CATEGORIES_MAP } from '../constants';
import { Calendar, CreditCard, Tag, Plus, Trash2, CheckCircle, Clock, Edit2, Save, X, Repeat, Divide, ChevronDown, ChevronUp, Paperclip, FileText, PieChart, Wallet, Calculator, Camera, Image, XCircle } from 'lucide-react';

interface ExpenseManagerProps {
  transactions: Transaction[];
  onAddTransaction: (t: Partial<Transaction>) => void;
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  type: TransactionType;
  tags: TagType[];
  accounts: Account[];
  allTransactions?: Transaction[];
}

const ExpenseManager: React.FC<ExpenseManagerProps> = ({ transactions, onAddTransaction, onUpdateTransaction, onDeleteTransaction, type, tags, accounts, allTransactions }) => {
  const filteredTransactions = transactions.filter(t => t.type === type);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
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

  // New Income/General Fields
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState<string>('');
  const [attachment, setAttachment] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Toggles
  const [ignoreInStatistics, setIgnoreInStatistics] = useState<boolean>(false);
  const [ignoreInBudgets, setIgnoreInBudgets] = useState<boolean>(false);
  const [ignoreInTotals, setIgnoreInTotals] = useState<boolean>(false);

  // UI State
  const [showMoreInfo, setShowMoreInfo] = useState(false);

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
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setAccountId(accounts.length > 0 ? accounts[0].id : '');
    setAttachment('');
    setNotes('');
    setIgnoreInStatistics(false);
    setIgnoreInBudgets(false);
    setIgnoreInTotals(false);
    setShowMoreInfo(false);
  }, [type, accounts]);

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

    // Load extra fields
    setPaymentDate(t.paymentDate || new Date().toISOString().split('T')[0]);
    setAccountId(t.account || (accounts.length > 0 ? accounts[0].id : ''));
    setAttachment(t.attachment || '');
    setNotes(t.notes || '');
    setIgnoreInStatistics(!!t.ignoreInStatistics);
    setIgnoreInBudgets(!!t.ignoreInBudgets);
    setIgnoreInTotals(!!t.ignoreInTotals);

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
      type: type,
      paymentDate: paymentDate,
      account: accountId,
      attachment: attachment,
      notes: notes,
      ignoreInStatistics: ignoreInStatistics,
      ignoreInBudgets: ignoreInBudgets,
      ignoreInTotals: ignoreInTotals
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

    // Reset New Fields
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setAccountId(accounts.length > 0 ? accounts[0].id : '');
    setAttachment('');
    setNotes('');
    setIgnoreInStatistics(false);
    setIgnoreInBudgets(false);
    setIgnoreInTotals(false);
    setShowMoreInfo(false);
  };

  // Helper to compress image
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max width/height
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check initial size (warn if > 10MB, but try to compress anyway)
      if (file.size > 10 * 1024 * 1024) {
        alert("O arquivo é muito grande (acima de 10MB). Tente uma foto menor.");
        return;
      }

      try {
        const compressedBase64 = await compressImage(file);
        setAttachment(compressedBase64);
      } catch (error) {
        console.error("Erro ao comprimir imagem:", error);
        alert("Erro ao processar a imagem. Tente novamente.");
      } finally {
        // Reset input so user can select same file again if needed
        e.target.value = '';
      }
    }
  };

  const toggleStatus = (id: string, currentStatus: boolean) => {
    onUpdateTransaction(id, { isPaid: !currentStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Gerenciar {type === 'expense' ? 'Despesas' : 'Receitas'}
        </h2>
        <div className="flex gap-2 w-full sm:w-auto">
          {type === 'income' && (
            <button
              onClick={() => setShowHistory(true)}
              className="p-2 sm:px-4 sm:py-2 bg-white text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all shadow-sm border border-slate-200 flex items-center justify-center gap-2"
              title="Ver Extrato Diário"
            >
              <FileText size={20} />
              <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider">Extrato</span>
            </button>
          )}

          <button
            onClick={() => {
              if (isFormOpen && editingId) { setIsFormOpen(false); setEditingId(null); resetForm(); }
              else setIsFormOpen(!isFormOpen);
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl transition-all shadow-sm font-bold ${isFormOpen ? 'bg-white text-slate-500 border border-slate-200' : 'bg-sky-600 text-white hover:bg-sky-500 shadow-sky-100'}`}
          >
            {isFormOpen ? <X size={20} /> : <Plus size={20} />}
            <span className="uppercase tracking-wider text-xs">{isFormOpen ? 'Cancelar' : 'Novo Lançamento'}</span>
          </button>
        </div>
      </div>

      {showHistory && (
        <DailyHistory
          transactions={allTransactions || transactions}
          accounts={accounts}
          onClose={() => setShowHistory(false)}
        />
      )}

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                placeholder={type === 'income' ? "Ex: Salário" : "Ex: Compra"}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Recurrence Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Periodicidade</label>
              <div className="flex flex-col sm:flex-row bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 sm:gap-0">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, recurrence: 'one_time' })}
                  className={`flex-1 py-2 px-2 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap uppercase tracking-widest ${formData.recurrence === 'one_time' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Única
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, recurrence: 'installment' })}
                  className={`flex-1 py-2 px-2 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap uppercase tracking-widest ${formData.recurrence === 'installment' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Parcelada
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, recurrence: 'fixed' })}
                  className={`flex-1 py-2 px-2 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap uppercase tracking-widest ${formData.recurrence === 'fixed' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Fixa Mensal
                </button>
              </div>
            </div>

            {/* Installments Logic - Only if Parcelada */}
            {formData.recurrence === 'installment' && (
              <div className="space-y-4 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-sky-50/50 p-4 rounded-xl border border-sky-100 animate-in fade-in zoom-in duration-300">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-sky-600 uppercase ml-1">
                    {type === 'income' ? 'Nº de Meses/Vezes' : 'Nº Parcelas'}
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="999"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-sky-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all font-bold text-sky-600 text-center"
                    value={formData.installmentCount}
                    onChange={e => setFormData({ ...formData, installmentCount: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-sky-600 uppercase ml-1">O valor informado é:</label>
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-sky-100 hover:bg-sky-50 transition-colors shadow-sm">
                      <input
                        type="radio"
                        name="valueType"
                        checked={installmentValueType === 'installment'}
                        onChange={() => setInstallmentValueType('installment')}
                        className="text-sky-600 focus:ring-sky-500 bg-white border-slate-300"
                        style={{ minWidth: '16px' }}
                      />
                      <span className="text-sm font-medium text-slate-700 break-words">
                        {type === 'income' ? 'Valor Mensal' : 'Valor da Parcela'}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-sky-100 hover:bg-sky-50 transition-colors shadow-sm">
                      <input
                        type="radio"
                        name="valueType"
                        checked={installmentValueType === 'total'}
                        onChange={() => setInstallmentValueType('total')}
                        className="text-sky-600 focus:ring-sky-500 bg-white border-slate-300"
                        style={{ minWidth: '16px' }}
                      />
                      <span className="text-sm font-medium text-slate-700 break-words">
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-black text-slate-900 placeholder:text-slate-400"
                placeholder="0.00"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
              />
              {formData.recurrence === 'installment' && inputValue && (
                <div className="text-[10px] font-bold text-sky-600 text-right px-1">
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 transition-all text-slate-900 font-medium"
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
                    className="w-full px-4 py-2.5 bg-white border border-sky-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium text-slate-900"
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
                    className="w-full px-4 py-2.5 bg-white border border-sky-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium text-slate-900"
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 transition-all text-slate-900 font-medium"
                  value={formData.subCategory}
                  onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                >
                  {targetMap[formData.category as string]?.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Account Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Conta / Carteira</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 transition-all text-slate-900 font-medium appearance-none"
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                >
                  <option value="" disabled>Selecione uma conta</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                  {accounts.length === 0 && <option value="default">Conta Padrão</option>}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <Wallet size={16} />
                </div>
              </div>
            </div>

            {/* Date Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Data Lançamento</label>
              <input
                type="date"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 transition-all text-slate-900 font-medium"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>




            {(type === 'income' || type === 'expense') && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  {type === 'income' ? 'Data Vencimento (Prevista)' : 'Data Vencimento'}
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 transition-all text-slate-900 font-medium"
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            )}

            {/* Effective Date (Data de Efetivação) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Data Efetivação</label>
              <input
                type="date"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 transition-all text-slate-900 font-medium"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
              />
            </div>

            {/* Payment Method - Dynamic based on Type */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Método</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 transition-all text-slate-900 font-medium"
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
              <label className={`flex items-center space-x-3 cursor-pointer p-3 rounded-xl border transition-all w-full ${formData.isPaid ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded-lg border-slate-300 bg-white text-sky-600 focus:ring-sky-500 scale-100 accent-emerald-600"
                  checked={formData.isPaid}
                  onChange={e => setFormData({ ...formData, isPaid: e.target.checked })}
                />
                <span className={`text-[10px] font-black uppercase tracking-widest ${formData.isPaid ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {formData.isPaid
                    ? (type === 'income' ? 'Recebido' : 'Pago')
                    : (type === 'income' ? 'Pendente' : 'Pendente')
                  }
                </span>
              </label>
            </div>

            {/* Tags Selector */}
            <div className="md:col-span-2 lg:col-span-3 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tags</label>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[50px]">
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
                      className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all border ${isSelected
                        ? 'shadow-sm text-white'
                        : 'bg-white border-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:bg-slate-50'
                        }`}
                      style={{
                        borderColor: isSelected ? tag.color : undefined,
                        backgroundColor: isSelected ? tag.color : undefined
                      }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
                {tags.length === 0 && (
                  <span className="text-xs text-slate-400 italic">Nenhuma tag criada.</span>
                )}
              </div>
            </div>


            {/* Divider for More Info */}
            <div className="md:col-span-2 lg:col-span-3 pt-2">
              <button
                type="button"
                onClick={() => setShowMoreInfo(!showMoreInfo)}
                className="flex items-center gap-2 text-[10px] font-bold text-sky-600 hover:text-sky-700 transition-colors uppercase tracking-widest"
              >
                {showMoreInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Mais Informações
              </button>
            </div>

            {/* Expandable Section */}
            {
              showMoreInfo && (
                <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-500 bg-slate-50 p-4 rounded-xl border border-slate-100">

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
                      <Paperclip size={12} /> Anexo / Comprovante
                    </label>
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        placeholder="Cole o link do documento ou foto aqui..."
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 transition-all text-slate-900 text-sm font-medium"
                        value={attachment.startsWith('data:image') ? 'Imagem anexada' : attachment}
                        onChange={e => setAttachment(e.target.value)}
                        readOnly={attachment.startsWith('data:image')}
                      />

                      <div className="flex flex-wrap gap-2">
                        <input
                          type="file"
                          id="cameraInput"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('cameraInput')?.click()}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest"
                        >
                          <Camera size={14} className="text-sky-600" />
                          Bater Foto
                        </button>

                        <input
                          type="file"
                          id="fileInput"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('fileInput')?.click()}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest"
                        >
                          <Image size={14} className="text-emerald-600" />
                          Importar
                        </button>

                        {attachment && (
                          <button
                            type="button"
                            onClick={() => setAttachment('')}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-bold text-rose-600 hover:bg-rose-100 transition-all uppercase tracking-widest"
                          >
                            <Trash2 size={14} />
                            Remover Anexo
                          </button>
                        )}
                      </div>

                      {attachment && attachment.startsWith('data:image') && (
                        <div className="relative w-full max-w-[200px] h-[200px] rounded-2xl overflow-hidden border-4 border-white shadow-lg animate-in fade-in zoom-in duration-300">
                          <img src={attachment} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setAttachment('')}
                            className="absolute top-2 right-2 p-1 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 italic px-1 mt-1">
                      * As fotos são salvas em formato otimizado para não pesar no sistema.
                    </p>
                  </div>

                  {/* Observations */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
                      <FileText size={12} /> Observações
                    </label>
                    <textarea
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 transition-all text-slate-900 text-sm font-medium min-h-[80px]"
                      placeholder="Detalhes adicionais sobre este lançamento..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>

                  {/* Toggles */}
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 paddingTop-2">
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 bg-white text-rose-500 focus:ring-rose-500"
                        checked={ignoreInStatistics}
                        onChange={e => setIgnoreInStatistics(e.target.checked)}
                      />
                      <span className="text-xs font-bold text-slate-500">Ignorar em Gráficos</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 bg-white text-rose-500 focus:ring-rose-500"
                        checked={ignoreInBudgets}
                        onChange={e => setIgnoreInBudgets(e.target.checked)}
                      />
                      <span className="text-xs font-bold text-slate-500">Ignorar Orçamentos</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 bg-white text-rose-500 focus:ring-rose-500"
                        checked={ignoreInTotals}
                        onChange={e => setIgnoreInTotals(e.target.checked)}
                      />
                      <span className="text-xs font-bold text-slate-500">Ignorar Totais</span>
                    </label>
                  </div>
                </div>
              )
            }
          </div >
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all uppercase tracking-widest text-xs"
            >
              <Save size={18} />
              <span>{editingId ? 'Atualizar' : 'Salvar Registro'}</span>
            </button>
          </div>
        </form >
      )
      }

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto relative">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="sticky left-0 z-20 bg-slate-50 px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-[80px]">Status</th>
                <th className="sticky left-[80px] z-20 bg-slate-50 px-4 md:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[200px]">Info</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Recorrência</th>
                <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Valor</th>
                <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-cyan-500/5 transition-colors group">
                  <td className="sticky left-0 z-10 bg-white px-4 py-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] w-[80px]">
                    <button
                      onClick={() => toggleStatus(t.id, t.isPaid)}
                      className="transition-transform active:scale-95 focus:outline-none w-full flex justify-center"
                      title="Clique para alterar status"
                    >
                      {t.isPaid ? (
                        <div className="flex items-center justify-center text-emerald-600 bg-emerald-50 w-8 h-8 rounded-full border border-emerald-100">
                          <CheckCircle size={16} />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center text-amber-600 bg-amber-50 w-8 h-8 rounded-full border border-amber-100">
                          <Clock size={16} />
                        </div>
                      )}
                    </button>
                    {/* Mobile text label below icon if needed, or just keep icon for compactness */}
                  </td>
                  <td className="sticky left-[80px] z-10 bg-white px-4 md:px-6 py-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] min-w-[200px]">
                    <div className="font-bold text-slate-900 text-sm truncate max-w-[180px]" title={t.description}>{t.description}</div>
                    <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">
                      <span className="flex items-center whitespace-nowrap">
                        <CreditCard size={10} className="mr-1" /> {t.paymentMethod}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-sky-600 flex items-center uppercase tracking-widest px-2 py-1 bg-sky-50 border border-sky-100 rounded-lg w-fit">
                        <Tag size={10} className="mr-1" /> {t.category}
                      </span>
                      {t.subCategory && <span className="text-[10px] text-slate-400 mt-1 font-bold ml-1 uppercase">{t.subCategory}</span>}
                      {t.tags && t.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1 ml-1">
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {t.recurrence === 'fixed' && (
                      <div className="flex items-center text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg w-fit border border-indigo-100 uppercase tracking-widest">
                        <Repeat size={12} className="mr-1" /> Mensal
                      </div>
                    )}
                    {t.recurrence === 'installment' && (
                      <div className="flex items-center text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg w-fit border border-orange-100 uppercase tracking-widest">
                        <Divide size={12} className="mr-1" /> {t.installmentCount}x
                      </div>
                    )}
                    {(!t.recurrence || t.recurrence === 'one_time') && (
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Única</span>
                    )}
                  </td>
                  <td className={`px-4 md:px-6 py-4 text-sm font-black text-right whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <div>R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-2 text-slate-400 hover:text-sky-600 transition-colors rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(t.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
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

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col divide-y divide-slate-100">
          {filteredTransactions.map((t) => (
            <div key={t.id} className="p-3 bg-white hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{t.description}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                      <CreditCard size={10} className="mr-1" /> {t.paymentMethod}
                    </span>
                    <span className="text-[10px] text-slate-400">|</span>
                    <span className="text-[10px] text-slate-400">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end mr-2">
                  <div className={`text-sm font-black whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1">
                    <button
                      onClick={() => toggleStatus(t.id, t.isPaid)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${t.isPaid
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}
                    >
                      {t.isPaid ? <CheckCircle size={10} /> : <Clock size={10} />}
                      {t.isPaid ? 'Pago' : 'Pendente'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-sky-600 flex items-center uppercase tracking-widest px-2 py-0.5 bg-sky-50 border border-sky-100 rounded w-fit">
                    <Tag size={10} className="mr-1" /> {t.category}
                  </span>
                  {t.recurrence && t.recurrence !== 'one_time' && (
                    <span className="text-[9px] text-slate-400 font-bold uppercase ml-1 flex items-center">
                      {t.recurrence === 'installment' ? <Divide size={10} className="mr-1" /> : <Repeat size={10} className="mr-1" />}
                      {t.recurrence === 'installment' ? `${t.installmentCount}x` : 'Mensal'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleEdit(t)}
                    className="p-2 bg-slate-50 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl border border-slate-100 transition-all active:scale-95"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onDeleteTransaction(t.id)}
                    className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-100 transition-all active:scale-95"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-600 italic text-sm">
              Nenhum registro encontrado.
            </div>
          )}
        </div>
      </div>
    </div >
  );
};
export default ExpenseManager;
