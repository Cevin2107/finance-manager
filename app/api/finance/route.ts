import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/access-session';
import { EMPTY_DATA, isFinanceData } from '@/lib/finance-data';

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

async function handle(request: NextRequest) {
  if (!(await verifyAccessToken(request.cookies.get('finance_access')?.value))) {
    return reply({ error: 'Vui lòng đăng nhập.' }, 401);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVER_KEY;
  const ownerId = process.env.FINANCE_OWNER_ID;
  if (!url || !key || !ownerId) {
    return reply({ error: 'Sổ thu chi chưa được cấu hình trên máy chủ.' }, 503);
  }

  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const table = client.from('finance_data');
  try {
    if (request.method === 'GET') {
      const { data: row, error } = await table.select('data,updated_at').eq('user_id', ownerId).maybeSingle();
      if (error) throw error;
      if (row && !isFinanceData(row.data)) throw new Error('Invalid finance data');
      return reply({ data: row?.data ?? EMPTY_DATA, updatedAt: row?.updated_at ?? null });
    }

    const origin = request.headers.get('origin');
    if (origin !== request.nextUrl.origin) return reply({ error: 'Yêu cầu ghi không hợp lệ.' }, 403);

    const body = await request.json().catch(() => null);
    if (
      !body ||
      !isFinanceData(body.data) ||
      (body.updatedAt !== null &&
        (typeof body.updatedAt !== 'string' || !Number.isFinite(Date.parse(body.updatedAt)) ||
          Math.abs(Date.parse(body.updatedAt)) >= 8.64e15))
    ) {
      return reply({ error: 'Dữ liệu sổ thu chi không hợp lệ.' }, 400);
    }

    const previousTime = body.updatedAt === null ? 0 : Date.parse(body.updatedAt);
    const updatedAt = new Date(Math.max(Date.now(), previousTime + 1)).toISOString();
    const changes = { data: body.data, updated_at: updatedAt };
    const result = body.updatedAt === null
      ? await table.upsert({ user_id: ownerId, ...changes }, { onConflict: 'user_id', ignoreDuplicates: true })
          .select('data,updated_at').maybeSingle()
      : await table.update(changes).eq('user_id', ownerId).eq('updated_at', body.updatedAt)
          .select('data,updated_at').maybeSingle();

    if (result.error) throw result.error;
    if (!result.data) {
      return reply({ error: 'Sổ đã thay đổi trên thiết bị khác. Hãy tải lại dữ liệu và kiểm tra trước khi lưu.' }, 409);
    }
    return reply({ data: result.data.data, updatedAt: result.data.updated_at });
  } catch (error) {
    console.error('Finance storage request failed', error instanceof Error ? error.name : 'database error');
    return reply({ error: 'Không thể kết nối với sổ thu chi. Vui lòng thử lại.' }, 503);
  }
}

export const GET = handle;
export const PUT = handle;
