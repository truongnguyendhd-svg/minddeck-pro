// api/groq.js

export default async function handler(req, res) {
    // 1. Cấu hình CORS cơ bản
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Chỉ chấp nhận phương thức POST' });
    }

    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Thiếu dữ liệu prompt' });
        }

        // ==========================================
        // 2. THUẬT TOÁN XOAY TUA API KEY (ROTATION)
        // ==========================================
        const rawKeys = process.env.GROQ_API_KEYS;
        if (!rawKeys) {
            throw new Error("Chưa cấu hình GROQ_API_KEYS trên Vercel");
        }

        // Tách chuỗi thành mảng và loại bỏ khoảng trắng thừa
        const apiKeys = rawKeys.split(',').map(key => key.trim()).filter(Boolean);
        
        // Chọn ngẫu nhiên 1 key trong mảng
        const randomKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

        // ==========================================
        // 3. GỌI GROQ API (Chuẩn OpenAI Endpoint)
        // ==========================================
        // Dùng model llama3-70b-8192 vì nó xử lý tiếng Nhật và JSON tốt nhất trên Groq hiện tại
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${randomKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama3-70b-8192",
                messages: [
                    {
                        "role": "system",
                        "content": "You are an API that strictly returns pure JSON arrays. Never include markdown formatting like ```json or any conversational text."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature: 0.1, // Giữ độ sáng tạo thấp để kết quả JSON ổn định
                max_tokens: 2000
            })
        });

        const data = await groqResponse.json();

        if (!groqResponse.ok) {
            throw new Error(data.error?.message || 'Lỗi từ máy chủ Groq');
        }

        // Trích xuất nội dung trả về
        const resultText = data.choices[0].message.content;

        return res.status(200).json({ result: resultText });

    } catch (error) {
        console.error("Lỗi Backend Groq:", error);
        return res.status(500).json({ error: error.message });
    }
}
