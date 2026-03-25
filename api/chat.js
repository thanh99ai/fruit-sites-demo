import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://9router.vuhai.io.vn/v1", // OpenRouter-compatible endpoint
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body; // Gửi toàn bộ history (messages array)
    
    // Đọc dữ liệu từ chatbot_data.txt
    const dataPath = path.join(process.cwd(), 'chatbot_data.txt');
    const kbContent = fs.readFileSync(dataPath, 'utf8');

    const systemMessage = {
      role: "system",
      content: `Bạn là trợ lý AI độc quyền cho chuyên gia Mr Thanh.

KNOWLEDGE BASE:
${kbContent}

QUY TẮC TRẢ LỜI:
1. Chỉ được trả lời dựa trên Knowledge Base ở trên.
2. Luôn chào thân thiện.
3. Phải trả lời bằng định dạng Markdown đẹp (in đậm, danh sách thẻ, bảng nếu cần).
4. Trả lời rõ ràng, súc tích.
5. Kết thúc bằng lời mời quý khách hỏi thêm điều gì đó liên quan đến chuyên môn.
6. Nếu câu hỏi ngoài phạm vi kiến thức trên -> Hãy từ chối khéo léo và hướng dẫn khách hàng liên hệ Mr Thanh qua Email thanhle@gmail.com hoặc Zalo 0986298789.`
    };

    const response = await openai.chat.completions.create({
      model: "ces-chatbot-gpt-5.4",
      messages: [systemMessage, ...messages], // Combine system and history
    });

    res.status(200).json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Lỗi kết nối API. Quý khách vui lòng thử lại sau." });
  }
}
