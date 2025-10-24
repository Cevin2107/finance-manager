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
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
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
    <div className="space-y-6">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              Báo cáo & Phân tích
            </h1>
            <p className="text-orange-100 text-lg">
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
            className="bg-white/20 backdrop-blur-md text-white border-white/30"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-0">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Tổng thu nhập</p>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {totalIncome.toLocaleString('vi-VN')} ₫
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-0">
          <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-pink-500 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Tổng chi tiêu</p>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              {totalExpense.toLocaleString('vi-VN')} ₫
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Tiết kiệm</p>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {(totalIncome - totalExpense).toLocaleString('vi-VN')} ₫
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Tỷ lệ tiết kiệm</p>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {savingsRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader title="Xu hướng theo tháng" subtitle="Thu nhập, chi tiêu và số dư" />
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Category Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <Card>
          <CardHeader title="Chi tiêu theo danh mục" subtitle="Top 5 danh mục chi nhiều nhất" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topExpenseCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {topExpenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${value.toLocaleString('vi-VN')} ₫`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {topExpenseCategories.map((cat, index) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {cat.value.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Income Categories */}
        <Card>
          <CardHeader title="Thu nhập theo nguồn" subtitle="Các nguồn thu nhập chính" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topIncomeCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value: any) => `${value.toLocaleString('vi-VN')} ₫`} />
                <Bar dataKey="value" fill="#10B981" name="Thu nhập" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Balance Trend */}
      <Card>
        <CardHeader title="Biến động số dư" subtitle="Theo dõi xu hướng tiết kiệm" />
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
