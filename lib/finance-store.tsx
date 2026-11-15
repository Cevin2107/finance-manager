'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useToast } from '@/components/ui/ToastProvider';

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

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

type Database = {
  public: {
    Tables: {
      finance_data: {
        Row: {
          user_id: string;
          data: FinanceData;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          data: FinanceData;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          data?: FinanceData;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_month_share: {
        Args: {
          p_token: string;
          p_password: string;
          p_month: number;
          p_year: number;
          p_transactions: Json;
          p_expires_at: string;
        };
        Returns: undefined;
      };
      get_month_share: {
        Args: { p_token: string; p_password: string };
        Returns: SharedMonth[];
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type FinanceContextValue = FinanceData & {
  updateFinanceData: (update: (current: FinanceData) => FinanceData) => void;
};

const STORAGE_KEY = 'so-thu-chi-data-v1';
const PENDING_SYNC_KEY = 'so-thu-chi-pending-sync-v1';
const EMPTY_DATA: FinanceData = { transactions: [], budgets: [], goals: [] };
const FinanceContext = createContext<FinanceContextValue | null>(null);

let supabaseClient: SupabaseClient<Database> | null = null;
let anonymousUserPromise: Promise<string> | null = null;

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error('Thiếu cấu hình NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  }

  if (!supabaseClient) {
    supabaseClient = createClient<Database>(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return supabaseClient;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFinanceData(value: unknown): value is FinanceData {
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

function readLocalData(): FinanceData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return EMPTY_DATA;

    const parsed: unknown = JSON.parse(saved);
    if (isFinanceData(parsed)) return parsed;
    console.error('Dữ liệu tài chính đã lưu trên thiết bị không đúng định dạng.');
  } catch (error) {
    console.error('Không thể đọc dữ liệu tài chính đã lưu trên thiết bị:', error);
  }

  return EMPTY_DATA;
}

function writeLocalData(data: FinanceData, pendingSync: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(PENDING_SYNC_KEY, String(pendingSync));
    return true;
  } catch (error) {
    console.error('Không thể lưu bộ nhớ tạm tài chính trên thiết bị:', error);
    return false;
  }
}

function hasPendingSync() {
  try {
    return localStorage.getItem(PENDING_SYNC_KEY) === 'true';
  } catch (error) {
    console.error('Không thể kiểm tra trạng thái đồng bộ cục bộ:', error);
    return false;
  }
}

async function getAnonymousUserId(client: SupabaseClient<Database>) {
  if (!anonymousUserPromise) {
    anonymousUserPromise = (async () => {
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      if (sessionData.session?.user.id) return sessionData.session.user.id;

      const { data, error } = await client.auth.signInAnonymously();
      if (error) throw error;
      if (!data.user) throw new Error('Supabase không trả về danh tính lưu trữ ẩn danh.');
      return data.user.id;
    })();
  }

  try {
    return await anonymousUserPromise;
  } finally {
    anonymousUserPromise = null;
  }
}

async function saveToSupabase(
  client: SupabaseClient<Database>,
  userId: string,
  data: FinanceData
) {
  const { error } = await client.from('finance_data').upsert(
    {
      user_id: userId,
      data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) throw error;
}

function getConnectionMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : isRecord(error) && typeof error.message === 'string'
        ? error.message
        : 'Lỗi không xác định.';

  if (message.toLowerCase().includes('anonymous sign-ins are disabled')) {
    return 'Hãy bật Anonymous Sign-Ins trong Supabase Authentication > Sign In / Providers rồi thử kết nối lại.';
  }

  if (
    message.includes('finance_data') &&
    (message.includes('does not exist') || message.includes('schema cache'))
  ) {
    return 'Chưa tìm thấy bảng finance_data. Hãy chạy migration trong supabase/migrations trên Supabase SQL Editor.';
  }

  return `Không thể kết nối Supabase: ${message}`;
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FinanceData>(EMPTY_DATA);
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'ready'>('loading');
  const [attempt, setAttempt] = useState(0);
  const notify = useToast();
  const dataRef = useRef(data);
  const userIdRef = useRef<string | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  const retryConnection = useCallback(() => {
    setConnectionStatus('loading');
    setAttempt((current) => current + 1);
  }, []);

  const connectAndLoad = useCallback(async (isActive: () => boolean) => {
    try {
      const client = getSupabaseClient();
      const userId = await getAnonymousUserId(client);
      if (!isActive()) return;

      const { data: row, error } = await client
        .from('finance_data')
        .select('data')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      let initialData: FinanceData;
      if (row) {
        if (!isFinanceData(row.data)) {
          throw new Error('Dữ liệu trong bảng finance_data không đúng định dạng.');
        }
        if (hasPendingSync()) {
          initialData = readLocalData();
          await saveToSupabase(client, userId, initialData);
        } else {
          initialData = row.data;
        }
      } else {
        initialData = readLocalData();
        await saveToSupabase(client, userId, initialData);
      }

      writeLocalData(initialData, false);
      if (!isActive()) return;

      userIdRef.current = userId;
      dataRef.current = initialData;
      setData(initialData);
      setConnectionStatus('ready');
      if (attempt > 0) {
        notify('Đã kết nối lại và đồng bộ dữ liệu với Supabase.', { type: 'success' });
      }
    } catch (error) {
      if (!isActive()) return;

      const message = getConnectionMessage(error);
      console.error(message, error);
      userIdRef.current = null;
      const localData = readLocalData();
      dataRef.current = localData;
      setData(localData);
      setConnectionStatus('ready');
      notify(message, {
        type: 'error',
        duration: 0,
        action: { label: 'Thử lại', onClick: retryConnection },
      });
    }
  }, [attempt, notify, retryConnection]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return connectAndLoad(() => active);
    });

    return () => {
      active = false;
    };
  }, [attempt, connectAndLoad]);

  const syncToSupabase = useCallback((next: FinanceData) => {
    const userId = userIdRef.current;
    if (!userId) {
      notify('Dữ liệu đang lưu trên thiết bị; kết nối lại Supabase để đồng bộ.', {
        type: 'error',
        duration: 0,
        action: { label: 'Kết nối lại', onClick: retryConnection },
      });
      return;
    }

    const client = getSupabaseClient();
    const save = saveQueue.current.catch(() => undefined).then(
      () => saveToSupabase(client, userId, next)
    );
    saveQueue.current = save;

    void save.then(
      () => {
        if (dataRef.current === next) writeLocalData(next, false);
      },
      (error: unknown) => {
        const message = getConnectionMessage(error);
        console.error('Không thể đồng bộ dữ liệu tài chính lên Supabase:', error);
        notify(message, {
          type: 'error',
          duration: 0,
          action: { label: 'Thử lại', onClick: retryConnection },
        });
      }
    );
  }, [notify, retryConnection]);

  const update = useCallback((updater: (current: FinanceData) => FinanceData) => {
    const next = updater(dataRef.current);
    dataRef.current = next;
    setData(next);
    writeLocalData(next, true);
    syncToSupabase(next);
  }, [syncToSupabase]);

  const contextValue = useMemo<FinanceContextValue>(
    () => ({ ...data, updateFinanceData: update }),
    [data, update]
  );

  return (
    <FinanceContext.Provider value={contextValue}>
      {connectionStatus === 'loading' ? (
        <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] px-5">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
            <p className="font-semibold text-slate-900">Đang kết nối sổ thu chi</p>
            <p className="mt-2 text-sm text-slate-500">Đang tải dữ liệu an toàn từ Supabase…</p>
          </div>
        </main>
      ) : (
        children
      )}
    </FinanceContext.Provider>
  );
}

export function useFinanceData() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinanceData phải được dùng bên trong FinanceProvider.');
  return context;
}

export function createId() {
  return crypto.randomUUID();
}

export async function createMonthShare({
  token,
  password,
  month,
  year,
  transactions,
  expiresAt,
}: {
  token: string;
  password: string;
  month: number;
  year: number;
  transactions: Transaction[];
  expiresAt: string;
}) {
  const client = getSupabaseClient();
  await getAnonymousUserId(client);
  const { error } = await client.rpc('create_month_share', {
    p_token: token,
    p_password: password,
    p_month: month,
    p_year: year,
    p_transactions: transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      description: transaction.description,
      date: transaction.date,
    })),
    p_expires_at: expiresAt,
  });
  if (error) throw error;
}

export async function getMonthShare(token: string, password: string) {
  const { data, error } = await getSupabaseClient().rpc('get_month_share', {
    p_token: token,
    p_password: password,
  });
  if (error) throw error;
  return data[0] ?? null;
}
