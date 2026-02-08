import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import FinancialAssistant from './components/FinancialAssistant';
import VoiceControl from './components/VoiceControl';
import ExpenseManager from './components/ExpenseManager';
import AccountManager from './components/AccountManager';
import GoalManager from './components/GoalManager';
import NotificationCenter from './components/NotificationCenter';
import BudgetManager from './components/BudgetManager';
import RetirementSimulator from './components/RetirementSimulator';

import { Bell, Search, User as UserIcon, Plus, Sparkles, AlertCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { parseNotification, getFinancialAdvice } from './geminiService';
import { supabase } from './supabaseClient';
import { Transaction, Account, Goal, User, ViewState } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [notificationData, setNotificationData] = useState<any>(null);
  const [aiAdvice, setAiAdvice] = useState<string>('Analisando suas finanças...');

  // Date State for Global Filter
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email!, name: session.user.user_metadata.name || session.user.email!.split('@')[0] });
        fetchData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email!, name: session.user.user_metadata.name || session.user.email!.split('@')[0] });
        fetchData(session.user.id);
      } else {
        setUser(null);
        setTransactions([]);
        setAccounts([]);
        setGoals([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async (userId: string) => {
    setLoading(true);
    try {
      const [txRes, accRes, goalRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('accounts').select('*').eq('user_id', userId),
        supabase.from('goals').select('*').eq('user_id', userId)
      ]);

      if (txRes.error) throw txRes.error;
      if (accRes.error) throw accRes.error;
      if (goalRes.error) throw goalRes.error;

      // Map DB fields to Frontend Interface if needed (e.g. snake_case to camelCase if inconsistent)
      // Currently interface matches mostly, check specific fields

      const mappedTxs = txRes.data.map((t: any) => ({
        ...t,
        date: t.date.split('T')[0], // Ensure YYYY-MM-DD
        dueDate: t.due_date ? t.due_date.split('T')[0] : undefined,
        installmentCount: t.installment_count,
        installmentTotal: t.installment_total,
        subCategory: t.sub_category,
        paymentMethod: t.payment_method,
        isPaid: t.is_paid
      }));

      const mappedAccs = accRes.data.map((a: any) => ({
        ...a,
        bankId: a.bank_id,
        isCredit: a.is_credit
      }));

      setTransactions(mappedTxs);
      setAccounts(mappedAccs);
      setGoals(goalRes.data);

      // After fetching data, run initial AI logic
      if (mappedTxs.length > 0) {
        getFinancialAdvice(mappedTxs, mappedAccs).then(setAiAdvice);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Simulate incoming SMS after 10s (Only once per session mount to be annoying? No, implementation kept simple)
    const timer = setTimeout(async () => {
      const fakeSMS = "Compra aprovada R$ 127,50 em LOJAS RENNER 14:30";
      const parsed = await parseNotification(fakeSMS);
      if (parsed) {
        setNotificationData({
          raw: fakeSMS,
          parsed: { ...parsed, isPaid: true, paymentMethod: 'Cartão de Crédito' }
        });
        setShowNotificationPopup(true);
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, [user]); // Run when user logs in

  const updateAdvice = async () => {
    const advice = await getFinancialAdvice(transactions, accounts);
    setAiAdvice(advice);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
    return tDate.getMonth() === currentDate.getMonth() &&
      tDate.getFullYear() === currentDate.getFullYear();
  });

  const monthlyBalance = filteredTransactions.reduce((acc, t) => {
    if (t.type === 'income') return acc + t.amount;
    if (t.type === 'expense') return acc - t.amount;
    return acc;
  }, 0);


  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    /* 
       Optimistic Update:
       1. Update local state immediately
       2. Send via API
       3. If fail, revert
    */

    // Calculate Balance Diff for Account update logic (Optimistic)
    // Finding original transaction
    const originalTx = transactions.find(t => t.id === id);
    if (!originalTx) return;

    // Apply updates locally
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, ...updates };
      }
      return t;
    }));

    // Handle Balance Update Logic (Sync with Account Balance)
    if (updates.isPaid !== undefined && updates.isPaid !== originalTx.isPaid) {
      const accountId = updates.account || originalTx.account;
      const amount = updates.amount || originalTx.amount;
      const type = updates.type || originalTx.type;

      // Fetch current account balance first or use local?
      // Using local logic for immediate feedback
      setAccounts(accs => accs.map(acc => {
        if (acc.id === accountId) {
          const diff = amount;
          if (type === 'expense') {
            return { ...acc, balance: updates.isPaid ? acc.balance - diff : acc.balance + diff };
          } else {
            return { ...acc, balance: updates.isPaid ? acc.balance + diff : acc.balance - diff };
          }
        }
        return acc;
      }));

      // Also update account in DB
      const acc = accounts.find(a => a.id === accountId);
      if (acc) {
        const diff = amount;
        let newBalance = acc.balance;
        if (type === 'expense') {
          newBalance = updates.isPaid ? acc.balance - diff : acc.balance + diff;
        } else {
          newBalance = updates.isPaid ? acc.balance + diff : acc.balance - diff;
        }
        supabase.from('accounts').update({ balance: newBalance }).eq('id', accountId);
      }
    }

    // Map updates to DB columns
    const dbUpdates: any = {};
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.amount) dbUpdates.amount = updates.amount;
    if (updates.date) dbUpdates.date = updates.date;
    if (updates.isPaid !== undefined) dbUpdates.is_paid = updates.isPaid;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.subCategory) dbUpdates.sub_category = updates.subCategory;
    // ... add others as needed

    await supabase.from('transactions').update(dbUpdates).eq('id', id);
  };

  // Helper to add months to a date string (YYYY-MM-DD) handling end-of-month correctly
  const addMonths = (dateStr: string, months: number) => {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; // 0-indexed
    const day = parseInt(dayStr);

    const date = new Date(year, month + months, 1);
    const lastDayOfNewMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const newDay = Math.min(day, lastDayOfNewMonth);
    date.setDate(newDay);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
  };

  const handleAddTransaction = async (data: Partial<Transaction>) => {
    if (!user) return;

    const baseTx = {
      description: data.description || 'Novo Lançamento',
      amount: data.amount || 0,
      category: data.category || 'Outros',
      subCategory: data.subCategory || 'Diversos',
      type: data.type || 'expense',
      account: data.account || accounts[0]?.id, // Must fix this logic if no accounts
      paymentMethod: data.paymentMethod || 'PIX',
      isPaid: data.isPaid !== undefined ? data.isPaid : data.type === 'income',
      recurrence: data.recurrence || 'one_time',
      installmentCount: data.installmentCount,
      installmentTotal: data.installmentTotal
    };

    if (!baseTx.account) {
      alert("Por favor, crie uma conta antes de adicionar transações.");
      return;
    }

    const newTransactions: any[] = []; // for DB
    const newOptimisticTxs: Transaction[] = []; // for State

    const baseDate = data.date || new Date().toISOString().split('T')[0];
    const baseDueDate = data.dueDate || baseDate;

    // Helper to generate IDs safely? Supabase generates UUIDs.
    // Ideally we let Supabase generate IDs and return them.
    // BUT for recurrence we are generating multiple.
    // Strategy: Insert to DB, wait for response, then update state.

    // Construct payload objects (without IDs)
    if (baseTx.recurrence === 'fixed') {
      for (let i = 0; i < 12; i++) {
        newTransactions.push({
          user_id: user.id,
          description: baseTx.description,
          amount: baseTx.amount,
          date: addMonths(baseDate, i),
          category: baseTx.category,
          sub_category: baseTx.subCategory,
          type: baseTx.type,
          account_id: baseTx.account,
          payment_method: baseTx.paymentMethod,
          is_paid: i === 0 ? baseTx.isPaid : false,
          recurrence: 'fixed',
          installment_total: baseTx.installmentTotal,
          installment_count: baseTx.installmentCount
        });
      }
    } else if (baseTx.recurrence === 'installment' && baseTx.installmentCount && baseTx.installmentCount > 1) {
      for (let i = 0; i < baseTx.installmentCount; i++) {
        newTransactions.push({
          user_id: user.id,
          description: `${baseTx.description} (${i + 1}/${baseTx.installmentCount})`,
          amount: baseTx.amount,
          date: addMonths(baseDate, i),
          category: baseTx.category,
          sub_category: baseTx.subCategory,
          type: baseTx.type,
          account_id: baseTx.account,
          payment_method: baseTx.paymentMethod,
          is_paid: i === 0 ? baseTx.isPaid : false,
          recurrence: 'installment',
          installment_total: baseTx.installmentTotal,
          installment_count: baseTx.installmentCount
        });
      }
    } else {
      newTransactions.push({
        user_id: user.id,
        description: baseTx.description,
        amount: baseTx.amount,
        date: baseDate,
        category: baseTx.category,
        sub_category: baseTx.subCategory,
        type: baseTx.type,
        account_id: baseTx.account,
        payment_method: baseTx.paymentMethod,
        is_paid: baseTx.isPaid,
        recurrence: 'one_time'
      });
    }

    try {
      const { data: insertedData, error } = await supabase.from('transactions').insert(newTransactions).select();

      if (error) throw error;

      // Map back to Frontend Types
      if (insertedData) {
        const mappedNew = insertedData.map((t: any) => ({
          ...t,
          date: t.date.split('T')[0],
          // account: t.account_id, // interface uses 'account' string
          account: t.account_id,
          subCategory: t.sub_category,
          paymentMethod: t.payment_method,
          isPaid: t.is_paid,
          installmentCount: t.installment_count,
          installmentTotal: t.installment_total
        }));

        setTransactions(prev => [...mappedNew, ...prev]);

        // Handle Account Balance Update
        mappedNew.forEach((tx: any) => {
          if (tx.isPaid) {
            // Update Local
            setAccounts(prev => prev.map(acc => {
              const diff = tx.amount;
              if (acc.id === tx.account) {
                return { ...acc, balance: tx.type === 'expense' ? acc.balance - diff : acc.balance + diff };
              }
              return acc;
            }));

            // Update DB (Optimized: could do one update per account at end, but simplistic here)
            const acc = accounts.find(a => a.id === tx.account);
            if (acc) {
              const diff = tx.amount;
              const newBalance = tx.type === 'expense' ? acc.balance - diff : acc.balance + diff;
              supabase.from('accounts').update({ balance: newBalance }).eq('id', tx.account);
            }
          }
        });
      }
    } catch (err) {
      console.error("Error creating transaction", err);
      alert("Erro ao salvar transação");
    }
  };

  const handleAICommand = (result: any) => {
    // Reuse handleAddTransaction logic? Or create specific logic?
    // Reuse is better to get DB persistence.
    if (result.intent === 'CREATE') {
      handleAddTransaction(result.data);
    } else if (result.intent === 'UPDATE_STATUS') {
      // ... find tx ...
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
  };

  const handleDeleteTransaction = async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    // Optimistic Delete
    setTransactions(prev => prev.filter(t => t.id !== id));

    // Balance Revert
    if (tx.isPaid) {
      setAccounts(prev => prev.map(acc => {
        if (acc.id === tx.account) {
          return { ...acc, balance: tx.type === 'expense' ? acc.balance + tx.amount : acc.balance - tx.amount };
        }
        return acc;
      }));
      // DB Balance Revert... ideally async in background
      const acc = accounts.find(a => a.id === tx.account);
      if (acc) {
        const newBalance = tx.type === 'expense' ? acc.balance + tx.amount : acc.balance - tx.amount;
        await supabase.from('accounts').update({ balance: newBalance }).eq('id', tx.account);
      }
    }

    await supabase.from('transactions').delete().eq('id', id);
  };

  const handleAddAccount = async (data: Partial<Account>) => {
    if (!user) return;
    const newAccPayload = {
      user_id: user.id,
      name: data.name || 'Nova Conta',
      balance: data.balance || 0,
      type: data.type || 'checking',
      bank_id: data.bankId || 'outro',
      color: data.color || '#64748b',
      is_credit: false // default
    };

    const { data: inserted, error } = await supabase.from('accounts').insert(newAccPayload).select().single();
    if (inserted && !error) {
      const newAcc = {
        ...inserted,
        bankId: inserted.bank_id,
        isCredit: inserted.is_credit
      };
      setAccounts(prev => [...prev, newAcc]);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
    await supabase.from('accounts').delete().eq('id', id);
  };

  const handleAddGoal = async (data: Partial<Goal>) => {
    if (!user) return;
    const newGoalPayload = {
      user_id: user.id,
      title: data.title || 'Novo Objetivo',
      target: data.target || 0,
      current: data.current || 0,
      deadline: data.deadline || null,
      category: data.category || 'Geral'
    };

    const { data: inserted, error } = await supabase.from('goals').insert(newGoalPayload).select().single();
    if (inserted && !error) {
      setGoals(prev => [...prev, inserted]);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    await supabase.from('goals').delete().eq('id', id);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sky-600"><Loader2 size={40} className="animate-spin" /></div>;
  }

  if (!user) {
    // Auth component doesn't need onLogin anymore if we rely on session state
    // But let's keep it to satisfy interface if needed, or update props.
    // Actually Auth calls onLogin, which calls old handleLogin.
    // Let's refactor Auth usage.
    /* 
       Wait, Auth component internally calls supabase.auth.signIn...
       So on successful login, the onAuthStateChange in App.tsx will trigger.
       So onLogin prop is actually redundant if Auth does the call.
       But Auth component implementation I wrote:
          if (data.user?.email) { onLogin(data.user.email); }
       So it calls it.
       I can just pass a no-op or simple function.
    */
    return <Auth onLogin={() => { }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onLogout={handleLogout} />
      <main className={`flex-1 flex flex-col transition-all duration-300 mb-24 md:mb-0 ml-0 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-sky-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
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
            <NotificationCenter onAddTransaction={(t) => handleAddTransaction({ ...t, type: t.type as any })} />
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-none">{user.name}</p>
                <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-tighter">Premium</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold shadow-lg shadow-sky-100">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>
        <div className="p-4 md:p-8 overflow-y-auto scrollbar-hide">
          <div className="mb-8">
            <VoiceControl onAddTransaction={handleAICommand} />
          </div>

          {/* We pass the FILTERED transactions to views, so they only see the selected month's data */}
          {(() => {
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
              case 'retirement':
                return <RetirementSimulator transactions={transactions} />;
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
          })()}

        </div>
      </main>
      {
        showNotificationPopup && notificationData && (
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
        )
      }
    </div >
  );
};

export default App;
