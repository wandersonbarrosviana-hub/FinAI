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
import TagManager from './components/TagManager';
import TransactionManager from './components/TransactionManager';
import CreditCardManager from './components/CreditCardManager';
import ChartsHub from './components/ChartsHub';
import CategoryManager from './components/CategoryManager';
import Reports from './components/Reports';
import Investments from './components/Investments';
import ProfileModal from './components/ProfileModal';
import { Budget } from './types';

import { Bell, Search, User as UserIcon, Plus, Sparkles, AlertCircle, ChevronLeft, ChevronRight, Loader2, LogOut } from 'lucide-react';
import { parseNotification, chatWithFinancialAssistant, getFinancialAdvice } from './aiService';
import { supabase } from './supabaseClient';
import { Transaction, Account, Goal, User, ViewState, Tag } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    return (localStorage.getItem('finai_current_view') as ViewState) || 'dashboard';
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [notificationData, setNotificationData] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  // aiAdvice moved to Dashboard component

  // Date State for Global Filter
  const [currentDate, setCurrentDate] = useState(() => {
    const savedDate = localStorage.getItem('finai_current_date');
    if (savedDate) {
      try {
        const parsed = new Date(savedDate);
        if (!isNaN(parsed.getTime())) return parsed;
      } catch (e) {
        console.error('Error parsing saved date', e);
      }
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('finai_current_view', currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem('finai_current_date', currentDate.toISOString());
  }, [currentDate]);

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
      const [txRes, accRes, goalRes, tagRes, budRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('accounts').select('*').eq('user_id', userId),
        supabase.from('goals').select('*').eq('user_id', userId),
        supabase.from('tags').select('*').eq('user_id', userId),
        supabase.from('budgets').select('*').eq('user_id', userId)
      ]);

      if (txRes.error) throw txRes.error;
      if (accRes.error) throw accRes.error;
      if (goalRes.error) throw goalRes.error;
      // Tag error check ?


      // Map DB fields to Frontend Interface if needed (e.g. snake_case to camelCase if inconsistent)
      // Currently interface matches mostly, check specific fields

      const mappedTxs = txRes.data.map((t: any) => ({
        ...t,
        date: t.date.split('T')[0], // Ensure YYYY-MM-DD
        dueDate: t.due_date ? t.due_date.split('T')[0] : undefined,
        installmentCount: t.installment_count,
        installmentTotal: t.installment_total,
        isPaid: t.is_paid,
        tags: t.tag_ids || []
      }));

      const mappedAccs = accRes.data.map((a: any) => ({
        ...a,
        bankId: a.bank_id,
        isCredit: a.is_credit
      }));

      setTransactions(mappedTxs);
      setAccounts(mappedAccs);
      setGoals(goalRes.data);
      setTags(tagRes.data || []);
      // Access 5th element from promise result (budgets)
      // Since destructuring didn't include it in original code, need to adjust destructuring above.
      // Wait, replacement chunk 3 updated destructuring? No, it updated the array passed to Promise.all but not the const [...] destructuring.
      // I need to fix the destructuring line as well.
      // Let's do it in a separate chunk or check if I can combine.
      // The destructuring was: `const [txRes, accRes, goalRes, tagRes] = await Promise.all([...])`
      // I need `const [txRes, accRes, goalRes, tagRes, budRes] = ...`
      setBudgets(budRes.data || []);

      // After fetching data, run initial AI logic
      // if (mappedTxs.length > 0) {
      //   getFinancialAdvice(mappedTxs, mappedAccs).then(setAiAdvice);
      // }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  /* 
   * Simulation of incoming SMS removed to prevent automatic API calls (429 errors).
   * To test notifications, use the Bell icon manually.
   */
  useEffect(() => {
    // Keep empty or remove entirely if not needed for anything else.
    // The original hook only had the simulation.
  }, [user]);

  // const updateAdvice = async () => {
  //   const advice = await getFinancialAdvice(transactions, accounts);
  //   setAiAdvice(advice);
  // };

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
    if (!t.isPaid) return acc; // Only count paid transactions
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
    if (updates.tags) dbUpdates.tag_ids = updates.tags;
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
      installmentTotal: data.installmentTotal,
      tags: data.tags || []
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
        recurrence: 'one_time',
        tag_ids: baseTx.tags
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
          installmentTotal: t.installment_total,
          tags: t.tag_ids || []
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

  const handleAICommand = async (result: any) => {
    // Reuse handleAddTransaction logic? Or create specific logic?
    // Reuse is better to get DB persistence.
    if (result.intent === 'CREATE') {
      handleAddTransaction(result.data);
      return true;
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
    } else if (result.intent === 'CREATE_ACCOUNT') {
      handleAddAccount(result.data);
      return true;
    } else if (result.intent === 'CREATE_GOAL') {
      handleAddGoal(result.data);
      return true;
    } else if (result.intent === 'CREATE_BUDGET') {
      handleAddBudget(result.data);
      return true;
    } else if (result.intent === 'ADVICE_REQUEST') {
      // Voice asked a question. We need to answer it using the Chat Service.
      // VoiceControl usually expects a boolean success. 
      // We can trigger a UI feedback here.
      const question = result.data.originalText || "Analise minhas finanças"; // We need to ensure originalText is passed if possible, or infer from context
      // Wait, parseVoiceCommand result.data might not have originalText unless we add it. 
      // geminiService.parseVoiceCommand needs to return original text in data if possible? 
      // Or we just use a generic prompt. 

      // Better: Let's assume result.message has the answer OR we generate it now.
      // The prompt in geminiService says "message: Short conversational confirmation".
      // We want a REAL answer using data.

      // Let's call chatWithFinancialAssistant
      const answer = await chatWithFinancialAssistant(
        "O usuário perguntou por voz: " + (result.data.description || "Resumo geral"), // Hack: prompt puts text in description sometimes? No.
        transactions, accounts, goals, budgets
      );

      // Show alert for now or speaking?
      alert("FinAI Responde: " + answer);
      return true;
    }
  };

  const handleAddBudget = async (data: Partial<Budget>) => {
    if (!user) return;
    const newBudget = {
      user_id: user.id,
      category: data.category || 'Outros',
      amount: data.amount || 1000,
      month: data.month || new Date().toISOString().slice(0, 7)
    };

    // Check if budget exists for this category/month
    const existing = budgets.find(b => b.category === newBudget.category && b.month === newBudget.month);

    if (existing && existing.id) {
      // Update
      await handleUpdateBudget(existing.id, { amount: newBudget.amount });
    } else {
      // Create
      const { data: inserted, error } = await supabase.from('budgets').insert(newBudget).select().single();
      if (inserted && !error) {
        setBudgets(prev => [...prev, inserted]);
      }
    }
  };

  const handleUpdateBudget = async (id: string, data: Partial<Budget>) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
    await supabase.from('budgets').update(data).eq('id', id);
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

  const handleTransfer = async (data: {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    date: string;
    description: string;
  }) => {
    // Create Withdraw (Expense) from Source
    await handleAddTransaction({
      description: `Transferência para: ${(accounts.find(a => a.id === data.destinationAccountId)?.name)} - ${data.description}`,
      amount: data.amount,
      type: 'expense',
      account: data.sourceAccountId,
      category: 'Transferência',
      subCategory: 'Saída',
      date: data.date,
      isPaid: true
    });

    // Create Deposit (Income) to Destination
    await handleAddTransaction({
      description: `Transferência de: ${(accounts.find(a => a.id === data.sourceAccountId)?.name)} - ${data.description}`,
      amount: data.amount,
      type: 'income',
      account: data.destinationAccountId,
      category: 'Transferência',
      subCategory: 'Entrada',
      date: data.date,
      isPaid: true
    });
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

  const handleAddTag = async (data: Partial<Tag>) => {
    if (!user) return;
    const newTag = {
      user_id: user.id,
      name: data.name || 'Nova Tag',
      color: data.color || '#64748b'
    };

    const { data: inserted, error } = await supabase.from('tags').insert(newTag).select().single();
    if (inserted && !error) {
      setTags(prev => [...prev, inserted]);
    }
  };

  const handleUpdateTag = async (id: string, updates: Partial<Tag>) => {
    try {
      const { error } = await supabase.from('tags').update(updates).eq('id', id);
      if (error) throw error;
      setTags(tags.map(t => (t.id === id ? { ...t, ...updates } : t)));
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  };

  const handleUpdateProfile = async (newName: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { name: newName }
      });
      if (error) throw error;
      setUser(prev => prev ? { ...prev, name: newName } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const handleDeleteTag = async (id: string) => {
    setTags(prev => prev.filter(t => t.id !== id));
    await supabase.from('tags').delete().eq('id', id);
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
    <div className="min-h-screen bg-slate-50 flex overflow-hidden selection:bg-sky-500/30">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onLogout={handleLogout} />
      <main className={`flex-1 flex flex-col transition-all duration-300 mb-24 md:mb-0 ml-0 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        {/* Header - White Glassmorphism */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          {/* Global Month Filter in Center */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-6 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-sky-600 transition-all active:scale-95"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-center min-w-[160px]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                  {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </div>
                <div className={`text-xl font-black ${monthlyBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  R$ {monthlyBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-sky-600 transition-all active:scale-95"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationCenter onAddTransaction={(t) => handleAddTransaction({ ...t, type: t.type as any })} />
            <div className="h-8 w-[1px] bg-slate-200"></div>

            {/* User Profile & Logout - Clean Context */}
            <div className="flex items-center gap-4 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900 leading-none">{user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{user.email}</p>
              </div>

              <div className="relative group/user">
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2 group relative"
                  title="Meu Perfil"
                >
                  <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-600 font-black shadow-sm border border-sky-100 group-hover:border-sky-300 group-hover:bg-sky-100 transition-all">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-sky-600 shadow-xs transition-colors">
                    <UserIcon size={10} />
                  </div>
                </button>
              </div>

              <div className="h-8 w-[1px] bg-slate-100 mx-1"></div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-black text-[10px] uppercase tracking-widest transition-all border border-transparent hover:border-rose-100"
                title="Sair da conta"
              >
                <LogOut size={16} />
                <span className="hidden lg:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 overflow-y-auto scrollbar-hide text-slate-800">
          <div className="mb-8">
            <VoiceControl onAddTransaction={handleAICommand} />
          </div>

          {/* We pass the FILTERED transactions to views, so they only see the selected month's data */}
          {(() => {
            switch (currentView) {
              case 'dashboard':
                return (
                  <div className="space-y-6">
                    {/* Replaced legacy card with Dashboard's internal card */}
                    <Dashboard transactions={filteredTransactions} accounts={accounts} onAddClick={() => setCurrentView('expenses')} tags={tags} goals={goals} budgets={budgets} />
                  </div>
                );
              case 'expenses':
                return <ExpenseManager type="expense" transactions={filteredTransactions} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} onUpdateTransaction={handleUpdateTransaction} tags={tags} accounts={accounts} />;
              case 'income':
                return <ExpenseManager type="income" transactions={filteredTransactions} allTransactions={transactions} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} onUpdateTransaction={handleUpdateTransaction} tags={tags} accounts={accounts} />;
              case 'transactions':
                return <TransactionManager
                  transactions={filteredTransactions}
                  accounts={accounts}
                  tags={tags}
                  onAddTransaction={handleAddTransaction}
                  onUpdateTransaction={handleUpdateTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  onTransfer={handleTransfer}
                />;
              case 'credit-cards':
                return <CreditCardManager accounts={accounts.filter(a => a.isCredit)} onAddAccount={handleAddAccount} />;
              case 'charts':
                return <ChartsHub transactions={filteredTransactions} />;
              case 'categories':
                return <CategoryManager transactions={filteredTransactions} />;
              case 'accounts':
                return <AccountManager accounts={accounts} onAddAccount={handleAddAccount} onDeleteAccount={handleDeleteAccount} />;
              case 'goals':
                return <GoalManager goals={goals} transactions={filteredTransactions} accounts={accounts} onAddGoal={handleAddGoal} onDeleteGoal={handleDeleteGoal} />;
              case 'investments':
                return <Investments />;
              case 'budgets':
                return <BudgetManager transactions={filteredTransactions} budgets={budgets} onUpdateBudget={handleUpdateBudget} onAddBudget={handleAddBudget} />;
              case 'retirement':
                return <RetirementSimulator transactions={transactions} />;
              case 'tags': // Keeping tags if needed, otherwise maybe merged into Categories?
                return <TagManager tags={tags} onAddTag={handleAddTag} onDeleteTag={handleDeleteTag} onUpdateTag={handleUpdateTag} />;
              case 'reports':
                return <Reports transactions={transactions} accounts={accounts} tags={tags} />;
              case 'ai-assistant':

                return <FinancialAssistant transactions={transactions} accounts={accounts} goals={goals} budgets={budgets} onAddTransaction={handleAddTransaction} />; // AI might need full context? Or just current month? Keeping full for now.
              default:
                return (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                    <div className="p-12 bg-white rounded-3xl border border-slate-100 text-center max-w-md shadow-xl ring-1 ring-black/5">
                      <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6 text-sky-600 shadow-sm border border-sky-100">
                        <Sparkles size={32} />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">Visão não encontrada</h3>
                      <p className="text-sm text-slate-500 font-medium">Ops! Parece que esta seção ainda está em desenvolvimento ou foi movida.</p>
                      <button
                        onClick={() => setCurrentView('dashboard')}
                        className="mt-6 px-6 py-2 bg-sky-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-sky-700 transition-all shadow-lg shadow-sky-100"
                      >
                        Voltar ao Dashboard
                      </button>
                    </div>
                  </div>
                );
            }
          })()}

        </div>
      </main>
      {
        showNotificationPopup && notificationData && (
          // ... notification popup ...
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-10 duration-500">
            <div className="bg-white/95 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-slate-100 flex flex-col space-y-3 max-w-sm ring-1 ring-black/5">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100"><AlertCircle size={20} /></div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest">IA - Notificação Detectada</p>
                  <p className="text-sm font-bold text-slate-900">Novo Evento Financeiro</p>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 italic text-xs text-slate-500">"{notificationData.raw}"</div>

              <div className="text-xs text-slate-500 font-medium">
                A IA identificou:
                <span className="font-bold text-slate-900 block mt-1 uppercase tracking-tight">
                  {notificationData.parsed.category} &gt; {notificationData.parsed.subCategory}
                </span>
                Deseja confirmar o lançamento?
              </div>

              <div className="flex space-x-2">
                <button onClick={() => { handleAddTransaction(notificationData.parsed); setShowNotificationPopup(false); }} className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-sky-100 uppercase tracking-widest">
                  Confirmar
                </button>
                <button onClick={() => setShowNotificationPopup(false)} className="px-4 py-2.5 border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all uppercase tracking-widest">
                  Ignorar
                </button>
              </div>
            </div>
          </div>
        )
      }

      <ProfileModal
        user={user}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdate={handleUpdateProfile}
      />
    </div >
  );
};

export default App;
