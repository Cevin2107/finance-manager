import { NextResponse } from 'next/server';
import { checkAccessPassword, createAccessToken } from '@/lib/access-session';

const SESSION_SECONDS = 12 * 60 * 60;
const REMEMBER_SECONDS = 30 * 24 * 60 * 60;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('password' in body) ||
    typeof body.password !== 'string' ||
    !('rememberMe' in body) ||
    typeof body.rememberMe !== 'boolean'
  ) {
    return NextResponse.json({ error: 'Vui lòng nhập mật khẩu.' }, { status: 400 });
  }
  if (!(await checkAccessPassword(body.password))) {
    return NextResponse.json({ error: 'Mật khẩu không chính xác.' }, { status: 401 });
  }

  const lifetime = body.rememberMe ? REMEMBER_SECONDS : SESSION_SECONDS;
  const expiresAt = Math.floor(Date.now() / 1000) + lifetime;
  const response = NextResponse.json({ success: true });
  response.cookies.set('finance_access', await createAccessToken(expiresAt), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(body.rememberMe ? { maxAge: lifetime } : {}),
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
