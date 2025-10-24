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

    // Lấy dữ liệu 6 tháng gần nhất
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await Transaction.find({
      userEmail: session.user.email,
      date: { $gte: sixMonthsAgo },
    })
      .sort({ date: -1 })
      .lean();

    if (transactions.length === 0) {
      return NextResponse.json({
        summary: 'Chưa có đủ dữ liệu để phân tích. Hãy thêm giao dịch để nhận được insights từ AI.',
        stats: null,
        topExpenseCategories: [],
      });
    }

    // Tính toán thống kê chi tiết
    const monthlyData: Record<string, { income: number; expense: number; balance: number }> = {};
    const categoryExpenses: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t) => {
      const monthKey = new Date(t.date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
      });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0, balance: 0 };
      }

      if (t.type === 'income') {
        monthlyData[monthKey].income += t.amount;
        totalIncome += t.amount;
      } else {
        monthlyData[monthKey].expense += t.amount;
        totalExpense += t.amount;
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
      }

      monthlyData[monthKey].balance = monthlyData[monthKey].income - monthlyData[monthKey].expense;
    });

    // Phân tích độ ổn định thu nhập
    const monthlyIncomes = Object.values(monthlyData).map((m) => m.income);
    const avgIncome = monthlyIncomes.reduce((a, b) => a + b, 0) / monthlyIncomes.length;
    const incomeVariance =
      monthlyIncomes.reduce((sum, income) => sum + Math.pow(income - avgIncome, 2), 0) /
      monthlyIncomes.length;
    const incomeStdDev = Math.sqrt(incomeVariance);
    const incomeStability = avgIncome > 0 ? (incomeStdDev / avgIncome) * 100 : 0;

    // Top danh mục chi tiêu
    const topExpenseCategories = Object.entries(categoryExpenses)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    const avgExpense = totalExpense / Object.keys(monthlyData).length;
    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0.0';

    // Tạo prompt cho AI phân tích
    const analysisPrompt = `
Phân tích tài chính chi tiết cho người dùng dựa trên dữ liệu 6 tháng gần nhất:

📊 TỔNG QUAN:
- Tổng thu nhập: ${totalIncome.toLocaleString('vi-VN')} VNĐ
- Tổng chi tiêu: ${totalExpense.toLocaleString('vi-VN')} VNĐ
- Số dư: ${balance.toLocaleString('vi-VN')} VNĐ
- Tỷ lệ tiết kiệm: ${savingsRate}%

📈 PHÂN TÍCH THEO THÁNG:
${Object.entries(monthlyData)
  .map(
    ([month, data]) =>
      `${month}: Thu ${data.income.toLocaleString('vi-VN')} VNĐ | Chi ${data.expense.toLocaleString(
        'vi-VN'
      )} VNĐ | Còn ${data.balance.toLocaleString('vi-VN')} VNĐ`
  )
  .join('\n')}

💰 ĐỘ ỔN ĐỊNH THU NHẬP:
- Thu nhập trung bình/tháng: ${avgIncome.toLocaleString('vi-VN')} VNĐ
- Độ biến động: ${incomeStability.toFixed(1)}% ${incomeStability > 20 ? '(KHÔNG ỔN ĐỊNH)' : '(Ổn định)'}

🛒 TOP DANH MỤC CHI TIÊU:
${topExpenseCategories
  .map((cat, i) => `${i + 1}. ${cat.category}: ${cat.amount.toLocaleString('vi-VN')} VNĐ`)
  .join('\n')}

Hãy phân tích chi tiết và đưa ra:
1. 📊 Đánh giá tổng quan tình hình tài chính
2. 💹 Phân tích độ ổn định thu nhập (có ổn định hay không)
3. 💸 Nhận xét về chi tiêu (hợp lý hay cần cải thiện ở đâu)
4. 💰 Khả năng tiết kiệm hiện tại
5. 🎯 3-5 khuyến nghị cụ thể để cải thiện tài chính

Trả lời bằng tiếng Việt, có cấu trúc rõ ràng với các emoji và markdown formatting.
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
      max_tokens: 2000,
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
      incomeStability: {
        isStable: incomeStability <= 20,
        variancePercent: incomeStability.toFixed(1),
      },
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
