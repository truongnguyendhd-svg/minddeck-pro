export default async function handler(req, res) {
    // Chỉ cho phép phương thức POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { prompt } = req.body;
        // Lấy API Key từ biến môi trường của Vercel
        const apiKey = process.env.GEMINI_API_KEY; 

        if (!apiKey) {
            return res.status(500).json({ error: 'Lỗi Server: Chưa cấu hình GEMINI_API_KEY' });
        }

        // Gọi API của Google Gemini (Dùng model 1.5-flash hoặc 2.5-flash miễn phí, tốc độ cao)
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7 }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Lỗi từ Google Gemini');
        }

        // Trích xuất text từ response của Gemini
        const text = data.candidates[0].content.parts[0].text;
        
        return res.status(200).json({ result: text });

    } catch (error) {
        console.error("Gemini API Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
