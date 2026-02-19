import { useEffect, useState } from 'react';
import { db } from './db';
import { supabase } from './supabaseClient';
import { Transaction, Account, Goal, Tag, Budget, CustomBudget } from './types';

export const useOfflineSync = (userId: string | undefined) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [syncing, setSyncing] = useState(false);

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

                    const syncPromise = (async () => {
                        if (action.action === 'INSERT' || action.action === 'UPDATE') {
                            const tableData = await (db as any)[action.table].get(action.entityId);
                            if (tableData) {
                                const dbPayload = mapToSupabaseFormat(action.table, tableData);
                                const { error } = await supabase.from(action.table).upsert(dbPayload);
                                if (!error) return true;
                                console.error(`[FinAI] Supabase Error (${action.table}):`, error);
                            } else if (action.action === 'UPDATE') {
                                return true;
                            }
                        } else if (action.action === 'DELETE') {
                            const { error } = await supabase.from(action.table).delete().eq('id', action.entityId);
                            if (!error) return true;
                        }
                        return false;
                    })();

                    success = await Promise.race([
                        syncPromise,
                        new Promise<boolean>(resolve => setTimeout(() => resolve(false), 15000))
                    ]);

                    if (success) {
                        await db.syncQueue.delete(action.id!);
                    } else {
                        console.warn(`[FinAI] Sync stalled for ${action.table}:${action.entityId}. Retrying later.`);
                        break;
                    }
                } catch (e) {
                    console.error(`[FinAI] Critical Sync Loop Error:`, e);
                    break;
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

    return { isOnline, syncing, addToSyncQueue, processSyncQueue };
};
