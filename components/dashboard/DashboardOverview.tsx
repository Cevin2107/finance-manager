'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { AIQuickInsight } from '@/components/dashboard/AIQuickInsight';
import { QuickTransaction } from '@/components/dashboard/QuickTransaction';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  eachWeekOfInterval, 
  eachMonthOfInterval 
} from 'date-fns';
import { vi } from 'date-fns/locale';

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
}

interface Stats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

type ChartPeriod = 'week' | 'month' | 'year';

export function DashboardOverview() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('week');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/transactions');
      const data = await response.json();
      
      if (data.transactions) {
        setTransactions(data.transactions);
        calculateStats(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (trans: Transaction[]) => {
    const income = trans
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = trans
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    setStats({
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      transactionCount: trans.length,
    });
  };

  // Generate chart data based on selected period
  const getChartData = () => {
    const now = new Date();
    let intervals: Date[] = [];
    let labelFormat: (date: Date) => string;

    if (chartPeriod === 'week') {
      const start = startOfWeek(now, { locale: vi });
      const end = endOfWeek(now, { locale: vi });
      intervals = eachDayOfInterval({ start, end });
      labelFormat = (date) => format(date, 'EEE', { locale: vi });
    } else if (chartPeriod === 'month') {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      intervals = eachDayOfInterval({ start, end });
      labelFormat = (date) => format(date, 'd'); // Chỉ hiển thị ngày (1, 2, 3...)
    } else {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      intervals = eachMonthOfInterval({ start, end });
      labelFormat = (date) => format(date, 'MMM', { locale: vi });
    }

    return intervals.map((interval) => {
      const relevantTransactions = transactions.filter((t) => {
        const tDate = new Date(t.date);
        if (chartPeriod === 'week' || chartPeriod === 'month') {
          return format(tDate, 'yyyy-MM-dd') === format(interval, 'yyyy-MM-dd');
        } else {
          return tDate.getMonth() === interval.getMonth();
        }
      });

      const income = relevantTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = relevantTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        label: labelFormat(interval),
        income,
        expense,
      };
    });
  };

  if (isLoading) {
    return <Loading fullScreen text="Đang tải dữ liệu..." />;
  }

  return (
    <div className="space-y-6 relative">
      {/* Animated Background Gradient Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-300 dark:bg-yellow-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header with Glassmorphism */}
      <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-3xl"></div>
        <div className="relative">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            ✨ Tổng quan tài chính của bạn
          </p>
        </div>
      </div>

      {/* Main Layout: Stats + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side: Stats Cards (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards - Glassmorphism Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Card */}
            <div className="group relative backdrop-blur-xl bg-gradient-to-br from-green-500/80 via-emerald-500/80 to-teal-500/80 dark:from-green-600/60 dark:via-emerald-600/60 dark:to-teal-600/60 border border-white/30 dark:border-white/10 rounded-3xl p-6 shadow-2xl hover:shadow-green-500/50 transition-all duration-500 hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-white/90 mb-2 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Tổng Thu Nhập
                  </p>
                  <h3 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
                    {stats.totalIncome.toLocaleString('vi-VN')} ₫
                  </h3>
                </div>
                <div className="bg-white/30 backdrop-blur-sm p-4 rounded-2xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                  <TrendingUp className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>

            {/* Expense Card */}
            <div className="group relative backdrop-blur-xl bg-gradient-to-br from-red-500/80 via-rose-500/80 to-pink-500/80 dark:from-red-600/60 dark:via-rose-600/60 dark:to-pink-600/60 border border-white/30 dark:border-white/10 rounded-3xl p-6 shadow-2xl hover:shadow-red-500/50 transition-all duration-500 hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-white/90 mb-2 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Tổng Chi Tiêu
                  </p>
                  <h3 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
                    {stats.totalExpense.toLocaleString('vi-VN')} ₫
                  </h3>
                </div>
                <div className="bg-white/30 backdrop-blur-sm p-4 rounded-2xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                  <TrendingDown className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>

            {/* Balance Card */}
            <div className={`group relative backdrop-blur-xl ${
              stats.balance >= 0 
                ? 'bg-gradient-to-br from-blue-500/80 via-indigo-500/80 to-purple-500/80 dark:from-blue-600/60 dark:via-indigo-600/60 dark:to-purple-600/60' 
                : 'bg-gradient-to-br from-orange-500/80 via-red-500/80 to-rose-500/80 dark:from-orange-600/60 dark:via-red-600/60 dark:to-rose-600/60'
            } border border-white/30 dark:border-white/10 rounded-3xl p-6 shadow-2xl hover:shadow-blue-500/50 transition-all duration-500 hover:scale-105 overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-white/90 mb-2 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Số Dư
                  </p>
                  <h3 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
                    {stats.balance.toLocaleString('vi-VN')} ₫
                  </h3>
                </div>
                <div className="bg-white/30 backdrop-blur-sm p-4 rounded-2xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                  <Wallet className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>

            {/* Transaction Count Card */}
            <div className="group relative backdrop-blur-xl bg-gradient-to-br from-purple-500/80 via-violet-500/80 to-indigo-500/80 dark:from-purple-600/60 dark:via-violet-600/60 dark:to-indigo-600/60 border border-white/30 dark:border-white/10 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-white/90 mb-2 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Giao Dịch
                  </p>
                  <h3 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
                    {stats.transactionCount}
                  </h3>
                </div>
                <div className="bg-white/30 backdrop-blur-sm p-4 rounded-2xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                  <Sparkles className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: AI Insights (1/3 width) */}
        <div className="lg:col-span-1">
          <AIQuickInsight />
        </div>
      </div>

      {/* Modern AreaChart with Glassmorphism */}
      <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl p-6 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📊 Biểu đồ tài chính
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Thu nhập & Chi tiêu theo thời gian
              </p>
            </div>
            
            {/* Period Selector with Glassmorphism */}
            <div className="flex items-center gap-2 backdrop-blur-lg bg-white/50 dark:bg-gray-800/50 p-1.5 rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-lg">
              <button
                onClick={() => setChartPeriod('week')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                  chartPeriod === 'week'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Calendar className="w-4 h-4 inline-block mr-1" />
                Tuần
              </button>
              <button
                onClick={() => setChartPeriod('month')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                  chartPeriod === 'month'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Calendar className="w-4 h-4 inline-block mr-1" />
                Tháng
              </button>
              <button
                onClick={() => setChartPeriod('year')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                  chartPeriod === 'year'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Calendar className="w-4 h-4 inline-block mr-1" />
                Năm
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={getChartData()}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="label" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip 
              formatter={(value: any) => `${value.toLocaleString('vi-VN')} ₫`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="income" 
              stroke="#10B981" 
              strokeWidth={2}
              fill="url(#incomeGradient)" 
              name="Thu nhập"
            />
            <Area 
              type="monotone" 
              dataKey="expense" 
              stroke="#EF4444" 
              strokeWidth={2}
              fill="url(#expenseGradient)" 
              name="Chi tiêu"
            />
          </AreaChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions with Glassmorphism */}
      <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5"></div>
        <div className="relative">
          <div className="p-6 border-b border-white/20 dark:border-gray-700/30">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              💳 Giao dịch gần đây
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {Math.min(5, transactions.length)} giao dịch mới nhất
            </p>
          </div>
          <div className="p-6 space-y-3">
            {transactions.slice(0, 5).map((transaction, index) => (
              <div
                key={transaction._id}
                className="group relative backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border border-white/30 dark:border-gray-700/30 rounded-2xl p-4 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl backdrop-blur-sm flex items-center justify-center shadow-lg ${
                        transaction.type === 'income'
                          ? 'bg-green-500/80 border border-green-300/30'
                          : 'bg-red-500/80 border border-red-300/30'
                      }`}
                    >
                      {transaction.type === 'income' ? (
                        <TrendingUp className="w-6 h-6 text-white drop-shadow-lg" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-white drop-shadow-lg" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {transaction.category}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {transaction.description || 'Không có mô tả'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        transaction.type === 'income'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {transaction.amount.toLocaleString('vi-VN')} ₫
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 backdrop-blur-sm bg-white/30 dark:bg-gray-700/30 px-2 py-0.5 rounded-full inline-block mt-1">
                      {format(new Date(transaction.date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full backdrop-blur-lg bg-gray-500/20 mb-4">
                  <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  Chưa có giao dịch nào
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
