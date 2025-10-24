'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    // Validate
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đăng ký thất bại');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 mb-4">
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Đăng ký tài khoản
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Tạo tài khoản mới để bắt đầu quản lý tài chính
        </p>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />
      )}

      {success && (
        <Alert
          type="success"
          message="Đăng ký thành công! Đang chuyển đến trang đăng nhập..."
          className="mb-6"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          type="text"
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          icon={<User size={20} />}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={isLoading}
        />

        <Input
          type="email"
          label="Email"
          placeholder="your@email.com"
          icon={<Mail size={20} />}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={isLoading}
        />

        <Input
          type="password"
          label="Mật khẩu"
          placeholder="••••••••"
          icon={<Lock size={20} />}
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
          disabled={isLoading}
          helperText="Tối thiểu 6 ký tự"
        />

        <Input
          type="password"
          label="Xác nhận mật khẩu"
          placeholder="••••••••"
          icon={<Lock size={20} />}
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          required
          disabled={isLoading}
        />

        <div className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            required
            className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="text-gray-700 dark:text-gray-300">
            Tôi đồng ý với{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-700">
              Điều khoản dịch vụ
            </Link>{' '}
            và{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
              Chính sách bảo mật
            </Link>
          </label>
        </div>

        <Button
          type="submit"
          variant="success"
          fullWidth
          size="lg"
          isLoading={isLoading}
          disabled={isLoading || success}
        >
          {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Đã có tài khoản?{' '}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
