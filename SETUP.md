# Hướng dẫn chạy Sổ Thu Chi

## Yêu cầu

- Node.js 20 trở lên
- Project Supabase

## Kết nối Supabase

1. Tạo `.env.local` từ `.env.example` rồi điền Project URL và Publishable key.
2. Trong Supabase Dashboard, bật **Allow new users to sign up** và **Anonymous Sign-Ins** tại Authentication → Sign In / Providers.
3. Mở SQL Editor và chạy lần lượt các migration trong `supabase/migrations`.

Các migration tạo bảng lưu dữ liệu, bật Row Level Security và chỉ cho phép danh tính hiện tại truy cập dòng dữ liệu của mình. Migration chia sẻ tạo các hàm RPC để lưu snapshot tháng, băm mã 6 chữ số và chỉ trả snapshot khi mã đúng, liên kết còn hạn. Không cần thêm service-role key vào ứng dụng.

## Chạy ứng dụng

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`. Ứng dụng tự tạo danh tính lưu trữ ẩn danh; không cần đăng nhập thủ công.

## Các màn hình

- **Tổng quan** (`/dashboard`): dòng tiền tháng này, danh mục chi tiêu, ngân sách và mục tiêu.
- **Giao dịch** (`/dashboard/transactions`): ghi khoản thu/chi, phân loại, tìm kiếm, sửa và xóa.
- **Ngân sách** (`/dashboard/budget`): đặt hạn mức chi tiêu theo danh mục và tháng.
- **Mục tiêu tiết kiệm** (`/dashboard/savings`): tạo mục tiêu, ghi nhận góp thêm hoặc rút tiền.
- **Báo cáo** (`/dashboard/reports`): xem dòng tiền và chi tiêu theo danh mục trong 3, 6 hoặc 12 tháng.

## Lưu ý về dữ liệu

Dữ liệu chính được lưu trên Supabase, đồng thời có bản sao cục bộ trên thiết bị hiện tại. Link chia sẻ mặc định hết hạn sau 1 ngày; có thể chọn 3, 7 hoặc 30 ngày. Link chia sẻ là snapshot, không cập nhật theo giao dịch phát sinh sau khi tạo; sau 10 lần nhập sai mã, link tạm khóa trong 15 phút. Không có đăng nhập tài khoản để mang danh tính ẩn danh sang thiết bị khác; xóa dữ liệu trình duyệt có thể làm mất cách truy cập dữ liệu trên Supabase.

## Build production

```bash
npm run lint
npm run build
npm run start
```
