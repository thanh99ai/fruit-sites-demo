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
      content: `Bạn là trợ lý AI chuyên gia về Trái Cây Nhập Khẩu của Mr Thanh.

DỮ LIỆU CỐ ĐỊNH (Knowledge Base):
${kbContent}

QUY TẮC TRẢ LỜI & KIẾN THỨC CHUYÊN MÔN:
1. Sử dụng Knowledge Base là nền tảng, đồng thời kết hợp linh hoạt với kiến thức chuyên môn sâu rộng về ngành trái cây nhập khẩu trên thị trường hiện nay.
2. Câu trả lời phải logic, thực tế với hiện thực xã hội và thị trường (mùa vụ, chất lượng, nguồn gốc xuất xứ từ Úc, Mỹ, New Zealand, Nhật Bản...).
3. Luôn chào quý khách thân thiện và giữ thái độ chuyên nghiệp của một chuyên gia lâu năm.
4. Phải trả lời bằng định dạng Markdown đẹp (in đậm, danh sách thẻ, bảng so sánh giá/mùa vụ nếu cần).
5. Trả lời rõ ràng, tập trung vào giá trị thực tế cho người tiêu dùng.
6. Kết thúc bằng lời mời quý khách hỏi thêm điều gì đó liên quan đến việc chọn mua hoặc bảo quản trái cây nhập khẩu.
7. ĐẶC BIỆT (QUAN TRỌNG): Khi khách hàng đã cung cấp đủ thông tin (Tên, SĐT, Địa chỉ, Sản phẩm) và xác nhận "Chốt đơn" hoặc "Gửi cho sale", bạn PHẢI trả lời xác nhận và KÈM THEO đoạn mã sau ở cuối câu trả lời (không thêm bất kỳ text nào khác sau mã này):
@order_submit{"customerName": "Tên khách", "phoneNumber": "SĐT", "orderDetails": "Chi tiết đơn hàng"}`
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
