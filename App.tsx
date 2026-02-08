import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import FinancialAssistant from './components/FinancialAssistant';
import VoiceControl from './components/VoiceControl';
import ExpenseManager from './components/ExpenseManager';
import AccountManager from './components/AccountManager';
import GoalManager from './components/GoalManager';
import BudgetManager from './components/BudgetManager';
import { Transaction, Account, ViewState, User, Goal } from './types';
import { Bell, Search, User as UserIcon, Plus, Sparkles, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const MOCK_ACCOUNTS: Account[] = [
  { id: '1', name: 'Principal Corrente', balance: 5240.50, type: 'checking', bankId: 'itau', color: '#EC7000' },
  { id: '2', name: 'Minha Reserva', balance: 12400.00, type: 'investment', bankId: 'nubank', color: '#8A05BE' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', description: 'Salário', amount: 8000.00, date: '2023-11-01', category: 'Investimentos', subCategory: 'Ações', type: 'income', account: '1', isPaid: true, paymentMethod: 'PIX', recurrence: 'one_time' },
  { id: '2', description: 'Supermercado', amount: 450.20, date: '2023-11-05', dueDate: '2023-11-10', category: 'Alimentação', subCategory: 'Supermercado', type: 'expense', account: '1', isPaid: true, paymentMethod: 'Débito', recurrence: 'one_time' },
  { id: '3', description: 'Aluguel', amount: 2200.00, date: '2023-11-01', dueDate: '2023-11-05', category: 'Moradia', subCategory: 'Aluguel', type: 'expense', account: '1', isPaid: false, paymentMethod: 'Boleto', recurrence: 'fixed' },
  { id: '4', description: 'Restaurante', amount: 120.00, date: '2023-11-08', category: 'Lazer', subCategory: 'Restaurante', type: 'expense', account: '1', isPaid: true, paymentMethod: 'Cartão de Crédito', recurrence: 'one_time' },
];

const MOCK_GOALS: Goal[] = [
  { id: 'g1', title: 'Independência Financeira', target: 500000, current: 15000, deadline: '2035-12-31', category: 'Aposentadoria' },
  { id: 'g2', title: 'Troca de Carro', target: 80000, current: 12000, deadline: '2026-06-30', category: 'Veículos' },
];

import { parseNotification, getFinancialAdvice } from './geminiService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [goals, setGoals] = useState<Goal[]>(MOCK_GOALS);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [notificationData, setNotificationData] = useState<any>(null); // Store parsed notification
  const [aiAdvice, setAiAdvice] = useState<string>('Analisando suas finanças...');

  // Date State for Global Filter
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    // Simulate incoming SMS after 10s
    const timer = setTimeout(async () => {
      const fakeSMS = "Compra aprovada R$ 127,50 em LOJAS RENNER 14:30";
      const parsed = await parseNotification(fakeSMS);
      if (parsed) {
        setNotificationData({
          raw: fakeSMS,
          parsed: { ...parsed, isPaid: true, paymentMethod: 'Cartão de Crédito' } // augment with context defaults
        });
        setShowNotificationPopup(true);
      }
    }, 10000);

    // Get AI Advice on load
    updateAdvice();

    return () => clearTimeout(timer);
  }, []);

  const updateAdvice = async () => {
    // Basic debounce or check to avoid spamming API could be added here
    const advice = await getFinancialAdvice(transactions, accounts);
    setAiAdvice(advice);
  };


  const handleLogin = (email: string) => {
    setUser({ id: '1', email, name: email.split('@')[0] });
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Navigation Logic
  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  // Global Filter
  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    // Ensure we compare year/month ignoring time/day
    return tDate.getMonth() === currentDate.getMonth() &&
      tDate.getFullYear() === currentDate.getFullYear();
  });

  // Calculate Monthly Balance (Income - Expense for the selected month)
  // Logic: Sum of all Income - Sum of all Expenses (regardless of paid status? 
  // Usually for a budget view, we look at projected. But maybe user wants realised.
  // The most useful metric for "Saldo do Mês" header is usually (Receitas Previstas - Despesas Previstas) or (Receitas Realizadas - Despesas Realizadas).
  // Given the earlier context, let's show the Projected Balance (All Income - All Expenses) for the month.
  const monthlyBalance = filteredTransactions.reduce((acc, t) => {
    if (t.type === 'income') return acc + t.amount;
    if (t.type === 'expense') return acc - t.amount;
    return acc;
  }, 0);


  const handleUpdateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updates };
        if (updates.isPaid !== undefined && updates.isPaid !== t.isPaid) {
          const diff = updated.amount;
          setAccounts(accs => accs.map(acc => {
            if (acc.id === updated.account) {
              if (updated.type === 'expense') {
                return { ...acc, balance: updates.isPaid ? acc.balance - diff : acc.balance + diff };
              } else {
                return { ...acc, balance: updates.isPaid ? acc.balance + diff : acc.balance - diff };
              }
            }
            return acc;
          }));
        }
        return updated;
      }
      return t;
    }));
  };

  const handleAICommand = (result: any) => {
    if (result.intent === 'CREATE') {
      const data = result.data;
      const newTx: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        description: data.description || 'Novo Lançamento',
        amount: data.amount || 0,
        date: new Date().toISOString().split('T')[0],
        dueDate: data.dueDate || new Date().toISOString().split('T')[0],
        category: data.category || 'Outros',
        subCategory: data.subCategory || 'Diversos',
        type: data.type || 'expense',
        account: accounts[0]?.id || '1',
        paymentMethod: 'IA Voice',
        isPaid: data.isPaid !== undefined ? data.isPaid : data.type === 'income',
        recurrence: 'one_time'
      };

      setTransactions([newTx, ...transactions]);

      if (newTx.isPaid) {
        setAccounts(prev => prev.map(acc => {
          if (acc.id === newTx.account) {
            return { ...acc, balance: newTx.type === 'expense' ? acc.balance - newTx.amount : acc.balance + newTx.amount };
          }
          return acc;
        }));
      }
    } else if (result.intent === 'UPDATE_STATUS') {
      const { searchDescription, newStatus } = result.data;
      const tx = transactions.find(t =>
        t.description.toLowerCase().includes(searchDescription.toLowerCase())
      );
      if (tx) {
        handleUpdateTransaction(tx.id, { isPaid: newStatus });
        return true;
      }
      return false;
    }
    return true;
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (tx.isPaid) {
      if (tx.type === 'expense') {
        setAccounts(prev => prev.map(acc => acc.id === tx.account ? { ...acc, balance: acc.balance + tx.amount } : acc));
      } else {
        setAccounts(prev => prev.map(acc => acc.id === tx.account ? { ...acc, balance: acc.balance - tx.amount } : acc));
      }
    }
  };

  // Helper to add months to a date string (YYYY-MM-DD) handling end-of-month correctly
  const addMonths = (dateStr: string, months: number) => {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; // 0-indexed
    const day = parseInt(dayStr);

    const date = new Date(year, month + months, 1);
    // To avoid overflow (e.g. Jan 31 -> Feb 28), we check the last day of the new month
    const lastDayOfNewMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    const newDay = Math.min(day, lastDayOfNewMonth);
    date.setDate(newDay);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
  };

  const handleAddTransaction = (data: Partial<Transaction>) => {
    const baseTx = {
      description: data.description || 'Novo Lançamento',
      amount: data.amount || 0,
      category: data.category || 'Outros',
      subCategory: data.subCategory || 'Diversos',
      type: data.type || 'expense',
      account: data.account || accounts[0]?.id || '1',
      paymentMethod: data.paymentMethod || 'PIX',
      isPaid: data.isPaid !== undefined ? data.isPaid : data.type === 'income',
      recurrence: data.recurrence || 'one_time',
      installmentCount: data.installmentCount,
      installmentTotal: data.installmentTotal
    };

    const newTransactions: Transaction[] = [];
    const baseDate = data.date || new Date().toISOString().split('T')[0];
    const baseDueDate = data.dueDate || baseDate;

    if (baseTx.recurrence === 'fixed') {
      // Generate for next 12 months
      for (let i = 0; i < 12; i++) {
        newTransactions.push({
          ...baseTx,
          id: Math.random().toString(36).substr(2, 9),
          date: addMonths(baseDate, i),
          dueDate: addMonths(baseDueDate, i),
          // For fixed, we usually don't append (1/12) unless requested, but let's keep it clean
          // We might want to mark them as 'pending' for future months even if first is paid?
          // Logic: if user says "Paid", usually they mean the current one.
          // But for simplicity, let's respect the form's choice for the *first* one, and mark others as pending?
          // User Request: "Fixed monthly... adds to future months".
          // Let's make future ones pending by default if expense? Or copy status?
          // Safest: Copy status for first, others pending.
          isPaid: i === 0 ? baseTx.isPaid : false
        } as Transaction);
      }
    } else if (baseTx.recurrence === 'installment' && baseTx.installmentCount && baseTx.installmentCount > 1) {
      // Generate N installments
      for (let i = 0; i < baseTx.installmentCount; i++) {
        newTransactions.push({
          ...baseTx,
          id: Math.random().toString(36).substr(2, 9),
          description: `${baseTx.description} (${i + 1}/${baseTx.installmentCount})`,
          date: addMonths(baseDate, i),
          dueDate: addMonths(baseDueDate, i),
          isPaid: i === 0 ? baseTx.isPaid : false
        } as Transaction);
      }
    } else {
      // Single transaction
      newTransactions.push({
        ...baseTx,
        id: Math.random().toString(36).substr(2, 9),
        date: baseDate,
        dueDate: baseDueDate
      } as Transaction);
    }

    setTransactions(prev => [...newTransactions, ...prev]);

    // Update accounts for PAID transactions only
    newTransactions.forEach(tx => {
      if (tx.isPaid) {
        const diff = tx.amount;
        setAccounts(prev => prev.map(acc => {
          if (acc.id === tx.account) {
            return {
              ...acc,
              balance: tx.type === 'expense' ? acc.balance - diff : acc.balance + diff
            };
          }
          return acc;
        }));
      }
    });
  };

  const handleAddAccount = (data: Partial<Account>) => {
    const newAcc: Account = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name || 'Nova Conta',
      balance: data.balance || 0,
      type: data.type || 'checking',
      bankId: data.bankId || 'outro',
      color: data.color || '#64748b'
    };
    setAccounts([...accounts, newAcc]);
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  const handleAddGoal = (data: Partial<Goal>) => {
    const newGoal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      title: data.title || 'Novo Objetivo',
      target: data.target || 0,
      current: data.current || 0,
      deadline: data.deadline || '',
      category: data.category || 'Investimentos'
    };
    setGoals([...goals, newGoal]);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderContent = () => {
    // We pass the FILTERED transactions to views, so they only see the selected month's data
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-sky-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl shadow-sky-200 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
              <div className="z-10 relative">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={18} className="text-sky-200 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest text-sky-100">Consultor IA - FinAI</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Análise Inteligente</h3>
                <p className="text-sky-100 text-sm max-w-xl italic">"{aiAdvice}"</p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={updateAdvice}
                    className="bg-white/10 border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-white/20 transition-all"
                  >
                    Atualizar Análise
                  </button>
                  <button
                    onClick={() => setCurrentView('ai-assistant')}
                    className="bg-white text-sky-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-sky-50 transition-all"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
              <div className="bg-white/10 p-4 rounded-full backdrop-blur-md z-10 border border-white/20 hidden md:block">

                <div className="text-center">
                  <p className="text-[10px] font-bold text-sky-200 uppercase mb-1">Score</p>
                  <p className="text-3xl font-black">82</p>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
            </div>
            <Dashboard transactions={filteredTransactions} accounts={accounts} onAddClick={() => setCurrentView('expenses')} />
          </div>
        );
      case 'expenses':
        return <ExpenseManager type="expense" transactions={filteredTransactions} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} onUpdateTransaction={handleUpdateTransaction} />;
      case 'income':
        return <ExpenseManager type="income" transactions={filteredTransactions} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} onUpdateTransaction={handleUpdateTransaction} />;
      case 'accounts':
        return <AccountManager accounts={accounts} onAddAccount={handleAddAccount} onDeleteAccount={handleDeleteAccount} />;
      case 'goals':
        return <GoalManager goals={goals} transactions={filteredTransactions} accounts={accounts} onAddGoal={handleAddGoal} onDeleteGoal={handleDeleteGoal} />;
      case 'budgets':
        return <BudgetManager transactions={filteredTransactions} />;
      case 'ai-assistant':
        return <FinancialAssistant transactions={transactions} accounts={accounts} />; // AI might need full context? Or just current month? Keeping full for now.
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
            <div className="p-8 bg-white rounded-3xl border border-sky-100 text-center max-w-md shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Módulo em Desenvolvimento</h3>
              <p>A seção de <strong>{currentView.charAt(0).toUpperCase() + currentView.slice(1)}</strong> está sendo finalizada pela nossa equipe. Em breve você terá acesso total.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onLogout={handleLogout} />
      <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-sky-100 flex items-center justify-between px-8 sticky top-0 z-40">
          {/* Global Month Filter in Center */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-6 bg-slate-100/50 p-2 rounded-2xl border border-slate-200 shadow-inner">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-white rounded-xl hover:shadow-sm text-slate-500 hover:text-sky-600 transition-all active:scale-95"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-center min-w-[160px]">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </div>
                <div className={`text-xl font-black ${monthlyBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  R$ {monthlyBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-white rounded-xl hover:shadow-sm text-slate-500 hover:text-sky-600 transition-all active:scale-95"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button className="relative p-2 text-slate-500 hover:text-sky-600 transition-colors">
              <Bell size={22} /><span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-none">{user.name}</p>
                <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-tighter">Premium</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold shadow-lg shadow-sky-100">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        <div className="p-8 overflow-y-auto scrollbar-hide">
          <div className="mb-8">
            <VoiceControl onAddTransaction={handleAICommand} />
          </div>
          {renderContent()}
        </div>
      </main>
      {showNotificationPopup && notificationData && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="bg-white p-5 rounded-3xl shadow-2xl border border-sky-100 flex flex-col space-y-3 max-w-sm ring-8 ring-sky-50">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-sky-600 text-white rounded-2xl shadow-lg shadow-sky-200"><AlertCircle size={20} /></div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest">IA - Notificação Detectada</p>
                <p className="text-sm font-bold text-slate-800">Novo Evento Financeiro</p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 italic text-xs text-slate-600">"{notificationData.raw}"</div>

            <div className="text-xs text-slate-500">
              A IA identificou:
              <span className="font-bold text-slate-700 block mt-1">
                {notificationData.parsed.category} &gt; {notificationData.parsed.subCategory}
              </span>
              Deseja confirmar o lançamento?
            </div>

            <div className="flex space-x-2">
              <button onClick={() => { handleAddTransaction(notificationData.parsed); setShowNotificationPopup(false); }} className="flex-1 py-2.5 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-700 transition-all">
                Confirmar
              </button>
              <button onClick={() => setShowNotificationPopup(false)} className="px-4 py-2.5 border border-slate-200 text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all">
                Ignorar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
