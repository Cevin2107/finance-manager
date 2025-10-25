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

export async function POST(req: NextRequest) {
  console.log('🔵 parse-bank-statement API called');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ Unauthorized: No session');
      return NextResponse.json({ error: 'Unauthorized', details: 'Vui lòng đăng nhập lại' }, { status: 401 });
    }

    console.log('✅ Session OK, user:', session.user?.email);

    const { data }: { data: any[][] } = await req.json();

    if (!data || data.length < 2) {
      console.log('❌ Invalid data:', { hasData: !!data, length: data?.length });
      return NextResponse.json({ 
        error: 'No data provided',
        details: 'File Excel không có đủ dữ liệu (cần ít nhất 2 rows)'
      }, { status: 400 });
    }

    console.log('📊 Parsing bank statement, rows:', data.length);

    // Strategy: For Techcombank, need to send enough rows to see actual data (starts ~row 34)
    // But keep it minimal to save tokens
    const sampleSize = Math.min(35, data.length); // Just enough to see first data row
    const sampleData = data.slice(0, sampleSize);
    
    // Convert sample data - only show non-empty cells to reduce tokens
    const sampleText = sampleData
      .map((row, idx) => {
        const nonEmptyCells = row
          .map((cell, cellIdx) => cell ? `Col${cellIdx}="${String(cell).substring(0, 50)}"` : null)
          .filter(Boolean)
          .join(', ');
        return nonEmptyCells ? `Row ${idx}: ${nonEmptyCells}` : null;
      })
      .filter(Boolean)
      .join('\n');

    console.log(`📤 Sending ${sampleSize} rows (${sampleText.length} chars) to AI...`);

    const prompt = `Analyze Techcombank bank statement structure. Total ${data.length} rows.

IMPORTANT: Techcombank statements have many header/info rows at top. Real transaction data starts around row 30-35.

Sample data (first ${sampleSize} rows):
${sampleText}

Find the header row with columns like: "Ngày giao dịch", "Đối tác", "Diễn giải", "Nợ/Debit", "Có/Credit", "Số dư"

Return ONLY this JSON (no explanation):
{
  "headerRow": <row number with column headers>,
  "columnMapping": {
    "date": <column index for date/ngày>,
    "sender": <column for đối tác/remitter or null>,
    "bank": <column for bank or null>,
    "description": <column for diễn giải/details>,
    "debit": <column for nợ/debit>,
    "credit": <column for có/credit>,
    "balance": <column for số dư/balance or null>
  }
}`;

    const completion = await createChatCompletionWithFallback(
      [{ role: 'user', content: prompt }],
      {
        temperature: 0,
        systemMessage: 'You are a precise data parser. Return ONLY valid JSON. No explanations. No markdown. Just JSON.',
        skipFallback: true, // Disable auto-fallback for import feature
      }
    );

    const responseText = completion.choices[0].message.content || '{}';
    
    console.log('📥 AI Response (first 500 chars):', responseText.substring(0, 500));
    
    // Extract JSON from response - handle multiple formats
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks
    if (jsonText.includes('```')) {
      const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else {
        // Try to find any JSON object
        const match = jsonText.match(/\{[\s\S]*\}/);
        if (match) {
          jsonText = match[0];
        }
      }
    }
    
    // If still has non-JSON text, try to extract JSON object
    if (!jsonText.startsWith('{')) {
      const match = jsonText.match(/\{[\s\S]*\}/);
      if (match) {
        jsonText = match[0];
      }
    }

    console.log('📝 Extracted JSON:', jsonText.substring(0, 300));

    let structure;
    try {
      structure = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('❌ Failed to parse AI JSON response:', parseError);
      console.error('AI Response text:', responseText);
      throw new Error(`AI trả về dữ liệu không hợp lệ. Vui lòng thử lại hoặc kiểm tra định dạng file Excel.`);
    }

    const { headerRow, columnMapping } = structure;

    if (headerRow === undefined || !columnMapping) {
      throw new Error('AI không thể xác định cấu trúc file. Vui lòng kiểm tra file có đúng định dạng sao kê ngân hàng không.');
    }

    console.log('✅ Detected structure:', JSON.stringify({ headerRow, columnMapping }, null, 2));
    console.log('📊 Starting to parse rows from', headerRow + 1, 'to', data.length);

    // Now parse ALL transactions using the detected structure
    const transactions: ParsedTransaction[] = [];
    
    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row || row.every((cell: any) => !cell && cell !== 0)) {
        console.log(`⏭️ Skip row ${i}: empty`);
        continue;
      }

      try {
        // Extract values based on column mapping
        const dateCell = row[columnMapping.date];
        const debitCell = row[columnMapping.debit];
        const creditCell = row[columnMapping.credit];
        
        console.log(`🔍 Row ${i}:`, { dateCell, debitCell, creditCell });
        
        // Skip if no amount
        if ((!debitCell && debitCell !== 0) && (!creditCell && creditCell !== 0)) {
          console.log(`⏭️ Skip row ${i}: no amount`);
          continue;
        }

        // Parse date
        let dateStr = '';
        if (typeof dateCell === 'number') {
          // Excel date number
          const excelEpoch = new Date(1899, 11, 30);
          const date = new Date(excelEpoch.getTime() + dateCell * 86400000);
          dateStr = date.toISOString().split('T')[0];
        } else if (dateCell) {
          // Try to parse string date
          const parts = String(dateCell).split(/[\/\-]/);
          if (parts.length === 3) {
            // Assume dd/mm/yyyy or yyyy-mm-dd
            if (parts[0].length === 4) {
              dateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            } else {
              dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
        }

        if (!dateStr) continue;

        // Parse amounts - handle both comma (,) and dot (.) as thousand separators
        const parseAmount = (val: any): number => {
          if (!val && val !== 0) return 0;
          if (typeof val === 'number') return Math.abs(val);
          
          const str = String(val).trim();
          if (!str) return 0;
          
          // Remove all non-numeric except dots and commas
          // Common formats: 1,000,000 or 1.000.000 or 1000000
          // Remove thousand separators (assuming last dot/comma is decimal if exists)
          let numStr = str.replace(/[^\d,\.]/g, '');
          
          // Count dots and commas
          const dotCount = (numStr.match(/\./g) || []).length;
          const commaCount = (numStr.match(/,/g) || []).length;
          
          // If multiple dots or commas, they are thousand separators
          if (dotCount > 1 || commaCount > 1 || (dotCount > 0 && commaCount > 0)) {
            // Remove all dots and commas (thousand separators)
            numStr = numStr.replace(/[,\.]/g, '');
          } else if (dotCount === 1 || commaCount === 1) {
            // Single dot/comma could be decimal separator or thousand
            const parts = numStr.split(/[,\.]/);
            if (parts[1] && parts[1].length === 3) {
              // Likely thousand separator: 1,000 or 1.000
              numStr = numStr.replace(/[,\.]/g, '');
            } else {
              // Likely decimal: 1,50 or 1.50 - normalize to dot
              numStr = numStr.replace(',', '.');
            }
          }
          
          const result = parseFloat(numStr) || 0;
          return Math.abs(result); // Always positive
        };

        const debit = parseAmount(debitCell);
        const credit = parseAmount(creditCell);
        const balance = columnMapping.balance !== null ? parseAmount(row[columnMapping.balance]) : 0;

        transactions.push({
          date: dateStr,
          sender: columnMapping.sender !== null ? String(row[columnMapping.sender] || '') : '',
          bank: columnMapping.bank !== null ? String(row[columnMapping.bank] || '') : '',
          description: String(row[columnMapping.description] || ''),
          debit,
          credit,
          balance,
        });
      } catch (err) {
        console.warn(`⚠️ Error parsing row ${i}:`, err);
        continue;
      }
    }

    console.log(`✅ Parsed ${transactions.length} transactions from ${data.length} rows`);

    // Validate the result
    if (transactions.length === 0) {
      return NextResponse.json({
        error: 'No transactions found',
        details: 'Không thể nhận diện giao dịch trong file. Vui lòng kiểm tra file có đúng là sao kê ngân hàng không.',
        aiResponse: responseText.substring(0, 500)
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      transactions: transactions,
      metadata: {
        headerRow: headerRow,
        columnMapping: columnMapping,
        totalRows: transactions.length,
        totalDataRows: data.length,
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
    
    // Check if it's a rate limit error
    const isRateLimit = status === 429 || 
                        errorMessage?.includes('Rate limit') ||
                        errorMessage?.includes('rate limit');

    let suggestion = 'Vui lòng kiểm tra: 1) File Excel có đúng định dạng sao kê ngân hàng không, 2) File có ít nhất 2 rows (header + data), 3) Các cột có chứa thông tin ngày, số tiền không';
    let canRetryWithOpenAI = false;

    if (status === 402) {
      suggestion = 'API Groq báo hết credit (402 Insufficient Balance). Vui lòng nạp thêm credit hoặc cập nhật API key khác.';
    } else if (isRateLimit) {
      suggestion = 'API Groq đã đạt giới hạn sử dụng. Vui lòng đợi 30-60 phút để quota reset.';
      canRetryWithOpenAI = !!process.env.OPENAI_API_KEY;
    }

    return NextResponse.json(
      {
        error: 'Failed to parse bank statement',
        details: errorMessage,
        suggestion,
        errorType: error?.name || 'Error',
        status,
        errorCode,
        isRateLimit,
        canRetryWithOpenAI,
      },
      { status }
    );
  }
}
