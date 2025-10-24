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
  period?: string;
  analysisMode?: 'weekly' | 'monthly';
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
      <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-cyan-900/20 h-full">
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loading size="md" />
            <span className="ml-3 text-gray-600 dark:text-gray-400 text-sm">
              Đang phân tích...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis?.stats) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-cyan-900/20 h-full">
        <CardContent>
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {analysis?.summary || 'Chưa có giao dịch. Hãy thêm để nhận insights!'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const periodEmoji = analysis.analysisMode === 'monthly' ? '📅' : '📊';
  const periodText = analysis.period || '7 ngày qua';

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-cyan-900/20 h-full border-2 border-purple-200 dark:border-purple-800">
      <CardContent>
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              AI Insights
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {periodEmoji} {periodText}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Thu</span>
            </div>
            <p className="text-base font-bold text-gray-900 dark:text-gray-100">
              {(analysis.stats.income / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Chi</span>
            </div>
            <p className="text-base font-bold text-gray-900 dark:text-gray-100">
              {(analysis.stats.expense / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>

        {/* Income Stability Badge */}
        {analysis.incomeStability && (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-3 ${
            analysis.incomeStability.isStable
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}>
            {analysis.incomeStability.isStable ? '✓' : '⚠'} Thu nhập{' '}
            {analysis.incomeStability.isStable ? 'ổn định' : 'biến động'}
          </div>
        )}

        {/* AI Summary - Shortened & styled */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="text-xs text-gray-700 dark:text-gray-300 line-clamp-4 leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {analysis.summary.split('\n').slice(0, 6).join('\n')}
            </ReactMarkdown>
          </div>
        </div>

        {/* View Full Analysis Link */}
        <a
          href="/dashboard/ai"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-3 font-semibold hover:gap-2 transition-all"
        >
          Xem đầy đủ →
        </a>
      </CardContent>
    </Card>
  );
}
