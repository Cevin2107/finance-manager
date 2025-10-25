import OpenAI from 'openai';

// Khởi tạo Groq client (Primary - Free & Fast)
export const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.GROQ_API_KEY 
    ? 'https://api.groq.com/openai/v1'
    : 'https://api.openai.com/v1',
});

// Model sử dụng - Llama 3.3 70B (rất mạnh cho phân tích tài chính)
// Fallback sang GPT-4o-mini nếu không có Groq
export const AI_MODEL = process.env.GROQ_API_KEY 
  ? 'llama-3.3-70b-versatile'
  : 'gpt-4o-mini';

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
