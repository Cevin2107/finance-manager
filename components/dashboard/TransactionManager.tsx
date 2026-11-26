'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { createId, type Transaction, useFinanceData } from '@/lib/finance-store';
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

const incomeCategories = ['Lương', 'Thưởng', 'Đầu tư', 'Kinh doanh', 'Khác'];
const expenseCategories = ['Ăn uống', 'Di chuyển', 'Nhà cửa', 'Mua sắm', 'Y tế', 'Học tập', 'Giải trí', 'Hóa đơn', 'Khác'];
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

type TransactionForm = Omit<Transaction, 'id'>;

export function TransactionManager({ initialOpen = false }: { initialOpen?: boolean }) {
  const { transactions, updateFinanceData } = useFinanceData();
  const notify = useToast();
  const [query, setQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [form, setForm] = useState<TransactionForm>({
    type: 'expense',
    category: expenseCategories[0],
    amount: 0,
    description: '',
    date: today(),
  });

  const visibleTransactions = useMemo(
    () =>
      [...transactions]
        .filter((transaction) => !monthFilter || transaction.date.slice(0, 7) === monthFilter)
        .filter((transaction) => typeFilter === 'all' || transaction.type === typeFilter)
        .filter((transaction) => {
          const searchText = `${transaction.category} ${transaction.description}`.toLocaleLowerCase('vi');
          return searchText.includes(query.toLocaleLowerCase('vi'));
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, typeFilter, query, monthFilter]
  );

  const openNew = () => {
    setEditing(null);
    setForm({ type: 'expense', category: expenseCategories[0], amount: 0, description: '', date: today() });
    setIsOpen(true);
  };

  const openEdit = (transaction: Transaction) => {
    setEditing(transaction);
    setForm({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      description: transaction.description,
      date: transaction.date,
    });
    setIsOpen(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.category || !Number.isFinite(form.amount) || form.amount <= 0 || !form.date) {
      notify('Vui lòng nhập danh mục, ngày và số tiền lớn hơn 0.', { type: 'error' });
      return;
    }

    try {
      if (editing) {
        await updateFinanceData((data) => ({
          ...data,
          transactions: data.transactions.map((transaction) =>
            transaction.id === editing.id ? { ...form, id: editing.id } : transaction
          ),
        }));
      } else {
        const transaction: Transaction = { ...form, id: createId() };
        await updateFinanceData((data) => ({ ...data, transactions: [transaction, ...data.transactions] }));
      }
      setIsOpen(false);
      notify(editing ? 'Đã cập nhật giao dịch.' : 'Đã thêm giao dịch.', { type: 'success' });
    } catch (saveError) {
      notify(saveError instanceof Error ? saveError.message : 'Không thể lưu giao dịch.', { type: 'error' });
    }
  };

  const remove = async (transaction: Transaction) => {
    try {
      await updateFinanceData((data) => ({
        ...data,
        transactions: data.transactions.filter((item) => item.id !== transaction.id),
      }));
      notify('Đã xóa giao dịch.', { type: 'success' });
    } catch (saveError) {
      notify(saveError instanceof Error ? saveError.message : 'Không thể xóa giao dịch.', { type: 'error' });
    } finally {
      setTransactionToDelete(null);
    }
  };

  const categories = form.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <div>
      <PageHeader
        eyebrow="Sổ thu chi"
        title="Giao dịch"
        description="Ghi lại mỗi khoản tiền vào và ra, kèm danh mục để biết chi tiêu dành cho việc gì."
        action={<button type="button" onClick={openNew} className={`${primaryButtonClassName} w-full sm:w-auto`}><Plus size={17} /> Thêm giao dịch</button>}
      />

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <label className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo nội dung hoặc danh mục" className={`${inputClassName} pl-10`} />
        </label>
        <div className="flex items-center gap-2">
          <input type="month" aria-label="Lọc giao dịch theo tháng" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} className={inputClassName} />
          {monthFilter && (
            <button type="button" onClick={() => setMonthFilter('')} aria-label="Xóa lọc tháng" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <X size={17} />
            </button>
          )}
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1">
          {([
            ['all', 'Tất cả'],
            ['income', 'Khoản thu'],
            ['expense', 'Khoản chi'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTypeFilter(value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${typeFilter === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[1.4fr_1fr_1.2fr_1fr_auto] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
          <span>Giao dịch</span><span>Danh mục</span><span>Ngày</span><span className="text-right">Số tiền</span><span />
        </div>
        {visibleTransactions.length ? (
          <div className="divide-y divide-slate-100">
            {visibleTransactions.map((transaction) => (
              <div key={transaction.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-4 sm:px-5 md:grid-cols-[1.4fr_1fr_1.2fr_1fr_auto] md:gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`rounded-xl p-2.5 ${transaction.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                    {transaction.type === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{transaction.description || transaction.category}</p>
                    <p className="text-xs text-slate-500 md:hidden">{transaction.category} · {new Date(`${transaction.date}T12:00:00`).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
                <span className="hidden text-sm text-slate-600 md:block">{transaction.category}</span>
                <span className="hidden text-sm text-slate-600 md:block">{new Date(`${transaction.date}T12:00:00`).toLocaleDateString('vi-VN')}</span>
                <span className={`col-start-2 row-start-1 min-w-0 text-right text-xs font-semibold [overflow-wrap:anywhere] sm:whitespace-nowrap sm:text-sm md:col-auto md:row-auto md:text-right ${transaction.type === 'income' ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {transaction.type === 'income' ? '+' : '−'}{formatMoney(transaction.amount)}
                </span>
                <div className="col-start-2 row-start-2 flex justify-end gap-1 md:col-auto md:row-auto md:justify-end">
                  <button type="button" aria-label="Sửa giao dịch" onClick={() => openEdit(transaction)} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil size={16} /></button>
                  <button type="button" aria-label="Xóa giao dịch" onClick={() => setTransactionToDelete(transaction)} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              title={transactions.length ? 'Không tìm thấy giao dịch phù hợp' : 'Chưa có giao dịch nào'}
              description={transactions.length ? 'Thử từ khóa khác hoặc đổi bộ lọc.' : 'Thêm khoản thu hoặc chi đầu tiên để bắt đầu theo dõi dòng tiền.'}
            />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && setIsOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="transaction-dialog-title" className="max-h-[calc(100dvh-0.5rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:max-h-[90vh] sm:rounded-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 id="transaction-dialog-title" className="text-xl font-semibold text-slate-950">{editing ? 'Sửa giao dịch' : 'Thêm giao dịch'}</h2>
                <p className="mt-1 text-sm text-slate-500">Thông tin được lưu trên thiết bị này.</p>
              </div>
              <button type="button" aria-label="Đóng" onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button>
            </div>
            <form onSubmit={submit} noValidate className="space-y-4">
              <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                {(['expense', 'income'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, type, category: type === 'income' ? incomeCategories[0] : expenseCategories[0] })}
                    className={`rounded-lg py-2.5 text-sm font-semibold ${form.type === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    {type === 'expense' ? 'Khoản chi' : 'Khoản thu'}
                  </button>
                ))}
              </div>
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                Số tiền
                <MoneyInput required value={form.amount} onChange={(amount) => setForm({ ...form, amount })} />
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                Danh mục
                <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={inputClassName}>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                Nội dung
                <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={inputClassName} placeholder="Ví dụ: Ăn trưa cùng đồng nghiệp" />
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                Ngày giao dịch
                <input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className={inputClassName} />
              </label>
              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Hủy</button>
                <button type="submit" className={`${primaryButtonClassName} w-full sm:w-auto`}>{editing ? 'Lưu thay đổi' : 'Lưu giao dịch'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={transactionToDelete !== null}
        title="Xóa giao dịch?"
        description="Giao dịch này sẽ bị xóa khỏi sổ thu chi."
        onCancel={() => setTransactionToDelete(null)}
        onConfirm={() => {
          if (transactionToDelete) remove(transactionToDelete);
        }}
      />
    </div>
  );
}
