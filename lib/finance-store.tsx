'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { type FinanceData, type SharedMonth, type Transaction } from './finance-data';

export type { Budget, SavingsGoal, SharedMonth, Transaction } from './finance-data';

type Snapshot = { data: FinanceData; updatedAt: string | null };
type FinanceContextValue = FinanceData & {
  updateFinanceData: (update: (current: FinanceData) => FinanceData) => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

async function requestSnapshot(options?: RequestInit): Promise<Snapshot> {
  const response = await fetch('/api/finance', { ...options, cache: 'no-store' });
  if (response.status === 401) {
    window.location.assign(new URL('/login', window.location.origin));
    throw new Error('Phiên đăng nhập đã hết hạn.');
  }

  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'Không thể kết nối với sổ thu chi.');
  return result;
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const current = useRef<Snapshot | null>(null);
  const busy = useRef(false);

  const refreshFinanceData = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setError('');
    try {
      const next = await requestSnapshot();
      current.current = next;
      setSnapshot(next);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể tải sổ thu chi.');
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(refreshFinanceData, 0);
    return () => window.clearTimeout(timer);
  }, [refreshFinanceData]);

  const updateFinanceData = useCallback(async (update: (data: FinanceData) => FinanceData) => {
    if (busy.current) throw new Error('Đang đồng bộ. Vui lòng đợi rồi thử lại.');
    const previous = current.current;
    if (!previous) throw new Error('Hãy tải sổ thu chi trước khi ghi dữ liệu.');
    const data = update(previous.data);
    busy.current = true;
    try {
      const next = await requestSnapshot({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, updatedAt: previous.updatedAt }),
      });
      current.current = next;
      setSnapshot(next);
    } finally {
      busy.current = false;
    }
  }, []);

  if (!snapshot) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] px-5">
        <div className="max-w-sm text-center">
          <p role="status" className="font-semibold text-slate-900">
            {error || 'Đang tải sổ thu chi…'}
          </p>
          {error && (
            <button type="button" onClick={refreshFinanceData} className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-white">
              Thử lại
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <FinanceContext.Provider value={{ ...snapshot.data, updateFinanceData }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinanceData() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinanceData requires FinanceProvider.');
  return context;
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
