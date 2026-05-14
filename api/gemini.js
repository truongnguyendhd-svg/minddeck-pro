// KHÔNG CẦN IMPORT THƯ VIỆN NỮA - TỰ VIẾT HÀM SCRAPING BẰNG JS THUẦN

// Hàm cào Subtitle ẩn danh (Giả lập Chrome để vượt rào YouTube)
async function fetchYoutubeTranscript(videoId) {
    // Bước 1: Lấy HTML của trang Youtube
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7' // Gợi ý Youtube ưu tiên trả sub Nhật nếu có
        }
    });
    
    if (!response.ok) throw new Error("Không thể kết nối đến YouTube");
    const html = await response.text();

    // Bước 2: Dùng Regex moi cục JSON chứa danh sách link Subtitle
    const captionRegex = /"captionTracks":(\[.*?\])/;
    const match = captionRegex.exec(html);
    if (!match) throw new Error("Video này không có phụ đề (CC) hoặc bị khóa bản quyền.");

    const tracks = JSON.parse(match[1]);
    if (!tracks || tracks.length === 0) throw new Error("Video không có dải phụ đề nào.");

    // Bước 3: Ưu tiên tìm Sub tiếng Nhật (ja), nếu không có lấy Sub đầu tiên (thường là Auto-generated)
    let selectedTrack = tracks.find(t => t.languageCode.includes('ja')) || tracks[0];

    // Bước 4: Tải file XML Subtitle về
    const xmlResponse = await fetch(selectedTrack.baseUrl);
    const xml = await xmlResponse.text();

    // Bước 5: Bóc tách XML bằng Regex thành dạng Array Object
    const textRegex = /<text start="([\d.]+)"(?: dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
    let result = [];
    let m;
    while ((m = textRegex.exec(xml)) !== null) {
        const start = parseFloat(m[1]);
        const dur = m[2] ? parseFloat(m[2]) : 0.0;
        // Giải mã các ký tự HTML đặc biệt (VD: &amp; -> &)
        const text = m[3]
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
            .replace(/<[^>]+>/g, ''); // Cắt bỏ các tag html rác lồng bên trong
        
        result.push({ offset: start, duration: dur, text: text });
    }

    return result;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 1. LẤY PROMPT, MẢNG IMAGE(S) VÀ VIDEO ID TỪ FRONTEND
    const { prompt, images, videoId } = req.body;

    const keysString = process.env.GEMINI_API_KEYS; 
    if (!keysString) {
        return res.status(500).json({ error: 'Lỗi Server: Chưa cấu hình GEMINI_API_KEYS' });
    }

    const apiKeys = keysString.split(',').map(key => key.trim()).filter(key => key.length > 0);
    let startIndex = Math.floor(Math.random() * apiKeys.length);
    let lastErrorMessage = "";

    // ================= TÍNH NĂNG MỚI: CÀO SUBTITLE YOUTUBE (TỰ VIẾT) =================
    let finalPrompt = prompt;

    if (videoId) {
        try {
            // Gọi hàm tự viết thay vì dùng thư viện
            const transcriptData = await fetchYoutubeTranscript(videoId);
            
            // Format Subtitle thành chuỗi văn bản kèm theo Timestamp
            const formattedSubtitles = transcriptData.map(t => 
                `[${t.offset}s - ${(t.offset + t.duration).toFixed(1)}s]: ${t.text}`
            ).join('\n');

            // Nối Subtitle vừa cào được vào Prompt để Gemini dịch
            finalPrompt = `
                ${prompt}
                
                DƯỚI ĐÂY LÀ PHỤ ĐỀ GỐC CỦA VIDEO KÈM THEO THỜI GIAN (TÍNH BẰNG GIÂY):
                ---
                ${formattedSubtitles}
                ---
            `;
        } catch (err) {
            console.error("Lỗi cào Youtube nội bộ:", err.message);
            return res.status(400).json({ error: `Lỗi từ Youtube: ${err.message}` });
        }
    }
    // ========================================================================

    // 2. CHUẨN BỊ DỮ LIỆU GỬI LÊN GOOGLE (Sử dụng finalPrompt thay vì prompt)
    let partsArray = [{ text: finalPrompt }];

    // NẾU CÓ ẢNH (MẢNG) -> DÙNG VÒNG LẶP ĐỂ THÊM VÀO
    if (images && Array.isArray(images) && images.length > 0) {
        images.forEach(imgString => {
            // Lọc chuỗi base64 (Cắt bỏ 'data:image/jpeg;base64,')
            const cleanBase64 = imgString.includes(',') ? imgString.split(',')[1] : imgString;
            
            partsArray.push({
                inlineData: {
                    mimeType: "image/jpeg",
                    data: cleanBase64
                }
            });
        });
    }

    // 3. VÒNG LẶP THỬ TỪNG KEY
    for (let i = 0; i < apiKeys.length; i++) {
        const currentIndex = (startIndex + i) % apiKeys.length;
        const currentKey = apiKeys[currentIndex];

        try {
            // GIỮ NGUYÊN MODEL CỦA BẠN
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${currentKey}`;
            
            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: partsArray }], 
                    generationConfig: { 
                        temperature: 0.2,
                        maxOutputTokens: 8192 // GIỮ NGUYÊN LƯỢNG TOKENS CỦA BẠN
                    } 
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
