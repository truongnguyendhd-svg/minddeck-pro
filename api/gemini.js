export default async function handler(req, res) {
    // Chỉ cho phép phương thức POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt } = req.body;

    // 1. Lấy danh sách API Keys từ Vercel (LƯU Ý: Biến mới có chữ S ở cuối)
    const keysString = process.env.GEMINI_API_KEYS; 

    if (!keysString) {
        return res.status(500).json({ error: 'Lỗi Server: Chưa cấu hình GEMINI_API_KEYS' });
    }

    // Tách chuỗi thành mảng các key và loại bỏ khoảng trắng thừa
    const apiKeys = keysString.split(',').map(key => key.trim()).filter(key => key.length > 0);

    // 2. THUẬT TOÁN LUÂN CHUYỂN (Cân bằng tải & Dự phòng)
    // Chọn ngẫu nhiên 1 vị trí để bắt đầu (Giúp chia đều tải cho các key)
    let startIndex = Math.floor(Math.random() * apiKeys.length);
    let lastErrorMessage = "";

    // 3. Vòng lặp thử từng Key
    for (let i = 0; i < apiKeys.length; i++) {
        // Tính toán thứ tự key sẽ được dùng
        const currentIndex = (startIndex + i) % apiKeys.length;
        const currentKey = apiKeys[currentIndex];

        try {
            // Gọi API của Google Gemini bằng Key hiện tại
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${currentKey}`;
            
            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7 }
                })
            });

            const data = await response.json();

            // Nếu Key này bị lỗi (Quá giới hạn, block...), ném lỗi để nhảy sang catch
            if (!response.ok) {
                throw new Error(data.error?.message || 'Lỗi từ Google Gemini');
            }

            // Nếu THÀNH CÔNG: Trích xuất text và trả về ngay lập tức (Thoát vòng lặp)
            const text = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ result: text });

        } catch (error) {
            // NẾU THẤT BẠI: Ghi nhận lỗi và Vòng lặp sẽ tự động thử Key tiếp theo
            console.warn(`⚠️ API Key thứ ${currentIndex + 1} thất bại:`, error.message);
            lastErrorMessage = error.message;
        }
    }

    // 4. Báo lỗi nếu TẤT CẢ các Key đều thất bại
    console.error("❌ Tất cả API Keys đều đã cạn kiệt hoặc gặp lỗi.");
    return res.status(500).json({ 
        error: 'Hệ thống AI đang bận hoặc quá tải. Vui lòng thử lại sau!',
        detail: lastErrorMessage 
    });
}
