'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Loading } from '@/components/ui/Loading';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
}

const INCOME_CATEGORIES = [
  { value: 'Lương', label: 'Lương' },
  { value: 'Thưởng', label: 'Thưởng' },
  { value: 'Đầu tư', label: 'Đầu tư' },
  { value: 'Kinh doanh', label: 'Kinh doanh' },
  { value: 'Khác', label: 'Khác' },
];

const EXPENSE_CATEGORIES = [
  { value: 'Ăn uống', label: 'Ăn uống' },
  { value: 'Di chuyển', label: 'Di chuyển' },
  { value: 'Mua sắm', label: 'Mua sắm' },
  { value: 'Giải trí', label: 'Giải trí' },
  { value: 'Học tập', label: 'Học tập' },
  { value: 'Y tế', label: 'Y tế' },
  { value: 'Nhà cửa', label: 'Nhà cửa' },
  { value: 'Khác', label: 'Khác' },
];

function formatInputToCurrency(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseCurrencyString(value: string) {
  if (!value) return 0;
  return parseFloat(value.replace(/\./g, '')) || 0;
}

function getAmountSuggestionsFrom(transactions: any[]) {
  // gather most frequent recent amounts (number)
  const amounts = transactions
    .map((t) => t.amount)
    .filter(Boolean)
    .slice(0, 50);

  const freq: Record<number, number> = {};
  amounts.forEach((a) => (freq[a] = (freq[a] || 0) + 1));

  const sorted = Object.keys(freq)
    .map((k) => parseFloat(k))
    .sort((a, b) => freq[b] - freq[a] || b - a)
    .slice(0, 5);

  // fallback presets
  const presets = [50000, 100000, 200000, 500000, 1000000];

  const combined = Array.from(new Set([...sorted, ...presets]));
  return combined.slice(0, 6);
}

export function TransactionManager() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Bulk delete state
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [bulkDeleteStart, setBulkDeleteStart] = useState('');
  const [bulkDeleteEnd, setBulkDeleteEnd] = useState('');
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    category: '',
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  // editable categories held locally and editable via modal
  const [incomeCategories, setIncomeCategories] = useState(INCOME_CATEGORIES);
  const [expenseCategories, setExpenseCategories] = useState(EXPENSE_CATEGORIES);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
    
    // Auto-refresh mỗi 10 giây để theo dõi thời gian thực
    const interval = setInterval(() => {
      fetchTransactions();
    }, 10000);
    
    // Lắng nghe sự kiện custom khi có giao dịch mới được thêm
    const handleTransactionAdded = () => {
      fetchTransactions();
    };
    
    window.addEventListener('transactionAdded', handleTransactionAdded);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('transactionAdded', handleTransactionAdded);
    };
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, filterType, sortBy, sortOrder]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      const data = await response.json();
      
      if (data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Không hiển thị lỗi khi auto-refresh để tránh làm phiền user
      if (!transactions.length) {
        setError('Không thể tải dữ liệu');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        // sortBy === 'amount'
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
    });

    setFilteredTransactions(filtered);
  };

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, sortBy, sortOrder]);

  const handleBulkDelete = async () => {
    if (!bulkDeleteStart || !bulkDeleteEnd) {
      setError('Vui lòng chọn khoảng thời gian');
      return;
    }

    const startDate = new Date(bulkDeleteStart);
    const endDate = new Date(bulkDeleteEnd);

    if (startDate > endDate) {
      setError('Ngày bắt đầu phải trước ngày kết thúc');
      return;
    }

    const transactionsToDelete = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    });

    if (transactionsToDelete.length === 0) {
      setError('Không có giao dịch nào trong khoảng thời gian này');
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa ${transactionsToDelete.length} giao dịch từ ${format(startDate, 'dd/MM/yyyy')} đến ${format(endDate, 'dd/MM/yyyy')}?`)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      // Delete each transaction
      await Promise.all(
        transactionsToDelete.map((t) =>
          fetch(`/api/transactions?id=${t._id}`, { method: 'DELETE' })
        )
      );

      setSuccess(`Đã xóa ${transactionsToDelete.length} giao dịch thành công!`);
      fetchTransactions();
      window.dispatchEvent(new Event('transactionAdded'));
      setShowBulkDelete(false);
      setBulkDeleteStart('');
      setBulkDeleteEnd('');
    } catch (err: any) {
      setError(err.message || 'Không thể xóa giao dịch');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // parse amount to number
      const amountNumber = parseCurrencyString(formData.amount);

      const payload = {
        ...formData,
        amount: amountNumber,
      };

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      setSuccess('Thêm giao dịch thành công!');
      // refresh list and reset form
      await fetchTransactions();
      
      // Dispatch event để các component khác cập nhật
      window.dispatchEvent(new Event('transactionAdded'));
      
      resetForm();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa giao dịch này?')) return;

    try {
      const response = await fetch(`/api/transactions?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Không thể xóa giao dịch');
      }

      setSuccess('Xóa giao dịch thành công!');
      fetchTransactions();
      
      // Dispatch event để các component khác cập nhật
      window.dispatchEvent(new Event('transactionAdded'));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      category: '',
      amount: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

  if (isLoading) {
    return <Loading fullScreen text="Đang tải giao dịch..." />;
  }

  return (
    <div className="space-y-6 relative">
      {/* Animated Background Gradient Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-4 w-96 h-96 bg-green-300 dark:bg-green-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-20 -right-4 w-96 h-96 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-20 w-96 h-96 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header with Glassmorphism */}
      <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl p-8 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 rounded-3xl"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="relative">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <div className="w-12 h-12 backdrop-blur-sm bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
              <TrendingUp className="w-7 h-7 text-white drop-shadow-lg" />
            </div>
            💳 Quản lý giao dịch
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Theo dõi và quản lý các giao dịch thu nhập & chi tiêu của bạn
          </p>
          
          {/* Quick Stats */}
          {transactions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="backdrop-blur-md bg-green-500/20 dark:bg-green-600/30 rounded-2xl p-4 border border-white/30 dark:border-green-500/30 shadow-lg hover:scale-105 transition-transform duration-300">
                <p className="text-green-700 dark:text-green-300 text-sm mb-1 font-semibold">📊 Tổng giao dịch</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{transactions.length}</p>
              </div>
              <div className="backdrop-blur-md bg-blue-500/20 dark:bg-blue-600/30 rounded-2xl p-4 border border-white/30 dark:border-blue-500/30 shadow-lg hover:scale-105 transition-transform duration-300">
                <p className="text-blue-700 dark:text-blue-300 text-sm mb-1 font-semibold">💰 Thu nhập</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}₫
                </p>
              </div>
              <div className="backdrop-blur-md bg-purple-500/20 dark:bg-purple-600/30 rounded-2xl p-4 border border-white/30 dark:border-purple-500/30 shadow-lg hover:scale-105 transition-transform duration-300">
                <p className="text-purple-700 dark:text-purple-300 text-sm mb-1 font-semibold">💸 Chi tiêu</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}₫
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Inline Add Transaction Form (always visible) */}
      <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="relative p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector */}
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                Loại giao dịch
              </label>
              <div className="inline-flex rounded-2xl bg-white dark:bg-[#1e1e1e] p-1.5 shadow-lg border border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    formData.type === 'income'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                  }`}
                >
                  <TrendingUp size={18} />
                  Thu nhập
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    formData.type === 'expense'
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg scale-105'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                  }`}
                >
                  <TrendingDown size={18} />
                  Chi tiêu
                </button>
              </div>
            </div>

            {/* Category chips + manage button */}
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                Danh mục
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: c.value })}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      formData.category === c.value
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                        : 'bg-white dark:bg-[#1e1e1e] text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-800 hover:border-blue-400 hover:shadow-md'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsCategoryManagerOpen(true)}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 transition-all"
                >
                  ✏️ Chỉnh sửa
                </button>
              </div>
            </div>

            {/* Amount, description, date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  Số tiền (VNĐ)
                </label>
                <div className="relative">
                  <Input
                    placeholder="0"
                    value={formData.amount}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const formatted = formatInputToCurrency(raw);
                      setFormData({ ...formData, amount: formatted });
                    }}
                    className="text-lg font-bold pr-12 border-2"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                    ₫
                  </span>
                </div>
                {/* Suggestions */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {getAmountSuggestionsFrom(transactions).slice(0, 4).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFormData({ ...formData, amount: amt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') })}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 hover:shadow transition"
                    >
                      {amt.toLocaleString('vi-VN')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  Mô tả (tùy chọn)
                </label>
                <Input
                  placeholder="Nhập mô tả..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="border-2"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  Ngày giao dịch
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="border-2"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              isLoading={isSubmitting}
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Plus size={20} className="mr-2" />
              Thêm giao dịch
            </Button>
          </form>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5"></div>
        <div className="relative p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input 
                placeholder="Tìm kiếm giao dịch..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10 border-2" 
              />
            </div>
            
            <Select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value as any)} 
              options={[
                { value: 'all', label: '📊 Tất cả' }, 
                { value: 'income', label: '💰 Thu nhập' }, 
                { value: 'expense', label: '💸 Chi tiêu' }
              ]}
              className="border-2"
            />

            {/* Sort by Date */}
            <button
              onClick={() => toggleSort('date')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-[#1e1e1e] border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            >
              <Calendar size={18} />
              <span className="font-medium">Ngày</span>
              {sortBy === 'date' && (
                sortOrder === 'asc' ? <ArrowUp size={16} className="text-blue-600" /> : <ArrowDown size={16} className="text-blue-600" />
              )}
            </button>

            {/* Sort by Amount */}
            <button
              onClick={() => toggleSort('amount')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-[#1e1e1e] border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            >
              <span className="font-bold">₫</span>
              <span className="font-medium">Số tiền</span>
              {sortBy === 'amount' && (
                sortOrder === 'asc' ? <ArrowUp size={16} className="text-blue-600" /> : <ArrowDown size={16} className="text-blue-600" />
              )}
            </button>
          </div>
          
          <div className="flex items-center gap-2 mt-3 text-sm text-gray-700 dark:text-gray-300">
            <Filter size={18} />
            <span className="font-medium">{filteredTransactions.length} giao dịch</span>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="relative p-6">
          <div className="space-y-3">
            {paginatedTransactions.map((transaction) => (
              <div 
                key={transaction._id} 
                className="group relative flex items-center justify-between p-5 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110 ${
                    transaction.type === 'income' 
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                      : 'bg-gradient-to-br from-red-400 to-pink-500'
                  }`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="w-7 h-7 text-white" />
                    ) : (
                      <TrendingDown className="w-7 h-7 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">{transaction.category}</h4>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '💰 Thu nhập' : '💸 Chi tiêu'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {transaction.description || 'Không có mô tả'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={14} />
                      {format(new Date(transaction.date), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${
                      transaction.type === 'income' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleDelete(transaction._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredTransactions.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Không tìm thấy giao dịch nào</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Thử thay đổi bộ lọc hoặc thêm giao dịch mới</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {filteredTransactions.length > 0 && (
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Hiển thị:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: '5', label: '5 giao dịch' },
                    { value: '10', label: '10 giao dịch' },
                    { value: '20', label: '20 giao dịch' },
                    { value: '50', label: '50 giao dịch' },
                  ]}
                  className="w-auto"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} / {filteredTransactions.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first, last, current, and adjacent pages
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, idx, arr) => {
                      // Add ellipsis
                      const prevPage = arr[idx - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;

                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsis && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                              currentPage === page
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333333]'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Delete Section */}
      <div className="relative backdrop-blur-xl bg-red-500/10 dark:bg-red-600/20 border border-red-300/30 dark:border-red-500/30 rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent"></div>
        <div className="relative p-6">
          <button
            onClick={() => setShowBulkDelete(!showBulkDelete)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Xóa nhiều giao dịch
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Xóa tất cả giao dịch trong khoảng thời gian
                </p>
              </div>
            </div>
            <ChevronDown
              size={20}
              className={`transition-transform ${showBulkDelete ? 'rotate-180' : ''}`}
            />
          </button>

          {showBulkDelete && (
            <div className="mt-4 space-y-4 pt-4 border-t border-red-200 dark:border-red-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Từ ngày
                  </label>
                  <Input
                    type="date"
                    value={bulkDeleteStart}
                    onChange={(e) => setBulkDeleteStart(e.target.value)}
                    className="border-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Đến ngày
                  </label>
                  <Input
                    type="date"
                    value={bulkDeleteEnd}
                    onChange={(e) => setBulkDeleteEnd(e.target.value)}
                    className="border-2"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={handleBulkDelete}
                  isLoading={isBulkDeleting}
                  className="flex-1"
                >
                  <Trash2 size={18} className="mr-2" />
                  Xóa giao dịch trong khoảng này
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowBulkDelete(false);
                    setBulkDeleteStart('');
                    setBulkDeleteEnd('');
                  }}
                >
                  Hủy
                </Button>
              </div>

              {bulkDeleteStart && bulkDeleteEnd && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sẽ xóa {transactions.filter((t) => {
                    const tDate = new Date(t.date);
                    return tDate >= new Date(bulkDeleteStart) && tDate <= new Date(bulkDeleteEnd);
                  }).length} giao dịch
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category Manager Modal */}
      <Modal isOpen={isCategoryManagerOpen} onClose={() => setIsCategoryManagerOpen(false)} title="Quản lý danh mục" size="md">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium">Thu nhập</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {incomeCategories.map((c) => (
                <div key={c.value} className="flex items-center gap-2 bg-white dark:bg-[#1e1e1e] border px-2 py-1 rounded-md">
                  <span className="text-sm">{c.label}</span>
                  <button className="text-xs text-red-500" onClick={() => setIncomeCategories((prev) => prev.filter((x) => x.value !== c.value))}>Xóa</button>
                </div>
              ))}
            </div>
            <AddCategoryInput onAdd={(v) => setIncomeCategories((prev) => [{ value: v, label: v }, ...prev])} />
          </div>

          <div>
            <h4 className="font-medium">Chi tiêu</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {expenseCategories.map((c) => (
                <div key={c.value} className="flex items-center gap-2 bg-white dark:bg-[#1e1e1e] border px-2 py-1 rounded-md">
                  <span className="text-sm">{c.label}</span>
                  <button className="text-xs text-red-500" onClick={() => setExpenseCategories((prev) => prev.filter((x) => x.value !== c.value))}>Xóa</button>
                </div>
              ))}
            </div>
            <AddCategoryInput onAdd={(v) => setExpenseCategories((prev) => [{ value: v, label: v }, ...prev])} />
          </div>
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsCategoryManagerOpen(false)}>Đóng</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// Small helper component inside file to add categories
function AddCategoryInput({ onAdd }: { onAdd: (v: string) => void }) {
  const [val, setVal] = useState('');
  return (
    <div className="mt-2 flex gap-2">
      <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Thêm danh mục mới" />
      <Button onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); } }}>Thêm</Button>
    </div>
  );
}
