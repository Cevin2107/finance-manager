export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: number;
  year: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  description: string;
}

export interface FinanceData {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
}

export interface SharedMonth {
  month: number;
  year: number;
  transactions: Transaction[];
  expires_at: string;
}

export const EMPTY_DATA: FinanceData = { transactions: [], budgets: [], goals: [] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isFinanceData(value: unknown): value is FinanceData {
  if (!isRecord(value) || !Array.isArray(value.transactions) || !Array.isArray(value.budgets) || !Array.isArray(value.goals)) {
    return false;
  }

  const validTransactions = value.transactions.every(
    (item) =>
      isRecord(item) &&
      typeof item.id === 'string' &&
      (item.type === 'income' || item.type === 'expense') &&
      typeof item.category === 'string' &&
      typeof item.amount === 'number' &&
      Number.isFinite(item.amount) &&
      typeof item.description === 'string' &&
      typeof item.date === 'string'
  );
  const validBudgets = value.budgets.every(
    (item) =>
      isRecord(item) &&
      typeof item.id === 'string' &&
      typeof item.category === 'string' &&
      typeof item.limit === 'number' &&
      Number.isFinite(item.limit) &&
      typeof item.month === 'number' &&
      typeof item.year === 'number'
  );
  const validGoals = value.goals.every(
    (item) =>
      isRecord(item) &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.targetAmount === 'number' &&
      Number.isFinite(item.targetAmount) &&
      typeof item.currentAmount === 'number' &&
      Number.isFinite(item.currentAmount) &&
      typeof item.targetDate === 'string' &&
      typeof item.description === 'string'
  );

  return validTransactions && validBudgets && validGoals;
}

