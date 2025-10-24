'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Sparkles, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface QuickAnalysis {
  summary: string;
  stats: {
    income: number;
    expense: number;
    balance: number;
    savingsRate: string;
  } | null;
  incomeStability?: {
    isStable: boolean;
    variancePercent: string;
  };
}

export function AIQuickInsight() {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<QuickAnalysis | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch analysis');
        }

        const data = await res.json();
        setAnalysis(data);
      } catch (err: any) {
        setError(err.message || 'Không thể tải phân tích');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardHeader title="AI Insights" subtitle="Phân tích tự động từ ChatGPT" />
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loading size="md" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Đang phân tích tài chính...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis?.stats) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardHeader title="AI Insights" subtitle="Phân tích tự động từ ChatGPT" />
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Chưa có đủ dữ liệu để phân tích.
              <br />
              Hãy thêm giao dịch để nhận insights từ AI!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
      <CardHeader title="AI Insights" subtitle="Phân tích tự động từ ChatGPT" />
      <CardContent>
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Thu nhập</span>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {(analysis.stats.income / 1000000).toFixed(1)}M ₫
            </p>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Chi tiêu</span>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {(analysis.stats.expense / 1000000).toFixed(1)}M ₫
            </p>
          </div>
        </div>

        {/* Income Stability Badge */}
        {analysis.incomeStability && (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4 ${
            analysis.incomeStability.isStable
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}>
            {analysis.incomeStability.isStable ? '✓' : '⚠'} Thu nhập{' '}
            {analysis.incomeStability.isStable ? 'ổn định' : 'không ổn định'}
          </div>
        )}

        {/* AI Summary - Shortened version */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {analysis.summary.split('\n').slice(0, 8).join('\n')}
            </ReactMarkdown>
          </div>
        </div>

        {/* View Full Analysis Link */}
        <a
          href="/dashboard/ai"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-3 font-medium"
        >
          Xem phân tích đầy đủ →
        </a>
      </CardContent>
    </Card>
  );
}
