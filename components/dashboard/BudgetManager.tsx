'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Loading } from '@/components/ui/Loading';
import { Plus, Trash2, AlertTriangle, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';

interface Budget {
  _id: string;
  category: string;
  limit: number;
  spent: number;
  percentage: number;
  month: number;
  year: number;
}

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

export function BudgetManager() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [formData, setFormData] = useState({
    category: '',
    limit: '',
  });

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  const fetchBudgets = async () => {
    try {
      const response = await fetch(
        `/api/budget?month=${selectedMonth}&year=${selectedYear}`
      );
      const data = await response.json();
      
      if (data.budgets) {
        setBudgets(data.budgets);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
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
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          month: selectedMonth,
          year: selectedYear,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      setSuccess('Thiết lập ngân sách thành công!');
      setIsModalOpen(false);
      fetchBudgets();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa ngân sách này?')) return;

    try {
      const response = await fetch(`/api/budget?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Không thể xóa ngân sách');
      }

      setSuccess('Xóa ngân sách thành công!');
      fetchBudgets();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      limit: '',
    });
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-600';
    if (percentage >= 80) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 100) {
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
    if (percentage >= 80) {
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
    return <TrendingUp className="w-5 h-5 text-green-600" />;
  };

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Tháng ${i + 1}`,
  }));

  const years = Array.from({ length: 5 }, (_, i) => ({
    value: (currentDate.getFullYear() - 2 + i).toString(),
    label: (currentDate.getFullYear() - 2 + i).toString(),
  }));

  if (isLoading) {
    return <Loading fullScreen text="Đang tải ngân sách..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Quản lý ngân sách
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Thiết lập và theo dõi ngân sách chi tiêu
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="success">
          <Plus size={20} className="mr-2" />
          Thêm ngân sách
        </Button>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Month/Year Selector */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tháng"
              value={selectedMonth.toString()}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              options={months}
            />
            <Select
              label="Năm"
              value={selectedYear.toString()}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              options={years}
            />
          </div>
        </CardContent>
      </Card>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget) => (
          <Card key={budget._id} hover>
            <CardContent>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    {getStatusIcon(budget.percentage)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {budget.category}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {budget.percentage.toFixed(0)}% đã sử dụng
                    </p>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(budget._id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={clsx(
                      'h-3 rounded-full transition-all duration-300',
                      getProgressColor(budget.percentage)
                    )}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Amount Info */}
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Đã chi</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {budget.spent.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 dark:text-gray-400">Hạn mức</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {budget.limit.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
              </div>

              {/* Warning */}
              {budget.percentage >= 80 && (
                <Alert
                  type={budget.percentage >= 100 ? 'error' : 'warning'}
                  message={
                    budget.percentage >= 100
                      ? 'Đã vượt ngân sách!'
                      : 'Sắp hết ngân sách!'
                  }
                  className="mt-4"
                />
              )}
            </CardContent>
          </Card>
        ))}

        {budgets.length === 0 && (
          <Card className="col-span-full">
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                  Chưa có ngân sách nào được thiết lập
                </p>
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus size={20} className="mr-2" />
                  Thêm ngân sách đầu tiên
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thiết lập ngân sách"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Danh mục"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: '', label: 'Chọn danh mục' },
              ...EXPENSE_CATEGORIES,
            ]}
            required
          />

          <Input
            type="number"
            label="Hạn mức (VNĐ)"
            placeholder="0"
            value={formData.limit}
            onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
            required
            min="0"
            step="10000"
          />

          <Alert
            type="info"
            message={`Ngân sách sẽ được áp dụng cho tháng ${selectedMonth}/${selectedYear}`}
          />

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="success"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Thiết lập
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
