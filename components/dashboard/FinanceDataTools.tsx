'use client';

import { useState, type ChangeEvent } from 'react';
import { useFinanceData, readLegacyFinanceData } from '@/lib/finance-store';
import { isFinanceData, type FinanceData } from '@/lib/finance-data';
import { useToast } from '@/components/ui/ToastProvider';

function download(data: FinanceData, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function addMissing<T extends { id: string }>(current: T[], incoming: T[], key: (item: T) => string = (item) => item.id) {
  const known = new Set(current.map(key));
  const ids = new Set(current.map((item) => item.id));
  const result = [...current];
  for (const item of incoming) {
    const identity = key(item);
    if (known.has(identity) || ids.has(item.id)) continue;
    known.add(identity);
    ids.add(item.id);
    result.push(item);
  }
  return result;
}

export function FinanceDataTools() {
  const { transactions, budgets, goals, syncStatus, refreshFinanceData, updateFinanceData } = useFinanceData();
  const [legacy] = useState(readLegacyFinanceData);
  const notify = useToast();
  const busy = syncStatus === 'loading' || syncStatus === 'saving';

  async function merge(data: FinanceData) {
    try {
      await updateFinanceData((current) => ({
        transactions: addMissing(current.transactions, data.transactions),
        budgets: addMissing(current.budgets, data.budgets, (budget) => JSON.stringify([budget.year, budget.month, budget.category])),
        goals: addMissing(current.goals, data.goals),
      }));
      notify('Đã nhập dữ liệu vào sổ thu chi.', { type: 'success' });
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể nhập dữ liệu.', { type: 'error' });
    }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    try {
      const data: unknown = JSON.parse(await file.text());
      if (!isFinanceData(data)) throw new Error();
      await merge(data);
    } catch {
      notify('Tệp này không phải bản sao lưu sổ thu chi hợp lệ.', { type: 'error' });
    }
  }

  const action = 'min-h-10 rounded-lg border border-slate-200 px-3 py-2 font-medium hover:bg-slate-50 disabled:opacity-50';
  const status = { ready: 'Đã kết nối', loading: 'Đang tải dữ liệu…', saving: 'Đang lưu…', error: 'Cần kiểm tra kết nối hoặc tải lại dữ liệu' };

  return (
    <section aria-label="Đồng bộ và sao lưu" className="mb-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto font-medium" role="status">{status[syncStatus]}</span>
        <button type="button" className={action} disabled={busy} onClick={refreshFinanceData}>Tải lại</button>
        <button type="button" className={action} onClick={() => download({ transactions, budgets, goals }, 'so-thu-chi.json')}>Tải bản sao JSON</button>
        <label className={action + (busy ? ' opacity-50' : '')}>
          Nhập bản sao JSON
          <input type="file" accept=".json,application/json" disabled={busy} onChange={importFile} className="sr-only" />
        </label>
      </div>
      {legacy && (legacy.transactions.length > 0 || legacy.budgets.length > 0 || legacy.goals.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 p-3">
          <span className="mr-auto">Có dữ liệu cũ trên trình duyệt này.</span>
          <button type="button" className={action} onClick={() => download(legacy, 'so-thu-chi-cu.json')}>Sao lưu sổ cũ</button>
          <button type="button" className={action} disabled={busy} onClick={() => merge(legacy)}>Nhập từ sổ cũ</button>
        </div>
      )}
      <p className="text-xs text-slate-500">Khi nhập, các mục đã có trong sổ hiện tại được giữ nguyên.</p>
    </section>
  );
}
