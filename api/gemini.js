export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 1. LẤY CẢ PROMPT VÀ IMAGE TỪ FRONTEND
    const { prompt, image } = req.body;

    const keysString = process.env.GEMINI_API_KEYS; 
    if (!keysString) {
        return res.status(500).json({ error: 'Lỗi Server: Chưa cấu hình GEMINI_API_KEYS' });
    }

    const apiKeys = keysString.split(',').map(key => key.trim()).filter(key => key.length > 0);
    let startIndex = Math.floor(Math.random() * apiKeys.length);
    let lastErrorMessage = "";

    // 2. CHUẨN BỊ DỮ LIỆU GỬI LÊN GOOGLE (MULTIMODAL PAYLOAD)
    // Cấu trúc bắt buộc của Gemini khi nhận Text
    let partsArray = [{ text: prompt }];

    // NẾU FRONTEND GỬI ẢNH -> NHÉT THÊM ẢNH VÀO MẢNG PARTS
    if (image) {
        // Lọc chuỗi base64 (Cắt bỏ 'data:image/jpeg;base64,' nếu frontend lỡ gửi kèm)
        const cleanBase64 = image.includes(',') ? image.split(',')[1] : image;
        
        // Thêm Object chứa ảnh vào mảng
        partsArray.push({
            inlineData: {
                mimeType: "image/jpeg",
                data: cleanBase64
            }
        });
    }

    // 3. VÒNG LẶP THỬ TỪNG KEY
    for (let i = 0; i < apiKeys.length; i++) {
        const currentIndex = (startIndex + i) % apiKeys.length;
        const currentKey = apiKeys[currentIndex];

        try {
            // TRẢ LẠI MODEL gemini-3-flash-preview NHƯ YÊU CẦU CỦA BẠN
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${currentKey}`;
            
            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Truyền mảng partsArray (Đã chứa cả Text và Ảnh) vào request
                    contents: [{ parts: partsArray }], 
                    
                    // Vẫn nên giữ temperature thấp (0.2) để AI tập trung làm OCR, không bịa chữ
                    generationConfig: { temperature: 0.2 } 
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Lỗi từ Google Gemini');
            }

            const text = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ result: text });

        } catch (error) {
            console.warn(`⚠️ API Key thứ ${currentIndex + 1} thất bại:`, error.message);
            lastErrorMessage = error.message;
        }
    }

    console.error("❌ Tất cả API Keys đều đã cạn kiệt hoặc gặp lỗi.");
    return res.status(500).json({ 
        error: 'Hệ thống AI đang bận hoặc quá tải. Vui lòng thử lại sau!',
        detail: lastErrorMessage 
    });
}
