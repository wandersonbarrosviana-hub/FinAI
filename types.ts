
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // Launch date (ISO format YYYY-MM-DD)
  dueDate?: string; // ISO format
  category: string;
  subCategory?: string;
  type: TransactionType;
  account: string;
  recurrence: 'one_time' | 'fixed' | 'installment';
  installmentTotal?: number;
  installmentCount?: number;
  installmentNumber?: number;
  paymentMethod?: string;
  isPaid: boolean;
  tags?: string[]; // Array of Tag IDs
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  userId?: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'investment';
  bankId: string;
  color?: string;
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline: string;
  category: string;
  icon?: string;
}

export interface Budget {
  id?: string;
  user_id?: string;
  category: string;
  amount: number; // Monthly budget limit
  month?: string; // YYYY-MM format
  created_at?: string;
  updated_at?: string;
}

export interface BudgetWithSpending extends Budget {
  spent: number; // Calculated from transactions
  percentage: number; // spent / amount * 100
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export type ViewState =
  | 'dashboard'
  | 'income'
  | 'expenses'
  | 'transfers'
  | 'accounts'
  | 'budgets'
  | 'goals'
  | 'objectives'
  | 'simulator'
  | 'retirement'
  | 'settings'
  | 'plans'
  | 'reports'
  | 'ai-assistant';
