'use client';

import { useState, type FormEvent } from 'react';
import { ArrowDownLeft, ArrowUpRight, LockKeyhole, PiggyBank } from 'lucide-react';
import { getMonthShare, type SharedMonth } from '@/lib/finance-store';
import { formatMoney } from '@/components/dashboard/FinanceUI';
import { useToast } from '@/components/ui/ToastProvider';

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function PublicMonthShare({ token }: { token: string }) {
  const notify = useToast();
  const [password, setPassword] = useState('');
  const [share, setShare] = useState<SharedMonth | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length !== 6) {
      notify('Vui lòng nhập mã truy cập gồm 6 chữ số.', { type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await getMonthShare(token, password);
      if (!result) {
        notify('Mã không đúng hoặc liên kết đã hết hạn.', { type: 'error' });
        return;
      }
      setShare(result);
      notify('Đã xác thực và tải dữ liệu chia sẻ.', { type: 'success' });
    } catch (requestError) {
      console.error('Không thể tải dữ liệu chia sẻ:', requestError);
      notify('Không thể tải dữ liệu. Vui lòng thử lại sau.', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }

  if (share) {
    const income = share.transactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expense = share.transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const monthLabel = new Date(share.year, share.month - 1, 1).toLocaleDateString('vi-VN', {
      month: 'long',
      year: 'numeric',
    });

    return (
      <main className="min-h-dvh bg-[#f7f8f6] px-4 py-[calc(2rem+env(safe-area-inset-top))] sm:px-6 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <header className="mb-7 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white">
              <PiggyBank size={23} />
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-700">Sổ Thu Chi</p>
              <h1 className="text-xl font-semibold text-slate-950">Thu chi {monthLabel}</h1>
            </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <ArrowDownLeft size={17} className="text-emerald-700" />
                Tổng thu
              </div>
              <p className="mt-3 break-words text-xl font-semibold text-slate-950 [overflow-wrap:anywhere] sm:text-2xl">{formatMoney(income)}</p>
            </section>
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <ArrowUpRight size={17} className="text-rose-600" />
                Tổng chi
              </div>
              <p className="mt-3 break-words text-xl font-semibold text-slate-950 [overflow-wrap:anywhere] sm:text-2xl">{formatMoney(expense)}</p>
            </section>
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950">Các giao dịch</h2>
                <p className="mt-1 text-sm text-slate-500">{share.transactions.length} khoản thu chi</p>
              </div>
              <p className="text-right text-xs text-slate-400">
                Liên kết hết hạn
                <span className="mt-1 block">{new Date(share.expires_at).toLocaleString('vi-VN')}</span>
              </p>
            </div>
            {share.transactions.length ? (
              <div className="divide-y divide-slate-100">
                {[...share.transactions]
                  .sort((first, second) => second.date.localeCompare(first.date))
                  .map((transaction) => (
                    <div key={transaction.id} className="flex items-center gap-3 py-3">
                      <span className={`rounded-xl p-2.5 ${transaction.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                        {transaction.type === 'income' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {transaction.description || transaction.category}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {transaction.category} · {formatDate(transaction.date)}
                        </p>
                      </div>
                      <p className={`max-w-[40%] break-words text-right text-xs font-semibold [overflow-wrap:anywhere] sm:max-w-none sm:whitespace-nowrap sm:text-sm ${transaction.type === 'income' ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {transaction.type === 'income' ? '+' : '−'}{formatMoney(transaction.amount)}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Tháng này chưa có giao dịch.
              </p>
            )}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f7f8f6] px-4 py-[calc(2.5rem+env(safe-area-inset-top))]">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-9">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <LockKeyhole size={23} />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Sổ Thu Chi
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Nhập mã để xem thu chi
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Nhập mã 6 chữ số được người chia sẻ gửi cho bạn.
        </p>
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Mã truy cập</span>
            <input
              required
              autoFocus
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              value={password}
              onChange={(event) => setPassword(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-center font-mono text-xl tracking-[0.4em] text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </label>
          <button
            type="submit"
            disabled={isLoading || password.length !== 6}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Đang kiểm tra…' : 'Xem báo cáo tháng'}
          </button>
        </form>
      </section>
    </main>
  );
}
