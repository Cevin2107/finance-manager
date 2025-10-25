import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import { createChatCompletionWithFallback, FINANCIAL_ADVISOR_PROMPT } from '@/lib/openai';

export async function POST(req: NextRequest) {
  console.log('📊 AI Analyze API called');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('❌ Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Session OK, user:', session.user.email);

    await connectDB();
    console.log('✅ DB connected');

    // Xác định period phân tích: tuần hoặc tháng
    const today = new Date();
    const dayOfMonth = today.getDate();
    const isFirstDayOfMonth = dayOfMonth === 1;
    
    // Nếu là ngày đầu tháng thì phân tích theo tháng, còn không thì theo tuần
    const analysisMode = isFirstDayOfMonth ? 'monthly' : 'weekly';
    
    let startDate: Date;
    let periodLabel: string;
    
    if (analysisMode === 'monthly') {
      // Phân tích tháng trước
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      periodLabel = 'tháng trước';
    } else {
      // Phân tích 7 ngày gần nhất
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      periodLabel = '7 ngày qua';
    }

    const transactions = await Transaction.find({
      userId: session.user.id,
      date: { $gte: startDate },
    })
      .sort({ date: -1 })
      .lean();

    console.log(`📋 Found ${transactions.length} transactions in ${periodLabel}`);

    if (transactions.length === 0) {
      console.log('⚠️ No transactions found, returning default message');
      return NextResponse.json({
        summary: `Chưa có giao dịch nào trong ${periodLabel}. Hãy thêm giao dịch để nhận được insights từ AI!`,
        stats: {
          income: 0,
          expense: 0,
          balance: 0,
          savingsRate: '0.0',
        },
        topExpenseCategories: [],
        period: periodLabel,
      });
    }

    // Tính toán thống kê chi tiết
    const dailyData: Record<string, { income: number; expense: number; balance: number }> = {};
    const categoryExpenses: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t) => {
      const dateKey = new Date(t.date).toLocaleDateString('vi-VN');

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { income: 0, expense: 0, balance: 0 };
      }

      if (t.type === 'income') {
        dailyData[dateKey].income += t.amount;
        totalIncome += t.amount;
      } else {
        dailyData[dateKey].expense += t.amount;
        totalExpense += t.amount;
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
      }

      dailyData[dateKey].balance = dailyData[dateKey].income - dailyData[dateKey].expense;
    });

    // Phân tích độ ổn định thu nhập (chỉ khi có ít nhất 2 giao dịch thu nhập)
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    let incomeStability = 0;
    let isStable = true;
    
    if (incomeTransactions.length >= 2) {
      const incomeAmounts = incomeTransactions.map(t => t.amount);
      const avgIncome = incomeAmounts.reduce((a, b) => a + b, 0) / incomeAmounts.length;
      const incomeVariance =
        incomeAmounts.reduce((sum, income) => sum + Math.pow(income - avgIncome, 2), 0) /
        incomeAmounts.length;
      const incomeStdDev = Math.sqrt(incomeVariance);
      incomeStability = avgIncome > 0 ? (incomeStdDev / avgIncome) * 100 : 0;
      isStable = incomeStability <= 20;
    }

    // Top danh mục chi tiêu
    const topExpenseCategories = Object.entries(categoryExpenses)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0.0';

    // Tạo prompt cho AI phân tích - NGẮN GỌN CHỈ 3 CÂU
    const analysisPrompt = `
Phân tích tài chính ${periodLabel}:

📊 Dữ liệu:
- Thu nhập: ${totalIncome.toLocaleString('vi-VN')} VNĐ
- Chi tiêu: ${totalExpense.toLocaleString('vi-VN')} VNĐ
- Số dư: ${balance.toLocaleString('vi-VN')} VNĐ
- Tỷ lệ tiết kiệm: ${savingsRate}%

� Top chi tiêu:
${topExpenseCategories.slice(0, 3)
  .map((cat) => `- ${cat.category}: ${cat.amount.toLocaleString('vi-VN')} VNĐ`)
  .join('\n')}

Hãy đưa ra nhận xét CỰC NGẮN GỌN chỉ trong 3 câu:
1. Đánh giá tình hình tài chính (1 câu)
2. Nhận xét về chi tiêu nổi bật (1 câu)
3. Lời khuyên ngắn gọn nhất (1 câu)

Trả lời bằng tiếng Việt, không dùng markdown phức tạp, chỉ text thuần túy có emoji.
`;

    console.log('🤖 Calling AI for analysis...');

    const completion = await createChatCompletionWithFallback(
      [{ role: 'user', content: analysisPrompt }],
      {
        temperature: 0.7,
        systemMessage: 'Bạn là cố vấn tài chính. Trả lời CỰC NGẮN GỌN, chỉ 3 câu, dễ hiểu.',
      }
    );

    console.log('✅ AI response received');

    const aiSummary = completion.choices[0]?.message?.content || 
      'Không thể tạo phân tích lúc này.';

    console.log('📤 Sending response to client');

    return NextResponse.json({
      summary: aiSummary,
      stats: {
        income: totalIncome,
        expense: totalExpense,
        balance,
        savingsRate,
      },
      topExpenseCategories,
      incomeStability: incomeTransactions.length >= 2 ? {
        isStable,
        variancePercent: incomeStability.toFixed(1),
      } : undefined,
      period: periodLabel,
      analysisMode,
    });
  } catch (error: any) {
    console.error('AI Analysis error:', error);

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
