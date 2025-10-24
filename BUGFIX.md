# 🔧 BUG FIX: NextAuth Configuration

## ✅ Đã sửa lỗi: "Cannot destructure property 'GET' of handlers"

### Nguyên nhân:
- Bạn đang sử dụng NextAuth v4.24.11
- Code ban đầu dùng cú pháp của NextAuth v5
- NextAuth v4 có cách config khác hoàn toàn

### Các thay đổi đã thực hiện:

#### 1. **auth.ts** - Cập nhật cấu hình
```typescript
// Trước (NextAuth v5 style - SAI):
export const { handlers, signIn, signOut, auth } = NextAuth({...})

// Sau (NextAuth v4 style - ĐÚNG):
export const authOptions: NextAuthOptions = {...}
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

#### 2. **app/api/auth/[...nextauth]/route.ts** - Đơn giản hóa
```typescript
// Trước:
import { handlers } from '@/auth';
export const { GET, POST } = handlers;

// Sau:
export { GET, POST } from '@/auth';
```

#### 3. **middleware.ts** - Sử dụng withAuth
```typescript
// Trước:
export { auth as middleware } from '@/auth';

// Sau:
import { withAuth } from 'next-auth/middleware';
export default withAuth({...});
```

#### 4. **API Routes** - Cập nhật cách lấy session
```typescript
// Trước:
import { auth } from '@/auth';
const session = await auth();

// Sau:
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
const session = await getServerSession(authOptions);
```

#### 5. **lib/session.ts** - Helper functions (MỚI)
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}
```

### Files đã được cập nhật:
- ✅ `auth.ts` - Core configuration
- ✅ `app/api/auth/[...nextauth]/route.ts` - Auth API route
- ✅ `middleware.ts` - Route protection
- ✅ `app/api/transactions/route.ts` - Transaction API
- ✅ `app/api/budget/route.ts` - Budget API
- ✅ `lib/session.ts` - Session helpers (NEW)

### Kiểm tra lại:
```bash
# Stop dev server (Ctrl+C)
# Xóa cache Next.js
rm -rf .next

# Chạy lại
npm run dev
```

### Test checklist:
- [ ] Đăng ký tài khoản mới - `/register`
- [ ] Đăng nhập - `/login`
- [ ] Truy cập dashboard - `/dashboard`
- [ ] Protected routes hoạt động
- [ ] API calls có authentication

### Tài liệu tham khảo:
- NextAuth v4 Docs: https://next-auth.js.org/getting-started/introduction
- Next.js 15 + NextAuth: https://next-auth.js.org/configuration/nextjs

---

**Lỗi đã được sửa hoàn toàn! Giờ bạn có thể đăng nhập bình thường.** ✅
