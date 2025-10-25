import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import Budget from '@/models/Budget';
import { createChatCompletionWithFallback, FINANCIAL_ADVISOR_PROMPT } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Lấy dữ liệu tài chính 3 tháng gần nhất
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const transactions = await Transaction.find({
      userId: session.user.id,
      date: { $gte: threeMonthsAgo },
    })
      .sort({ date: -1 })
      .limit(100)
      .lean();

    const budgets = await Budget.find({
      userId: session.user.id,
    }).lean();

    // Tạo context từ dữ liệu tài chính
    let contextMessage = '';
    
    if (transactions.length > 0) {
      // Tính toán thống kê
      const monthlyStats: Record<string, { income: number; expense: number }> = {};
      const expenseByCategory: Record<string, number> = {};

      transactions.forEach((t) => {
        const monthKey = new Date(t.date).toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: 'long',
        });

        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = { income: 0, expense: 0 };
        }

        if (t.type === 'income') {
          monthlyStats[monthKey].income += t.amount;
        } else {
          monthlyStats[monthKey].expense += t.amount;
          expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
        }
      });

      contextMessage = `
📊 THÔNG TIN TÀI CHÍNH CỦA NGƯỜI DÙNG (3 tháng gần nhất):

📈 Thống kê theo tháng:
${Object.entries(monthlyStats)
  .map(
    ([month, stats]) =>
      `${month}:
  - Thu nhập: ${stats.income.toLocaleString('vi-VN')} VNĐ
  - Chi tiêu: ${stats.expense.toLocaleString('vi-VN')} VNĐ
  - Còn lại: ${(stats.income - stats.expense).toLocaleString('vi-VN')} VNĐ`
  )
  .join('\n')}

💰 Chi tiêu theo danh mục:
${Object.entries(expenseByCategory)
  .sort(([, a]: any, [, b]: any) => b - a)
  .map(([category, amount]: [string, any]) => 
    `- ${category}: ${amount.toLocaleString('vi-VN')} VNĐ`
  )
  .join('\n')}

🎯 Ngân sách đã đặt: ${budgets.length} danh mục

Dựa trên dữ liệu trên, hãy trả lời câu hỏi của người dùng.
`;
    }

    // Prepare messages
    const messages: any[] = [
      ...(contextMessage
        ? [
            {
              role: 'system' as const,
              content: contextMessage,
            },
          ]
        : []),
      {
        role: 'user' as const,
        content: message,
      },
    ];

    // Gọi AI API với fallback
    const completion = await createChatCompletionWithFallback(messages, {
      temperature: 0.7,
      systemMessage: FINANCIAL_ADVISOR_PROMPT,
    });

    const aiResponse = completion.choices[0]?.message?.content || 
      'Xin lỗi, tôi không thể tạo phản hồi lúc này.';

    return NextResponse.json({
      response: aiResponse,
      usage: completion.usage,
    });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'API key không hợp lệ. Vui lòng kiểm tra OPENAI_API_KEY.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
