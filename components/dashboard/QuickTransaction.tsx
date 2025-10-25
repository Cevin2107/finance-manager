'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Settings, 
  X, 
  Check,
  AlertCircle 
} from 'lucide-react';

const DEFAULT_EXPENSE_CATEGORIES = [
  'Ăn uống',
  'Di chuyển',
  'Mua sắm',
  'Giải trí',
  'Sức khỏe',
  'Giáo dục',
  'Hóa đơn',
  'Khác',
];

const DEFAULT_INCOME_CATEGORIES = [
  'Lương',
  'Thưởng',
  'Đầu tư',
  'Làm thêm',
  'Quà tặng',
  'Khác',
];

function formatCurrency(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseCurrency(value: string) {
  return parseFloat(value.replace(/\./g, '')) || 0;
}

function formatAmountText(amount: number): string {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)} tỷ đồng`;
  } else if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)} triệu đồng`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)} nghìn đồng`;
  }
  return `${amount} đồng`;
}

export function QuickTransaction() {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Category management
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState<string[]>(DEFAULT_INCOME_CATEGORIES);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingType, setEditingType] = useState<'income' | 'expense'>('expense');

  // Load categories from localStorage
  useEffect(() => {
    const savedExpense = localStorage.getItem('expenseCategories');
    const savedIncome = localStorage.getItem('incomeCategories');
    
    if (savedExpense) {
      setExpenseCategories(JSON.parse(savedExpense));
    }
    if (savedIncome) {
      setIncomeCategories(JSON.parse(savedIncome));
    }
  }, []);

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const handleQuickAdd = async () => {
    if (!category || !amount) {
      setError('Vui lòng chọn danh mục và nhập số tiền');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          category,
          amount: parseCurrency(amount),
          description: '',
          date: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Thêm giao dịch thất bại');

      setSuccess(`Đã thêm ${type === 'income' ? 'thu nhập' : 'chi tiêu'} thành công!`);
      setCategory('');
      setAmount('');
      
      // Dispatch event để các component khác cập nhật ngay lập tức
      window.dispatchEvent(new Event('transactionAdded'));
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const targetCategories = editingType === 'income' ? incomeCategories : expenseCategories;
    
    if (targetCategories.includes(newCategoryName.trim())) {
      alert('Danh mục này đã tồn tại!');
      return;
    }

    const updated = [...targetCategories, newCategoryName.trim()];
    
    if (editingType === 'income') {
      setIncomeCategories(updated);
      localStorage.setItem('incomeCategories', JSON.stringify(updated));
    } else {
      setExpenseCategories(updated);
      localStorage.setItem('expenseCategories', JSON.stringify(updated));
    }
    
    setNewCategoryName('');
  };

  const handleRemoveCategory = (categoryName: string) => {
    const targetCategories = editingType === 'income' ? incomeCategories : expenseCategories;
    const updated = targetCategories.filter(c => c !== categoryName);
    
    if (editingType === 'income') {
      setIncomeCategories(updated);
      localStorage.setItem('incomeCategories', JSON.stringify(updated));
    } else {
      setExpenseCategories(updated);
      localStorage.setItem('expenseCategories', JSON.stringify(updated));
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              ⚡ Thêm nhanh
            </h3>
            <Button
              onClick={() => {
                setEditingType(type);
                setShowCategoryModal(true);
              }}
              variant="outline"
              size="sm"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Type Selector */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => {
                setType('income');
                setCategory('');
              }}
              className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                type === 'income'
                  ? 'bg-green-500 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-[#1e1e1e] text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Thu nhập</span>
            </button>
            <button
              onClick={() => {
                setType('expense');
                setCategory('');
              }}
              className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                type === 'expense'
                  ? 'bg-red-500 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-[#1e1e1e] text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              <TrendingDown className="w-5 h-5" />
              <span className="font-medium">Chi tiêu</span>
            </button>
          </div>

          {/* Category Selection */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Danh mục
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`p-2 rounded-lg text-sm transition-all ${
                    category === cat
                      ? type === 'income'
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-red-500 text-white shadow-md'
                      : 'bg-white dark:bg-[#1e1e1e] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                  }`}
                >
                  {category === cat && <Check className="w-4 h-4 inline mr-1" />}
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Số tiền
            </label>
            <div className="relative">
              <Input
                type="text"
                value={amount}
                onChange={(e) => setAmount(formatCurrency(e.target.value))}
                placeholder="0"
                className="text-right text-lg font-semibold pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                ₫
              </span>
            </div>
            {amount && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                {formatAmountText(parseCurrency(amount))}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleQuickAdd}
            disabled={isSubmitting || !category || !amount}
            variant={type === 'income' ? 'success' : 'danger'}
            className="w-full"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang xử lý...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Thêm {type === 'income' ? 'thu nhập' : 'chi tiêu'}
              </span>
            )}
          </Button>

          {error && (
            <Alert className="mt-3">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </Alert>
          )}

          {success && (
            <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span className="text-sm">{success}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)}>
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Quản lý danh mục
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Selector */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setEditingType('expense')}
                className={`p-2 rounded-lg text-sm ${
                  editingType === 'expense'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-[#2a2a2a]'
                }`}
              >
                Chi tiêu
              </button>
              <button
                onClick={() => setEditingType('income')}
                className={`p-2 rounded-lg text-sm ${
                  editingType === 'income'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-[#2a2a2a]'
                }`}
              >
                Thu nhập
              </button>
            </div>

            {/* Add New Category */}
            <div className="flex gap-2 mb-4">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Tên danh mục mới"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <Button onClick={handleAddCategory} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Category List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(editingType === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg"
                >
                  <span className="text-sm">{cat}</span>
                  <button
                    onClick={() => handleRemoveCategory(cat)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
