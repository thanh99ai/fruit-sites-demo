export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerName, phoneNumber, address, orderDetails } = req.body;

  // GOOGLE_SHEET_WEBHOOK_URL is the Web App URL from Google Apps Script
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;

  if (!webhookUrl) {
    return res.status(500).json({ error: 'Chưa cấu hình Google Sheet Webhook. Vui lòng liên hệ Admin.' });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        customerName,
        phoneNumber,
        address,
        orderDetails
      })
    });

    if (response.ok) {
      res.status(200).json({ success: true, message: 'Đã nhận thông tin đơn hàng. Nhân viên sẽ gọi lại sớm!' });
    } else {
      const errorText = await response.text();
      console.error("Webhook error:", errorText);
      res.status(500).json({ error: 'Lỗi khi gửi dữ liệu về Google Sheet.' });
    }
  } catch (error) {
    console.error("Order error:", error);
    res.status(500).json({ error: 'Lỗi hệ thống khi xử lý đơn hàng.' });
  }
}
