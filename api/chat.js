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
    const { messages, sessionId, currentUrl } = req.body; 

    // Đọc dữ liệu từ chatbot_data.txt
    const dataPath = path.join(process.cwd(), 'chatbot_data.txt');
    const kbContent = fs.readFileSync(dataPath, 'utf8');

    const systemMessage = {
      role: "system",
      content: `Bạn là trợ lý AI chuyên gia về Trái Cây Nhập Khẩu của Mr Thanh.

DỮ LIỆU CỐ ĐỊNH (Knowledge Base):
${kbContent}

QUY TẮC TRẢ LỜI & KIẾN THỨC CHUYÊN MÔN:
1. Sử dụng Knowledge Base là nền tảng, đồng thời kết hợp linh hoạt với kiến thức chuyên môn sâu rộng về ngành trái cây nhập khẩu trên thị trường hiện nay.
2. Câu trả lời phải logic, thực tế với hiện thực xã hội và thị trường.
3. Luôn chào quý khách thân thiện và giữ thái độ chuyên nghiệp của một chuyên gia lâu năm.
4. Phải trả lời bằng định dạng Markdown đẹp.
5. Trả lời rõ ràng, tập trung vào giá trị thực tế cho người tiêu dùng.
6. Kết thúc bằng lời mời quý khách hỏi thêm điều gì đó liên quan đến việc chọn mua hoặc bảo quản trái cây nhập khẩu.
7. QUY TẮC PHÁT HIỆN LEAD (BẮT BUỘC): Trong quá trình trò chuyện, nếu khách hàng cung cấp Tên, Số điện thoại hoặc Email, bạn PHẢI vừa trả lời họ bình thường, vừa tự phân tích xem họ quan tâm sản phẩm gì (interest) và đánh giá mức độ sẵn sàng mua hàng (intent_level: hot, warm, cold). Sau đó chèn thêm một đoạn mã JSON vào cuối cùng của câu trả lời theo đúng định dạng sau:
||LEAD_DATA: {"name": "...", "phone": "...", "email": "...", "interest": "...", "intent_level": "..."}||
Nếu thông tin nào chưa có, hãy để null. TUYỆT ĐỐI KHÔNG giải thích hay đề cập đến đoạn mã này cho người dùng.`
    };

    const response = await openai.chat.completions.create({
      model: "ces-chatbot-gpt-5.4",
      messages: [systemMessage, ...messages],
    });

    let botReply = response.choices[0].message.content;
    const dataPattern = /\|\|LEAD_DATA:\s*(\{[\s\S]*?\})\s*\|\|/;
    const removePattern = /\|\|LEAD_DATA:\s*(\{[\s\S]*?\})\s*\|\|/g;

    // XỬ LÝ PROXY DỮ LIỆU LÊN GOOGLE SHEETS TỪ BACKEND
    if (botReply.includes("||LEAD_DATA:") && process.env.GOOGLE_SCRIPT_URL) {
      const match = botReply.match(dataPattern);
      if (match && match[1]) {
        try {
          const leadData = JSON.parse(match[1]);
          if (leadData.name || leadData.phone || leadData.email) {
            // Định dạng lịch sử chat
            const formattedHistory = messages.map(msg => {
              let role = msg.role === 'user' ? 'Khách' : 'AI';
              return `${role}: ${msg.content.replace(removePattern, "").trim()}`;
            }).join('\n\n') + `\n\nAI (Latest): ${botReply.replace(removePattern, "").trim()}`;

            // Gửi Proxy và chờ phản hồi để đảm bảo Vercel không đóng function quá sớm
            try {
              await fetch(process.env.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...leadData,
                  source: currentUrl || 'Chatbot Proxy',
                  sessionId: sessionId || 'N/A',
                  chatHistory: formattedHistory,
                  timestamp: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
                })
              });
            } catch (e) {
              console.error("Proxy error:", e);
            }
          }
        } catch (e) { console.error("Backend Parse Lead error:", e); }
      }
      // Xóa tag khỏi câu trả lời trả về frontend
      botReply = botReply.replace(removePattern, "").trim();
    }

    res.status(200).json({ reply: botReply });
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Lỗi kết nối API. Quý khách vui lòng thử lại sau." });
  }
}
