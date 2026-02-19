import Dexie, { Table } from 'dexie';
import { Transaction, Account, Goal, Tag, Budget, CustomBudget } from './types';

export interface SyncStatus {
    id?: number;
    table: string;
    entityId: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    timestamp: number;
}

export class FinAIDatabase extends Dexie {
    transactions!: Table<Transaction>;
    accounts!: Table<Account>;
    goals!: Table<Goal>;
    tags!: Table<Tag>;
    budgets!: Table<Budget>;
    customBudgets!: Table<CustomBudget>;
    syncQueue!: Table<SyncStatus>;

    constructor() {
        super('FinAIDatabase');
        this.version(1).stores({
            transactions: 'id, date, category, account, type, user_id',
            accounts: 'id, name, type, userId',
            goals: 'id, title, category',
            tags: 'id, name',
            budgets: 'id, category, month',
            customBudgets: 'id, name, userId',
            syncQueue: '++id, table, entityId, action, timestamp'
        });
    }
}

export const db = new FinAIDatabase();
