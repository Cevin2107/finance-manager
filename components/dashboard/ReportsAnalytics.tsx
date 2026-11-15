'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDownLeft, ArrowUpRight, CircleDollarSign } from 'lucide-react';
import { useFinanceData } from '@/lib/finance-store';
import { EmptyState, formatMoney, PageHeader, Panel } from '@/components/dashboard/FinanceUI';

const formatAxis = (amount: number) => {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toLocaleString('vi-VN')}tr`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return String(amount);
};

export function ReportsAnalytics() {
  const { transactions } = useFinanceData();
  const [range, setRange] = useState(6);
  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: range }, (_, index) => {
      const month = new Date(now.getFullYear(), now.getMonth() - range + index + 1, 1);
      const items = transactions.filter((transaction) => {
        const date = new Date(`${transaction.date}T12:00:00`);
        return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
      });

      return {
        month: month.toLocaleDateString('vi-VN', { month: 'short' }),
        income: items.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0),
        expense: items.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0),
      };
    });
  }, [range, transactions]);

  const periodTransactions = useMemo(() => {
    const start = new Date();
    start.setMonth(start.getMonth() - range + 1, 1);
    const startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    return transactions.filter((transaction) => transaction.date.slice(0, 7) >= startKey);
  }, [range, transactions]);

  const income = periodTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expense = periodTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const savingsRate = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;
  const categoryTotals = periodTransactions
    .filter((item) => item.type === 'expense')
    .reduce<Record<string, number>>((totals, item) => {
      totals[item.category] = (totals[item.category] || 0) + item.amount;
      return totals;
    }, {});
  const categories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const largestCategory = Math.max(1, ...categories.map(([, value]) => value));

  return (
    <div>
      <PageHeader
        eyebrow="Nhìn lại dòng tiền"
        title="Báo cáo"
        description="Hiểu xu hướng thu chi và những danh mục đang chiếm phần lớn ngân sách của bạn."
        action={
          <select
            aria-label="Khoảng thời gian báo cáo"
            value={range}
            onChange={(event) => setRange(Number(event.target.value))}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 sm:w-auto"
          >
            <option value={3}>3 tháng gần nhất</option>
            <option value={6}>6 tháng gần nhất</option>
            <option value={12}>12 tháng gần nhất</option>
          </select>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="inline-flex rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><ArrowDownLeft size={19} /></span>
          <p className="mt-4 text-sm text-slate-500">Tổng tiền vào</p>
          <p className="mt-1 break-words text-xl font-semibold text-slate-950 [overflow-wrap:anywhere] sm:text-2xl">{formatMoney(income)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="inline-flex rounded-xl bg-rose-50 p-2.5 text-rose-600"><ArrowUpRight size={19} /></span>
          <p className="mt-4 text-sm text-slate-500">Tổng tiền ra</p>
          <p className="mt-1 break-words text-xl font-semibold text-slate-950 [overflow-wrap:anywhere] sm:text-2xl">{formatMoney(expense)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="inline-flex rounded-xl bg-blue-50 p-2.5 text-blue-700"><CircleDollarSign size={19} /></span>
          <p className="mt-4 text-sm text-slate-500">Tỷ lệ tiết kiệm</p>
          <p className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">{savingsRate}%</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Thu nhập và chi tiêu" description={`Dòng tiền trong ${range} tháng gần nhất`}>
          {periodTransactions.length ? (
            <div className="h-[280px] w-full min-w-0 sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={formatAxis} width={48} />
                  <Tooltip
                    formatter={(value) => formatMoney(Number(value))}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Thu nhập" fill="#059669" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="expense" name="Chi tiêu" fill="#fb7185" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="Chưa có dữ liệu trong khoảng thời gian này" description="Thêm giao dịch để xem biểu đồ dòng tiền." />
          )}
        </Panel>

        <Panel title="Chi tiêu theo danh mục" description="Sắp xếp theo số tiền đã chi">
          {categories.length ? (
            <div className="space-y-5">
              {categories.map(([category, value]) => (
                <div key={category}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-700">{category}</span>
                    <span className="break-words text-right font-semibold text-slate-900 [overflow-wrap:anywhere]">{formatMoney(value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.max(3, (value / largestCategory) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Chưa có khoản chi nào" description="Các danh mục chi tiêu sẽ hiển thị sau khi bạn ghi giao dịch." />
          )}
        </Panel>
      </div>
    </div>
  );
}
