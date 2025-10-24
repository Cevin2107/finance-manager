# 🚀 HƯỚNG DẪN CHẠY DỰ ÁN

## Bước 1: Chuẩn bị MongoDB

### Option 1: MongoDB Atlas (Cloud - Khuyên dùng)
1. Truy cập [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Đăng ký/Đăng nhập tài khoản
3. Tạo cluster mới (Free tier)
4. Tạo Database User (username + password)
5. Whitelist IP: 0.0.0.0/0 (cho phép mọi IP)
6. Get Connection String:
   - Click "Connect" > "Connect your application"
   - Copy connection string
   - Format: `mongodb+srv://<username>:<password>@cluster.mongodb.net/finance-app`

### Option 2: MongoDB Local
1. Tải MongoDB Community Server
2. Cài đặt và chạy
3. Connection string: `mongodb://localhost:27017/finance-app`

## Bước 2: Setup Environment Variables

1. Copy file `.env.example` thành `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Mở `.env.local` và cập nhật:
   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/finance-app
   AUTH_SECRET=run-this-command-openssl-rand-base64-32
   NEXTAUTH_URL=http://localhost:3000
   ```

3. Tạo AUTH_SECRET (Windows PowerShell):
   ```powershell
   # Option 1: Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   
   # Option 2: Online
   # Truy cập: https://generate-secret.vercel.app/32
   ```

## Bước 3: Cài đặt Dependencies

```bash
npm install
```

## Bước 4: Chạy Development Server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: http://localhost:3000

## Bước 5: Test Application

1. Mở trình duyệt: http://localhost:3000
2. Click "Đăng ký" để tạo tài khoản mới
3. Đăng nhập với tài khoản vừa tạo
4. Bắt đầu sử dụng!

## 📋 Các Tính Năng Cần Test

### ✅ Authentication
- [ ] Đăng ký tài khoản mới
- [ ] Đăng nhập
- [ ] Đăng xuất
- [ ] Protected routes (thử truy cập /dashboard khi chưa đăng nhập)

### ✅ Transactions
- [ ] Thêm giao dịch thu nhập
- [ ] Thêm giao dịch chi tiêu
- [ ] Xem danh sách giao dịch
- [ ] Lọc giao dịch (theo loại)
- [ ] Tìm kiếm giao dịch
- [ ] Xóa giao dịch

### ✅ Budget
- [ ] Tạo ngân sách mới
- [ ] Xem progress bar ngân sách
- [ ] Nhận cảnh báo khi vượt 80%
- [ ] Nhận cảnh báo khi vượt 100%
- [ ] Xóa ngân sách

### ✅ Reports
- [ ] Xem biểu đồ thu nhập vs chi tiêu
- [ ] Xem biểu đồ phân bổ chi tiêu
- [ ] Xem xu hướng số dư
- [ ] Thay đổi khoảng thời gian (3/6/12 tháng)

### ✅ Dashboard
- [ ] Xem thống kê tổng quan
- [ ] Xem 5 giao dịch gần nhất
- [ ] Kiểm tra số liệu real-time

### ✅ UI/UX
- [ ] Dark mode (nếu hệ thống hỗ trợ)
- [ ] Responsive mobile
- [ ] Responsive tablet
- [ ] Animations mượt mà

## 🐛 Troubleshooting

### Lỗi kết nối MongoDB
```
Error: Could not connect to MongoDB
```
**Giải pháp:**
- Kiểm tra MONGODB_URI trong .env.local
- Kiểm tra username/password
- Kiểm tra IP whitelist trên MongoDB Atlas
- Kiểm tra internet connection

### Lỗi AUTH_SECRET
```
Error: AUTH_SECRET is not set
```
**Giải pháp:**
- Tạo AUTH_SECRET mới
- Đảm bảo file .env.local tồn tại
- Restart development server

### Port 3000 đã được sử dụng
```
Error: Port 3000 is already in use
```
**Giải pháp:**
- Kill process: `npx kill-port 3000`
- Hoặc dùng port khác: `npm run dev -- -p 3001`

### Dependencies errors
```
Error: Cannot find module...
```
**Giải pháp:**
- Xóa node_modules: `rm -rf node_modules`
- Xóa package-lock.json
- Cài lại: `npm install`

## 📱 Build Production

```bash
# Build
npm run build

# Run production server
npm run start
```

## 🎨 Các Màn Hình Chính

1. **Landing Page** (`/`) - Trang giới thiệu
2. **Login** (`/login`) - Đăng nhập
3. **Register** (`/register`) - Đăng ký
4. **Dashboard** (`/dashboard`) - Tổng quan
5. **Transactions** (`/dashboard/transactions`) - Quản lý giao dịch
6. **Budget** (`/dashboard/budget`) - Quản lý ngân sách
7. **Reports** (`/dashboard/reports`) - Báo cáo & phân tích

## 💡 Tips

- Dùng Chrome DevTools để test responsive
- Dùng MongoDB Compass để xem database
- Check console log để debug
- Test trên nhiều trình duyệt khác nhau

## 🆘 Cần Hỗ Trợ?

- Kiểm tra console log (F12)
- Kiểm tra Network tab
- Kiểm tra MongoDB connection
- Đảm bảo .env.local được cấu hình đúng

---

**Chúc bạn code vui vẻ! 🎉**
