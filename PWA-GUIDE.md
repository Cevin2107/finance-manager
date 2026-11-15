# Cài đặt Sổ Thu Chi

Sổ Thu Chi có thể được cài như một ứng dụng web trên điện thoại hoặc máy tính.

## Android

1. Mở ứng dụng bằng Chrome.
2. Mở menu trình duyệt và chọn **Thêm vào màn hình chính** hoặc **Cài đặt ứng dụng**.
3. Xác nhận để tạo biểu tượng Sổ Thu Chi trên màn hình chính.

## iPhone hoặc iPad

1. Mở ứng dụng bằng Safari.
2. Chọn nút **Chia sẻ** rồi chọn **Thêm vào màn hình chính**.
3. Xác nhận tên và chọn **Thêm**.

## Lưu ý về dữ liệu

Dữ liệu được đồng bộ lên Supabase bằng danh tính ẩn danh của trình duyệt hiện tại. Không có đăng nhập để chuyển danh tính giữa thiết bị. Xóa dữ liệu trang web có thể làm mất danh tính ẩn danh và quyền truy cập vào dữ liệu tương ứng.

## Kiểm tra bản PWA

Ứng dụng cần được mở qua HTTPS khi cài từ môi trường production. Có thể kiểm tra manifest và service worker trong Chrome DevTools → **Application**.
