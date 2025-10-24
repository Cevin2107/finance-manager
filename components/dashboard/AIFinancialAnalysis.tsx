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
    <div className="space-y-6">
      {/* Header with action button */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
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
        </CardContent>
      </Card>

      {error && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </Alert>
      )}

      {!analysis && !loading && (
        <Card variant="gradient">
          <CardContent>
            <div className="text-center py-12">
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
          </CardContent>
        </Card>
      )}

      {analysis && (
        <>
          {/* Stats Overview */}
          {analysis.stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card variant="gradient">
                <CardContent>
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Tổng thu nhập
                    </span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {analysis.stats.income.toLocaleString('vi-VN')} ₫
                  </p>
                </CardContent>
              </Card>

              <Card variant="gradient">
                <CardContent>
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Tổng chi tiêu
                    </span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {analysis.stats.expense.toLocaleString('vi-VN')} ₫
                  </p>
                </CardContent>
              </Card>

              <Card variant="gradient">
                <CardContent>
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Số dư
                    </span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {analysis.stats.balance.toLocaleString('vi-VN')} ₫
                  </p>
                </CardContent>
              </Card>

              <Card variant="gradient">
                <CardContent>
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Tiết kiệm
                    </span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {analysis.stats.savingsRate}%
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Analysis */}
          <Card>
            <CardHeader title="Phân tích chi tiết từ AI" />
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {analysis.summary}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* Top Expenses */}
          {analysis.topExpenseCategories && analysis.topExpenseCategories.length > 0 && (
            <Card>
              <CardHeader title="Top danh mục chi tiêu" />
              <CardContent>
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
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
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
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
