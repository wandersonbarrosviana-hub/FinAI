import React, { useState, useEffect, useMemo } from 'react';
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
import DebtManager from './components/DebtManager';

import ProfileModal from './components/ProfileModal';
import FinancialAssistant from './components/FinancialAssistant';
import CustomBudgetManager from './components/CustomBudgetManager';
import AdminPanel from './components/AdminPanel';
import PlansPage from './components/PlansPage';
import AccountModal from './components/AccountModal';
import { canAddAccount, canAddCard, canUseAI, PLAN_LIMITS } from './planConstraints';
import { Budget, CustomBudget } from './types';

import { Bell, Search, User as UserIcon, Plus, Sparkles, AlertCircle, ChevronLeft, ChevronRight, Loader2, LogOut, Settings as SettingsIcon, MessageSquare } from 'lucide-react';
import { parseNotification } from './aiService';
import { supabase } from './supabaseClient';
import { Transaction, Account, Goal, User, ViewState, Tag, AppNotification, Debt } from './types';

import { Session } from '@supabase/supabase-js';
import { db } from './db';
import { useOfflineSync } from './useOfflineSync';
import { useLiveQuery } from 'dexie-react-hooks';

const APP_VERSION = "1.1.0-OFFLINE-FIX";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('finai_user_data') || 'null'); } catch { return null; }
  });
  const [session, setSession] = useState<Session | null>(null);
  // Boot Local-First: Se temos usuário no cache, começamos com loading false
  const [loading, setLoading] = useState(() => {
    return !localStorage.getItem('finai_user_data');
  });
  const [showEmergencySkip, setShowEmergencySkip] = useState(false);

  const [familyMembers, setFamilyMembers] = useState<Record<string, { name: string, avatar: string }>>(() => {
    try { return JSON.parse(localStorage.getItem('finai_family_members') || '{}'); } catch { return {}; }
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState<string>(() => localStorage.getItem('finai_user_role') || 'user');
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'premium'>(() => (localStorage.getItem('finai_user_plan') as any) || 'free');
  const [currentView, setCurrentView] = useState<ViewState | 'settings'>(() => {
    return (localStorage.getItem('finai_current_view') as ViewState | 'settings') || 'dashboard';
  });
  const [lastSync, setLastSync] = useState<string | null>(() => localStorage.getItem('finai_last_sync'));
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const { isOnline, syncing, pendingCount, addToSyncQueue, clearSyncQueue, processSyncQueue } = useOfflineSync(user?.id);

  // Fonte de dados Híbrida (Dexie + Fallback localStorage)
  // Merging Logic: Se o Dexie tem poucos itens, complementamos com o backup do localStorage
  const dexieTransactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const dexieAccounts = useLiveQuery(() => db.accounts.toArray()) || [];

  const transactions = useMemo(() => {
    const fallbackTxs = (() => {
      try { return JSON.parse(localStorage.getItem('finai_fallback_txs') || '[]'); } catch { return []; }
    })();
    // Se não temos nada no Dexie, usamos todo o fallback
    if (dexieTransactions.length === 0) return fallbackTxs;

    // Se temos itens no Dexie, mesclamos (removendo duplicados por ID)
    const merged = [...dexieTransactions];
    const dexieIds = new Set(dexieTransactions.map(t => t.id));

    fallbackTxs.forEach((t: Transaction) => {
      if (!dexieIds.has(t.id)) {
        merged.push(t);
      }
    });
    return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dexieTransactions]);

  const accounts = useMemo(() => {
    const fallbackAccs = (() => {
      try { return JSON.parse(localStorage.getItem('finai_fallback_accs') || '[]'); } catch { return []; }
    })();
    if (dexieAccounts.length === 0) return fallbackAccs;

    const merged = [...dexieAccounts];
    const dexieIds = new Set(dexieAccounts.map(a => a.id));
    fallbackAccs.forEach((a: Account) => {
      if (!dexieIds.has(a.id)) merged.push(a);
    });
    return merged;
  }, [dexieAccounts]);

  const goals = useLiveQuery(() => db.goals.toArray()) || [];
  const tags = useLiveQuery(() => db.tags.toArray()) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
  const customBudgets = useLiveQuery(() => db.customBudgets.toArray()) || [];
  const debts = useLiveQuery(() => db.debts.toArray()) || [];





  const [retirementParams, setRetirementParams] = useState<any>(null);

  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [notificationData, setNotificationData] = useState<any>(null);
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

  // No auto-clearing user from localStorage based on state
  // It will be managed by Auth events explicitly.

  useEffect(() => {
    // Local-First Auth: Get session silently
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        // Silently update user data if online
        const userData = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || session.user.email!.split('@')[0],
          avatarUrl: session.user.user_metadata.avatar_url
        };
        setUser(userData);
        localStorage.setItem('finai_user_data', JSON.stringify(userData));

        // Background fetch
        fetchData(session.user.id, true);
        checkPendingInvites(session.user.email!, session.user.id);
      }
      // Releasing loading if it was still active
      setLoading(false);
    }).catch(err => {
      console.error("[FinAI] Auth Session Error:", err);
      setLoading(false); // Never block
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[FinAI] Auth Event: ${event}`);
      if (event === 'SIGNED_IN') {
        setSession(session);
        if (session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata.name || session.user.email!.split('@')[0],
            avatarUrl: session.user.user_metadata.avatar_url
          };
          setUser(userData);
          localStorage.setItem('finai_user_data', JSON.stringify(userData));
          fetchData(session.user.id, true);
          checkPendingInvites(session.user.email!, session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        if (!session && navigator.onLine) {
          setSession(null);
          setUser(null);
          localStorage.removeItem('finai_user_data');
          db.syncQueue.count().then(count => {
            if (count === 0) {
              db.transactions.clear();
              db.accounts.clear();
            }
          });
        }
      }
    });

    // Visibility Listener: Sincronizar ao voltar para a aba
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        console.log('[FinAI] Tab focused, triggering silent sync...');
        fetchData(user.id, true);
        if (user.email) checkPendingInvites(user.email, user.id);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Supabase Realtime: handle INSERT/UPDATE/DELETE in real-time
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'transactions' },
        (payload) => {
          const deletedId = payload.old?.id;
          if (deletedId) {
            console.log(`[FinAI] Realtime DELETE transaction: ${deletedId}`);
            db.transactions.delete(deletedId);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'accounts' },
        (payload) => {
          const deletedId = payload.old?.id;
          if (deletedId) {
            console.log(`[FinAI] Realtime DELETE account: ${deletedId}`);
            db.accounts.delete(deletedId);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        () => user?.id && fetchData(user.id, true)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transactions' },
        () => user?.id && fetchData(user.id, true)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'accounts' },
        () => user?.id && fetchData(user.id, true)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'accounts' },
        () => user?.id && fetchData(user.id, true)
      )
      .subscribe();

    return () => {
      authListener.subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Update localStorage when roles change
  useEffect(() => {
    localStorage.setItem('finai_user_role', userRole);
    localStorage.setItem('finai_user_plan', userPlan);
  }, [userRole, userPlan]);

  useEffect(() => {
    localStorage.setItem('finai_family_members', JSON.stringify(familyMembers));
  }, [familyMembers]);

  // Re-fetch data when coming back online
  useEffect(() => {
    if (isOnline && user?.id) {
      fetchData(user.id, true); // silent fetch
    }
  }, [isOnline]);

  const fetchData = async (userId: string, silent = false) => {
    // Local-First: We never block the UI for network
    setIsSyncing(true);
    console.log(`[FinAI] Fetching data for ${userId}. Online: ${isOnline}`);

    // Log Dexie status for debugging
    const txCount = await db.transactions.count();
    console.log(`[FinAI] Current Dexie Transaction Count: ${txCount}`);

    // Verify if there are pending sync items
    let pendingSync = await db.syncQueue.count();
    if (pendingSync > 0 && isOnline) {
      console.log(`[FinAI] Found ${pendingSync} pending items. Attempting pre-fetch sync...`);
      await processSyncQueue();
      pendingSync = await db.syncQueue.count(); // Refresh count
    }

    try {
      if (isOnline) {
        const [txRes, accRes, goalRes, tagRes, budRes, cbRes, familyRes, profileRes] = await Promise.all([
          supabase.from('transactions').select('*').order('date', { ascending: false }),
          supabase.from('accounts').select('*'),
          supabase.from('goals').select('*'),
          supabase.from('tags').select('*'),
          supabase.from('budgets').select('*'),
          supabase.from('custom_budgets').select('*'),
          supabase.rpc('get_family_details', { current_user_id: userId }),
          supabase.from('profiles').select('role, plan_type').eq('id', userId).single()
        ]);

        if (txRes.error) throw txRes.error;
        if (accRes.error) throw accRes.error;
        if (goalRes.error) throw goalRes.error;

        const txData = txRes.data || [];
        const accData = accRes.data || [];
        const goalData = goalRes.data || [];
        const tagData = tagRes.data || [];
        const budData = budRes.data || [];
        const cbData = cbRes.data || [];

        // Set user role and plan from profile
        if (profileRes.data) {
          setUserRole(profileRes.data.role);
          setUserPlan(profileRes.data.plan_type as 'free' | 'pro' | 'premium' || 'free');
        }

        // Process Family Members
        const membersMap: Record<string, { name: string, avatar: string }> = {};
        if (familyRes.data) {
          familyRes.data.forEach((m: any) => {
            membersMap[m.user_id] = { name: m.name, avatar: m.avatar_url };
          });
        }
        if (user) {
          membersMap[user.id] = { name: user.name, avatar: user.avatarUrl || '' };
        }
        setFamilyMembers(membersMap);

        const mappedTxs = txData.map((t: any) => ({
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

        const mappedAccs = accData.map((a: any) => ({
          ...a,
          bankId: a.bank_id,
          isCredit: a.is_credit,
          creditLimit: a.credit_limit,
          closingDay: a.closing_day,
          dueDay: a.due_day
        }));

        const mappedCB = cbData.map((cb: any) => ({
          id: cb.id,
          userId: cb.user_id,
          name: cb.name,
          categories: cb.categories || [],
          limitType: cb.limit_type,
          limitValue: cb.limit_value
        }));

        // --- TRUE SYNC: Reconcile local data with server (remove orphans) ---
        if (pendingSync === 0) {
          // Build sets of server IDs for fast lookup
          const serverTxIds = new Set(mappedTxs.map((t: any) => t.id));
          const serverAccIds = new Set(mappedAccs.map((a: any) => a.id));
          const serverGoalIds = new Set(goalData.map((g: any) => g.id));
          const serverTagIds = new Set(tagData.map((t: any) => t.id));
          const serverBudgetIds = new Set(budData.map((b: any) => b.id));
          const serverCBIds = new Set(mappedCB.map((c: any) => c.id));

          // Find and delete local records no longer on server
          const [localTxs, localAccs, localGoals, localTags, localBudgets, localCBs] = await Promise.all([
            db.transactions.toArray(),
            db.accounts.toArray(),
            db.goals.toArray(),
            db.tags.toArray(),
            db.budgets.toArray(),
            db.customBudgets.toArray()
          ]);

          const orphanTxIds = localTxs.filter(t => !serverTxIds.has(t.id)).map(t => t.id);
          const orphanAccIds = localAccs.filter(a => !serverAccIds.has(a.id)).map(a => a.id);
          const orphanGoalIds = localGoals.filter(g => !serverGoalIds.has(g.id)).map(g => g.id);
          const orphanTagIds = localTags.filter(t => !serverTagIds.has(t.id)).map(t => t.id);
          const orphanBudgetIds = localBudgets.filter(b => !serverBudgetIds.has(b.id)).map(b => b.id);
          const orphanCBIds = localCBs.filter(c => !serverCBIds.has(c.id)).map(c => c.id);

          if (orphanTxIds.length > 0) {
            console.log(`[FinAI] Reconcile: removing ${orphanTxIds.length} orphan transactions.`);
            await db.transactions.bulkDelete(orphanTxIds);
          }
          if (orphanAccIds.length > 0) {
            console.log(`[FinAI] Reconcile: removing ${orphanAccIds.length} orphan accounts.`);
            await db.accounts.bulkDelete(orphanAccIds);
          }
          if (orphanGoalIds.length > 0) await db.goals.bulkDelete(orphanGoalIds);
          if (orphanTagIds.length > 0) await db.tags.bulkDelete(orphanTagIds);
          if (orphanBudgetIds.length > 0) await db.budgets.bulkDelete(orphanBudgetIds);
          if (orphanCBIds.length > 0) await db.customBudgets.bulkDelete(orphanCBIds);

          // Upsert server data locally
          await db.transactions.bulkPut(mappedTxs);
          await db.accounts.bulkPut(mappedAccs);
          await db.goals.bulkPut(goalData);
          await db.tags.bulkPut(tagData);
          await db.budgets.bulkPut(budData);
          await db.customBudgets.bulkPut(mappedCB);

          localStorage.setItem('finai_fallback_txs', JSON.stringify(mappedTxs.slice(0, 50)));
          localStorage.setItem('finai_fallback_accs', JSON.stringify(mappedAccs));
        } else {
          console.warn("[FinAI] Skipping reconcile due to pending sync items to prevent data loss.");
        }

        const syncTime = new Date().toLocaleString('pt-BR');
        setLastSync(syncTime);
        localStorage.setItem('finai_last_sync', syncTime);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setIsSyncing(false);
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
  // Global Filter: Compare Year and Month using string prefix (Robust against Timezone)
  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const filterPrefix = `${year}-${month}`;
    return t.date.startsWith(filterPrefix);
  });

  const monthlyBalance = filteredTransactions.reduce((acc, t) => {
    if (!t.isPaid) return acc; // Only count paid transactions
    if (t.type === 'income') return acc + t.amount;
    if (t.type === 'expense') return acc - t.amount;
    return acc;
  }, 0);


  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    // 1. Buscar transação original no banco local
    const originalTx = await db.transactions.get(id);
    if (!originalTx) return;

    // 2. Persistir localmente no Dexie
    await db.transactions.update(id, updates);

    // 3. Adicionar na fila de sincronização
    await addToSyncQueue('transactions', id, 'UPDATE');

    // 4. Lógica de Atualização de Saldo de Conta (se necessário)
    const isAmountChanged = updates.amount !== undefined && updates.amount !== originalTx.amount;
    const isAccountChanged = updates.account !== undefined && updates.account !== originalTx.account;
    const isTypeChanged = updates.type !== undefined && updates.type !== originalTx.type;
    const isStatusChanged = updates.isPaid !== undefined && updates.isPaid !== originalTx.isPaid;

    if (isAmountChanged || isAccountChanged || isTypeChanged || isStatusChanged) {
      // Reverter efeito antigo
      if (originalTx.isPaid) {
        const acc = await db.accounts.get(originalTx.account);
        if (acc) {
          const revertDelta = originalTx.type === 'expense' ? originalTx.amount : -originalTx.amount;
          await db.accounts.update(acc.id, { balance: acc.balance + revertDelta });
          await addToSyncQueue('accounts', acc.id, 'UPDATE');
        }
      }

      // Aplicar novo efeito
      const newIsPaid = updates.isPaid !== undefined ? updates.isPaid : originalTx.isPaid;
      if (newIsPaid) {
        const newAmount = updates.amount !== undefined ? updates.amount : originalTx.amount;
        const newAccount = updates.account !== undefined ? updates.account : originalTx.account;
        const newType = updates.type !== undefined ? updates.type : originalTx.type;

        const acc = await db.accounts.get(newAccount);
        if (acc) {
          const applyDelta = newType === 'expense' ? -newAmount : newAmount;
          await db.accounts.update(acc.id, { balance: acc.balance + applyDelta });
          await addToSyncQueue('accounts', acc.id, 'UPDATE');
        }
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
      account: data.account || accounts[0]?.id,
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

    if (accounts.length === 0) {
      setIsAccountModalOpen(true);
      return;
    }

    const baseDate = data.date || new Date().toISOString().split('T')[0];
    const newTxs: Transaction[] = [];

    if (baseTx.recurrence === 'fixed') {
      for (let i = 0; i < 12; i++) {
        newTxs.push({
          ...baseTx,
          id: crypto.randomUUID(),
          date: addMonths(baseDate, i),
          isPaid: i === 0 ? baseTx.isPaid : false,
          user_id: user.id
        } as Transaction);
      }
    } else if (baseTx.recurrence === 'installment' && baseTx.installmentCount && baseTx.installmentCount > 1) {
      for (let i = 0; i < baseTx.installmentCount; i++) {
        newTxs.push({
          ...baseTx,
          id: crypto.randomUUID(),
          description: `${baseTx.description} (${i + 1}/${baseTx.installmentCount})`,
          date: addMonths(baseDate, i),
          isPaid: i === 0 ? baseTx.isPaid : false,
          user_id: user.id
        } as Transaction);
      }
    } else {
      newTxs.push({
        ...baseTx,
        id: crypto.randomUUID(),
        date: baseDate,
        user_id: user.id
      } as Transaction);
    }

    try {
      // 1. Persistir Localmente (Dexie)
      await db.transactions.bulkAdd(newTxs);

      // 2. Atualizar Saldos de Contas Localmente
      for (const tx of newTxs) {
        if (tx.isPaid) {
          const acc = accounts.find(a => a.id === tx.account);
          if (acc) {
            const delta = tx.type === 'expense' ? -tx.amount : tx.amount;
            await db.accounts.update(acc.id, { balance: acc.balance + delta });
            await addToSyncQueue('accounts', acc.id, 'UPDATE');
          }
        }
        // 3. Adicionar na fila de sincronização
        await addToSyncQueue('transactions', tx.id, 'INSERT');
      }

    } catch (err) {
      console.error("Error creating transaction", err);
      alert("Erro ao salvar transação localmente");
    }
  };

  const handleUpdateAccount = async (id: string, updates: Partial<Account>) => {
    await db.accounts.update(id, updates);
    await addToSyncQueue('accounts', id, 'UPDATE');
  };

  const handleUpdateGoal = async (id: string, updates: Partial<Goal>) => {
    await db.goals.update(id, updates);
    await addToSyncQueue('goals', id, 'UPDATE');
  };

  const handleAddDebt = async (debtData: Partial<Debt>) => {
    if (!user) return;
    const newDebt: Debt = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: debtData.name || '',
      type: debtData.type || 'personal_loan',
      creditor: debtData.creditor || '',
      totalContracted: debtData.totalContracted || 0,
      currentBalance: debtData.currentBalance || 0,
      interestRateMonthly: debtData.interestRateMonthly,
      totalInstallments: debtData.totalInstallments || 1,
      remainingInstallments: debtData.remainingInstallments || 1,
      installmentValue: debtData.installmentValue || 0,
      startDate: debtData.startDate || new Date().toISOString().split('T')[0],
      endDate: debtData.endDate || '',
      amortizationType: debtData.amortizationType || 'unknown',
      reason: debtData.reason,
      classification: debtData.classification,
      createdAt: new Date().toISOString(),
    };
    await db.debts.add(newDebt);
    // Sync to Supabase
    try {
      const { error } = await supabase.from('debts').insert([{
        id: newDebt.id, user_id: newDebt.userId, name: newDebt.name,
        type: newDebt.type, creditor: newDebt.creditor,
        total_contracted: newDebt.totalContracted, current_balance: newDebt.currentBalance,
        interest_rate_monthly: newDebt.interestRateMonthly, total_installments: newDebt.totalInstallments,
        remaining_installments: newDebt.remainingInstallments, installment_value: newDebt.installmentValue,
        start_date: newDebt.startDate, end_date: newDebt.endDate,
        amortization_type: newDebt.amortizationType, reason: newDebt.reason,
        classification: newDebt.classification,
      }]);
      if (error) console.warn('Debt sync error:', error.message);
    } catch (e) { console.warn('Debt offline:', e); }
  };

  const handleUpdateDebt = async (id: string, updates: Partial<Debt>) => {
    await db.debts.update(id, updates);
    try {
      await supabase.from('debts').update({
        name: updates.name, type: updates.type, creditor: updates.creditor,
        total_contracted: updates.totalContracted, current_balance: updates.currentBalance,
        interest_rate_monthly: updates.interestRateMonthly, total_installments: updates.totalInstallments,
        remaining_installments: updates.remainingInstallments, installment_value: updates.installmentValue,
        start_date: updates.startDate, end_date: updates.endDate,
        amortization_type: updates.amortizationType, reason: updates.reason, classification: updates.classification,
      }).eq('id', id);
    } catch (e) { console.warn('Debt update offline:', e); }
  };

  const handleDeleteDebt = async (id: string) => {
    await db.debts.delete(id);
    try { await supabase.from('debts').delete().eq('id', id); }
    catch (e) { console.warn('Debt delete offline:', e); }
  };

  const handleAICommand = async (result: any) => {
    console.log('AI Command:', result);

    if (result.intent === 'CREATE') {
      await handleAddTransaction(result.data);
      return true;
    } else if (result.intent === 'UPDATE_STATUS') {
      const { searchDescription, newStatus } = result.data;
      const tx = transactions.find(t =>
        t.description.toLowerCase().includes(searchDescription.toLowerCase())
      );
      if (tx) {
        await handleUpdateTransaction(tx.id, { isPaid: newStatus });
        return true;
      }
      return false;
    } else if (result.intent === 'CREATE_ACCOUNT') {
      await handleAddAccount(result.data);
      return true;
    } else if (result.intent === 'UPDATE_ACCOUNT') {
      const acc = accounts.find(a => a.name.toLowerCase().includes(result.data.name.toLowerCase()));
      if (acc) {
        await handleUpdateAccount(acc.id, result.data.updates);
        return true;
      }
      return false;
    } else if (result.intent === 'DELETE_ACCOUNT') {
      const acc = accounts.find(a => a.name.toLowerCase().includes(result.data.name.toLowerCase()));
      if (acc) {
        await handleDeleteAccount(acc.id);
        return true;
      }
      return false;
    } else if (result.intent === 'CREATE_GOAL') {
      await handleAddGoal(result.data);
      return true;
    } else if (result.intent === 'UPDATE_GOAL') {
      const goal = goals.find(g => g.title.toLowerCase().includes(result.data.title.toLowerCase()));
      if (goal) {
        await handleUpdateGoal(goal.id, result.data.updates);
        return true;
      }
      return false;
    } else if (result.intent === 'DELETE_GOAL') {
      const goal = goals.find(g => g.title.toLowerCase().includes(result.data.title.toLowerCase()));
      if (goal) {
        await handleDeleteGoal(goal.id);
        return true;
      }
      return false;
    } else if (result.intent === 'CREATE_BUDGET') {
      await handleAddBudget(result.data);
      return true;
    } else if (result.intent === 'UPDATE_BUDGET') {
      const budget = budgets.find(b => b.category.toLowerCase() === result.data.category.toLowerCase());
      if (budget) {
        await handleUpdateBudget(budget.id, { amount: result.data.amount });
        return true;
      }
      return false;
    } else if (result.intent === 'DELETE_BUDGET') {
      const budget = budgets.find(b => b.category.toLowerCase() === result.data.category.toLowerCase());
      if (budget) {
        await db.budgets.delete(budget.id);
        await addToSyncQueue('budgets', budget.id, 'DELETE');
        return true;
      }
      return false;
    } else if (result.intent === 'SIMULATE_RETIREMENT') {
      setRetirementParams(result.data);
      setCurrentView('retirement');
      return true;
    } else if (result.intent === 'ADVICE_REQUEST') {
      alert('FinAI: ' + result.data.answer);
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
        // O liveQuery do Dexie atualizará o estado automaticamente se o db for atualizado
        // Se estivermos usando Supabase diretamente aqui, precisamos garantir que o db local reflita isso ou confiar no liveQuery.
        // Como o plano é usar Dexie como fonte da verdade, o ideal seria db.budgets.put(inserted)
        await db.budgets.put(inserted);
      }
    }
  };

  const handleAddCustomBudget = async (data: Partial<CustomBudget>) => {
    if (!user) return;

    if (userRole !== 'admin' && userPlan !== 'premium') {
      alert("Orçamentos personalizados são exclusivos para usuários Premium. Faça o upgrade agora!");
      setCurrentView('plans');
      return;
    }
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
      await db.customBudgets.put({
        id: inserted.id,
        userId: inserted.user_id,
        name: inserted.name,
        categories: inserted.categories,
        limitType: inserted.limit_type,
        limitValue: inserted.limit_value
      });
    }
  };

  const handleDeleteCustomBudget = async (id: string) => {
    const { error } = await supabase.from('custom_budgets').delete().eq('id', id);
    if (error) {
      console.error("Error deleting custom budget", error);
      alert("Erro ao excluir orçamento");
      return;
    }
    // O liveQuery do Dexie atualizará o estado automaticamente
    await db.customBudgets.delete(id);
  };

  const handleUpdateBudget = async (id: string, updates: Partial<Budget>) => {
    // Atualiza localmente e o liveQuery reflete a mudança
    await db.budgets.update(id, updates);
    await supabase.from('budgets').update(updates).eq('id', id);
  };


  const handleDeleteTransaction = async (id: string) => {
    const originalTx = await db.transactions.get(id);
    if (!originalTx) return;
    await db.transactions.delete(id);
    await addToSyncQueue('transactions', id, 'DELETE');
    if (originalTx.isPaid) {
      const acc = await db.accounts.get(originalTx.account);
      if (acc) {
        const revertDelta = originalTx.type === 'expense' ? originalTx.amount : -originalTx.amount;
        await db.accounts.update(acc.id, { balance: acc.balance + revertDelta });
        await addToSyncQueue('accounts', acc.id, 'UPDATE');
      }
    }
  };
  const handleTransfer = async (data: {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    date: string;
    description: string;
  }) => {
    await handleAddTransaction({
      description: `Transferência para: ${data.description}`,
      amount: data.amount,
      type: 'expense',
      account: data.sourceAccountId,
      category: 'Transferência',
      subCategory: 'Saída',
      date: data.date,
      isPaid: true
    });

    await handleAddTransaction({
      description: `Transferência de: ${data.description}`,
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
    const newId = crypto.randomUUID();
    const newAcc: Account = {
      id: newId,
      userId: user.id,
      name: data.name || 'Nova Conta',
      balance: data.balance || 0,
      type: data.type || 'checking',
      bankId: data.bankId || 'outro',
      color: data.color || '#64748b',
      isCredit: data.isCredit || false,
      creditLimit: data.creditLimit || 0,
      closingDay: data.closingDay || 1,
      dueDay: data.dueDay || 10
    } as Account;

    try {
      await db.accounts.add(newAcc);
      await addToSyncQueue('accounts', newId, 'INSERT');
    } catch (err) {
      console.error('Erro ao criar conta localmente:', err);
      alert('Erro ao criar conta no banco local');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!user) return;
    if (!window.confirm('Tem certeza que deseja excluir esta conta? Todas as transa??es vinculadas ser?o mantidas mas sem conta associada.')) return;

    try {
      await db.accounts.delete(id);
      await addToSyncQueue('accounts', id, 'DELETE');
    } catch (err) {
      console.error('Erro ao excluir conta localmente:', err);
    }
  };

  const handleAddGoal = async (data: Partial<Goal>) => {
    if (!user) return;
    const newId = crypto.randomUUID();
    const newGoal: Goal = {
      id: newId,
      ...data,
      userId: user.id
    } as Goal;
    await db.goals.add(newGoal);
    await addToSyncQueue('goals', newId, 'INSERT');
  };

  const handleReconcileBalances = async () => {
    if (!confirm("Isso recalculará o saldo de todas as contas com base no histórico de transações local. Deseja continuar?")) return;

    setIsSyncing(true);
    try {
      console.log("[FinAI] Reconciling all accounts...");
      for (const acc of accounts) {
        const accTxs = transactions.filter(t => t.account === acc.id && t.isPaid);
        const newBalance = accTxs.reduce((sum, t) => {
          return t.type === 'income' ? sum + t.amount : sum - t.amount;
        }, 0);

        if (Math.abs(newBalance - acc.balance) > 0.01) {
          console.log(`[FinAI] Reconciling ${acc.name}: ${acc.balance} -> ${newBalance}`);
          await db.accounts.update(acc.id, { balance: newBalance });
          await addToSyncQueue('accounts', acc.id, 'UPDATE');
        }
      }
      alert("Saldos reconciliados localmente e enviados para sincronia!");
      if (isOnline && user?.id) fetchData(user.id, true);
    } catch (err) {
      console.error("Reconciliation error:", err);
      alert("Erro ao reconciliar saldos.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    await db.goals.delete(id);
    await addToSyncQueue('goals', id, 'DELETE');
  };

  const handleAddTag = async (data: Partial<Tag>) => {
    if (!user) return;
    const newId = crypto.randomUUID();
    const newTag: Tag = {
      id: newId,
      name: data.name || 'Nova Tag',
      userId: user.id
    } as Tag;
    await db.tags.add(newTag);
    await addToSyncQueue('tags', newId, 'INSERT');
  };

  const handleUpdateTag = async (id: string, updates: Partial<Tag>) => {
    await db.tags.update(id, updates);
    await addToSyncQueue('tags', id, 'UPDATE');
  };

  const handleDeleteTag = async (id: string) => {
    await db.tags.delete(id);
    await addToSyncQueue('tags', id, 'DELETE');
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
    try {
      setLoading(true);
      const { keepCategories = false, keepCreditCards = false, keepAccounts = false, keepGoals = false } = options || {};

      const { error } = await supabase.rpc('reset_user_data_v2', {
        p_keep_goals: keepGoals,
        p_keep_credit_cards: keepCreditCards,
        p_keep_accounts: keepAccounts
      });

      if (error) {
        console.error('Error resetting data:', error);
        alert('Erro ao resetar dados. Tente novamente ou contate o suporte.');
      } else {
        if (!keepCategories) {
          localStorage.removeItem('finai_categories');
          localStorage.removeItem('finai_subcategories');
        }
        localStorage.removeItem('finai_current_view');
        localStorage.removeItem('finai_current_date');

        // Limpar Banco Local (Dexie)
        await db.transactions.clear();
        if (!keepAccounts) await db.accounts.clear();
        else if (!keepCreditCards) {
          const accs = await db.accounts.toArray();
          const idsToRemove = accs.filter(a => a.isCredit).map(a => a.id);
          await db.accounts.bulkDelete(idsToRemove);
        }
        if (!keepGoals) await db.goals.clear();

        alert('Dados resetados com sucesso!');
        window.location.reload();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-sky-100 border-t-sky-600 rounded-full animate-spin"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sky-600 animate-pulse" size={24} />
        </div>
        <div className="mt-8 text-center space-y-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Carregando FinAI...</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Inteligência Financeira Ativa</p>

          {showEmergencySkip && (
            <button
              onClick={() => setLoading(false)}
              className="mt-6 px-6 py-2 bg-white border border-slate-200 text-[10px] font-black text-slate-400 hover:text-sky-600 rounded-xl shadow-sm transition-all uppercase tracking-widest"
            >
              Ignorar e Entrar (Modo Offline)
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!user && !session) {
    return <Auth onLogin={() => { }} />;
  }



  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden selection:bg-sky-500/30">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} onLogout={handleLogout} userRole={userRole} />
      <main className={`flex-1 flex flex-col transition-all duration-300 mb-[88px] md:mb-0 ml-0 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        {/* Header - White Glassmorphism */}
        {isSyncing && (
          <div className="bg-sky-600 text-white text-[9px] font-black text-center py-0.5 uppercase tracking-tighter flex items-center justify-center gap-2">
            <Loader2 size={10} className="animate-spin" />
            <span>Sincronizando dados com a nuvem...</span>
          </div>
        )}

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

        {/* Main Content Area - All views stay mounted, hidden via CSS to preserve state */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative scrollbar-hide">
          {userRole === 'admin' && <div className={currentView === 'admin' ? '' : 'hidden'}><AdminPanel isOnline={isOnline} /></div>}
          <div className={currentView === 'dashboard' ? '' : 'hidden'}>
            <Dashboard
              transactions={filteredTransactions}
              accounts={accounts}
              onAddClick={() => setCurrentView('expenses')}
              tags={tags}
              goals={goals}
              budgets={budgets}
              familyMembers={familyMembers}
            />
          </div>
          <div className={currentView === 'transactions' ? '' : 'hidden'}>
            <TransactionManager
              transactions={filteredTransactions}
              accounts={accounts}
              tags={tags}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onTransfer={handleTransfer}
              familyMembers={familyMembers}
              onOpenAccountModal={() => setIsAccountModalOpen(true)}
            />
          </div>
          <div className={currentView === 'debts' ? '' : 'hidden'}>
            <DebtManager
              debts={debts as any}
              onAddDebt={handleAddDebt}
              onUpdateDebt={handleUpdateDebt}
              onDeleteDebt={handleDeleteDebt}
              accounts={accounts}
              onCreateExpense={async (data) => {
                await handleAddTransaction(data);
              }}
              monthlyIncome={filteredTransactions
                .filter(t => t.type === 'income' && t.date.startsWith(currentDate.toISOString().slice(0, 7)))
                .reduce((sum, t) => sum + t.amount, 0)}
            />
          </div>
          <div className={currentView === 'reports' ? '' : 'hidden'}>
            <Reports
              transactions={transactions}
              accounts={accounts}
              currentDate={currentDate}
              tags={tags}
            />
          </div>
          <div className={currentView === 'credit-cards' ? '' : 'hidden'}>
            <CreditCardManager accounts={accounts.filter(a => a.isCredit)} transactions={transactions} onAddTransaction={handleAddTransaction} onAddAccount={handleAddAccount} />
          </div>
          <div className={currentView === 'budgets' ? '' : 'hidden'}>
            <BudgetManager transactions={filteredTransactions} budgets={budgets} onUpdateBudget={handleUpdateBudget} onAddBudget={handleAddBudget} />
          </div>
          <div className={currentView === 'custom-budgets' ? '' : 'hidden'}>
            <CustomBudgetManager
              customBudgets={customBudgets}
              transactions={filteredTransactions}
              monthlyIncome={filteredTransactions
                .filter(t => t.type === 'income' && t.date.startsWith(currentDate.toISOString().slice(0, 7)))
                .reduce((sum, t) => sum + t.amount, 0)}
              onAddCustomBudget={handleAddCustomBudget}
              onDeleteCustomBudget={handleDeleteCustomBudget}
            />
          </div>
          <div className={currentView === 'goals' ? '' : 'hidden'}>
            <GoalManager goals={goals} transactions={filteredTransactions} accounts={accounts} onAddGoal={handleAddGoal} onDeleteGoal={handleDeleteGoal} />
          </div>
          <div className={currentView === 'categories' ? '' : 'hidden'}>
            <CategoryManager transactions={filteredTransactions} />
          </div>
          <div className={currentView === 'accounts' ? '' : 'hidden'}>
            <AccountManager accounts={accounts} transactions={transactions} onAddAccount={handleAddAccount} onDeleteAccount={handleDeleteAccount} />
          </div>
          <div className={currentView === 'retirement' ? '' : 'hidden'}>
            <RetirementSimulator transactions={transactions} budgets={budgets} simulationParams={retirementParams} />
          </div>
          <div className={currentView === 'tags' ? '' : 'hidden'}>
            <TagManager tags={tags} onAddTag={handleAddTag} onDeleteTag={handleDeleteTag} onUpdateTag={handleUpdateTag} />
          </div>
          <div className={currentView === 'ai-assistant' ? '' : 'hidden'}>
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
                  onOpenAccountModal={() => setIsAccountModalOpen(true)}
                  userPlan={userPlan}
                  userRole={userRole}
                />
              </div>
            </div>
          </div>
          <div className={currentView === 'expenses' ? '' : 'hidden'}>
            <ExpenseManager type="expense" transactions={filteredTransactions} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} onUpdateTransaction={handleUpdateTransaction} tags={tags} accounts={accounts} familyMembers={familyMembers} onOpenAccountModal={() => setIsAccountModalOpen(true)} />
          </div>
          <div className={currentView === 'income' ? '' : 'hidden'}>
            <ExpenseManager type="income" transactions={filteredTransactions} allTransactions={transactions} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} onUpdateTransaction={handleUpdateTransaction} tags={tags} accounts={accounts} familyMembers={familyMembers} onOpenAccountModal={() => setIsAccountModalOpen(true)} />
          </div>
          <div className={currentView === 'plans' ? '' : 'hidden'}>
            <PlansPage userPlan={userPlan} onUpgradeSuccess={() => fetchData(user!.id)} />
          </div>
          <div className={currentView === 'charts' ? '' : 'hidden'}>
            <ChartsHub transactions={filteredTransactions} />
          </div>
          <div className={currentView === 'settings' ? '' : 'hidden'}>
            <Settings user={user} onLogout={handleLogout} onExportData={handleExportData} onForceSync={() => user?.id && fetchData(user.id, true)} onResetData={handleResetData} />
          </div>
          <div className={currentView === 'investments' ? '' : 'hidden'}>
            <Investments />
          </div>
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
          onUpdate={async () => { }}
          userPlan={userPlan}
          userRole={userRole}
        />
      )}
      {isAccountModalOpen && (
        <AccountModal
          onClose={() => setIsAccountModalOpen(false)}
          onAddAccount={handleAddAccount}
        />
      )}
    </div>
  );
};

export default App;
