
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
  paymentDate?: string; // ISO format
  attachment?: string; // URL or filename
  notes?: string;
  ignoreInStatistics?: boolean;
  ignoreInBudgets?: boolean;
  ignoreInTotals?: boolean;
  created_by?: string;
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
  type: 'checking' | 'savings' | 'investment' | 'credit';
  bankId: string;
  color?: string;
  isCredit?: boolean;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
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
  avatarUrl?: string;
}

export type ViewState =
  | 'dashboard'
  | 'income'
  | 'expenses'
  // | 'transfers' // Removed
  | 'credit-cards'
  | 'charts'
  | 'categories'
  | 'accounts'
  | 'budgets'
  | 'goals'
  | 'objectives'
  | 'simulator'
  | 'retirement'
  | 'settings'
  | 'plans'
  | 'reports'
  | 'transactions'
  | 'ai-assistant'
  | 'tags'
  | 'investments';

export interface InvestmentIndicator {
  dy: number;
  pl: number;
  pvp: number;
  roe: number;
  roic: number;
  cagr_lucros_5y: number;
  payout: number;
  margem_liquida: number;
  margem_bruta: number;
  margem_ebitda: number;
  p_ebitda: number;
  divida_liquida_ebitda: number;
  vpa: number;
  lpa: number;
  divida_liquida: number;
  divida_bruta: number;
  liquidez_media_diaria: number;
  free_float: number;
  patrimonio_liquido: number;
  numero_papeis: number;
}

export interface DividendChartItem {
  year: number;
  value: number;
  yield: number;
}

export interface DividendEvent {
  type: string;
  dateCom: string;
  paymentDate: string;
  value: number;
}

export interface InvestmentData {
  ticker: string;
  type: string;
  price: number;
  name: string;
  segment: string;
  indicators: InvestmentIndicator;
  chartData: DividendChartItem[];
  dividends: DividendEvent[];
}
