'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Loading } from '@/components/ui/Loading';
import {
  Upload,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Eye,
  Save,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ParsedTransaction {
  date: string;
  sender: string;
  bank: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  // AI classified fields
  type?: 'income' | 'expense';
  category?: string;
  amount?: number;
  isValid?: boolean;
}

interface AIClassificationResult {
  transactions: ParsedTransaction[];
  summary: {
    total: number;
    income: number;
    expense: number;
    incomeCount: number;
    expenseCount: number;
  };
}

export function ImportBankStatement() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [classifiedData, setClassifiedData] = useState<AIClassificationResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'confirm'>('upload');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        setError('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const parseExcelFile = async () => {
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Get all data including headers
      const allData = jsonData.filter(row => row && row.length > 0);
      
      if (allData.length < 2) {
        throw new Error('File Excel không có dữ liệu hoặc chỉ có header');
      }

      // Send to AI to auto-detect format and parse
      const response = await fetch('/api/ai/parse-bank-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          data: allData.slice(0, 50), // Send first 50 rows for analysis
        }),
      });

      if (!response.ok) {
        let errorData: any = null;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          try {
            const fallbackText = await response.text();
            if (fallbackText) {
              errorData = { error: fallbackText };
            }
          } catch {
            // ignore secondary errors
          }
        }

        console.error('API Error:', errorData);
        const message =
          errorData?.details ||
          errorData?.suggestion ||
          errorData?.error ||
          errorData?.message ||
          'AI không thể phân tích file';
        throw new Error(message);
      }

      const result = await response.json();
      
      if (!result.success || !result.transactions || result.transactions.length === 0) {
        throw new Error('Không tìm thấy giao dịch nào trong file');
      }

      const transactions: ParsedTransaction[] = result.transactions;

      setParsedData(transactions);
      setStep('preview');
      
      // Auto classify with AI
      await classifyWithAI(transactions);
    } catch (err: any) {
      setError(`Lỗi đọc file: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const classifyWithAI = async (transactions: ParsedTransaction[]) => {
    setIsClassifying(true);
    setError('');

    try {
      const response = await fetch('/api/ai/classify-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ transactions }),
      });

      if (!response.ok) {
        let errorData: any = null;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          try {
            const fallbackText = await response.text();
            if (fallbackText) {
              errorData = { error: fallbackText };
            }
          } catch {
            // ignore secondary errors
          }
        }

        console.error('API classify error:', errorData);
        const message =
          errorData?.details ||
          errorData?.suggestion ||
          errorData?.error ||
          errorData?.message ||
          'Không thể phân loại giao dịch';
        throw new Error(message);
      }

      const result: AIClassificationResult = await response.json();
      setClassifiedData(result);
      setStep('confirm');
    } catch (err: any) {
      setError(`Lỗi phân loại AI: ${err.message}`);
    } finally {
      setIsClassifying(false);
    }
  };

  const handleImport = async () => {
    if (!classifiedData) return;

    setIsImporting(true);
    setError('');

    try {
      const response = await fetch('/api/transactions/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: classifiedData.transactions,
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể import giao dịch');
      }

      const result = await response.json();
      setSuccess(`✅ Import thành công ${result.imported} giao dịch!`);
      
      // Reset after 3 seconds
      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (err: any) {
      setError(`Lỗi import: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setParsedData([]);
    setClassifiedData(null);
    setStep('upload');
    setError('');
    setSuccess('');
  };

  return (
    <div className="space-y-6 relative">
      {/* Animated gradient background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl animate-blob"></div>
      <div className="absolute top-40 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-40 left-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

      {/* Header */}
      <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5"></div>
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400/20 to-blue-400/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                  <FileSpreadsheet className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                Import sao kê ngân hàng
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                AI tự động phân loại giao dịch từ file Excel
              </p>
            </div>
            {step !== 'upload' && (
              <Button
                onClick={resetForm}
                variant="secondary"
                className="bg-gray-500/10 hover:bg-gray-500/20"
              >
                Tải file khác
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="relative z-10">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5"></div>
          <div className="relative p-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Upload size={48} className="text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Tải lên file sao kê
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                AI sẽ tự động nhận diện và phân loại giao dịch từ bất kỳ định dạng sao kê nào
              </p>

              <label className="cursor-pointer inline-block">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 inline-flex items-center gap-2">
                  <Upload size={20} />
                  Chọn file Excel
                </div>
              </label>

              {file && (
                <div className="mt-6 p-4 bg-green-100/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl inline-block">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="text-green-600 dark:text-green-400" size={24} />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={parseExcelFile}
                    isLoading={isUploading}
                    className="mt-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white w-full"
                  >
                    <Sparkles size={20} className="mr-2" />
                    Phân tích với AI
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && (
        <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <Eye className="inline mr-2" size={28} />
                AI đang phân tích...
              </h2>
              <div className="bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-xl">
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  Đã phát hiện {parsedData.length} giao dịch
                </span>
              </div>
            </div>

            {isClassifying && (
              <div className="text-center py-12">
                <Loading size="lg" />
                <p className="text-gray-600 dark:text-gray-400 mt-4 font-semibold">
                  🤖 AI đang phân tích sâu từng giao dịch...
                </p>
                <p className="text-gray-500 dark:text-gray-500 mt-2 text-sm">
                  Tự động nhận diện loại giao dịch và phân loại danh mục
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && classifiedData && (
        <>
          {/* Summary Stats */}
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="text-blue-600 dark:text-blue-400" size={20} />
                <span className="text-sm text-gray-600 dark:text-gray-400">Tổng giao dịch</span>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {classifiedData.summary.total}
              </p>
            </div>

            <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-white/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
                <span className="text-sm text-gray-600 dark:text-gray-400">Thu nhập</span>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {classifiedData.summary.incomeCount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {classifiedData.summary.income.toLocaleString('vi-VN')} ₫
              </p>
            </div>

            <div className="backdrop-blur-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-white/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="text-red-600 dark:text-red-400" size={20} />
                <span className="text-sm text-gray-600 dark:text-gray-400">Chi tiêu</span>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                {classifiedData.summary.expenseCount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {classifiedData.summary.expense.toLocaleString('vi-VN')} ₫
              </p>
            </div>

            <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-purple-600 dark:text-purple-400" size={20} />
                <span className="text-sm text-gray-600 dark:text-gray-400">Chênh lệch</span>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {(classifiedData.summary.income - classifiedData.summary.expense).toLocaleString('vi-VN')} ₫
              </p>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
            <div className="relative p-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                Xem trước giao dịch
              </h2>

              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-xl">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Ngày</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Loại</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Danh mục</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Mô tả</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Số tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classifiedData.transactions.map((tx, index) => (
                      <tr key={index} className="border-t border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {new Date(tx.date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-4 py-3">
                          {tx.type === 'income' ? (
                            <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg text-xs font-semibold">
                              <TrendingUp size={14} />
                              Thu nhập
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-lg text-xs font-semibold">
                              <TrendingDown size={14} />
                              Chi tiêu
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {tx.category}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          {tx.sender && `${tx.sender} - `}{tx.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">
                          <span className={tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {tx.type === 'income' ? '+' : '-'}{tx.amount?.toLocaleString('vi-VN')} ₫
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <Button
                  onClick={resetForm}
                  variant="secondary"
                  className="bg-gray-500/10 hover:bg-gray-500/20"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleImport}
                  isLoading={isImporting}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                >
                  <Save size={20} className="mr-2" />
                  Import {classifiedData.summary.total} giao dịch
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
