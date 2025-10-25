# 🔔 Hướng dẫn khắc phục thông báo không hiện

## ✅ Log cho thấy thông báo đã được gửi thành công
```
✅ Notification shown via direct Notification API
✅ Daily notification sent at: 23:48:04 25/10/2025
```

Nhưng bạn không nhìn thấy → **Windows/Browser đang ẩn thông báo**

---

## 🔧 Các bước kiểm tra

### 1️⃣ Kiểm tra Windows Focus Assist (Quan trọng nhất!)

**Windows đang chặn thông báo khi bạn đang làm việc:**

1. Mở **Settings** (Win + I)
2. Vào **System** → **Focus assist** (hoặc "Trợ lý tập trung")
3. Chọn **Off** (Tắt hoàn toàn)

**HOẶC** cho phép thông báo từ Chrome:
1. Trong Focus assist settings
2. Click **Customize priority list**
3. Add **Chrome** vào danh sách được phép

---

### 2️⃣ Kiểm tra Windows Notification Settings

1. Mở **Settings** (Win + I)
2. Vào **System** → **Notifications**
3. Đảm bảo:
   - ✅ **Notifications** = ON
   - ✅ **Show notifications on the lock screen** = ON
   - ✅ Tìm **Google Chrome** trong danh sách apps
   - ✅ Bật thông báo cho Chrome

---

### 3️⃣ Kiểm tra Chrome Notification Settings

1. Mở Chrome Settings
2. Vào **Privacy and security** → **Site settings** → **Notifications**
3. Đảm bảo:
   - ✅ **Sites can ask to send notifications** = ON
   - ✅ `http://localhost:3000` ở trong **Allowed** list (KHÔNG ở Blocked)

**Nếu localhost bị Block:**
1. Remove khỏi Blocked list
2. Reload trang
3. Cho phép lại notifications

---

### 4️⃣ Kiểm tra Action Center (Notification Center)

1. Bấm **Win + A** để mở Action Center
2. Xem có thông báo nào ở đó không
3. Windows có thể gom nhóm thông báo ở đây

---

### 5️⃣ Kiểm tra Do Not Disturb

1. Check xem có biểu tượng 🌙 (mặt trăng) ở System Tray không
2. Nếu có → Click để tắt Do Not Disturb
3. Hoặc vào Quick Settings (Win + A) → Tắt Focus

---

## 🧪 Test nhanh

Sau khi kiểm tra các bước trên, làm theo:

1. **Reload trang web** (F5)
2. Vào Dashboard → Bật thông báo lại
3. Click **"🔔 Test thông báo ngay"**
4. Bạn phải thấy:
   - ✅ Thông báo test đơn giản (sau 1s)
   - ✅ Thông báo AI đầy đủ (sau 3s)
   - 🔊 Tiếng beep nhẹ

---

## 🎯 Dấu hiệu thành công

Khi thông báo hiện đúng cách, bạn sẽ thấy:

1. **Popup notification** ở góc màn hình (Windows 10/11)
2. **Console log**: `🎉 Notification displayed on screen!`
3. **Tiếng beep** nhẹ (nếu không bị tắt tiếng)

---

## 💡 Tip: Test với thời gian gần

Để test lịch thông báo:

1. Đặt thời gian **1-2 phút sau** thời gian hiện tại
2. Click **"💾 Lưu"**
3. Click **"📅 Kiểm tra lịch thông báo"** → Xem còn bao lâu
4. **GIỮ TAB MỞ**, không đóng trình duyệt
5. Đợi đến giờ và xem console log

---

## ⚠️ Lưu ý quan trọng

- **Tab phải MỞ**: JavaScript timer chỉ chạy khi tab đang mở
- **Không minimize**: Một số browser tạm dừng timer khi minimize
- **Không sleep**: Computer phải bật và không ở chế độ ngủ

---

## 🔍 Debug thêm

Nếu vẫn không thấy, mở Console và chạy:

```javascript
// Check permission
console.log('Permission:', Notification.permission);

// Try simple notification
new Notification('Test', { body: 'Hello!' });
```

Nếu không có lỗi → Thông báo đã được gửi, chỉ là Windows ẩn nó!

---

## 📞 Nếu vẫn không được

1. Thử restart Chrome
2. Thử restart Windows
3. Thử browser khác (Edge, Firefox)
4. Check antivirus có chặn không
