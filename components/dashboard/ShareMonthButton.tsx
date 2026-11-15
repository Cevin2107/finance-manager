'use client';

import { useState } from 'react';
import { Copy, Share2, X } from 'lucide-react';
import { useFinanceData, createMonthShare } from '@/lib/finance-store';
import { useToast } from '@/components/ui/ToastProvider';

const expirationOptions = [
  { days: 1, label: '1 ngày (mặc định)' },
  { days: 3, label: '3 ngày' },
  { days: 7, label: '7 ngày' },
  { days: 30, label: '30 ngày' },
];

export function ShareMonthButton() {
  const { transactions } = useFinanceData();
  const notify = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [expirationDays, setExpirationDays] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [share, setShare] = useState<{ url: string; password: string; expiresAt: string } | null>(null);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const monthTransactions = transactions.filter((transaction) => transaction.date.startsWith(monthKey));
  const monthLabel = now.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  async function createShare() {
    setIsCreating(true);
    try {
      const password = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
      const token = crypto.randomUUID().replace(/-/g, '');
      const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString();
      await createMonthShare({
        token,
        password,
        month,
        year,
        transactions: monthTransactions,
        expiresAt,
      });
      setShare({ url: `${window.location.origin}/share/${token}`, password, expiresAt });
      notify('Đã tạo liên kết chia sẻ tháng.', { type: 'success' });
    } catch (creationError) {
      console.error('Không thể tạo liên kết chia sẻ tháng:', creationError);
      notify(
        creationError instanceof Error
          ? creationError.message
          : 'Không thể tạo liên kết chia sẻ. Vui lòng thử lại.',
        { type: 'error' }
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function copyLink() {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.url);
      notify('Đã sao chép liên kết chia sẻ.', { type: 'success' });
    } catch (copyError) {
      console.error('Không thể sao chép liên kết chia sẻ:', copyError);
      notify('Không thể sao chép tự động. Hãy sao chép liên kết đang hiển thị.', { type: 'error' });
    }
  }

  function closeDialog() {
    setIsOpen(false);
    setShare(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 sm:w-auto"
      >
        <Share2 size={17} />
        Chia sẻ tháng này
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-month-title"
            className="max-h-[calc(100dvh-0.5rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:max-h-[90vh] sm:rounded-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-700">{monthLabel}</p>
                <h2 id="share-month-title" className="mt-1 text-xl font-semibold text-slate-950">
                  Chia sẻ thu chi tháng này
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Người nhận cần liên kết và mã 6 chữ số để xem snapshot {monthLabel}.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                aria-label="Đóng"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            {!share ? (
              <>
                <label className="mt-6 block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Liên kết hết hạn sau</span>
                  <select
                    value={expirationDays}
                    onChange={(event) => setExpirationDays(Number(event.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none focus:border-emerald-500"
                  >
                    {expirationOptions.map((option) => (
                      <option key={option.days} value={option.days}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Mã truy cập gồm 6 chữ số sẽ được tạo ngẫu nhiên sau khi tạo liên kết.
                </p>
              </>
            ) : (
              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Liên kết chia sẻ</span>
                  <input
                    readOnly
                    value={share.url}
                    onFocus={(event) => event.currentTarget.select()}
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none"
                  />
                </label>
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-950">Mã truy cập</p>
                  <p className="mt-1 font-mono text-2xl font-bold tracking-[0.3em] text-emerald-800">
                    {share.password}
                  </p>
                  <p className="mt-2 text-xs text-emerald-800">
                    Hết hạn: {new Date(share.expiresAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDialog}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
              {share ? (
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  <Copy size={17} />
                  Sao chép liên kết
                </button>
              ) : (
                <button
                  type="button"
                  onClick={createShare}
                  disabled={isCreating}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Share2 size={17} />
                  {isCreating ? 'Đang tạo…' : 'Tạo liên kết'}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
