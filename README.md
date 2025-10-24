# 💰 FinanceApp - Ứng dụng Quản lý Tài chính Cá nhân

Ứng dụng quản lý tài chính hiện đại, thông minh và dễ sử dụng, được xây dựng với Next.js 15, TypeScript, MongoDB và NextAuth.

## ✨ Tính năng chính

### 🔐 Bảo mật & Xác thực
- ✅ Đăng ký/Đăng nhập với email & password
- ✅ Mã hóa mật khẩu với bcrypt
- ✅ Session management với JWT
- ✅ Protected routes với middleware
- ✅ Bảo mật API endpoints

### 📊 Dashboard & Tổng quan
- ✅ Thống kê tổng thu nhập, chi tiêu, số dư
- ✅ Biểu đồ phân tích trực quan (Line, Bar, Pie charts)
- ✅ Giao dịch gần đây
- ✅ Responsive trên mọi thiết bị

### 💸 Quản lý Giao dịch
- ✅ Thêm/Xóa giao dịch (Thu nhập & Chi tiêu)
- ✅ Phân loại theo danh mục
- ✅ Tìm kiếm và lọc nâng cao
- ✅ Ghi chú mô tả chi tiết

### 🎯 Quản lý Ngân sách
- ✅ Thiết lập hạn mức chi tiêu theo danh mục
- ✅ Theo dõi % sử dụng ngân sách
- ✅ Cảnh báo khi sắp vượt/vượt ngân sách
- ✅ Tự động tính toán chi tiêu thực tế

### 📈 Báo cáo & Phân tích
- ✅ Biểu đồ xu hướng theo tháng
- ✅ Phân tích chi tiêu theo danh mục
- ✅ So sánh thu nhập vs chi tiêu
- ✅ Tỷ lệ tiết kiệm

## 🚀 Công nghệ sử dụng

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB với Mongoose
- **Authentication**: NextAuth v4
- **UI**: TailwindCSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date**: date-fns

## 📦 Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env.local`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finance-app
AUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Chạy development server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## 🎯 Hướng dẫn sử dụng

1. **Đăng ký/Đăng nhập** - Tạo tài khoản hoặc đăng nhập
2. **Dashboard** - Xem tổng quan tài chính
3. **Giao dịch** - Quản lý thu chi hàng ngày
4. **Ngân sách** - Thiết lập và theo dõi ngân sách
5. **Báo cáo** - Phân tích chi tiết tài chính

## 🔒 Bảo mật

- ✅ Mật khẩu được hash với bcrypt
- ✅ JWT tokens với expiry time
- ✅ Protected API routes
- ✅ Server-side validation

## 📝 License

MIT License

---

**Happy Coding! 🚀**
