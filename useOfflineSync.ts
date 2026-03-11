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

            // 1. Agrupar Ações (Squashing): Remover repetidas.
            // Apenas a última ação importa. Se um item foi deletado no final da fila, descartamos os updates.
            const latestActionsMap = new Map<string, typeof pendingActions[0]>();
            for (const action of pendingActions) {
                const key = `${action.table}:${action.entityId}`;
                const existing = latestActionsMap.get(key);
                if (existing && existing.action === 'DELETE') continue; // Já será deletado de qualquer jeito
                latestActionsMap.set(key, action);
            }

            const resolvedEntityKeys = new Set<string>();
            const upsertsByTable: Record<string, { entityId: string, payload: any }[]> = {};
            const deletesByTable: Record<string, string[]> = {};

            // 2. Preparar payload validando fantasmas
            for (const [key, typeofAction] of latestActionsMap.entries()) {
                if (typeofAction.action === 'DELETE') {
                    if (!deletesByTable[typeofAction.table]) deletesByTable[typeofAction.table] = [];
                    deletesByTable[typeofAction.table].push(typeofAction.entityId);
                } else {
                    const tableData = await (db as any)[typeofAction.table].get(typeofAction.entityId);
                    if (!tableData) {
                        console.warn(`[FinAI] Ghost item detected (${key}), discarding.`);
                        resolvedEntityKeys.add(key); // fantasma resolvido (pode limpar)
                        continue;
                    }
                    const dbPayload = mapToSupabaseFormat(typeofAction.table, tableData);
                    if (!upsertsByTable[typeofAction.table]) upsertsByTable[typeofAction.table] = [];
                    upsertsByTable[typeofAction.table].push({ entityId: typeofAction.entityId, payload: dbPayload });
                }
            }

            const syncPromises: Promise<void>[] = [];

            // 3. Processar UPSERTS de forma paralela usando Promise.all
            for (const table of Object.keys(upsertsByTable)) {
                syncPromises.push(
                    (async () => {
                        const items = upsertsByTable[table];
                        // Divide em blocos caso haja limite gigante
                        for (let i = 0; i < items.length; i += 500) {
                            const chunk = items.slice(i, i + 500);
                            const payloads = chunk.map(c => c.payload);

                            const { error } = await supabase.from(table).upsert(payloads);
                            if (!error) {
                                chunk.forEach(c => resolvedEntityKeys.add(`${table}:${c.entityId}`));
                            } else {
                                console.error(`[FinAI] Bulk Upsert Error (${table}):`, error);
                            }
                        }
                    })()
                );
            }

            // 4. Processar DELETES via "in"
            for (const table of Object.keys(deletesByTable)) {
                syncPromises.push(
                    (async () => {
                        const ids = deletesByTable[table];
                        for (let i = 0; i < ids.length; i += 200) {
                            const chunk = ids.slice(i, i + 200);
                            const { error } = await supabase.from(table).delete().in('id', chunk);
                            // PGRST116 indicates 0 rows affected mostly which is totally fine on deletes
                            if (!error || error.code === 'PGRST116') {
                                chunk.forEach(id => resolvedEntityKeys.add(`${table}:${id}`));
                            } else {
                                console.error(`[FinAI] Bulk Delete Error (${table}):`, error);
                            }
                        }
                    })()
                );
            }

            // Esperar tudo rodar magicamente
            await Promise.all(syncPromises);

            // 5. Encerrar fila
            const idsToDeleteFromQueue: number[] = [];
            for (const action of pendingActions) {
                const key = `${action.table}:${action.entityId}`;
                if (resolvedEntityKeys.has(key) && action.id !== undefined) {
                    idsToDeleteFromQueue.push(action.id);
                }
            }

            if (idsToDeleteFromQueue.length > 0) {
                await db.syncQueue.bulkDelete(idsToDeleteFromQueue);
                console.log(`[FinAI] Sync success! Removed ${idsToDeleteFromQueue.length} items from queue.`);
            }

        } catch (e) {
            console.error(`[FinAI] Critical Bulk Sync Error:`, e);
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

        const sanitizeUUID = (id: any) => {
            if (id === 'default' || !id || typeof id !== 'string') return null;
            // Simple check to see if it looks like a UUID or at least isn't a known placeholder
            return id;
        };

        if (table === 'transactions') {
            const mapped = {
                ...payload,
                account_id: sanitizeUUID(data.account),
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
                bank_id: data.bankId === 'default' ? 'outro' : data.bankId,
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
