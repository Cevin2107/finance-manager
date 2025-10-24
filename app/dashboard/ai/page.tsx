'use client';

import { useState } from 'react';
import { AIChatBox } from '@/components/dashboard/AIChatBox';
import { AIFinancialAnalysis } from '@/components/dashboard/AIFinancialAnalysis';
import { MessageSquare, BarChart3 } from 'lucide-react';

export default function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'analysis'>('analysis');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          AI Assistant
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Trợ lý tài chính thông minh được hỗ trợ bởi ChatGPT
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('analysis')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'analysis'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={20} />
            <span>Phân tích AI</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'chat'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={20} />
            <span>Chat với AI</span>
          </div>
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'analysis' && <AIFinancialAnalysis />}
        {activeTab === 'chat' && <AIChatBox />}
      </div>
    </div>
  );
}
