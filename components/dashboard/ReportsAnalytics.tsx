'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Loading } from '@/components/ui/Loading';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', 
  '#FF8B94', '#C7CEEA', '#FFDAC1', '#B4F8C8',
  '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'
];

export function ReportsAnalytics() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');

  useEffect(() => {
    fetchTransactions();
  }, [timeRange]);

  const fetchTransactions = async () => {
    try {
      const months = timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12;
      const startDate = startOfMonth(subMonths(new Date(), months - 1));
      const endDate = endOfMonth(new Date());

      const response = await fetch(
        `/api/transactions?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const data = await response.json();
      
      if (data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate monthly trends
  const monthlyTrends = () => {
    const months = timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12;
    const startDate = subMonths(new Date(), months - 1);
    const monthsArray = eachMonthOfInterval({ start: startDate, end: new Date() });

    return monthsArray.map((month) => {
      const monthTransactions = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return (
          tDate.getMonth() === month.getMonth() &&
          tDate.getFullYear() === month.getFullYear()
        );
      });

      const income = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: format(month, 'MMM yy'),
        income,
        expense,
        balance: income - expense,
      };
    });
  };

  // Category breakdown
  const categoryBreakdown = (type: 'income' | 'expense') => {
    return transactions
      .filter((t) => t.type === type)
      .reduce((acc: any[], t) => {
        const existing = acc.find((item) => item.name === t.category);
        if (existing) {
          existing.value += t.amount;
        } else {
          acc.push({ name: t.category, value: t.amount });
        }
        return acc;
      }, [])
      .sort((a, b) => b.value - a.value);
  };

  // Top categories
  const topExpenseCategories = categoryBreakdown('expense').slice(0, 5);
  const topIncomeCategories = categoryBreakdown('income').slice(0, 5);

  // Total stats
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  if (isLoading) {
    return <Loading fullScreen text="Đang tạo báo cáo..." />;
  }

  const monthlyData = monthlyTrends();

  return (
    <div className="space-y-6 relative">
      {/* Animated Background Gradient Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-4 w-96 h-96 bg-orange-300 dark:bg-orange-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-20 -right-4 w-96 h-96 bg-red-300 dark:bg-red-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-20 w-96 h-96 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header with Glassmorphism */}
      <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl p-8 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10 rounded-3xl"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-400/10 rounded-full blur-3xl"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
              <div className="w-12 h-12 backdrop-blur-sm bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                <TrendingUp className="w-7 h-7 text-white drop-shadow-lg" />
              </div>
              📊 Báo cáo & Phân tích
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Phân tích chi tiết và xu hướng tài chính của bạn
            </p>
          </div>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            options={[
              { value: '3months', label: '3 tháng' },
              { value: '6months', label: '6 tháng' },
              { value: '12months', label: '12 tháng' },
            ]}
            className="backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="group relative backdrop-blur-xl bg-gradient-to-br from-green-500/80 via-emerald-500/80 to-teal-500/80 dark:from-green-600/60 dark:via-emerald-600/60 dark:to-teal-600/60 border border-white/30 dark:border-white/10 rounded-3xl p-6 shadow-2xl hover:shadow-green-500/50 transition-all duration-500 hover:scale-105 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 backdrop-blur-sm bg-white/30 rounded-2xl flex items-center justify-center shadow-xl">
                <TrendingUp className="w-6 h-6 text-white drop-shadow-lg" />
              </div>
              <p className="text-sm font-semibold text-white/90">💰 Tổng thu nhập</p>
            </div>
            <p className="text-3xl font-bold text-white drop-shadow-lg">
              {totalIncome.toLocaleString('vi-VN')} ₫
            </p>
          </div>
        </div>

        <div className="group relative backdrop-blur-xl bg-gradient-to-br from-red-500/80 via-rose-500/80 to-pink-500/80 dark:from-red-600/60 dark:via-rose-600/60 dark:to-pink-600/60 border border-white/30 dark:border-white/10 rounded-3xl p-6 shadow-2xl hover:shadow-red-500/50 transition-all duration-500 hover:scale-105 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 backdrop-blur-sm bg-white/30 rounded-2xl flex items-center justify-center shadow-xl">
                <TrendingDown className="w-6 h-6 text-white drop-shadow-lg" />
              </div>
              <p className="text-sm font-semibold text-white/90">💸 Tổng chi tiêu</p>
            </div>
            <p className="text-3xl font-bold text-white drop-shadow-lg">
              {totalExpense.toLocaleString('vi-VN')} ₫
            </p>
          </div>
        </div>

        <div className="group relative backdrop-blur-xl bg-gradient-to-br from-blue-500/80 via-indigo-500/80 to-purple-500/80 dark:from-blue-600/60 dark:via-indigo-600/60 dark:to-purple-600/60 border border-white/30 dark:border-white/10 rounded-3xl p-6 shadow-2xl hover:shadow-blue-500/50 transition-all duration-500 hover:scale-105 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 backdrop-blur-sm bg-white/30 rounded-2xl flex items-center justify-center shadow-xl">
                <DollarSign className="w-6 h-6 text-white drop-shadow-lg" />
              </div>
              <p className="text-sm font-semibold text-white/90">💎 Tiết kiệm</p>
            </div>
            <p className="text-3xl font-bold text-white drop-shadow-lg">
              {(totalIncome - totalExpense).toLocaleString('vi-VN')} ₫
            </p>
          </div>
        </div>

        <div className="group relative backdrop-blur-xl bg-gradient-to-br from-purple-500/80 via-violet-500/80 to-pink-500/80 dark:from-purple-600/60 dark:via-violet-600/60 dark:to-pink-600/60 border border-white/30 dark:border-white/10 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 hover:scale-105 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 backdrop-blur-sm bg-white/30 rounded-2xl flex items-center justify-center shadow-xl">
                <Calendar className="w-6 h-6 text-white drop-shadow-lg" />
              </div>
              <p className="text-sm font-semibold text-white/90">📈 Tỷ lệ tiết kiệm</p>
            </div>
            <p className="text-3xl font-bold text-white drop-shadow-lg">
              {savingsRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="relative p-6">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
            📈 Xu hướng theo tháng
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Thu nhập, chi tiêu và số dư</p>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: any) => `${value.toLocaleString('vi-VN')} ₫`} />
              <Legend />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorIncome)"
                name="Thu nhập"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#EF4444"
                fillOpacity={1}
                fill="url(#colorExpense)"
                name="Chi tiêu"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
          <div className="relative p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <span className="w-3 h-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-pulse"></span>
                Chi tiêu theo danh mục
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Top 5 danh mục chi nhiều nhất</p>
            </div>
            <div className="relative">
              {/* Decorative circles */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-full opacity-20"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-32 h-32 border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-full opacity-20"></div>
              </div>
              
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <defs>
                    {topExpenseCategories.map((entry, index) => (
                      <linearGradient 
                        key={`gradient-${index}`} 
                        id={`gradient-${index}`} 
                        x1="0" 
                        y1="0" 
                        x2="0" 
                        y2="1"
                      >
                        <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={1} />
                        <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.7} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={topExpenseCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={110}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={3}
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {topExpenseCategories.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#gradient-${index})`}
                        stroke="white"
                        strokeWidth={2}
                        className="hover:opacity-80 transition-opacity cursor-pointer drop-shadow-lg"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => `${value.toLocaleString('vi-VN')} ₫`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      padding: '12px 16px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Tổng chi tiêu</p>
                  <p className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    {topExpenseCategories.reduce((sum, cat) => sum + cat.value, 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}₫
                  </p>
                </div>
              </div>
            </div>
            
            {/* Legend with enhanced styling */}
            <div className="mt-6 space-y-3">
              {topExpenseCategories.map((cat, index) => {
                const percentage = (cat.value / topExpenseCategories.reduce((sum, c) => sum + c.value, 0)) * 100;
                return (
                  <div 
                    key={cat.name} 
                    className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative">
                        <div
                          className="w-5 h-5 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-200"
                          style={{ 
                            background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[index % COLORS.length]}dd)`
                          }}
                        ></div>
                        <div className="absolute inset-0 rounded-lg blur-sm opacity-50" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-200">
                          {cat.name}
                        </span>
                        <div className="w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500 group-hover:shadow-lg"
                            style={{ 
                              width: `${percentage}%`,
                              background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}, ${COLORS[index % COLORS.length]}dd)`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-lg transition-all duration-200">
                        {cat.value.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Income Categories */}
        <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-teal-500/5"></div>
          <div className="relative p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                💰 Thu nhập theo nguồn
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Các nguồn thu nhập chính</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topIncomeCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value: any) => `${value.toLocaleString('vi-VN')} ₫`} />
                <Bar dataKey="value" fill="#10B981" name="Thu nhập" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Balance Trend */}
      <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="relative p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              📉 Biến động số dư
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Theo dõi xu hướng tiết kiệm</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: any) => `${value.toLocaleString('vi-VN')} ₫`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#3B82F6"
                strokeWidth={3}
                name="Số dư"
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
