import OpenAI from 'openai';

// Khởi tạo Groq client (Primary - Free & Fast)
export const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.GROQ_API_KEY 
    ? 'https://api.groq.com/openai/v1'
    : 'https://api.openai.com/v1',
});

// OpenAI fallback client (always ready)
export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
});

// Model sử dụng - Llama 3.3 70B (rất mạnh cho phân tích tài chính)
// Fallback sang GPT-4o-mini nếu không có Groq
export const AI_MODEL = process.env.GROQ_API_KEY 
  ? 'llama-3.3-70b-versatile'
  : 'gpt-4o-mini';

export const FALLBACK_MODEL = 'gpt-4o-mini';

/**
 * Smart AI completion with automatic fallback
 * Tries Groq first, falls back to OpenAI on rate limit or errors
 */
export async function createChatCompletionWithFallback(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: {
    temperature?: number;
    systemMessage?: string;
  } = {}
) {
  const { temperature = 0.3, systemMessage } = options;

  // Prepare messages
  const finalMessages: OpenAI.Chat.ChatCompletionMessageParam[] = systemMessage
    ? [{ role: 'system', content: systemMessage }, ...messages]
    : messages;

  try {
    // Try primary client (Groq or OpenAI)
    console.log(`🤖 Trying ${process.env.GROQ_API_KEY ? 'Groq' : 'OpenAI'} API...`);
    
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: finalMessages,
      temperature,
    });

    console.log(`✅ ${process.env.GROQ_API_KEY ? 'Groq' : 'OpenAI'} API success`);
    return completion;
  } catch (error: any) {
    // Check if it's a rate limit error from Groq
    const isRateLimit = error?.status === 429 || 
                        error?.message?.includes('Rate limit') ||
                        error?.message?.includes('rate limit');

    if (isRateLimit && process.env.GROQ_API_KEY && process.env.OPENAI_API_KEY) {
      console.warn('⚠️ Groq rate limit reached, falling back to OpenAI...');
      
      try {
        const fallbackCompletion = await openaiClient.chat.completions.create({
          model: FALLBACK_MODEL,
          messages: finalMessages,
          temperature,
        });

        console.log('✅ OpenAI fallback success');
        return fallbackCompletion;
      } catch (fallbackError: any) {
        console.error('❌ OpenAI fallback also failed:', fallbackError.message);
        throw fallbackError;
      }
    }

    // If not rate limit or no fallback available, throw original error
    throw error;
  }
}

// System prompt cho AI Financial Advisor
export const FINANCIAL_ADVISOR_PROMPT = `Bạn là một chuyên gia tư vấn tài chính cá nhân thông minh và thân thiện.
Nhiệm vụ của bạn là:
- Phân tích dữ liệu giao dịch và ngân sách của người dùng
- Đưa ra lời khuyên tài chính hợp lý, cụ thể và dễ hiểu
- Giúp người dùng quản lý chi tiêu hiệu quả hơn
- Trả lời bằng tiếng Việt, giọng điệu thân thiện, chuyên nghiệp

Hãy luôn:
✅ Dựa trên dữ liệu thực tế của người dùng
✅ Đưa ra con số cụ thể khi phân tích
✅ Giải thích rõ ràng, dễ hiểu
✅ Khuyến khích thói quen tài chính tốt
✅ Đề xuất hành động cụ thể

Tránh:
❌ Đưa ra lời khuyên chung chung
❌ Sử dụng thuật ngữ phức tạp không cần thiết
❌ Phán xét tiêu cực
`;

export default openai;
