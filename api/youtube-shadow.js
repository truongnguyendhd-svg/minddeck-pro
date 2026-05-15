// api/youtube-shadow.js

// =========================================================================
// HÀM GỌI GEMINI XOAY VÒNG KEY (GIỮ NGUYÊN BẢN CHUẨN CỦA BẠN)
// =========================================================================
async function translateWithGemini(promptText) {
    const keysString = process.env.GEMINI_API_KEYS; 
    if (!keysString) throw new Error('Chưa cấu hình GEMINI_API_KEYS trên Vercel');

    const apiKeys = keysString.split(',').map(key => key.trim()).filter(key => key.length > 0);
    let startIndex = Math.floor(Math.random() * apiKeys.length);
    let lastErrorMessage = "";

    for (let i = 0; i < apiKeys.length; i++) {
        const currentIndex = (startIndex + i) % apiKeys.length;
        const currentKey = apiKeys[currentIndex];

        try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${currentKey}`;
            
            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }], 
                    generationConfig: { 
                        temperature: 0.2,
                        maxOutputTokens: 8192
                    } 
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || 'Lỗi từ Google Gemini');

            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            console.warn(`⚠️ Key thứ ${currentIndex + 1} thất bại:`, error.message);
            lastErrorMessage = error.message;
        }
    }
    throw new Error('Hệ thống AI đang bận. Lỗi cuối: ' + lastErrorMessage);
}
// =========================================================================

module.exports = async (req, res) => {
    // 1. CẤU HÌNH CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // Chỉ nhận POST
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Chỉ hỗ trợ POST method' });

    // 2. NHẬN DỮ LIỆU TỪ FRONTEND (Frontend đã tự cắt Chunk và gửi lên)
    const { chunkData } = req.body;

    if (!chunkData || !Array.isArray(chunkData) || chunkData.length === 0) {
        return res.status(400).json({ error: 'Dữ liệu Subtitle (Chunk) gửi lên không hợp lệ hoặc rỗng.' });
    }

    try {
        // 3. TẠO PROMPT DỊCH THUẬT
        // Chỉ gửi ID và original text để tiết kiệm tối đa Token
        const rawTextForAI = chunkData.map(item => ({
            id: item.id,
            original: item.original
        }));

        const prompt = `Bạn là chuyên gia ngôn ngữ tiếng Nhật. Dưới đây là các mảnh vỡ phụ đề video.
        NHIỆM VỤ:
        1. Đọc hiểu toàn bộ để nối các mảnh vụn thành những câu nói có nghĩa hoàn chỉnh của người Việt. 
        2. Cứ mỗi khi hết một câu trọn vẹn (có dấu chấm hoặc dứt ý), hãy tạo một dòng mới.
        3. Dịch các câu hoàn chỉnh đó sang tiếng Nhật tự nhiên.
        4. Trả về mảng JSON. 
        
        LƯU Ý: Mốc 'start' là của mảnh đầu tiên, mốc 'end' là của mảnh cuối cùng trong câu đó.
        
        Dữ liệu: ${JSON.stringify(chunkData)}
        Trả về format: [{"start": 0, "end": 5, "original": "Câu hoàn chỉnh", "japanese": "Bản dịch Nhật"}]`;

        // 4. GỌI AI
        const aiRawText = await translateWithGemini(prompt);

        // 5. BÓC TÁCH KẾT QUẢ
        const cleanJsonStr = aiRawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const translatedArray = JSON.parse(cleanJsonStr);

        // 6. GỘP (MERGE) BẢN DỊCH VÀO CHUNK GỐC VÀ TRẢ VỀ FRONTEND
        const finalData = chunkData.map(line => {
            const aiTranslation = translatedArray.find(t => t.id === line.id);
            return {
                ...line, // Giữ nguyên start, end, original
                japanese: aiTranslation ? aiTranslation.japanese : line.original 
            };
        });

        res.status(200).json({ data: finalData });

    } catch (error) {
        console.error("Lỗi Dịch Subtitle AI:", error);
        res.status(500).json({ error: error.message });
    }
};
