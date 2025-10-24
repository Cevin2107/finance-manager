import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import { openai, AI_MODEL, FINANCIAL_ADVISOR_PROMPT } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

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
      userEmail: session.user.email,
      date: { $gte: startDate },
    })
      .sort({ date: -1 })
      .lean();

    if (transactions.length === 0) {
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

    // Tạo prompt cho AI phân tích
    const analysisPrompt = `
Phân tích tài chính chi tiết cho người dùng dựa trên dữ liệu ${periodLabel}:

📊 TỔNG QUAN (${periodLabel.toUpperCase()}):
- Tổng thu nhập: ${totalIncome.toLocaleString('vi-VN')} VNĐ
- Tổng chi tiêu: ${totalExpense.toLocaleString('vi-VN')} VNĐ
- Số dư: ${balance.toLocaleString('vi-VN')} VNĐ
- Tỷ lệ tiết kiệm: ${savingsRate}%
- Số giao dịch: ${transactions.length}

📈 CHI TIẾT GIAO DỊCH:
${Object.entries(dailyData)
  .slice(0, 10) // Giới hạn 10 ngày để không quá dài
  .map(
    ([date, data]) =>
      `${date}: Thu ${data.income.toLocaleString('vi-VN')} | Chi ${data.expense.toLocaleString(
        'vi-VN'
      )} | Còn ${data.balance.toLocaleString('vi-VN')} VNĐ`
  )
  .join('\n')}

${incomeTransactions.length >= 2 ? `💰 ĐỘ ỔN ĐỊNH THU NHẬP:
- Độ biến động: ${incomeStability.toFixed(1)}% ${isStable ? '(Ổn định)' : '(KHÔNG ỔN ĐỊNH)'}
` : ''}

🛒 TOP DANH MỤC CHI TIÊU:
${topExpenseCategories.length > 0 
  ? topExpenseCategories
      .map((cat, i) => `${i + 1}. ${cat.category}: ${cat.amount.toLocaleString('vi-VN')} VNĐ`)
      .join('\n')
  : 'Chưa có chi tiêu nào'}

Hãy phân tích ngắn gọn và đưa ra:
1. 📊 Đánh giá tổng quan tình hình tài chính ${periodLabel}
2. ${incomeTransactions.length >= 2 ? '💹 Nhận xét về độ ổn định thu nhập\n3. ' : ''}💸 Nhận xét về chi tiêu (có gì cần lưu ý không)
${incomeTransactions.length >= 2 ? '4.' : '3.'} 🎯 2-3 khuyến nghị cụ thể để cải thiện

${analysisMode === 'weekly' ? 'Lưu ý: Đây là phân tích theo tuần. Vào ngày đầu tháng sẽ có phân tích tổng kết theo tháng.' : 'Lưu ý: Đây là phân tích tổng kết tháng.'}

Trả lời ngắn gọn bằng tiếng Việt, có cấu trúc rõ ràng với emoji và markdown.
`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system' as const,
          content: FINANCIAL_ADVISOR_PROMPT,
        },
        {
          role: 'user' as const,
          content: analysisPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const aiSummary = completion.choices[0]?.message?.content || 
      'Không thể tạo phân tích lúc này.';

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
