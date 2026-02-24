import React, { useState, useEffect } from 'react';
import DailyHistory from './DailyHistory';
import { Transaction, TransactionType, Tag as TagType, Account } from '../types';
import { CATEGORIES_MAP, INCOME_CATEGORIES_MAP, BANKS } from '../constants';
import { Calendar, CreditCard, Tag, Plus, Trash2, CheckCircle, Clock, Edit2, Save, X, Repeat, Divide, ChevronDown, ChevronUp, Paperclip, FileText, PieChart, Wallet, Calculator, Camera, Image, XCircle, Sparkles, Loader2 } from 'lucide-react';
import { analyzeOCRText } from '../aiService';
import { transcribeImage } from '../ocrService';

interface ExpenseManagerProps {
  transactions: Transaction[];
  onAddTransaction: (t: Partial<Transaction>) => void;
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  type: TransactionType;
  tags: TagType[];
  accounts: Account[];
  familyMembers?: Record<string, { name: string, avatar: string }>;
  allTransactions?: Transaction[];
  onOpenAccountModal?: () => void;
}

const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  type,
  tags,
  accounts,
  familyMembers,
  allTransactions,
  onOpenAccountModal
}) => {
  const filteredTransactions = transactions.filter(t => t.type === type);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);

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
  const [isScanning, setIsScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

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

    // Pre-select default account if available
    const defaultAcc = accounts.find(a => a.isDefault);
    setAccountId(defaultAcc ? defaultAcc.id : (accounts.length > 0 ? accounts[0].id : ''));

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

    setInstallmentValueType('installment');

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

    if (accounts.length === 0) {
      if (onOpenAccountModal) {
        onOpenAccountModal();
      } else {
        alert("Você precisa cadastrar uma conta primeiro.");
      }
      return;
    }

    if (!accountId || accountId === '') {
      alert("Selecione uma conta para continuar.");
      return;
    }

    let finalCategory = formData.category;
    let finalSubCategory = formData.subCategory;

    if (formData.category === 'Outros') {
      finalCategory = customCategory || 'Outros';
      finalSubCategory = customSubCategory || 'Diversos';
    }

    let finalAmount = parseFloat(inputValue);
    let finalInstallmentTotal = undefined;

    if (formData.recurrence === 'installment' && formData.installmentCount && formData.installmentCount > 1) {
      if (installmentValueType === 'total') {
        finalInstallmentTotal = finalAmount;
        finalAmount = finalAmount / formData.installmentCount;
      } else {
        finalInstallmentTotal = finalAmount * formData.installmentCount;
      }
    }

    const transactionData: Partial<Transaction> = {
      ...formData,
      amount: finalAmount,
      category: finalCategory,
      subCategory: finalSubCategory,
      installmentTotal: finalInstallmentTotal,
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

    setPaymentDate(new Date().toISOString().split('T')[0]);
    setAccountId(accounts.length > 0 ? accounts[0].id : '');
    setAttachment('');
    setNotes('');
    setIgnoreInStatistics(false);
    setIgnoreInBudgets(false);
    setIgnoreInTotals(false);
    setShowMoreInfo(false);
  };

  // Helper to compress and optionally enhance image for OCR
  const compressImage = (file: File, enhance = false): Promise<string> => {
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

          // Max width/height - optimized for Groq Vision (limit 4MB)
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;

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

          if (ctx) {
            if (enhance) {
              // Apply filters to make text pop for OCR
              ctx.filter = 'contrast(1.4) brightness(1.05) grayscale(0.2)';
            }
            ctx.drawImage(img, 0, 0, width, height);
          }

          // Compress to JPEG 0.8 quality (balanced for OCR and File Size)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isForScan = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("O arquivo é muito grande (acima de 10MB). Tente uma foto menor.");
        return;
      }

      try {
        // Enhance only if it's for scanning
        const compressedBase64 = await compressImage(file, isForScan);
        setAttachment(compressedBase64);

        if (isForScan) {
          handleScanReceipt(compressedBase64);
        }
      } catch (error) {
        console.error("Erro ao processar imagem:", error);
        alert("Erro ao processar a imagem. Tente novamente.");
      } finally {
        e.target.value = '';
      }
    }
  };

  const handleScanReceipt = async (base64Image: string) => {
    setIsScanning(true);
    setOcrProgress(0);
    try {
      // Step 1: Transcribe localmente
      const rawText = await transcribeImage(base64Image, (p) => setOcrProgress(p));

      if (!rawText || rawText.trim().length < 5) {
        throw new Error("Não foi possível extrair texto da imagem.");
      }

      // Step 2: Analisar texto com IA
      const result = await analyzeOCRText(rawText);

      if (result && !result.error) {
        // Update form with AI data
        setFormData(prev => ({
          ...prev,
          description: result.description || prev.description,
          amount: result.amount || prev.amount,
          category: result.category || prev.category,
          subCategory: result.subCategory || prev.subCategory,
          date: result.date || prev.date,
          paymentMethod: result.paymentMethod || prev.paymentMethod,
          recurrence: result.type === 'parcelada' ? 'installment' : 'one_time',
          installmentCount: (result.type === 'parcelada' && result.installments?.total) ? result.installments.total : prev.installmentCount
        }));

        if (result.amount) {
          setInputValue(result.amount.toString());
        }

        const targetMap = type === 'income' ? INCOME_CATEGORIES_MAP : CATEGORIES_MAP;
        if (!Object.keys(targetMap).includes(result.category)) {
          setFormData(prev => ({ ...prev, category: 'Outros' }));
          setCustomCategory(result.category);
          setCustomSubCategory(result.subCategory || '');
        }

        const installmentMsg = result.type === 'parcelada'
          ? ` (Parcelado ${result.installments?.current || 1}/${result.installments?.total || 1})`
          : ' (Única)';

        alert(`FinAI: Identifiquei "${result.description}" no valor de R$ ${result.amount}${installmentMsg}.`);
      } else {
        alert("FinAI: Não consegui interpretar os dados do comprovante.");
      }
    } catch (error: any) {
      console.error("Erro no OCR Híbrido:", error);
      alert(`Erro no Scanner: ${error.message || "Tente uma foto mais nítida."}`);
    } finally {
      setIsScanning(false);
      setOcrProgress(0);
    }
  };

  const toggleStatus = (id: string, currentStatus: boolean) => {
    onUpdateTransaction(id, { isPaid: !currentStatus });
  };

  const getAccountInfo = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return null;
    const bank = BANKS.find(b => b.id === account.bankId);
    return { ...account, bankLogo: bank?.logoUrl };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Gerenciar {type === 'expense' ? 'Despesas' : 'Receitas'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Organize seu fluxo financeiro</p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          {type === 'income' && (
            <button
              onClick={() => setShowHistory(true)}
              className="flex-1 sm:flex-none p-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2"
              title="Ver Extrato Diário"
            >
              <FileText size={18} />
              <span className="font-black text-[10px] uppercase tracking-widest">Extrato</span>
            </button>
          )}

          <button
            onClick={() => {
              if (!isFormOpen && accounts.length === 0) {
                if (onOpenAccountModal) {
                  onOpenAccountModal();
                  return;
                }
              }
              if (isFormOpen && editingId) { setIsFormOpen(false); setEditingId(null); resetForm(); }
              else setIsFormOpen(!isFormOpen);
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl transition-all shadow-lg font-black text-[10px] uppercase tracking-widest ${isFormOpen ? 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700' : 'bg-sky-600 text-white hover:bg-sky-700 shadow-sky-100 dark:shadow-sky-900/20'}`}
          >
            {isFormOpen ? <X size={18} /> : <Plus size={18} />}
            <span>{isFormOpen ? 'Fechar' : 'Novo Lançamento'}</span>
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

      {isFormOpen ? (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase flex items-center gap-3 tracking-widest">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
              </div>
              {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            <div className="space-y-1.5 focus-within:transform focus-within:scale-[1.01] transition-transform">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Descrição</label>
              <input
                type="text"
                required
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-bold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 text-sm"
                placeholder={type === 'income' ? "Ex: Salário Mensal" : "Ex: Supermercado"}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Periodicidade</label>
              <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/50 gap-1.5 overflow-x-auto scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, recurrence: 'one_time' })}
                  className={`flex-1 min-w-[80px] py-3 px-3 text-[10px] font-black rounded-xl transition-all whitespace-nowrap uppercase tracking-widest ${formData.recurrence === 'one_time' ? 'bg-white dark:bg-slate-900 shadow-sm text-sky-600 dark:text-sky-400 ring-1 ring-slate-100 dark:ring-slate-800' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  Única
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, recurrence: 'installment' })}
                  className={`flex-1 min-w-[80px] py-3 px-3 text-[10px] font-black rounded-xl transition-all whitespace-nowrap uppercase tracking-widest ${formData.recurrence === 'installment' ? 'bg-white dark:bg-slate-900 shadow-sm text-sky-600 dark:text-sky-400 ring-1 ring-slate-100 dark:ring-slate-800' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  Parcelada
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, recurrence: 'fixed' })}
                  className={`flex-1 min-w-[80px] py-3 px-3 text-[10px] font-black rounded-xl transition-all whitespace-nowrap uppercase tracking-widest ${formData.recurrence === 'fixed' ? 'bg-white dark:bg-slate-900 shadow-sm text-sky-600 dark:text-sky-400 ring-1 ring-slate-100 dark:ring-slate-800' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  Fixa
                </button>
              </div>
            </div>

            {formData.recurrence === 'installment' && (
              <div className="space-y-4 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-sky-50/30 dark:bg-sky-900/10 p-5 rounded-[1.5rem] border border-sky-100/50 dark:border-sky-900/30 animate-in fade-in zoom-in duration-300">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest ml-1">
                    {type === 'income' ? 'Nº de Meses' : 'Parcelas'}
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="999"
                    required
                    className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-900 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500 transition-all font-black text-sky-600 text-center"
                    value={formData.installmentCount}
                    onChange={e => setFormData({ ...formData, installmentCount: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest ml-1">O valor informado é:</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setInstallmentValueType('installment')}
                      className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${installmentValueType === 'installment' ? 'bg-white dark:bg-slate-900 border-sky-200 dark:border-sky-500 text-sky-600 shadow-sm' : 'bg-transparent border-sky-100 dark:border-sky-900 text-sky-400'}`}
                    >
                      {type === 'income' ? 'Mensal' : 'Parcela'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstallmentValueType('total')}
                      className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${installmentValueType === 'total' ? 'bg-white dark:bg-slate-900 border-sky-200 dark:border-sky-500 text-sky-600 shadow-sm' : 'bg-transparent border-sky-100 dark:border-sky-900 text-sky-400'}`}
                    >
                      Valor Total
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">
                {formData.recurrence === 'installment'
                  ? (installmentValueType === 'total' ? 'Valor Total (R$)' : 'Valor da Parcela (R$)')
                  : 'Valor (R$)'
                }
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-black text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="0.00"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
              />
              {formData.recurrence === 'installment' && inputValue && (
                <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 text-right px-1">
                  {installmentValueType === 'total'
                    ? `~ R$ ${(parseFloat(inputValue) / (formData.installmentCount || 1)).toFixed(2)} por mês`
                    : `Total: R$ ${(parseFloat(inputValue) * (formData.installmentCount || 1)).toFixed(2)}`
                  }
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Categoria</label>
              <div className="relative">
                <select
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-800 dark:text-white font-bold text-sm appearance-none cursor-pointer"
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
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <PieChart size={16} />
                </div>
              </div>
            </div>

            {formData.category === 'Outros' ? (
              <>
                <div className="space-y-1.5 animate-in fade-in zoom-in duration-300">
                  <label className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase ml-1 tracking-widest">Nome da Categoria</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-900 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-bold text-slate-800 dark:text-white"
                    placeholder="Digite a categoria..."
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 animate-in fade-in zoom-in duration-300">
                  <label className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase ml-1 tracking-widest">Nome da Subcategoria</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-900 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-bold text-slate-800 dark:text-white"
                    placeholder="Digite a subcategoria..."
                    value={customSubCategory}
                    onChange={e => setCustomSubCategory(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Subcategoria</label>
                <div className="relative">
                  <select
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-800 dark:text-white font-bold text-sm appearance-none cursor-pointer"
                    value={formData.subCategory}
                    onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                  >
                    {targetMap[formData.category as string]?.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Tag size={16} />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Conta / Carteira</label>
              <div className="relative">
                <select
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-800 dark:text-white font-bold text-sm appearance-none cursor-pointer"
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                >
                  <option value="" disabled>Selecione uma conta</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                  {accounts.length === 0 && <option value="" disabled>Crie uma conta primeiro</option>}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <Wallet size={16} />
                </div>
              </div>
            </div>

            {/* Date Inputs */}
            <div className="space-y-1.5 focus-within:transform focus-within:scale-[1.01] transition-transform">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Data Lançamento</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full pl-5 pr-10 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-800 dark:text-white font-bold text-sm appearance-none"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Calendar size={16} />
                </div>
              </div>
            </div>

            {(type === 'income' || type === 'expense') && (
              <div className="space-y-1.5 focus-within:transform focus-within:scale-[1.01] transition-transform">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">
                  {type === 'income' ? 'Vencimento (Prevista)' : 'Data Vencimento'}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className="w-full pl-5 pr-10 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-800 dark:text-white font-bold text-sm appearance-none"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Clock size={16} />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5 focus-within:transform focus-within:scale-[1.01] transition-transform">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Data Efetivação</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full pl-5 pr-10 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-800 dark:text-white font-bold text-sm appearance-none"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <CheckCircle size={16} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Método</label>
              <div className="relative">
                <select
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-800 dark:text-white font-bold text-sm appearance-none cursor-pointer"
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
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <CreditCard size={16} />
                </div>
              </div>
            </div>

            <div className="flex items-end pb-1 md:col-span-2 lg:col-span-1">
              <label className={`flex items-center space-x-4 cursor-pointer p-4 rounded-2xl border transition-all w-full ring-1 ${formData.isPaid ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30 ring-emerald-50 dark:ring-emerald-900/10' : 'bg-slate-50/50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 ring-slate-100 dark:ring-slate-800/20'}`}>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.isPaid}
                    onChange={e => setFormData({ ...formData, isPaid: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${formData.isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {formData.isPaid
                    ? (type === 'income' ? 'Recebido' : 'Pago')
                    : (type === 'income' ? 'Pendente' : 'Pendente')
                  }
                </span>
              </label>
            </div>

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

            <div className="md:col-span-2 lg:col-span-3 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
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
                disabled={isScanning}
                className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all uppercase tracking-widest disabled:opacity-50 shadow-sm"
              >
                {isScanning ? <Loader2 size={14} className="animate-spin text-sky-600" /> : <Camera size={14} className="text-sky-600" />}
                {isScanning ? 'Lendo...' : 'Bater Foto'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => handleFileUpload(e as any, true);
                  input.click();
                }}
                disabled={isScanning}
                className="flex items-center gap-2 px-4 py-3 bg-sky-600 text-white rounded-xl text-[10px] font-black hover:bg-sky-500 transition-all uppercase tracking-widest shadow-lg shadow-sky-100 dark:shadow-sky-900/20 disabled:opacity-50 relative overflow-hidden"
              >
                {isScanning && (
                  <div
                    className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300"
                    style={{ width: `${ocrProgress}%` }}
                  />
                )}
                {isScanning ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {isScanning ? (ocrProgress < 100 ? `Lendo (${ocrProgress}%)` : 'Analisando...') : 'Escanear com IA'}
              </button>

              <button
                type="button"
                onClick={() => setShowMoreInfo(!showMoreInfo)}
                className="flex items-center gap-2 ml-auto px-4 py-3 text-[10px] font-bold text-slate-400 hover:text-sky-600 transition-colors uppercase tracking-widest"
              >
                {showMoreInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Detalhes
              </button>
            </div>

            {showMoreInfo && (
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
                        id="fileInput"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('fileInput')?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all uppercase tracking-widest shadow-sm"
                      >
                        <Image size={14} className="text-emerald-600" />
                        Importar Galeria
                      </button>

                      {attachment && (
                        <button
                          type="button"
                          onClick={() => setAttachment('')}
                          className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-bold text-rose-600 hover:bg-rose-100 transition-all uppercase tracking-widest shadow-sm"
                        >
                          <Trash2 size={14} />
                          Limpar
                        </button>
                      )}
                    </div>

                    {attachment && attachment.startsWith('data:image') && (
                      <div className="relative w-full max-w-[200px] h-[200px] rounded-2xl overflow-hidden border-4 border-white shadow-lg animate-in fade-in zoom-in duration-300 mt-2">
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
            )}
          </div>
          <div className="mt-10 flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => { setIsFormOpen(false); setEditingId(null); resetForm(); }}
              className="w-full sm:w-auto px-8 py-4 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Descartar
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-emerald-100 dark:shadow-emerald-900/40 transition-all uppercase tracking-widest text-[10px]"
            >
              <Save size={18} />
              <span>{editingId ? 'Atualizar Lançamento' : 'Salvar Registro'}</span>
            </button>
          </div>
        </form >
      ) : (

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          {/* Responsive Table View for All Viewports */}
          <div className="overflow-x-auto relative scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                <tr>
                  <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 px-4 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-[80px] text-center">Status</th>
                  <th className="sticky left-[80px] z-20 bg-slate-50 dark:bg-slate-800 px-4 md:px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[200px]">Descrição</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Conta</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">Data</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">Foto</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Categoria</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Recorrência</th>
                  <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Valor</th>
                  <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right whitespace-nowrap pr-8">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-cyan-500/5 dark:hover:bg-cyan-500/10 transition-colors group">
                    <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-4 py-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] w-[80px]">
                      <button
                        onClick={() => toggleStatus(t.id, t.isPaid)}
                        className="transition-transform active:scale-95 focus:outline-none w-full flex justify-center"
                        title="Clique para alterar status"
                      >
                        {t.isPaid ? (
                          <div className="flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 w-8 h-8 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                            <CheckCircle size={16} />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center text-amber-600 bg-amber-50 dark:bg-amber-900/20 w-8 h-8 rounded-full border border-amber-100 dark:border-amber-900/30">
                            <Clock size={16} />
                          </div>
                        )}
                      </button>
                    </td>
                    <td className="sticky left-[80px] z-10 bg-white dark:bg-slate-900 px-4 md:px-6 py-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] min-w-[200px]">
                      <div className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[180px]" title={t.description}>{t.description}</div>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {t.created_by && familyMembers && familyMembers[t.created_by] && (
                          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full pr-2 border border-slate-200 dark:border-slate-700">
                            <img
                              src={familyMembers[t.created_by].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(familyMembers[t.created_by].name)}&background=random`}
                              alt={familyMembers[t.created_by].name}
                              className="w-4 h-4 rounded-full"
                            />
                            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 max-w-[60px] truncate">
                              {familyMembers[t.created_by].name.split(' ')[0]}
                            </span>
                          </div>
                        )}
                        <span className="flex items-center whitespace-nowrap text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-tighter">
                          <CreditCard size={10} className="mr-1" /> {t.paymentMethod}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const accInfo = getAccountInfo(t.account);
                        return accInfo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-0.5 border border-slate-200 dark:border-slate-700 overflow-hidden">
                              {accInfo.bankLogo ? (
                                <img src={accInfo.bankLogo} alt={accInfo.name} className="w-full h-full object-contain" />
                              ) : (
                                <Wallet size={10} className="text-slate-400" />
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                              {accInfo.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-medium">-</span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      {t.attachment && t.attachment.startsWith('data:image') ? (
                        <button
                          onClick={() => setSelectedAttachment(t.attachment!)}
                          className="relative group/photo inline-block"
                        >
                          <img
                            src={t.attachment}
                            alt="Comprovante"
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                          />
                        </button>
                      ) : (
                        <span className="text-slate-200 dark:text-slate-700">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 flex items-center uppercase tracking-widest px-2 py-1 bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-900/30 rounded-lg w-fit">
                          {t.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {t.recurrence === 'installment' ? (
                        <span className="text-[10px] font-black text-orange-600 uppercase">
                          {(() => { const m = t.description?.match(/\((\d+)\/(\d+)\)/); return m ? `${m[1]}/${m[2]}x` : `${t.installmentCount}x`; })()}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 uppercase font-bold">{t.recurrence === 'fixed' ? 'Mensal' : 'Única'}</span>
                      )}
                    </td>
                    <td className={`px-4 md:px-6 py-4 text-sm font-black text-right whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right whitespace-nowrap pr-8">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(t)} className="p-2 text-slate-400 hover:text-sky-600 transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => onDeleteTransaction(t.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )
      }

      {/* Attachment Modal Viewer */}
      {
        selectedAttachment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full animate-in zoom-in-95 duration-300">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Visualizar Anexo</h3>
                <button
                  onClick={() => setSelectedAttachment(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 flex justify-center bg-slate-50 min-h-[300px] max-h-[70vh] overflow-y-auto">
                {selectedAttachment.startsWith('data:image') ? (
                  <img src={selectedAttachment} alt="Anexo" className="max-w-full h-auto rounded-xl shadow-sm" />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
                      <FileText size={48} className="text-sky-500" />
                    </div>
                    <p className="text-slate-500 font-medium text-center">Este anexo é um link externo.</p>
                    <a
                      href={selectedAttachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-sky-500 transition-all shadow-lg shadow-sky-100"
                    >
                      Abrir Link Externo
                    </a>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedAttachment(null)}
                  className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ExpenseManager;
