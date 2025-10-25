'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Sparkles,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AnalysisData {
  summary: string;
  stats: {
    income: number;
    expense: number;
    balance: number;
    savingsRate: string;
  } | null;
  topExpenseCategories: Array<{
    category: string;
    amount: number;
  }>;
  incomeStability?: {
    isStable: boolean;
    variancePercent: string;
  };
  period?: string;
  analysisMode?: 'weekly' | 'monthly';
}

export function AIFinancialAnalysis() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to analyze');
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi phân tích');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Animated gradient background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-blob"></div>
      <div className="absolute top-40 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-40 left-1/2 w-96 h-96 bg-gradient-to-br from-green-400/20 to-yellow-400/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

      {/* Header with action button */}
      <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5"></div>
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {analysis?.analysisMode === 'monthly' ? '📅' : '📊'} Phân tích tài chính bằng AI
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {analysis ? `Phân tích ${analysis.period || '7 ngày qua'}` : 'Phân tích chi tiết tài chính của bạn với AI'}
              </p>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              variant="primary"
              size="lg"
            >
              {loading ? (
                <>
                  <Loading size="sm" />
                  <span className="ml-2">Đang phân tích...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  {analysis ? 'Phân tích lại' : 'Phân tích ngay'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="relative z-10">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </Alert>
        </div>
      )}

      {!analysis && !loading && (
        <div className="relative backdrop-blur-xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70"></div>
          <div className="relative p-12">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Xin chào{session?.user?.name ? ` ${session.user.name}` : ''}! Sẵn sàng nhận insights từ AI?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                AI sẽ phân tích giao dịch của bạn và đưa ra những lời khuyên cá nhân hóa
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Phân tích xu hướng
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Thu nhập & chi tiêu 6 tháng
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Kiểm tra ổn định
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Thu nhập có ổn định không?
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <PiggyBank className="w-5 h-5 text-yellow-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Tiết kiệm thông minh
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Khuyến nghị cải thiện tài chính
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Cá nhân hóa
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Dựa trên dữ liệu của bạn
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <>
          {/* Stats Overview */}
          {analysis.stats && (
            <div className="relative grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative backdrop-blur-xl bg-gradient-to-br from-green-400/80 via-emerald-400/80 to-teal-400/80 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden group hover:scale-105 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <div className="relative p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-white drop-shadow-lg" />
                    <span className="text-sm text-white/90">
                      Tổng thu nhập
                    </span>
                  </div>
                  <p className="text-xl font-bold text-white drop-shadow-lg">
                    {analysis.stats.income.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
              </div>

              <div className="relative backdrop-blur-xl bg-gradient-to-br from-red-400/80 via-pink-400/80 to-rose-400/80 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden group hover:scale-105 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <div className="relative p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingDown className="w-5 h-5 text-white drop-shadow-lg" />
                    <span className="text-sm text-white/90">
                      Tổng chi tiêu
                    </span>
                  </div>
                  <p className="text-xl font-bold text-white drop-shadow-lg">
                    {analysis.stats.expense.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
              </div>

              <div className="relative backdrop-blur-xl bg-gradient-to-br from-blue-400/80 via-cyan-400/80 to-sky-400/80 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden group hover:scale-105 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <div className="relative p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-5 h-5 text-white drop-shadow-lg" />
                    <span className="text-sm text-white/90">
                      Số dư
                    </span>
                  </div>
                  <p className="text-xl font-bold text-white drop-shadow-lg">
                    {analysis.stats.balance.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
              </div>

              <div className="relative backdrop-blur-xl bg-gradient-to-br from-yellow-400/80 via-orange-400/80 to-amber-400/80 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden group hover:scale-105 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <div className="relative p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-white drop-shadow-lg" />
                    <span className="text-sm text-white/90">
                      Tiết kiệm
                    </span>
                  </div>
                  <p className="text-xl font-bold text-white drop-shadow-lg">
                    {analysis.stats.savingsRate}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis */}
          <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-pink-500/5"></div>
            <div className="relative p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  ✨ Phân tích chi tiết từ AI
                </h3>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {analysis.summary}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Top Expenses */}
          {analysis.topExpenseCategories && analysis.topExpenseCategories.length > 0 && (
            <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-pink-500/5 to-orange-500/5"></div>
              <div className="relative p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                    🔥 Top danh mục chi tiêu
                  </h3>
                </div>
                <div className="space-y-3">
                  {analysis.topExpenseCategories.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {index + 1}. {item.category}
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {item.amount.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                      <div className="w-full bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-full h-2 border border-white/10">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-purple-600 h-full rounded-full transition-all shadow-lg"
                          style={{
                            width: `${
                              (item.amount /
                                Math.max(...analysis.topExpenseCategories.map((c) => c.amount))) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
