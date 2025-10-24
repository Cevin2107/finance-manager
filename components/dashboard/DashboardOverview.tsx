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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Tổng quan tài chính của bạn
        </p>
      </div>

      {/* Main Layout: Stats + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side: Stats Cards (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards - Gradient Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-green-100 mb-2 font-medium">Tổng Thu Nhập</p>
                  <h3 className="text-3xl font-bold tracking-tight">
                    {stats.totalIncome.toLocaleString('vi-VN')} ₫
                  </h3>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-red-500 via-rose-600 to-pink-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-red-100 mb-2 font-medium">Tổng Chi Tiêu</p>
                  <h3 className="text-3xl font-bold tracking-tight">
                    {stats.totalExpense.toLocaleString('vi-VN')} ₫
                  </h3>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                  <TrendingDown className="w-8 h-8 text-white" />
                </div>
              </div>
            </Card>

            <Card className={`p-6 bg-gradient-to-br ${
              stats.balance >= 0 
                ? 'from-blue-500 via-indigo-600 to-purple-600' 
                : 'from-orange-500 via-red-600 to-rose-600'
            } text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-blue-100 mb-2 font-medium">Số Dư</p>
                  <h3 className="text-3xl font-bold tracking-tight">
                    {stats.balance.toLocaleString('vi-VN')} ₫
                  </h3>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-purple-100 mb-2 font-medium">Giao Dịch</p>
                  <h3 className="text-3xl font-bold tracking-tight">
                    {stats.transactionCount}
                  </h3>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Right side: AI Insights (1/3 width) */}
        <div className="lg:col-span-1">
          <AIQuickInsight />
        </div>
      </div>

      {/* Modern AreaChart with Period Selector */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Biểu đồ tài chính
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Thu nhập & Chi tiêu theo thời gian
            </p>
          </div>
          
          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setChartPeriod('week')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                chartPeriod === 'week'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4 inline-block mr-1" />
              Tuần
            </button>
            <button
              onClick={() => setChartPeriod('month')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                chartPeriod === 'month'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4 inline-block mr-1" />
              Tháng
            </button>
            <button
              onClick={() => setChartPeriod('year')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                chartPeriod === 'year'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
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
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader title="Giao dịch gần đây" subtitle={`${Math.min(5, transactions.length)} giao dịch mới nhất`} />
        <CardContent>
          <div className="space-y-4">
            {transactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction._id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}
                  >
                    {transaction.type === 'income' ? (
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {transaction.category}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {transaction.description || 'Không có mô tả'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      transaction.type === 'income'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {transaction.amount.toLocaleString('vi-VN')} ₫
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(transaction.date), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                Chưa có giao dịch nào
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
