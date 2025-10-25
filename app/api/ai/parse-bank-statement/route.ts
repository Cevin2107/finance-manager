import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { openai, AI_MODEL } from '@/lib/openai';

interface ParsedTransaction {
  date: string;
  sender: string;
  bank: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data }: { data: any[][] } = await req.json();

    if (!data || data.length < 2) {
      return NextResponse.json({ 
        error: 'No data provided',
        details: 'File Excel không có đủ dữ liệu (cần ít nhất 2 rows)'
      }, { status: 400 });
    }

    console.log('📊 Parsing bank statement, rows:', data.length);
    console.log('First 3 rows:', data.slice(0, 3));

    // Convert data to text representation for AI
    const dataText = data
      .slice(0, 30) // Only send first 30 rows to avoid token limit
      .map((row, idx) => `Row ${idx}: ${row.map((cell, cellIdx) => `Col${cellIdx}="${cell}"`).join(', ')}`)
      .join('\n');

    console.log('📤 Sending to AI for analysis...');

    console.log('📤 Sending to AI for analysis...');

    const prompt = `Bạn là chuyên gia phân tích sao kê ngân hàng. Dưới đây là dữ liệu từ file Excel sao kê ngân hàng.

NHIỆM VỤ:
1. Tự động nhận diện các cột trong file (ngày, người gửi/nhận, diễn giải, ghi nợ, ghi có, số dư)
2. Xác định row nào là header, row nào là dữ liệu
3. Parse và chuẩn hóa dữ liệu

LƯU Ý:
- Ghi nợ (debit) = Tiền BỊ TRỪ (chi tiêu) - có thể tên: "Ghi nợ", "Debit", "Tiền ra", "Số tiền ghi nợ", "Rút", "-"
- Ghi có (credit) = Tiền ĐƯỢC CỘNG (thu nhập) - có thể tên: "Ghi có", "Credit", "Tiền vào", "Số tiền ghi có", "Nạp", "+"
- Ngày có thể ở nhiều format: dd/mm/yyyy, yyyy-mm-dd, số Excel date (VD: 45232)
- Diễn giải/Nội dung: thường chứa text mô tả giao dịch
- Số tiền có thể có dấu phân cách (1,000,000) hoặc không (1000000)
- Bỏ qua các row trống hoặc row tổng kết

DỮ LIỆU:
${dataText}

TRẢ VỀ JSON theo format SAU (QUAN TRỌNG - PHẢI ĐÚNG FORMAT):
{
  "headerRow": <số thứ tự row là header, VD: 0>,
  "columnMapping": {
    "date": <số cột chứa ngày, VD: 0>,
    "sender": <số cột chứa người gửi/nhận hoặc null>,
    "bank": <số cột chứa ngân hàng hoặc null>,
    "description": <số cột chứa diễn giải/nội dung, VD: 3>,
    "debit": <số cột chứa ghi nợ/tiền ra, VD: 4>,
    "credit": <số cột chứa ghi có/tiền vào, VD: 5>,
    "balance": <số cột chứa số dư hoặc null>
  },
  "transactions": [
    {
      "date": "2025-10-20",
      "sender": "NGUYEN VAN A",
      "bank": "",
      "description": "Chuyen tien",
      "debit": 0,
      "credit": 1000000,
      "balance": 5000000
    }
  ]
}

QUY TẮC:
- date phải format YYYY-MM-DD
- debit và credit là số (không có dấu phân cách)
- Nếu không có sender/bank/balance thì để rỗng hoặc 0
- CHỈ TRẢ VỀ JSON HỢP LỆ, KHÔNG TEXT GIẢI THÍCH`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at parsing bank statements from various formats. Always return valid JSON only. Be extremely accurate in detecting debit (money out) vs credit (money in).',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // Very low for accuracy
    });

    const responseText = completion.choices[0].message.content || '{}';
    
    console.log('📥 AI Response:', responseText.substring(0, 500));
    
    // Extract JSON from response
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const result = JSON.parse(jsonText);

    console.log('✅ Parsed result, transactions:', result.transactions?.length || 0);

    // Validate the result
    if (!result.transactions || result.transactions.length === 0) {
      return NextResponse.json({
        error: 'No transactions found',
        details: 'AI không thể nhận diện giao dịch trong file. Vui lòng kiểm tra file có đúng là sao kê ngân hàng không.',
        aiResponse: responseText.substring(0, 500)
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      transactions: result.transactions,
      metadata: {
        headerRow: result.headerRow,
        columnMapping: result.columnMapping,
        totalRows: result.transactions.length,
      },
    });
  } catch (error: any) {
    console.error('❌ Error parsing bank statement:', error);
    if (error?.stack) {
      console.error('Error stack:', error.stack);
    }

    const status = error?.status || error?.response?.status || 500;
    const apiError = error?.error || error?.response?.data || {};
    const errorMessage = apiError?.message || error?.message || 'Unknown error';
    const errorCode = apiError?.code || error?.code;

    let suggestion = 'Vui lòng kiểm tra: 1) File Excel có đúng định dạng sao kê ngân hàng không, 2) File có ít nhất 2 rows (header + data), 3) Các cột có chứa thông tin ngày, số tiền không';

    if (status === 402) {
      suggestion = 'API DeepSeek báo hết credit (402 Insufficient Balance). Vui lòng nạp thêm credit hoặc cập nhật API key khác.';
    } else if (status === 429) {
      suggestion = 'API đang bị giới hạn tốc độ (429 Rate Limit). Vui lòng đợi vài phút hoặc giảm số lần gọi.';
    }

    return NextResponse.json(
      {
        error: 'Failed to parse bank statement',
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
