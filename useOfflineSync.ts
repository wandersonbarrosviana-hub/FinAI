import { useEffect, useState } from 'react';
import { db } from './db';
import { supabase } from './supabaseClient';
import { useLiveQuery } from 'dexie-react-hooks';
import { Transaction, Account, Goal, Tag, Budget, CustomBudget } from './types';

export const useOfflineSync = (userId: string | undefined) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [syncing, setSyncing] = useState(false);

    // Monitorar contagem da fila em tempo real
    const pendingCount = useLiveQuery(() => db.syncQueue.count()) ?? 0;

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Sincronizar fila pendente quando voltar a ficar online
    useEffect(() => {
        if (isOnline && userId) {
            processSyncQueue();
        }
    }, [isOnline, userId]);

    const processSyncQueue = async () => {
        if (syncing) return;
        setSyncing(true);

        try {
            const pendingActions = await db.syncQueue.toArray();
            if (pendingActions.length === 0) return;

            console.log(`[FinAI] Starting sync for ${pendingActions.length} items...`);

            for (const action of pendingActions) {
                try {
                    let success = false;
                    let isGhost = false; // item whose local data no longer exists

                    const syncPromise = (async () => {
                        if (action.action === 'INSERT' || action.action === 'UPDATE') {
                            const tableData = await (db as any)[action.table].get(action.entityId);

                            // If local data is gone, this is a ghost item from before a reset → discard it
                            if (!tableData) {
                                console.warn(`[FinAI] Ghost item detected (${action.table}:${action.entityId}), discarding.`);
                                isGhost = true;
                                return false;
                            }

                            const dbPayload = mapToSupabaseFormat(action.table, tableData);
                            const { error } = await supabase.from(action.table).upsert(dbPayload);
                            if (!error) return true;
                            console.error(`[FinAI] Supabase Error (${action.table}):`, error);
                        } else if (action.action === 'DELETE') {
                            const { error } = await supabase.from(action.table).delete().eq('id', action.entityId);
                            // If row doesn't exist on server (already gone), treat as success
                            if (!error || error.code === 'PGRST116') return true;
                            console.error(`[FinAI] Delete Error (${action.table}):`, error);
                        }
                        return false;
                    })();

                    const result = await Promise.race([
                        syncPromise,
                        new Promise<boolean>(resolve => setTimeout(() => resolve(false), 15000))
                    ]);

                    // Remove item if synced successfully OR if it's a ghost (stale pre-reset data)
                    if (result || isGhost) {
                        await db.syncQueue.delete(action.id!);
                        if (isGhost) {
                            success = true; // count as resolved so we don't break
                        } else {
                            success = true;
                        }
                    } else {
                        // Log the failure but CONTINUE to next item — don't block the whole queue
                        console.warn(`[FinAI] Sync failed for ${action.table}:${action.entityId}. Continuing with next item.`);
                    }
                } catch (e) {
                    console.error(`[FinAI] Critical Sync Loop Error:`, e);
                    // Don't break — continue processing remaining items
                }
            }
        } finally {
            setSyncing(false);
        }
    };


    const mapToSupabaseFormat = (table: string, data: any) => {
        // Criar uma cópia limpa
        const payload = { ...data };

        // Remover chaves do lado do cliente (Dexie/React) que não existem no Supabase
        const keysToRemove = [
            'account', 'subCategory', 'paymentMethod', 'isPaid',
            'installmentCount', 'installmentTotal', 'tags',
            'ignoreInStatistics', 'ignoreInBudgets', 'ignoreInTotals',
            'dueDate', 'paymentDate', 'bankId', 'isCredit',
            'creditLimit', 'closingDay', 'dueDay', 'userId'
        ];

        if (table === 'transactions') {
            const mapped = {
                ...payload,
                account_id: data.account,
                sub_category: data.subCategory,
                payment_method: data.paymentMethod,
                is_paid: data.isPaid,
                installment_count: data.installmentCount,
                installment_total: data.installmentTotal,
                tag_ids: data.tags,
                ignore_in_statistics: data.ignoreInStatistics,
                ignore_in_budgets: data.ignoreInBudgets,
                ignore_in_totals: data.ignoreInTotals,
                due_date: data.dueDate,
                payment_date: data.paymentDate,
                user_id: data.user_id || userId
            };
            keysToRemove.forEach(k => delete (mapped as any)[k]);
            return mapped;
        }

        if (table === 'accounts') {
            const mapped = {
                ...payload,
                bank_id: data.bankId,
                is_credit: data.isCredit,
                credit_limit: data.creditLimit,
                closing_day: data.closingDay,
                due_day: data.dueDay,
                user_id: data.user_id || userId
            };
            keysToRemove.forEach(k => delete (mapped as any)[k]);
            return mapped;
        }

        if (table === 'custom_budgets') {
            const mapped = {
                ...payload,
                user_id: data.userId || userId
            };
            delete (mapped as any).userId;
            return mapped;
        }

        return { ...payload, user_id: payload.user_id || userId };
    };

    const addToSyncQueue = async (table: string, entityId: string, action: 'INSERT' | 'UPDATE' | 'DELETE') => {
        await db.syncQueue.add({
            table,
            entityId,
            action,
            timestamp: Date.now()
        });

        if (isOnline) {
            processSyncQueue();
        }
    };

    const clearSyncQueue = async () => {
        if (window.confirm("Isso limpará as ações pendentes localmente. Use apenas se o sincronismo estiver travado. Continuar?")) {
            await db.syncQueue.clear();
            console.log("[FinAI] Sync queue cleared manually.");
        }
    };

    return { isOnline, syncing, pendingCount, addToSyncQueue, processSyncQueue, clearSyncQueue };
};
