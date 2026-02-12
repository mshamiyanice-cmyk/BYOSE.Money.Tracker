
export interface Inflow {
  id: string;
  date: string;
  source: string;
  product: string; // e.g., Rocks, Trimming, etc.
  amount: number;
  remainingBalance: number;
  description: string;
  paymentMethod?: 'Bank' | 'Momo' | 'Hand in Hand';
  accountNumber?: string;
  notes?: string;
  currency?: 'RWF' | 'USD';
  bankAccountName?: string;
}

export interface Outflow {
  id: string;
  date: string;
  purpose: string; // The general "Use" (e.g., Operational)
  category: string; // Expense category
  amount: number;
  seller: string; // The "Vendor"
  inflowId: string; // Tracing which specific receipt this money came from
  expenseName?: string; // The specific name of the expense (used for COGS and Misc)
  notes?: string;
  paymentMethod?: 'Bank' | 'Momo' | 'Hand in Hand';
  accountNumber?: string;
}

export interface Overdraft {
  id: string;
  date: string;
  purpose: string;
  amount: number;
  seller: string;
  isSettled: boolean;
  settledWithInflowId?: string;
  notes?: string;
  createdAt?: string; // ISO String for sorting
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoFileName: string;
  createdAt: string;
}

export type TransactionType = 'INFLOW' | 'OUTFLOW' | 'OVERDRAFT';

export interface FinancialMetric {
  label: string;
  current: number;
  previous: number;
  change: number;
  color: string;
}
