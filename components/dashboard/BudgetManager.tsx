'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, Plus, Trash2, WalletCards } from 'lucide-react';
import { createId, type Budget, useFinanceData } from '@/lib/finance-store';
import {
  EmptyState,
  formatMoney,
  inputClassName,
  PageHeader,
  Panel,
  primaryButtonClassName,
} from '@/components/dashboard/FinanceUI';
import { MoneyInput } from '@/components/dashboard/MoneyInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastProvider';

const categories = ['Ăn uống', 'Di chuyển', 'Nhà cửa', 'Mua sắm', 'Y tế', 'Học tập', 'Giải trí', 'Hóa đơn', 'Khác'];

export function BudgetManager() {
  const { budgets, transactions, updateFinanceData } = useFinanceData();
  const notify = useToast();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [category, setCategory] = useState(categories[0]);
  const [limit, setLimit] = useState(0);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [year, month] = selectedMonth.split('-').map(Number);

  const monthBudgets = useMemo(
    () => budgets.filter((budget) => budget.year === year && budget.month === month),
    [budgets, year, month]
  );
  const spentByCategory = useMemo(() => {
    return transactions
      .filter((transaction) => {
        const date = new Date(`${transaction.date}T12:00:00`);
        return transaction.type === 'expense' && date.getFullYear() === year && date.getMonth() + 1 === month;
      })
      .reduce<Record<string, number>>((totals, transaction) => {
        totals[transaction.category] = (totals[transaction.category] || 0) + transaction.amount;
        return totals;
      }, {});
  }, [transactions, year, month]);
  const totalLimit = monthBudgets.reduce((sum, budget) => sum + budget.limit, 0);
  const totalSpent = monthBudgets.reduce((sum, budget) => sum + (spentByCategory[budget.category] || 0), 0);
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  const saveBudget = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!Number.isFinite(limit) || limit <= 0) {
      notify('Hạn mức phải lớn hơn 0.', { type: 'error' });
      return;
    }

    try {
      updateFinanceData((data) => {
        const existing = data.budgets.find((budget) => budget.category === category && budget.month === month && budget.year === year);
        const budget = { id: existing?.id || createId(), category, limit, month, year };
        return {
          ...data,
          budgets: existing
            ? data.budgets.map((item) => item.id === existing.id ? budget : item)
            : [budget, ...data.budgets],
        };
      });
      setLimit(0);
      setIsOpen(false);
      notify('Đã lưu ngân sách.', { type: 'success' });
    } catch (saveError) {
      notify(saveError instanceof Error ? saveError.message : 'Không thể lưu ngân sách.', { type: 'error' });
    }
  };

  const removeBudget = (budget: Budget) => {
    try {
      updateFinanceData((data) => ({ ...data, budgets: data.budgets.filter((item) => item.id !== budget.id) }));
      notify(`Đã xóa ngân sách ${budget.category}.`, { type: 'success' });
    } catch (saveError) {
      notify(saveError instanceof Error ? saveError.message : 'Không thể xóa ngân sách.', { type: 'error' });
    } finally {
      setBudgetToDelete(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Chủ động chi tiêu"
        title="Ngân sách"
        description="Đặt giới hạn cho từng danh mục và theo dõi số tiền đã dùng trong tháng."
        action={<button type="button" onClick={() => setIsOpen(true)} className={`${primaryButtonClassName} w-full sm:w-auto`}><Plus size={17} /> Đặt ngân sách</button>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_2fr]">
        <label className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Chọn tháng</span>
          <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className={inputClassName} />
        </label>
        <div className="grid grid-cols-1 gap-4 rounded-2xl bg-emerald-900 p-5 text-white min-[420px]:grid-cols-2">
          <div>
            <p className="text-sm text-emerald-100">Đã chi trong ngân sách</p>
            <p className="mt-2 break-words text-lg font-semibold [overflow-wrap:anywhere] sm:text-xl">{formatMoney(totalSpent)}</p>
          </div>
          <div>
            <p className="text-sm text-emerald-100">Tổng hạn mức</p>
            <p className="mt-2 break-words text-lg font-semibold [overflow-wrap:anywhere] sm:text-xl">{formatMoney(totalLimit)}</p>
          </div>
        </div>
      </div>

      <Panel title={`Hạn mức ${monthLabel}`} description="Chi tiêu được tính tự động từ các giao dịch đã ghi.">
        {monthBudgets.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {monthBudgets.map((budget) => {
              const spent = spentByCategory[budget.category] || 0;
              const percent = budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0;
              const exceeded = spent > budget.limit;

              return (
                <article key={budget.id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-xl p-2.5 ${exceeded ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                        {exceeded ? <AlertTriangle size={18} /> : <WalletCards size={18} />}
                      </span>
                      <div>
                        <h3 className="font-semibold text-slate-900">{budget.category}</h3>
                        <p className="mt-1 text-xs text-slate-500">{exceeded ? 'Đã vượt hạn mức' : `Còn ${formatMoney(Math.max(0, budget.limit - spent))}`}</p>
                      </div>
                    </div>
                    <button type="button" aria-label={`Xóa ngân sách ${budget.category}`} onClick={() => setBudgetToDelete(budget)} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button>
                  </div>
                  <div className="mt-6 flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
                    <p className="break-words text-lg font-semibold text-slate-900 [overflow-wrap:anywhere]">{formatMoney(spent)}</p>
                    <p className="text-sm text-slate-500">/ {formatMoney(budget.limit)}</p>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full transition-all ${exceeded ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-400' : 'bg-emerald-600'}`} style={{ width: `${Math.min(100, percent)}%` }} />
                  </div>
                  <p className={`mt-2 text-xs font-medium ${exceeded ? 'text-rose-600' : 'text-slate-500'}`}>{percent}% hạn mức</p>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Chưa có hạn mức cho tháng này" description="Tạo ngân sách theo danh mục để kiểm soát chi tiêu dễ dàng hơn." />
        )}
      </Panel>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && setIsOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="budget-dialog-title" className="max-h-[calc(100dvh-0.5rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:max-h-[90vh] sm:rounded-2xl sm:p-6">
            <h2 id="budget-dialog-title" className="text-xl font-semibold text-slate-950">Đặt ngân sách</h2>
            <p className="mt-1 text-sm text-slate-500">{monthLabel}</p>
            <form onSubmit={saveBudget} noValidate className="mt-5 space-y-4">
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                Danh mục
                <select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClassName}>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                Hạn mức
                <MoneyInput required value={limit} onChange={setLimit} placeholder="Ví dụ: 3.000.000" />
              </label>
              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Hủy</button>
                <button type="submit" className={`${primaryButtonClassName} w-full sm:w-auto`}>Lưu ngân sách</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={budgetToDelete !== null}
        title="Xóa ngân sách?"
        description={`Ngân sách cho danh mục ${budgetToDelete?.category ?? ''} sẽ bị xóa.`}
        onCancel={() => setBudgetToDelete(null)}
        onConfirm={() => {
          if (budgetToDelete) removeBudget(budgetToDelete);
        }}
      />
    </div>
  );
}
