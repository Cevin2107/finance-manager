import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { createChatCompletionWithFallback } from '@/lib/openai';

interface ParsedTransaction {
  date: string;
  sender: string;
  bank: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface ClassifiedTransaction extends ParsedTransaction {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  isValid: boolean;
}

const EXPENSE_CATEGORIES = [
  'Ăn uống',
  'Di chuyển',
  'Mua sắm',
  'Giải trí',
  'Học tập',
  'Y tế',
  'Nhà cửa',
  'Hóa đơn',
  'Khác',
];

const INCOME_CATEGORIES = [
  'Lương',
  'Thưởng',
  'Đầu tư',
  'Bán hàng',
  'Freelance',
  'Khác',
];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactions }: { transactions: ParsedTransaction[] } = await req.json();

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions provided' }, { status: 400 });
    }

    // Prepare data for AI classification
    const transactionsText = transactions
      .map((tx, idx) => {
        const amount = tx.debit > 0 ? tx.debit : tx.credit;
        const type = tx.debit > 0 ? 'debit' : 'credit';
        return `${idx + 1}. Ngày: ${tx.date}, Người gửi: ${tx.sender}, Diễn giải: ${tx.description}, ${type === 'debit' ? 'Ghi nợ' : 'Ghi có'}: ${amount}`;
      })
      .join('\n');

    const prompt = `Bạn là chuyên gia phân tích tài chính. Hãy phân loại các giao dịch ngân hàng sau đây VỚI ĐỘ CHÍNH XÁC CAO NHẤT.

QUY TẮC PHÂN LOẠI CỰC KỲ QUAN TRỌNG:
- "Ghi nợ" (debit > 0): LUÔN LUÔN LÀ CHI TIÊU (expense) - Tiền bị trừ khỏi tài khoản
- "Ghi có" (credit > 0): LUÔN LUÔN LÀ THU NHẬP (income) - Tiền được cộng vào tài khoản
- KHÔNG BAO GIỜ nhầm lẫn 2 loại này!

PHÂN LOẠI THEO NỘI DUNG:
Chi tiêu (expense):
- Thanh toán mua hàng, dịch vụ
- Chuyển tiền cho người khác
- Rút tiền ATM
- Thanh toán hóa đơn
- Mua sắm online/offline
- Ăn uống, di chuyển, giải trí

Thu nhập (income):
- Nhận lương
- Nhận chuyển khoản từ người khác
- Hoàn tiền
- Lãi suất, đầu tư
- Thu nhập từ bán hàng

DANH MUC CHO PHÉP - CHỈ ĐƯỢC CHỌN TỪ DANH SÁCH NÀY:
Danh mục chi tiêu (expense): ${EXPENSE_CATEGORIES.join(', ')}
Danh mục thu nhập (income): ${INCOME_CATEGORIES.join(', ')}

QUAN TRỌNG: BẠN CHỈ ĐƯỢC CHỌN DANH MỤC TỪ DANH SÁCH TRÊN, KHÔNG ĐƯỢC TỰ TẠO DANH MỤC MỚI!
- Nếu không chắc chắn → chọn "Khác"
- Phải match chính xác tên danh mục (có dấu tiếng Việt)

Giao dịch:
${transactionsText}

Hãy trả về kết quả theo format JSON array như sau:
[
  {
    "index": 1,
    "type": "income" hoặc "expense" (DỰA VÀO debit/credit),
    "category": "CHÍNH XÁC 1 trong các danh mục đã cho ở trên",
    "isValid": true
  }
]

QUY TẮC NGHIÊM NGẶT: 
- Nếu debit > 0 → type PHẢI LÀ "expense"
- Nếu credit > 0 → type PHẢI LÀ "income"
- category PHẢI là 1 trong danh sách đã cho (copy chính xác, có dấu)
- Nếu không chắc → dùng "Khác"
- isValid luôn là true

CHỈ TRẢ VỀ JSON ARRAY, KHÔNG THÊM TEXT KHÁC.`;

    const completion = await createChatCompletionWithFallback(
      [{ role: 'user', content: prompt }],
      {
        temperature: 0.1,
        systemMessage: 'You are a financial transaction classifier. You MUST be 100% accurate. Debit = expense, Credit = income. You MUST ONLY use categories from the provided list - never create new ones. If unsure, use "Khác". Always respond with valid JSON only.',
        skipFallback: true, // Disable auto-fallback for import feature
      }
    );

    const responseText = completion.choices[0].message.content || '[]';
    
    // Extract JSON from response (remove markdown code blocks if present)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const classifications = JSON.parse(jsonText);

    // Merge classifications with original transactions
    const classifiedTransactions: ClassifiedTransaction[] = transactions.map((tx, idx) => {
      const classification = classifications.find((c: any) => c.index === idx + 1);
      
      // Fallback logic with strict rules if AI somehow fails
      let type: 'income' | 'expense';
      let category: string;
      
      if (classification) {
        type = classification.type;
        category = classification.category;
        
        // Validate category is in allowed list
        const allowedCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        if (!allowedCategories.includes(category)) {
          console.warn(`AI returned invalid category "${category}" for ${type}, defaulting to "Khác"`);
          category = 'Khác';
        }
      } else {
        // Strict fallback: debit = expense, credit = income
        type = tx.debit > 0 ? 'expense' : 'income';
        category = 'Khác';
      }

      return {
        ...tx,
        type,
        category,
        amount: tx.debit > 0 ? tx.debit : tx.credit,
        isValid: true, // Always true as AI is confident
      };
    });

    // Calculate summary
    const summary = {
      total: classifiedTransactions.length,
      income: classifiedTransactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0),
      expense: classifiedTransactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0),
      incomeCount: classifiedTransactions.filter(tx => tx.type === 'income').length,
      expenseCount: classifiedTransactions.filter(tx => tx.type === 'expense').length,
    };

    return NextResponse.json({
      transactions: classifiedTransactions,
      summary,
    });
  } catch (error: any) {
    console.error('Error classifying transactions:', error);

    const status = error?.status || error?.response?.status || 500;
    const apiError = error?.error || error?.response?.data || {};
    const errorMessage = apiError?.message || error?.message || 'Unknown error';
    const errorCode = apiError?.code || error?.code;

    let suggestion = 'Vui lòng thử lại sau hoặc kiểm tra định dạng dữ liệu gửi lên.';
    if (status === 402) {
      suggestion = 'API DeepSeek báo hết credit (402 Insufficient Balance). Vui lòng nạp thêm credit hoặc cập nhật API key khác.';
    } else if (status === 429) {
      suggestion = 'API đang bị giới hạn tốc độ (429 Rate Limit). Vui lòng đợi vài phút hoặc giảm số lần gọi.';
    }

    return NextResponse.json(
      {
        error: 'Failed to classify transactions',
        details: errorMessage,
        suggestion,
        errorType: error?.name || 'Error',
        status,
        errorCode,
      },
      { status }
    );
  }
}
