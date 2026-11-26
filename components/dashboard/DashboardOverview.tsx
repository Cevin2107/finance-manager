'use client';

import Link from 'next/link';
import { FinanceDataTools } from './FinanceDataTools';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  Plus,
  Target,
  Wallet,
} from 'lucide-react';
import { useFinanceData } from '@/lib/finance-store';
import { ShareMonthButton } from '@/components/dashboard/ShareMonthButton';
import {
  EmptyState,
  formatMoney,
  PageHeader,
  Panel,
  primaryButtonClassName,
} from '@/components/dashboard/FinanceUI';

function localDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
  });
}

export function DashboardOverview() {
  const { transactions, budgets, goals } = useFinanceData();
  const today = new Date();
  const monthTransactions = transactions.filter((transaction) => {
    const date = new Date(`${transaction.date}T12:00:00`);
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  });
  const income = monthTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = monthTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalBalance = transactions.reduce(
    (balance, transaction) =>
      balance + (transaction.type === 'income' ? transaction.amount : -transaction.amount),
    0
  );
  const savedBalance = goals.reduce((balance, goal) => balance + goal.currentAmount, 0);
  const spendableBalance = totalBalance - savedBalance;
  const savingsRate = income > 0 ? Math.max(0, Math.round(((income - expenses) / income) * 100)) : 0;
  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const spendingByCategory = monthTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce<Record<string, number>>((totals, transaction) => {
      totals[transaction.category] = (totals[transaction.category] || 0) + transaction.amount;
      return totals;
    }, {});
  const categories = Object.entries(spendingByCategory).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const largestCategory = Math.max(1, ...categories.map(([, amount]) => amount));
  const monthLabel = today.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  const stats = [
    { label: 'Thu nhập tháng này', value: formatMoney(income), icon: ArrowDownLeft, tone: 'emerald' },
    { label: 'Chi tiêu tháng này', value: formatMoney(expenses), icon: ArrowUpRight, tone: 'rose' },
    { label: 'Tiền còn để chi', value: formatMoney(spendableBalance), icon: Wallet, tone: 'blue' },
    { label: 'Tỷ lệ tiết kiệm', value: `${savingsRate}%`, icon: CircleDollarSign, tone: 'amber' },
  ] as const;

  return (
    <div>
      <PageHeader
        eyebrow={monthLabel}
        title="Tiền của bạn, trong tầm mắt."
        description="Theo dõi dòng tiền mỗi ngày, hiểu tiền đang đi đâu và tiến gần hơn tới mục tiêu của bạn."
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <ShareMonthButton />
            <Link href="/dashboard/transactions?new=1" className={`${primaryButtonClassName} w-full sm:w-auto`}>
              <Plus size={17} />
              Thêm giao dịch
            </Link>
          </div>
        }
      />

      <FinanceDataTools />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const tones = {
            emerald: 'bg-emerald-50 text-emerald-700',
            rose: 'bg-rose-50 text-rose-700',
            blue: 'bg-blue-50 text-blue-700',
            amber: 'bg-amber-50 text-amber-700',
          };

          return (
            <div key={stat.label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <span className={`rounded-xl p-2.5 ${tones[stat.tone]}`}>
                  <Icon size={19} />
                </span>
              </div>
              <p className="mt-5 break-words text-xl font-semibold tracking-tight text-slate-950 [overflow-wrap:anywhere] sm:text-2xl">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-400">
                {stat.label.includes('tháng')
                  ? monthLabel
                  : stat.label === 'Tiền còn để chi'
                    ? 'Đã trừ số tiền đang dành cho mục tiêu'
                    : 'Tính từ các giao dịch đã ghi'}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Panel
          title="Chi tiêu theo mục đích"
          description={`Các khoản chi trong ${monthLabel}`}
          action={<Link href="/dashboard/reports" className="text-sm font-semibold text-emerald-700">Báo cáo</Link>}
        >
          {categories.length ? (
            <div className="space-y-5">
              {categories.map(([category, amount]) => (
                <div key={category}>
                  <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-slate-700">{category}</span>
                    <span className="text-right font-semibold text-slate-900">{formatMoney(amount)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${Math.max(4, (amount / largestCategory) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Chưa có khoản chi nào trong tháng này" description="Thêm giao dịch chi tiêu để xem tiền của bạn đang được dùng vào đâu." />
          )}
        </Panel>

        <Panel
          title="Giao dịch gần đây"
          description="Những khoản thu chi mới nhất"
          action={<Link href="/dashboard/transactions" className="text-sm font-semibold text-emerald-700">Tất cả</Link>}
        >
          {recentTransactions.length ? (
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`rounded-xl p-2.5 ${transaction.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                    {transaction.type === 'income' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{transaction.description || transaction.category}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{transaction.category} · {localDate(transaction.date)}</p>
                  </div>
                  <p className={`max-w-[40%] break-words text-right text-xs font-semibold [overflow-wrap:anywhere] sm:max-w-none sm:whitespace-nowrap sm:text-sm ${transaction.type === 'income' ? 'text-emerald-700' : 'text-slate-800'}`}>
                    {transaction.type === 'income' ? '+' : '−'}{formatMoney(transaction.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sổ của bạn đang trống" description="Ghi lại khoản thu hoặc chi đầu tiên để bắt đầu theo dõi." />
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Panel
          title="Ngân sách tháng"
          description="Theo dõi hạn mức chi tiêu theo danh mục"
          action={<Link href="/dashboard/budget" className="text-sm font-semibold text-emerald-700">Quản lý</Link>}
        >
          {budgets.length ? (
            <div className="space-y-4">
              {budgets.slice(0, 3).map((budget) => {
                const spent = monthTransactions
                  .filter((transaction) => transaction.type === 'expense' && transaction.category === budget.category)
                  .reduce((sum, transaction) => sum + transaction.amount, 0);
                const percent = budget.limit > 0 ? Math.min(100, (spent / budget.limit) * 100) : 0;

                return (
                  <div key={budget.id}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{budget.category}</span>
                      <span className="text-slate-500">{formatMoney(spent)} / {formatMoney(budget.limit)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${percent >= 100 ? 'bg-rose-500' : 'bg-emerald-600'}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Chưa có ngân sách" description="Đặt hạn mức cho từng danh mục để chủ động kiểm soát chi tiêu." />
          )}
        </Panel>

        <Panel
          title="Mục tiêu tiết kiệm"
          description="Từng bước dành dụm cho điều quan trọng"
          action={<Link href="/dashboard/savings" className="text-sm font-semibold text-emerald-700">Xem mục tiêu</Link>}
        >
          {goals.length ? (
            <div className="space-y-4">
              {goals.slice(0, 2).map((goal) => {
                const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
                return (
                  <div key={goal.id} className="rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <span className="rounded-xl bg-amber-50 p-2.5 text-amber-700"><Target size={18} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{goal.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)}</p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-700">{Math.round(progress)}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Bắt đầu một mục tiêu" description="Quỹ dự phòng, chuyến đi hay món đồ bạn mong muốn — hãy đặt mục tiêu đầu tiên." />
          )}
        </Panel>
      </div>
    </div>
  );
}
