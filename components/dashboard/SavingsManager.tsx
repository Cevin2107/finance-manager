'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Loading } from '@/components/ui/Loading';
import {
  Plus,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Trash2,
  Edit,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface Saving {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  description: string;
  color: string;
  savingType: 'accumulative' | 'long-term';
  hasDeposited: boolean;
}

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export function SavingsManager() {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    description: '',
    color: COLORS[0],
    savingType: 'accumulative' as 'accumulative' | 'long-term',
  });

  const [transactionData, setTransactionData] = useState({
    amount: '',
    type: 'deposit' as 'deposit' | 'withdraw',
  });

  useEffect(() => {
    fetchSavings();
  }, []);

  const fetchSavings = async () => {
    try {
      const response = await fetch('/api/savings');
      const data = await response.json();
      
      if (data.savings) {
        setSavings(data.savings);
      }
    } catch (error) {
      console.error('Error fetching savings:', error);
      setError('Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount.replace(/\./g, '')),
      };

      const response = await fetch('/api/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      setSuccess('Tạo mục tiêu tiết kiệm thành công!');
      await fetchSavings();
      resetForm();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaving) return;

    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        amount: parseFloat(transactionData.amount.replace(/\./g, '')),
        type: transactionData.type,
      };

      const response = await fetch(`/api/savings?id=${selectedSaving._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      setSuccess(data.message);
      await fetchSavings();
      setIsTransactionModalOpen(false);
      setTransactionData({ amount: '', type: 'deposit' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa mục tiêu này?')) return;

    try {
      const response = await fetch(`/api/savings?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Không thể xóa mục tiêu');
      }

      setSuccess('Xóa mục tiêu thành công!');
      fetchSavings();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      targetAmount: '',
      targetDate: '',
      description: '',
      color: COLORS[0],
      savingType: 'accumulative',
    });
  };

  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const getProgress = (saving: Saving) => {
    return Math.min((saving.currentAmount / saving.targetAmount) * 100, 100);
  };

  const getDaysLeft = (targetDate: string) => {
    return differenceInDays(new Date(targetDate), new Date());
  };

  if (isLoading) {
    return <Loading fullScreen text="Đang tải mục tiêu tiết kiệm..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <PiggyBank className="w-7 h-7 text-white" />
              </div>
              Mục tiêu tiết kiệm
            </h1>
            <p className="text-blue-100 text-lg">
              Quản lý và theo dõi các mục tiêu tài chính của bạn
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="bg-white hover:bg-gray-100 text-blue-600 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            <Plus size={20} className="mr-2" />
            Tạo mục tiêu mới
          </Button>
        </div>

        {/* Summary Stats */}
        {savings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <p className="text-blue-100 text-sm mb-1">Tổng mục tiêu</p>
              <p className="text-3xl font-bold text-white">{savings.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <p className="text-blue-100 text-sm mb-1">Tổng đã tiết kiệm</p>
              <p className="text-3xl font-bold text-white">
                {savings.reduce((sum, s) => sum + s.currentAmount, 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}₫
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <p className="text-blue-100 text-sm mb-1">Tổng mục tiêu</p>
              <p className="text-3xl font-bold text-white">
                {savings.reduce((sum, s) => sum + s.targetAmount, 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}₫
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Savings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savings.map((saving) => {
          const progress = getProgress(saving);
          const daysLeft = getDaysLeft(saving.targetDate);
          const isOverdue = daysLeft < 0;
          const isCompleted = progress >= 100;

          return (
            <Card key={saving._id} className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-0 rounded-3xl">
              {/* Gradient Header */}
              <div
                className="h-32 relative rounded-t-3xl"
                style={{
                  background: `linear-gradient(135deg, ${saving.color}dd, ${saving.color})`
                }}
              >
                <div className="absolute inset-0 bg-grid-white/10"></div>
                
                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(saving._id)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <Trash2 size={16} className="text-white" />
                </button>

                {/* Icon and Name */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl">
                      <PiggyBank size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-white mb-1 truncate">
                        {saving.name}
                      </h3>
                      {saving.description && (
                        <p className="text-xs text-white/80 truncate">
                          {saving.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Saving Type Badge */}
                <div className="absolute top-3 left-3">
                  {saving.savingType === 'long-term' ? (
                    <div className="bg-purple-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                      🔒 Dài hạn
                    </div>
                  ) : (
                    <div className="bg-blue-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                      💎 Tích lũy
                    </div>
                  )}
                </div>

                {/* Completion Badge */}
                {isCompleted && (
                  <div className="absolute top-12 left-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Target size={12} />
                    Hoàn thành!
                  </div>
                )}
              </div>

              <CardContent className="pt-6">
                {/* Progress Section */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Tiến độ
                    </span>
                    <span className="text-2xl font-bold" style={{ color: saving.color }}>
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full"
                      style={{
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, ${saving.color}dd, ${saving.color})`
                      }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Amount Info Cards */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      💰 Hiện tại
                    </span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {saving.currentAmount.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      🎯 Mục tiêu
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {saving.targetAmount.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      📊 Còn thiếu
                    </span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {Math.max(0, saving.targetAmount - saving.currentAmount).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>

                {/* Date Badge */}
                <div className={`flex items-center justify-center gap-2 p-3 rounded-xl mb-4 ${
                  isOverdue 
                    ? 'bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : isCompleted
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                    : 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                }`}>
                  <Calendar size={18} />
                  <span className="text-sm font-bold">
                    {isOverdue ? '⚠️ Quá hạn' : isCompleted ? '✅ Đã hoàn thành' : `⏰ Còn ${daysLeft} ngày`}
                  </span>
                  <span className="text-xs opacity-70">
                    • {format(new Date(saving.targetDate), 'dd/MM/yyyy')}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedSaving(saving);
                      setTransactionData({ amount: '', type: 'deposit' });
                      setIsTransactionModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
                    disabled={saving.savingType === 'long-term' && saving.hasDeposited}
                    title={saving.savingType === 'long-term' && saving.hasDeposited ? 'Tiết kiệm dài hạn chỉ được nạp 1 lần' : ''}
                  >
                    <TrendingUp size={18} className="mr-1" />
                    {saving.savingType === 'long-term' && saving.hasDeposited ? 'Đã nạp' : 'Nạp tiền'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedSaving(saving);
                      setTransactionData({ amount: '', type: 'withdraw' });
                      setIsTransactionModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
                    disabled={
                      saving.currentAmount === 0 || 
                      (saving.savingType === 'long-term' && getDaysLeft(saving.targetDate) > 0)
                    }
                    title={
                      saving.currentAmount === 0 
                        ? 'Không có tiền để rút' 
                        : saving.savingType === 'long-term' && getDaysLeft(saving.targetDate) > 0
                        ? 'Tiết kiệm dài hạn chỉ được rút khi đến hạn'
                        : ''
                    }
                  >
                    <TrendingDown size={18} className="mr-1" />
                    Rút tiền
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {savings.length === 0 && (
          <div className="col-span-full">
            <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-600">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <PiggyBank size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Chưa có mục tiêu tiết kiệm
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Tạo mục tiêu đầu tiên để bắt đầu hành trình tiết kiệm!
              </p>
              <Button
                variant="primary"
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-bold shadow-xl"
              >
                <Plus size={20} className="mr-2" />
                Tạo mục tiêu ngay
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Saving Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tạo mục tiêu tiết kiệm mới"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Tên mục tiêu
            </label>
            <Input
              placeholder="Ví dụ: Mua xe, Du lịch Nhật..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Loại tiết kiệm
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, savingType: 'accumulative' })}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                  formData.savingType === 'accumulative'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                <div className="text-3xl mb-2">💎</div>
                <div className="font-bold text-gray-900 dark:text-gray-100 mb-1">Tích lũy</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Có thể nạp và rút nhiều lần
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, savingType: 'long-term' })}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                  formData.savingType === 'long-term'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                <div className="text-3xl mb-2">🔒</div>
                <div className="font-bold text-gray-900 dark:text-gray-100 mb-1">Dài hạn</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Nạp 1 lần, rút khi đến hạn
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Số tiền mục tiêu (VNĐ)
            </label>
            <Input
              placeholder="0"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: formatCurrency(e.target.value) })}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Ngày đến mục tiêu
            </label>
            <Input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Mô tả (tùy chọn)
            </label>
            <Input
              placeholder="Ghi chú về mục tiêu..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Màu sắc
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg transition-transform ${
                    formData.color === color ? 'scale-110 ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Tạo mục tiêu
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Transaction Modal */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title={transactionData.type === 'deposit' ? 'Nạp tiền' : 'Rút tiền'}
        size="sm"
      >
        <form onSubmit={handleTransaction} className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Mục tiêu
            </p>
            <p className="font-bold text-gray-900 dark:text-gray-100">
              {selectedSaving?.name}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {selectedSaving?.savingType === 'long-term' ? (
                <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold px-2 py-1 rounded-full">
                  🔒 Dài hạn
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2 py-1 rounded-full">
                  💎 Tích lũy
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Số dư hiện tại: {selectedSaving?.currentAmount.toLocaleString('vi-VN')} ₫
            </p>
          </div>

          {/* Show warning for long-term savings */}
          {selectedSaving?.savingType === 'long-term' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                ⚠️ {transactionData.type === 'deposit' 
                  ? 'Lưu ý: Tiết kiệm dài hạn chỉ được nạp 1 lần duy nhất' 
                  : `Lưu ý: Chỉ được rút khi đến hạn (${selectedSaving?.targetDate ? new Date(selectedSaving.targetDate).toLocaleDateString('vi-VN') : ''})`
                }
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Số tiền (VNĐ)
            </label>
            <Input
              placeholder="0"
              value={transactionData.amount}
              onChange={(e) => setTransactionData({ ...transactionData, amount: formatCurrency(e.target.value) })}
              required
            />
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsTransactionModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant={transactionData.type === 'deposit' ? 'primary' : 'danger'}
              isLoading={isSubmitting}
            >
              {transactionData.type === 'deposit' ? 'Nạp tiền' : 'Rút tiền'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
