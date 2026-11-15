'use client';

import { useState, type FormEvent } from 'react';
import { CalendarDays, Coins, Plus, Target, Trash2, X } from 'lucide-react';
import { createId, type SavingsGoal, useFinanceData } from '@/lib/finance-store';
import {
  EmptyState,
  formatMoney,
  inputClassName,
  PageHeader,
  primaryButtonClassName,
} from '@/components/dashboard/FinanceUI';
import { MoneyInput } from '@/components/dashboard/MoneyInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastProvider';

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export function SavingsManager() {
  const { goals, updateFinanceData } = useFinanceData();
  const notify = useToast();
  const [isGoalOpen, setIsGoalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);
  const [amount, setAmount] = useState(0);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [form, setForm] = useState({ name: '', targetAmount: 0, targetDate: '', description: '' });
  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  const addGoal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targetAmount = form.targetAmount;
    if (
      !form.name.trim() ||
      !Number.isFinite(targetAmount) ||
      targetAmount <= 0 ||
      !form.targetDate ||
      form.targetDate < today()
    ) {
      notify('Vui lòng nhập tên mục tiêu, số tiền hợp lệ và ngày dự kiến.', { type: 'error' });
      return;
    }

    try {
      const goal: SavingsGoal = {
        id: createId(),
        name: form.name.trim(),
        targetAmount,
        currentAmount: 0,
        targetDate: form.targetDate,
        description: form.description.trim(),
      };
      updateFinanceData((data) => ({ ...data, goals: [goal, ...data.goals] }));
      setForm({ name: '', targetAmount: 0, targetDate: '', description: '' });
      setIsGoalOpen(false);
      notify('Đã tạo mục tiêu tiết kiệm.', { type: 'success' });
    } catch (saveError) {
      notify(saveError instanceof Error ? saveError.message : 'Không thể lưu mục tiêu.', { type: 'error' });
    }
  };

  const updateBalance = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedGoal) return;
    const value = amount;
    if (!Number.isFinite(value) || value <= 0) {
      notify('Số tiền phải lớn hơn 0.', { type: 'error' });
      return;
    }
    if (transactionType === 'withdraw' && value > selectedGoal.currentAmount) {
      notify('Số dư mục tiêu không đủ để rút khoản tiền này.', { type: 'error' });
      return;
    }

    try {
      updateFinanceData((data) => ({
        ...data,
        goals: data.goals.map((goal) =>
          goal.id === selectedGoal.id
            ? { ...goal, currentAmount: goal.currentAmount + (transactionType === 'deposit' ? value : -value) }
            : goal
        ),
      }));
      setSelectedGoal(null);
      setAmount(0);
      notify(
        transactionType === 'deposit'
          ? 'Đã ghi nhận khoản góp vào mục tiêu.'
          : 'Đã cập nhật số dư sau khi rút tiền.',
        { type: 'success' }
      );
    } catch (saveError) {
      notify(saveError instanceof Error ? saveError.message : 'Không thể cập nhật mục tiêu.', { type: 'error' });
    }
  };

  const deleteGoal = (goal: SavingsGoal) => {
    try {
      updateFinanceData((data) => ({ ...data, goals: data.goals.filter((item) => item.id !== goal.id) }));
      notify(`Đã xóa mục tiêu ${goal.name}.`, { type: 'success' });
    } catch (saveError) {
      notify(saveError instanceof Error ? saveError.message : 'Không thể xóa mục tiêu.', { type: 'error' });
    } finally {
      setGoalToDelete(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Dành dụm cho điều quan trọng"
        title="Mục tiêu tiết kiệm"
        description="Chia nhỏ mục tiêu thành từng bước, theo dõi số tiền đã góp và tiến độ mỗi ngày."
        action={<button type="button" onClick={() => setIsGoalOpen(true)} className={`${primaryButtonClassName} w-full sm:w-auto`}><Plus size={17} /> Tạo mục tiêu</button>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl bg-amber-400 p-6 text-amber-950">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-amber-950/70">Tổng tiền đã dành dụm</p>
              <p className="mt-2 break-words text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">{formatMoney(totalSaved)}</p>
              <p className="mt-2 break-words text-sm text-amber-950/70 [overflow-wrap:anywhere]">Trên tổng mục tiêu {formatMoney(totalTarget)}</p>
            </div>
            <span className="rounded-2xl bg-white/40 p-3"><Coins size={23} /></span>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-amber-950/10">
            <div className="h-full rounded-full bg-amber-950" style={{ width: `${overallProgress}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold">{overallProgress}% hoàn thành tổng mục tiêu</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="inline-flex rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><Target size={19} /></span>
          <p className="mt-4 text-sm text-slate-500">Mục tiêu đang theo dõi</p>
          <p className="mt-1 text-3xl font-semibold text-slate-950">{goals.length}</p>
          <p className="mt-2 text-sm text-slate-500">Từng bước nhỏ cũng là tiến bộ.</p>
        </div>
      </div>

      {goals.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((goal) => {
            const progress = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            return (
              <article key={goal.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="rounded-xl bg-amber-50 p-3 text-amber-700"><Target size={20} /></span>
                    <div className="min-w-0">
                      <h2 className="break-words font-semibold text-slate-900">{goal.name}</h2>
                      <p className="mt-1 break-words text-sm text-slate-500">{goal.description || 'Mục tiêu tiết kiệm của bạn'}</p>
                    </div>
                  </div>
                  <button type="button" aria-label={`Xóa mục tiêu ${goal.name}`} onClick={() => setGoalToDelete(goal)} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button>
                </div>
                <div className="mt-6 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="break-words text-xl font-semibold text-slate-950 [overflow-wrap:anywhere] sm:text-2xl">{formatMoney(goal.currentAmount)}</p>
                    <p className="mt-1 text-xs text-slate-500">Mục tiêu {formatMoney(goal.targetAmount)}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-700">{progress}%</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>Còn {formatMoney(remaining)}</span>
                  <span className="inline-flex items-center gap-1"><CalendarDays size={13} /> {new Date(`${goal.targetDate}T12:00:00`).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => { setSelectedGoal(goal); setTransactionType('deposit'); setAmount(0); }} className="min-h-11 flex-1 rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Góp thêm</button>
                  <button type="button" disabled={goal.currentAmount <= 0} onClick={() => { setSelectedGoal(goal); setTransactionType('withdraw'); setAmount(0); }} className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Rút tiền</button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <EmptyState title="Chưa có mục tiêu tiết kiệm" description="Tạo mục tiêu đầu tiên và bắt đầu tích lũy cho những điều bạn mong muốn." />
        </div>
      )}

      {(isGoalOpen || selectedGoal) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && (setIsGoalOpen(false), setSelectedGoal(null))}>
          <div role="dialog" aria-modal="true" aria-labelledby="saving-dialog-title" className="max-h-[calc(100dvh-0.5rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:max-h-[90vh] sm:rounded-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="saving-dialog-title" className="text-xl font-semibold text-slate-950">
                  {selectedGoal ? `${transactionType === 'deposit' ? 'Góp vào' : 'Rút khỏi'} ${selectedGoal.name}` : 'Tạo mục tiêu tiết kiệm'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{selectedGoal ? 'Cập nhật số dư mục tiêu.' : 'Đặt tên, số tiền và thời hạn bạn mong muốn.'}</p>
              </div>
              <button type="button" aria-label="Đóng" onClick={() => { setIsGoalOpen(false); setSelectedGoal(null); }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button>
            </div>

            {selectedGoal ? (
              <form onSubmit={updateBalance} noValidate className="mt-5 space-y-4">
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  Số tiền
                  <MoneyInput required value={amount} onChange={setAmount} placeholder="Ví dụ: 500.000" />
                </label>
                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
                  <button type="button" onClick={() => setSelectedGoal(null)} className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Hủy</button>
                  <button type="submit" className={`${primaryButtonClassName} w-full sm:w-auto`}>{transactionType === 'deposit' ? 'Ghi nhận góp tiền' : 'Xác nhận rút'}</button>
                </div>
              </form>
            ) : (
              <form onSubmit={addGoal} noValidate className="mt-5 space-y-4">
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  Tên mục tiêu
                  <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClassName} placeholder="Ví dụ: Quỹ dự phòng" />
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  Số tiền mong muốn
                  <MoneyInput required value={form.targetAmount} onChange={(targetAmount) => setForm({ ...form, targetAmount })} placeholder="Ví dụ: 30.000.000" />
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  Ngày dự kiến hoàn thành
                  <input required min={today()} type="date" value={form.targetDate} onChange={(event) => setForm({ ...form, targetDate: event.target.value })} className={inputClassName} />
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  Ghi chú (không bắt buộc)
                  <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={inputClassName} placeholder="Điều gì khiến mục tiêu này quan trọng?" />
                </label>
                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
                  <button type="button" onClick={() => setIsGoalOpen(false)} className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Hủy</button>
                  <button type="submit" className={`${primaryButtonClassName} w-full sm:w-auto`}>Tạo mục tiêu</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={goalToDelete !== null}
        title="Xóa mục tiêu?"
        description={`Mục tiêu ${goalToDelete?.name ?? ''} và số tiền đã dành cho mục tiêu này sẽ bị xóa.`}
        onCancel={() => setGoalToDelete(null)}
        onConfirm={() => {
          if (goalToDelete) deleteGoal(goalToDelete);
        }}
      />
    </div>
  );
}
