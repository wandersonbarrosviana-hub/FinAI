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

            for (const action of pendingActions) {
                try {
                    let success = false;

                    if (action.action === 'INSERT' || action.action === 'UPDATE') {
                        const tableData = await (db as any)[action.table].get(action.entityId);
                        if (tableData) {
                            // Converter para formato do Supabase
                            const dbPayload = mapToSupabaseFormat(action.table, tableData);
                            const { error } = await supabase.from(action.table).upsert({ ...dbPayload, user_id: userId });
                            if (!error) success = true;
                        } else if (action.action === 'UPDATE') {
                            // Se o dado foi deletado localmente antes do sync de update, ignoramos
                            success = true;
                        }
                    } else if (action.action === 'DELETE') {
                        const { error } = await supabase.from(action.table).delete().eq('id', action.entityId);
                        if (!error) success = true;
                    }

                    if (success) {
                        await db.syncQueue.delete(action.id!);
                    }
                } catch (e) {
                    console.error(`Erro ao processar item da fila de sync:`, e);
                }
            }
        } finally {
            setSyncing(false);
        }
    };

    const mapToSupabaseFormat = (table: string, data: any) => {
        // Implementar mapeamento de campos (ex: account -> account_id)
        // Isso deve seguir a lógica já existente no App.tsx
        const payload = { ...data };

        if (table === 'transactions') {
            return {
                ...payload,
                account_id: payload.account,
                sub_category: payload.subCategory,
                payment_method: payload.paymentMethod,
                is_paid: payload.isPaid,
                installment_count: payload.installmentCount,
                installment_total: payload.installmentTotal,
                tag_ids: payload.tags,
                ignore_in_statistics: payload.ignoreInStatistics,
                ignore_in_budgets: payload.ignoreInBudgets,
                ignore_in_totals: payload.ignoreInTotals,
                due_date: payload.dueDate,
                payment_date: payload.paymentDate
            };
        }

        if (table === 'accounts') {
            return {
                ...payload,
                bank_id: payload.bankId,
                is_credit: payload.isCredit,
                credit_limit: payload.creditLimit,
                closing_day: payload.closingDay,
                due_day: payload.dueDay
            };
        }

        return payload;
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
