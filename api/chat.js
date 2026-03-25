import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://9router.vuhai.io.vn/v1",
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    
    const response = await openai.chat.completions.create({
      model: "ces-chatbot-gpt-5.4",
      messages: [
        { role: "system", content: "You are the Concierge of 'The Orchard Editorial', a premium fruit store with 30 years of history. Answer in a polite, helpful, and premium tone." },
        { role: "user", content: message }
      ],
    });

    res.status(200).json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Failed to fetch response." });
  }
}
