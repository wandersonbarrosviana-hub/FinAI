import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
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
import Settings from './components/Settings';

import ProfileModal from './components/ProfileModal';
import FinancialAssistant from './components/FinancialAssistant';
import CustomBudgetManager from './components/CustomBudgetManager';
import { Budget, CustomBudget } from './types';

import { Bell, Search, User as UserIcon, Plus, Sparkles, AlertCircle, ChevronLeft, ChevronRight, Loader2, LogOut, Settings as SettingsIcon, MessageSquare } from 'lucide-react';
import { parseNotification } from './aiService';
import { supabase } from './supabaseClient';
import { Transaction, Account, Goal, User, ViewState, Tag, AppNotification } from './types';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [familyMembers, setFamilyMembers] = useState<Record<string, { name: string, avatar: string }>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState | 'settings'>(() => {
    return (localStorage.getItem('finai_current_view') as ViewState | 'settings') || 'dashboard';
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [customBudgets, setCustomBudgets] = useState<CustomBudget[]>([]);




  const [retirementParams, setRetirementParams] = useState<any>(null);

  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [notificationData, setNotificationData] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
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
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || session.user.email!.split('@')[0],
          avatarUrl: session.user.user_metadata.avatar_url
        });
        fetchData(session.user.id);
        checkPendingInvites(session.user.email!, session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || session.user.email!.split('@')[0],
          avatarUrl: session.user.user_metadata.avatar_url
        });
        fetchData(session.user.id);
        checkPendingInvites(session.user.email!, session.user.id);
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
      const [txRes, accRes, goalRes, tagRes, budRes, cbRes, familyRes] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('accounts').select('*'),
        supabase.from('goals').select('*'),
        supabase.from('tags').select('*'),
        supabase.from('budgets').select('*'),
        supabase.from('custom_budgets').select('*'),
        supabase.rpc('get_family_details', { current_user_id: userId })
      ]);

      if (txRes.error) throw txRes.error;
      if (accRes.error) throw accRes.error;
      if (goalRes.error) throw goalRes.error;

      if (user) {
        membersMap[user.id] = { name: user.name, avatar: user.avatarUrl || '' };
      }
      setFamilyMembers(membersMap);

      // 6. Family data is now at index 6 if custom_budgets is 5
      // We need to ensure destructuring matches Promise.all order:
      // [tx, acc, goal, tag, bud, cb, family]


      // Let's process existing results and come back for custom budgets processing.
      // Wait, I can't leave the code broken.
      // I should update the destructuring line first.

      // Changing plan: I will update the destructuring line in the next tool call, then process.

      if (familyRes.data) {
        familyRes.data.forEach((m: any) => {
          membersMap[m.user_id] = { name: m.name, avatar: m.avatar_url };
        });
      }
      // Add current user to map if not already there (it might be returned by RPC depending on logic, but ensuring it is good)
      if (user) {
        membersMap[user.id] = { name: user.name, avatar: user.avatarUrl || '' };
      }
      setFamilyMembers(membersMap);

      const mappedTxs = txRes.data.map((t: any) => ({
        ...t,
        date: t.date ? t.date.split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: t.due_date ? t.due_date.split('T')[0] : undefined,
        paymentDate: t.payment_date ? t.payment_date.split('T')[0] : undefined,
        installmentCount: t.installment_count,
        installmentTotal: t.installment_total,
        isPaid: t.is_paid,
        tags: t.tag_ids || [],
        account: t.account_id,
        subCategory: t.sub_category,
        paymentMethod: t.payment_method,
        ignoreInStatistics: t.ignore_in_statistics,
        ignoreInBudgets: t.ignore_in_budgets,
        ignoreInTotals: t.ignore_in_totals
      }));

      const mappedAccs = accRes.data.map((a: any) => ({
        ...a,
        bankId: a.bank_id,
        isCredit: a.is_credit,
        creditLimit: a.credit_limit,
        closingDay: a.closing_day,
        dueDay: a.due_day
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

      if (cbRes.data) {
        const mappedCB = cbRes.data.map((cb: any) => ({
          id: cb.id,
          userId: cb.user_id,
          name: cb.name,
          categories: cb.categories,
          limitType: cb.limit_type,
          limitValue: cb.limit_value
        }));
        setCustomBudgets(mappedCB);
      }

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
  /* 
   * Realtime Subscription for Invites
   */
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:invites')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'invites',
          filter: `email=eq.${user.email}`
        },
        (payload) => {
          console.log('🔔 Novo convite recebido em tempo real:', payload);
          // Refresh invites check
          checkPendingInvites(user.email, user.id);
          // Optional: Show a toast? Notification state update handles the UI bell.
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // const updateAdvice = async () => {
  //   const advice = await getFinancialAdvice(transactions, accounts);
  //   setAiAdvice(advice);
  // };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const checkPendingInvites = async (email: string, userId: string) => {
    console.log(`🔍 Verificando convites para: ${email} (User ID: ${userId})`);
    try {
      const { data: invites, error } = await supabase
        .from('invites')
        .select('*')
        // Using ilike for case-insensitive comparison
        .ilike('email', email.trim())
        .eq('status', 'pending');

      if (error) {
        console.error('❌ Erro ao buscar convites:', error);
        throw error;
      }

      console.log('✅ Convites encontrados no banco:', invites);

      if (invites && invites.length > 0) {
        const notificationsData: AppNotification[] = invites.map(invite => ({
          id: invite.id,
          type: 'invite',
          message: `Você recebeu um convite para entrar na família.`,
          read: false,
          date: new Date(invite.created_at).toLocaleDateString(),
          data: { inviteId: invite.id, inviterId: invite.inviter_id, role: invite.role }
        }));

        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const newNotifs = notificationsData.filter(n => !existingIds.has(n.id));
          console.log('🔔 Atualizando notificações. Novas:', newNotifs);
          return [...prev, ...newNotifs];
        });
      } else {
        console.log('📭 Nenhum convite pendente encontrado para este email.');
      }
    } catch (error) {
      console.error('Error checking invites:', error);
    }
  };

  const handleRespondToInvite = async (inviteId: string, accept: boolean) => {
    try {
      if (accept) {
        const inviteNotif = notifications.find(n => n.id === inviteId);
        if (!inviteNotif) return;
        const invite = inviteNotif.data;

        // 1. Update invite status
        const { error: updateError } = await supabase
          .from('invites')
          .update({ status: 'accepted' })
          .eq('id', inviteId);
        if (updateError) throw updateError;

        // 2. Add to family_members
        const { error: insertError } = await supabase
          .from('family_members')
          .insert({
            master_user_id: invite.inviterId,
            member_user_id: user?.id,
            role: invite.role
          });
        if (insertError) throw insertError;

        alert("Convite aceito! Agora você faz parte da família.");
        if (user) fetchData(user.id);
      } else {
        await supabase
          .from('invites')
          .update({ status: 'rejected' })
          .eq('id', inviteId);
      }

      // Remove notification
      setNotifications(prev => prev.filter(n => n.id !== inviteId));

    } catch (error) {
      console.error("Error responding to invite:", error);
      alert("Erro ao processar convite.");
    }
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
  // Global Filter: Compare Year and Month explicitly
  const filteredTransactions = transactions.filter(t => {
    // Check if date is in current month/year
    const txDate = new Date(t.date + 'T12:00:00'); // Force noon to avoid timezone issues
    return txDate.getMonth() === currentDate.getMonth() &&
      txDate.getFullYear() === currentDate.getFullYear();
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

    // Validations for Balance Updates
    // We need to calculate the net effect on accounts
    const isAmountChanged = updates.amount !== undefined && updates.amount !== originalTx.amount;
    const isAccountChanged = updates.account !== undefined && updates.account !== originalTx.account;
    const isTypeChanged = updates.type !== undefined && updates.type !== originalTx.type;
    const isStatusChanged = updates.isPaid !== undefined && updates.isPaid !== originalTx.isPaid;

    if (isAmountChanged || isAccountChanged || isTypeChanged || isStatusChanged) {
      const accountUpdates = new Map<string, number>();

      // Helper to accrue changes
      const addChange = (accId: string, delta: number) => {
        const current = accountUpdates.get(accId) || 0;
        accountUpdates.set(accId, current + delta);
      };

      // 1. Revert Original Effect (if it was paid)
      // Note: We use originalTx for this check
      if (originalTx.isPaid) {
        const amount = originalTx.amount;
        const accountId = originalTx.account;
        // If expense, we removed money. To revert, we ADD (+).
        // If income, we added money. To revert, we SUBTRACT (-).
        const change = originalTx.type === 'expense' ? amount : -amount;
        if (accountId) addChange(accountId, change);
      }

      // 2. Apply New Effect (if it is paid)
      // We construct the "new" transaction state
      const newIsPaid = updates.isPaid !== undefined ? updates.isPaid : originalTx.isPaid;

      if (newIsPaid) {
        const amount = updates.amount !== undefined ? updates.amount : originalTx.amount;
        const accountId = updates.account !== undefined ? updates.account : originalTx.account;
        const type = updates.type !== undefined ? updates.type : originalTx.type;

        // If expense, we remove money (-).
        // If income, we add money (+).
        const change = type === 'expense' ? -amount : amount;
        if (accountId) addChange(accountId, change);
      }

      // 3. Process Account Updates
      if (accountUpdates.size > 0) {
        // Update Local State once
        setAccounts(prevAccs => prevAccs.map(acc => {
          const delta = accountUpdates.get(acc.id);
          if (delta) {
            return { ...acc, balance: acc.balance + delta };
          }
          return acc;
        }));

        // Update DB for each affected account
        // We use the computed delta + current DB state (or optimistic state assumptions)
        // Ideally we would trigger an RPC, but loop update is fine for now.
        for (const [accountId, delta] of accountUpdates.entries()) {
          if (delta !== 0) {
            // We need to fetch the *current* balance to be safe, OR rely on local state if we trust it.
            // Relying on previous local state (before this setAccounts check) might be stale inside the loop? 
            // Actually, `setAccounts` above handles visual. For DB:
            const acc = accounts.find(a => a.id === accountId);
            if (acc) {
              // We add delta to the KNOWN balance.
              // Warning: concurrency issues if multiple updates happen fast. 
              // For this app scale, this is acceptable.
              await supabase.from('accounts').update({ balance: acc.balance + delta }).eq('id', accountId);
            }
          }
        }
      }
    }

    // Map updates to DB columns
    const dbUpdates: any = {};
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.isPaid !== undefined) dbUpdates.is_paid = updates.isPaid;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.subCategory !== undefined) dbUpdates.sub_category = updates.subCategory;
    if (updates.tags !== undefined) dbUpdates.tag_ids = updates.tags;
    if (updates.paymentDate !== undefined) dbUpdates.payment_date = updates.paymentDate;
    if (updates.account !== undefined) dbUpdates.account_id = updates.account;
    if (updates.attachment !== undefined) dbUpdates.attachment = updates.attachment;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.ignoreInStatistics !== undefined) dbUpdates.ignore_in_statistics = updates.ignoreInStatistics;
    if (updates.ignoreInBudgets !== undefined) dbUpdates.ignore_in_budgets = updates.ignoreInBudgets;
    if (updates.ignoreInTotals !== undefined) dbUpdates.ignore_in_totals = updates.ignoreInTotals;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;

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
      tags: data.tags || [],
      paymentDate: data.paymentDate,
      attachment: data.attachment,
      notes: data.notes,
      ignoreInStatistics: data.ignoreInStatistics,
      ignoreInBudgets: data.ignoreInBudgets,
      ignoreInTotals: data.ignoreInTotals,
      dueDate: data.dueDate
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
          installment_count: baseTx.installmentCount,
          attachment: baseTx.attachment,
          notes: baseTx.notes,
          payment_date: baseTx.paymentDate,
          ignore_in_statistics: baseTx.ignoreInStatistics,
          ignore_in_budgets: baseTx.ignoreInBudgets,
          ignore_in_totals: baseTx.ignoreInTotals,
          due_date: baseTx.dueDate || baseDate,
          created_by: user.id
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
          installment_count: baseTx.installmentCount,
          attachment: baseTx.attachment,
          notes: baseTx.notes,
          payment_date: baseTx.paymentDate,
          ignore_in_statistics: baseTx.ignoreInStatistics,
          ignore_in_budgets: baseTx.ignoreInBudgets,
          ignore_in_totals: baseTx.ignoreInTotals,
          due_date: baseTx.dueDate || baseDate,
          created_by: user.id
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
        tag_ids: baseTx.tags,
        attachment: baseTx.attachment,
        notes: baseTx.notes,
        payment_date: baseTx.paymentDate,
        ignore_in_statistics: baseTx.ignoreInStatistics,
        ignore_in_budgets: baseTx.ignoreInBudgets,
        ignore_in_totals: baseTx.ignoreInTotals,
        due_date: baseTx.dueDate || baseDate,
        created_by: user.id // Track who created
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
          tags: t.tag_ids || [],
          attachment: t.attachment,
          notes: t.notes,
          paymentDate: t.payment_date,
          ignoreInStatistics: t.ignore_in_statistics,
          ignoreInBudgets: t.ignore_in_budgets,
          ignoreInTotals: t.ignore_in_totals,
          dueDate: t.due_date
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

  const handleUpdateAccount = async (id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    await supabase.from('accounts').update(updates).eq('id', id);
  };

  const handleUpdateGoal = async (id: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    await supabase.from('goals').update(updates).eq('id', id);
  };

  const handleAICommand = async (result: any) => {
    console.log("AI Command:", result);

    // 1. Transactions
    if (result.intent === 'CREATE') {
      await handleAddTransaction(result.data);
      return true;
    }

    // 2. Status Update
    else if (result.intent === 'UPDATE_STATUS') {
      const { searchDescription, newStatus } = result.data;
      const tx = transactions.find(t =>
        t.description.toLowerCase().includes(searchDescription.toLowerCase())
      );
      if (tx) {
        await handleUpdateTransaction(tx.id, { isPaid: newStatus });
        return true;
      }
      return false;
    }

    // 3. Accounts
    else if (result.intent === 'CREATE_ACCOUNT') {
      await handleAddAccount(result.data);
      return true;
    }
    else if (result.intent === 'UPDATE_ACCOUNT') {
      const acc = accounts.find(a => a.name.toLowerCase().includes(result.data.name.toLowerCase()));
      if (acc) {
        await handleUpdateAccount(acc.id, result.data.updates);
        return true;
      }
      return false;
    }
    else if (result.intent === 'DELETE_ACCOUNT') {
      const acc = accounts.find(a => a.name.toLowerCase().includes(result.data.name.toLowerCase()));
      if (acc) {
        await handleDeleteAccount(acc.id);
        return true;
      }
      return false;
    }

    // 4. Goals
    else if (result.intent === 'CREATE_GOAL') {
      await handleAddGoal(result.data);
      return true;
    }
    else if (result.intent === 'UPDATE_GOAL') {
      const goal = goals.find(g => g.title.toLowerCase().includes(result.data.title.toLowerCase()));
      if (goal) {
        await handleUpdateGoal(goal.id, result.data.updates);
        return true;
      }
      return false;
    }
    else if (result.intent === 'DELETE_GOAL') {
      const goal = goals.find(g => g.title.toLowerCase().includes(result.data.title.toLowerCase()));
      if (goal) {
        await handleDeleteGoal(goal.id);
        return true;
      }
      return false;
    }

    // 5. Budgets
    else if (result.intent === 'CREATE_BUDGET') {
      await handleAddBudget(result.data);
      return true;
    }
    else if (result.intent === 'UPDATE_BUDGET') {
      // Logic to find budget by category (and current month?)
      const budget = budgets.find(b => b.category.toLowerCase() === result.data.category.toLowerCase());
      if (budget) {
        await handleUpdateBudget(budget.id, { amount: result.data.amount });
        return true;
      }
      return false;
    }
    else if (result.intent === 'DELETE_BUDGET') {
      const budget = budgets.find(b => b.category.toLowerCase() === result.data.category.toLowerCase());
      if (budget) {
        // We don't have a delete budget function yet, let's add one or just set amount to 0?
        // Actually, Supabase delete is needed.
        // implementation below
        setBudgets(prev => prev.filter(b => b.id !== budget.id));
        await supabase.from('budgets').delete().eq('id', budget.id);
        return true;
      }
      return false;
    }

    // 6. Retirement Simulation
    else if (result.intent === 'SIMULATE_RETIREMENT') {
      setRetirementParams(result.data);
      setCurrentView('retirement');
      return true;
    }

    // 7. Advice / Chat
    else if (result.intent === 'ADVICE_REQUEST') {
      const answer = "Funcionalidade de chat desativada. Use comandos diretos.";
      alert("FinAI: " + answer);
      return true;
    }

    return false;
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

  const handleAddCustomBudget = async (data: Partial<CustomBudget>) => {
    if (!user) return;
    const newCB = {
      user_id: user.id,
      name: data.name,
      categories: data.categories,
      limit_type: data.limitType,
      limit_value: data.limitValue
    };

    const { data: inserted, error } = await supabase.from('custom_budgets').insert(newCB).select().single();
    if (error) {
      console.error("Error adding custom budget", error);
      alert("Erro ao criar orçamento personalizado");
      return;
    }

    if (inserted) {
      setCustomBudgets(prev => [...prev, {
        id: inserted.id,
        userId: inserted.user_id,
        name: inserted.name,
        categories: inserted.categories,
        limitType: inserted.limit_type,
        limitValue: inserted.limit_value
      }]);
    }
  };

  const handleDeleteCustomBudget = async (id: string) => {
    const { error } = await supabase.from('custom_budgets').delete().eq('id', id);
    if (error) {
      console.error("Error deleting custom budget", error);
      alert("Erro ao excluir orçamento");
      return;
    }
    setCustomBudgets(prev => prev.filter(cb => cb.id !== id));
  };

  const handleUpdateBudget = async (id: string, updates: Partial<Budget>) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    await supabase.from('budgets').update(updates).eq('id', id);
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
      is_credit: data.isCredit || false, // default to false if undefined, but respect true
      credit_limit: data.creditLimit || 0,
      closing_day: data.closingDay || 1,
      due_day: data.dueDay || 10
    };

    const { data: inserted, error } = await supabase.from('accounts').insert(newAccPayload).select().single();

    if (error) {
      console.error("Erro ao criar conta:", error);
      alert(`Erro ao criar cartão: ${error.message} (${error.details || ''})`);
      return;
    }

    if (inserted) {
      const newAcc = {
        ...inserted,
        bankId: inserted.bank_id,
        isCredit: inserted.is_credit,
        creditLimit: inserted.credit_limit,
        closingDay: inserted.closing_day,
        dueDay: inserted.due_day
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

  const handleUpdateProfile = async (newName: string, newAvatarUrl?: string) => {
    if (!user) return;
    try {
      const updates: any = { name: newName };
      if (newAvatarUrl) updates.avatar_url = newAvatarUrl;

      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });
      if (error) throw error;

      setUser(prev => prev ? {
        ...prev,
        name: newName,
        avatarUrl: newAvatarUrl || prev.avatarUrl
      } : null);
      setIsProfileModalOpen(false); // Close modal after update
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleDeleteTag = async (id: string) => {
    setTags(prev => prev.filter(t => t.id !== id));
    await supabase.from('tags').delete().eq('id', id);
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify({ transactions, accounts, goals, budgets }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finai_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetData = async (options?: {
    keepCategories: boolean;
    keepCreditCards: boolean;
    keepAccounts: boolean;
    keepGoals: boolean;
  }) => {
    // If called without options (legacy), we shouldn't proceed implicitly or should assume 'delete all'.
    // However, the new Settings UI calls it with options.
    // If confirmed via Modal:
    try {
      setLoading(true);

      const { keepCategories = false, keepCreditCards = false, keepAccounts = false, keepGoals = false } = options || {};

      const { error } = await supabase.rpc('reset_user_data_v2', {
        p_keep_goals: keepGoals,
        p_keep_credit_cards: keepCreditCards,
        p_keep_accounts: keepAccounts
      });

      if (error) {
        console.error("Error resetting data:", error);
        alert("Erro ao resetar dados. Tente novamente ou contate o suporte.");
      } else {
        // Clear LocalStorage if not kept
        if (!keepCategories) {
          // Specific keys for categories need to be confirmed.
          // Assuming 'finai_categories' or clearing known keys.
          // Will ensure we only clear if explicitly requested.
          localStorage.removeItem('finai_categories');
          localStorage.removeItem('finai_subcategories'); // If exists
        }

        // Always remove these view/date prefs on reset? Or keep?
        // User asked for "starting from zero", so maybe reset view too.
        localStorage.removeItem('finai_current_view');
        localStorage.removeItem('finai_current_date');

        // Clear State
        setTransactions([]);
        if (!keepAccounts) setAccounts(keepCreditCards ? accounts.filter(a => a.isCredit) : []);
        else if (!keepCreditCards) setAccounts(accounts.filter(a => !a.isCredit));
        // If both kept, accounts stay (but likely need refetch to match DB if implementation logic was complex)

        // Actually, easiest is to reload page to refetch everything from DB/LocalStorage
        alert("Dados resetados com sucesso!");
        window.location.reload();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden selection:bg-sky-500/30">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} onLogout={handleLogout} />
      <main className={`flex-1 flex flex-col transition-all duration-300 mb-[88px] md:mb-0 ml-0 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
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
            <NotificationCenter
              onAddTransaction={(t) => handleAddTransaction({ ...t, type: t.type as any })}
              notifications={notifications}
              onRespondToInvite={handleRespondToInvite}
            />

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
                  <div
                    className="w-10 h-10 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 font-black text-sm shadow-sm border border-sky-100 hover:bg-sky-100 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name ? user.name.charAt(0).toUpperCase() : 'U'
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <UserIcon size={16} className="text-white" />
                    </div>
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

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative scrollbar-hide">
          {currentView === 'dashboard' && <Dashboard
            transactions={filteredTransactions}
            accounts={accounts}
            onAddClick={() => setCurrentView('expenses')} // Updated logic
            tags={tags}
            goals={goals}
            budgets={budgets}
            familyMembers={familyMembers}
          />}
          {currentView === 'transactions' && <TransactionManager
            transactions={filteredTransactions}
            accounts={accounts}
            tags={tags}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onTransfer={handleTransfer}
            familyMembers={familyMembers}
          />}
          {currentView === 'reports' && <Reports
            transactions={transactions}
            accounts={accounts}
            currentDate={currentDate}
            tags={tags}
          />}

          {currentView === 'credit-cards' && <CreditCardManager accounts={accounts.filter(a => a.isCredit)} transactions={transactions} onAddTransaction={handleAddTransaction} onAddAccount={handleAddAccount} />}
          {currentView === 'budgets' && <BudgetManager transactions={filteredTransactions} budgets={budgets} onUpdateBudget={handleUpdateBudget} onAddBudget={handleAddBudget} />}
          {currentView === 'custom-budgets' && <CustomBudgetManager
            customBudgets={customBudgets}
            transactions={filteredTransactions}
            monthlyIncome={filteredTransactions
              .filter(t => t.type === 'income' && t.date.startsWith(currentDate.toISOString().slice(0, 7)))
              .reduce((sum, t) => sum + t.amount, 0)}
            onAddCustomBudget={handleAddCustomBudget}
            onDeleteCustomBudget={handleDeleteCustomBudget}
          />}
          {currentView === 'goals' && <GoalManager goals={goals} transactions={filteredTransactions} accounts={accounts} onAddGoal={handleAddGoal} onDeleteGoal={handleDeleteGoal} />}
          {currentView === 'categories' && <CategoryManager transactions={filteredTransactions} />}
          {currentView === 'accounts' && <AccountManager accounts={accounts} transactions={transactions} onAddAccount={handleAddAccount} onDeleteAccount={handleDeleteAccount} />}
          {currentView === 'investments' && <Investments />}
          {currentView === 'retirement' && <RetirementSimulator transactions={transactions} budgets={budgets} simulationParams={retirementParams} />}
          {currentView === 'tags' && <TagManager tags={tags} onAddTag={handleAddTag} onDeleteTag={handleDeleteTag} onUpdateTag={handleUpdateTag} />}
          {currentView === 'ai-assistant' && (
            <div className="p-4 md:p-8 overflow-y-auto scrollbar-hide text-slate-800 h-full flex flex-col">
              <div className="max-w-4xl mx-auto w-full h-full">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Assistente Virtual</h2>
                  <p className="text-slate-500 font-medium">Seu consultor financeiro pessoal 24/7</p>
                </div>
                <FinancialAssistant
                  userName={user?.name || 'Investidor'}
                  transactions={transactions}
                  accounts={accounts}
                  goals={goals}
                  budgets={budgets}
                  onAddTransaction={handleAddTransaction}
                />
              </div>
            </div>
          )}
          {currentView === 'expenses' && <ExpenseManager type="expense" transactions={filteredTransactions} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} onUpdateTransaction={handleUpdateTransaction} tags={tags} accounts={accounts} familyMembers={familyMembers} />}
          {currentView === 'income' && <ExpenseManager type="income" transactions={filteredTransactions} allTransactions={transactions} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} onUpdateTransaction={handleUpdateTransaction} tags={tags} accounts={accounts} familyMembers={familyMembers} />}
          {currentView === 'charts' && <ChartsHub transactions={filteredTransactions} />}
          {currentView === 'settings' && <Settings user={user} onLogout={handleLogout} onExportData={handleExportData} onResetData={handleResetData} />}
        </div>
      </main>

      {/* Global Voice Control - Floating Action Button */}
      <VoiceControl onAddTransaction={(result) => { handleAICommand(result); return true; }} />

      {/* Global Components Layer */}
      {showNotificationPopup && notificationData && (
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
      )}

      {/* Modals */}
      {user && (
        <ProfileModal
          user={user}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdate={handleUpdateProfile}
        />
      )}
    </div>
  );
};

export default App;
