
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
  | 'custom-budgets'
  | 'goals'
  | 'objectives'
  | 'debts'
  | 'retirement'
  | 'settings'
  | 'plans'
  | 'reports'
  | 'transactions'
  | 'ai-assistant'
  | 'tags'
  | 'admin'
  | 'investments';

export type DebtType = 'financing' | 'personal_loan' | 'credit_card' | 'informal' | 'other';
export type AmortizationType = 'sac' | 'price' | 'unknown';
export type DebtClassification = 'productive' | 'passive';
export type DebtReason = 'consumption' | 'emergency' | 'education' | 'real_estate' | 'vehicle' | 'investment' | 'other';

export interface Debt {
  id: string;
  userId: string;
  name: string;
  type: DebtType;
  creditor: string;
  totalContracted: number;
  currentBalance: number;
  interestRateMonthly?: number;
  totalInstallments: number;
  remainingInstallments: number;
  installmentValue: number;
  startDate: string;
  endDate: string;
  amortizationType: AmortizationType;
  reason?: DebtReason;
  classification?: DebtClassification;
  linkedTransactionId?: string;
  createdAt?: string;
}

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

export interface AppNotification {
  id: string;
  type: 'invite' | 'system' | 'alert';
  message: string;
  data?: any;
  read: boolean;
  date: string;
}
export interface CustomBudget {
  id: string;
  userId: string;
  name: string;
  categories: string[];
  limitType: 'value' | 'percentage';
  limitValue: number;
  spent?: number; // Calculated on frontend
  percentage?: number; // Calculated on frontend
}
export interface HighSpendingDay {
  day: string;
  amount: number;
  isImpulsive: boolean;
}

export interface DecisionScenario {
  description: string;
  action: string;
  impact: string;
  targetObjective?: string;
}

export interface ProjectionPoint {
  date: string;
  amount: number;
}

export interface HealthScoreDetail {
  score: number; // 0-100
  liquidity: number;
  reserve: number;
  debt: number;
  stability: number;
  message: string;
}

export interface AdvancedAIInsights {
  emotionalPatterns: {
    peakDay: string;
    peakCategory: string;
    impulsivityScore: number;
    description: string;
    highSpendingDays: HighSpendingDay[];
  };
  scenarios: DecisionScenario[];
  projections: ProjectionPoint[];
  healthScore: HealthScoreDetail;
  updatedAt: string;
}
