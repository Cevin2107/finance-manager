import OpenAI from 'openai';

// Khởi tạo Groq client (Primary - Free & Fast)
export const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.GROQ_API_KEY 
    ? 'https://api.groq.com/openai/v1'
    : 'https://api.openai.com/v1',
});

// Groq backup client (second Groq API key)
export const groqClient2 = new OpenAI({
  apiKey: process.env.GROQ_API_KEY_2,
  baseURL: 'https://api.groq.com/openai/v1',
});

// OpenAI fallback client (always ready)
export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
});

// Gemini fallback client (third tier fallback)
export const geminiClient = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

// Model sử dụng - Llama 3.3 70B (rất mạnh cho phân tích tài chính)
// Fallback sang GPT-4o-mini nếu không có Groq
export const AI_MODEL = process.env.GROQ_API_KEY 
  ? 'llama-3.3-70b-versatile'
  : 'gpt-4o-mini';

export const FALLBACK_MODEL = 'gpt-4o-mini';
export const GEMINI_MODEL = 'gemini-1.5-flash';

/**
 * Smart AI completion with automatic fallback
 * Priority: Groq 1 → Groq 2 → OpenAI → Gemini
 */
export async function createChatCompletionWithFallback(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: {
    temperature?: number;
    systemMessage?: string;
    skipFallback?: boolean;
  } = {}
) {
  const { temperature = 0.3, systemMessage, skipFallback = false } = options;

  // Prepare messages
  const finalMessages: OpenAI.Chat.ChatCompletionMessageParam[] = systemMessage
    ? [{ role: 'system', content: systemMessage }, ...messages]
    : messages;

  // Define fallback chain
  const fallbackChain: Array<{
    name: string;
    client: OpenAI;
    model: string;
    condition: boolean;
  }> = [
    {
      name: 'Groq #1',
      client: openai,
      model: AI_MODEL,
      condition: !!process.env.GROQ_API_KEY,
    },
    {
      name: 'Groq #2',
      client: groqClient2,
      model: AI_MODEL,
      condition: !!process.env.GROQ_API_KEY_2,
    },
    {
      name: 'OpenAI',
      client: openaiClient,
      model: FALLBACK_MODEL,
      condition: !!process.env.OPENAI_API_KEY,
    },
    {
      name: 'Gemini',
      client: geminiClient,
      model: GEMINI_MODEL,
      condition: !!process.env.GEMINI_API_KEY,
    },
  ].filter(item => item.condition);

  let lastError: any = null;

  // Try each API in the chain
  for (let i = 0; i < fallbackChain.length; i++) {
    const { name, client, model } = fallbackChain[i];
    const isLastOption = i === fallbackChain.length - 1;
    const isGroqAPI = name.includes('Groq');

    try {
      console.log(`🤖 Trying ${name} API...`);
      
      const completion = await client.chat.completions.create({
        model,
        messages: finalMessages,
        temperature,
      });

      console.log(`✅ ${name} API success`);
      return completion;
    } catch (error: any) {
      lastError = error;
      
      const isRateLimit = error?.status === 429 || 
                          error?.message?.includes('Rate limit') ||
                          error?.message?.includes('rate limit');

      console.error(`❌ ${name} failed:`, error.message);

      // If skipFallback is enabled and we've tried both Groq APIs, throw error
      if (skipFallback && !isGroqAPI) {
        console.warn('⚠️ skipFallback enabled, stopping at paid APIs');
        throw error;
      }

      // If this is the last option, throw error
      if (isLastOption) {
        throw error;
      }

      // If not a rate limit error on first attempt, throw immediately
      if (!isRateLimit && i === 0) {
        throw error;
      }

      // Continue to next fallback
      console.warn(`⚠️ ${isRateLimit ? 'Rate limit reached' : 'Error occurred'}, trying next option...`);
    }
  }

  // Should never reach here, but throw last error just in case
  throw lastError || new Error('All API options failed');
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
