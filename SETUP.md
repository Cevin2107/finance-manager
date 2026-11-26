# Cấu hình đồng bộ Sổ Thu Chi

1. Chạy các migration trong `supabase/migrations` trên Supabase.
2. Điền `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Đặt `FINANCE_ACCESS_PASSWORD` thành mật khẩu mới. Các phiên đăng nhập cũ sẽ cần đăng nhập lại.
4. Điền `SUPABASE_SERVER_KEY` bằng Supabase Secret key hoặc khóa service_role. Chỉ đặt biến này trong môi trường máy chủ.
5. Điền `FINANCE_OWNER_ID` bằng UUID người dùng Supabase sở hữu sổ chính. Dùng truy vấn dưới đây trong SQL Editor để nhận diện dòng cũ theo số lượng mục và thời gian cập nhật. Với sổ mới, tạo một người dùng dành riêng cho sổ trong Authentication → Users rồi dùng UUID của người dùng đó.
6. Đặt cấu hình trong `.env.local` để chạy cục bộ và trong Environment Variables của dịch vụ triển khai cho bản online. Khởi động lại hoặc triển khai lại sau khi cập nhật.

```sql
select user_id, updated_at,
       jsonb_array_length(data->'transactions') as transactions,
       jsonb_array_length(data->'budgets') as budgets,
       jsonb_array_length(data->'goals') as goals
from public.finance_data
order by updated_at desc;
```

Sau khi đăng nhập bằng mật khẩu của web, mọi thiết bị đọc cùng một sổ chính.

Tính năng chia sẻ tháng vẫn dùng Supabase Anonymous Sign-Ins. Bật **Allow new users to sign up** và **Anonymous Sign-Ins** trong Supabase Authentication nếu dùng tính năng đó.

## Chạy cục bộ

Yêu cầu Node.js 20.9 trở lên.

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).
