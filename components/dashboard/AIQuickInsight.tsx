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
      <div className="relative backdrop-blur-xl bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 dark:from-purple-600/30 dark:via-blue-600/30 dark:to-cyan-600/30 border border-white/30 dark:border-purple-500/30 rounded-3xl shadow-2xl h-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
        <div className="relative p-6">
          <div className="flex items-center justify-center py-12">
            <Loading size="md" />
            <span className="ml-3 text-gray-700 dark:text-gray-300 text-sm font-medium">
              🤖 AI đang phân tích...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis?.stats) {
    return (
      <div className="relative backdrop-blur-xl bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 dark:from-purple-600/30 dark:via-blue-600/30 dark:to-cyan-600/30 border border-white/30 dark:border-purple-500/30 rounded-3xl shadow-2xl h-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
        <div className="relative p-6">
          <div className="text-center py-8">
            <div className="w-14 h-14 backdrop-blur-lg bg-purple-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <AlertCircle className="w-7 h-7 text-purple-600 dark:text-purple-300" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
              {analysis?.summary || '📝 Chưa có giao dịch. Hãy thêm để nhận AI insights!'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const periodEmoji = analysis.analysisMode === 'monthly' ? '📅' : '📊';
  const periodText = analysis.period || '7 ngày qua';

  return (
    <div className="group relative backdrop-blur-xl bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 dark:from-purple-600/30 dark:via-blue-600/30 dark:to-cyan-600/30 border border-white/30 dark:border-purple-500/30 rounded-3xl shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 h-full overflow-hidden">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent group-hover:from-white/40 transition-all duration-500"></div>
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl group-hover:bg-purple-400/30 transition-all duration-500"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl group-hover:bg-blue-400/30 transition-all duration-500"></div>
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 backdrop-blur-sm bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            <Sparkles className="w-6 h-6 text-white drop-shadow-lg" />
          </div>
          <div>
            <h3 className="font-bold text-lg bg-gradient-to-r from-purple-700 to-blue-700 dark:from-purple-300 dark:to-blue-300 bg-clip-text text-transparent">
              AI Insights
            </h3>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 px-2 py-0.5 rounded-full inline-block">
              {periodEmoji} {periodText}
            </p>
          </div>
        </div>

        {/* AI Summary */}
        <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
          <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed space-y-2 backdrop-blur-sm bg-white/20 dark:bg-gray-800/20 p-4 rounded-2xl border border-white/20 dark:border-gray-700/20">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {analysis.summary}
            </ReactMarkdown>
          </div>
        </div>

        {/* Income Stability Badge */}
        {analysis.incomeStability && (
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold mb-4 backdrop-blur-md border shadow-lg ${
            analysis.incomeStability.isStable
              ? 'bg-green-500/80 text-white border-green-300/30'
              : 'bg-yellow-500/80 text-white border-yellow-300/30'
          }`}>
            {analysis.incomeStability.isStable ? '✓' : '⚠'} Thu nhập{' '}
            {analysis.incomeStability.isStable ? 'ổn định' : 'biến động'}
          </div>
        )}

        {/* View Full Analysis Link */}
        <a
          href="/dashboard/ai"
          className="inline-flex items-center gap-2 px-4 py-2.5 backdrop-blur-md bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-600/90 hover:to-blue-600/90 text-white text-sm font-semibold rounded-xl border border-white/30 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          <Sparkles className="w-4 h-4" />
          Xem phân tích chi tiết →
        </a>
      </div>
    </div>
  );
}
