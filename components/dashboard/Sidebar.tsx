'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  ReceiptText,
  WalletCards,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Giao dịch', href: '/dashboard/transactions', icon: ReceiptText },
  { name: 'Ngân sách', href: '/dashboard/budget', icon: WalletCards },
  { name: 'Mục tiêu tiết kiệm', href: '/dashboard/savings', icon: PiggyBank },
  { name: 'Báo cáo', href: '/dashboard/reports', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function logout() {
    setLogoutError(null);
    try {
      const response = await fetch('/api/access/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Không thể kết thúc phiên đăng nhập.');
      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error('Không thể đăng xuất:', error);
      setLogoutError('Không thể đăng xuất. Vui lòng thử lại.');
    }
  }

  const navigationContent = (
    <>
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white">
          <PiggyBank size={23} strokeWidth={2.2} />
        </div>
        <div>
          <p className="font-semibold tracking-tight text-slate-950">Sổ Thu Chi</p>
          <p className="text-xs text-slate-500">Tài chính rõ ràng hơn</p>
        </div>
      </div>

      <div className="px-4 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        Không gian của bạn
      </div>
      <nav className="space-y-1 px-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={clsx(
                'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition',
                active
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon size={18} />
              <span className="flex-1">{item.name}</span>
              {active && <ChevronRight size={16} />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4">
        {logoutError && (
          <p role="alert" className="mb-2 text-xs text-rose-700">
            {logoutError}
          </p>
        )}
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
        >
          <LogOut size={17} />
          Đăng xuất
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex h-[calc(4rem+env(safe-area-inset-top))] items-center justify-between border-b border-slate-200 bg-white px-4 pt-[env(safe-area-inset-top)] lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-slate-900">
          <PiggyBank size={21} className="text-emerald-700" />
          Sổ Thu Chi
        </Link>
        <button
          type="button"
          aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
          onClick={() => setIsOpen(!isOpen)}
          className="min-h-11 min-w-11 rounded-lg p-2 text-slate-700 hover:bg-slate-100"
        >
          {isOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {isOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex max-h-dvh w-64 flex-col overflow-y-auto overscroll-contain border-r border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] transition-transform lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {navigationContent}
      </aside>
    </>
  );
}
