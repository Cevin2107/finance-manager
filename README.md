# Sổ Thu Chi

Ứng dụng quản lý tài chính cá nhân để ghi lại dòng tiền vào/ra, phân loại mục đích chi tiêu, đặt ngân sách và theo dõi mục tiêu tiết kiệm.

## Tính năng

- Dashboard tổng hợp thu nhập, chi tiêu, số dư và tỷ lệ tiết kiệm.
- Ghi, sửa, xóa, tìm kiếm và lọc giao dịch thu/chi theo danh mục.
- Đặt ngân sách theo danh mục và theo dõi mức sử dụng từng tháng.
- Tạo mục tiêu tiết kiệm, ghi nhận góp thêm hoặc rút tiền.
- Báo cáo dòng tiền và phân bổ chi tiêu theo danh mục trong 3, 6 hoặc 12 tháng.
- Chia sẻ snapshot thu chi tháng hiện tại bằng liên kết có hạn dùng và mã truy cập 6 chữ số.
- Giao diện tương thích với điện thoại và có thể cài đặt như PWA.

## Cấu hình Supabase

1. Tạo `.env.local` từ `.env.example`, sau đó điền Project URL và Publishable key trong Supabase.
2. Trong Supabase Dashboard, bật **Allow new users to sign up** và **Anonymous Sign-Ins** tại Authentication → Sign In / Providers.
3. Chạy lần lượt các migration trong `supabase/migrations` trong Supabase SQL Editor để tạo bảng, bật Row Level Security và cấu hình chia sẻ tháng.

Ứng dụng tự tạo danh tính lưu trữ ẩn danh, không có màn hình đăng nhập. Chính sách RLS giới hạn mỗi danh tính chỉ đọc và sửa dữ liệu của mình.

## Bắt đầu

Yêu cầu Node.js 20 trở lên.

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Lưu trữ dữ liệu

Dữ liệu được lưu trong Supabase và giữ bản sao cục bộ trên trình duyệt. Liên kết chia sẻ chỉ chứa snapshot các giao dịch tháng tại thời điểm tạo, cần mã 6 chữ số riêng và tự hết hạn theo thời gian đã chọn. Không có đồng bộ liên thiết bị hoặc cách khôi phục danh tính ẩn danh sau khi xóa dữ liệu trình duyệt.

## Kiểm tra và build

```bash
npm run lint
npm run build
```
