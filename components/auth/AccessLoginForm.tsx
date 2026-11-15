'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole, PiggyBank } from 'lucide-react';

export function AccessLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/access/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, rememberMe }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof result === 'object' &&
          result !== null &&
          'error' in result &&
          typeof result.error === 'string'
            ? result.error
            : 'Không thể đăng nhập. Vui lòng thử lại.';
        setError(message);
        return;
      }
      router.replace('/dashboard');
      router.refresh();
    } catch (requestError) {
      console.error('Không thể gửi yêu cầu đăng nhập:', requestError);
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f7f8f6] px-4 py-[calc(2.5rem+env(safe-area-inset-top))]">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-9">
        <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white">
          <PiggyBank size={25} />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Sổ Thu Chi</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Nhập mật khẩu để tiếp tục
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Khu vực quản lý thu chi được bảo vệ bằng mật khẩu.
        </p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Mật khẩu</span>
            <span className="relative block">
              <LockKeyhole
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                autoFocus
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-emerald-700"
            />
            <span>
              <span className="block font-medium text-slate-800">Lưu đăng nhập trên thiết bị này</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Không cần nhập lại trong 30 ngày. Bỏ chọn để chỉ đăng nhập trong phiên này.
              </span>
            </span>
          </label>
          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !password}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Đang kiểm tra…' : 'Đăng nhập'}
          </button>
        </form>
      </section>
    </main>
  );
}
