// HÀM CÀO SUBTITLE YOUTUBE (PHIÊN BẢN ĐỌC PLAYER RESPONSE CHUẨN)
async function fetchYoutubeTranscript(videoId) {
    // 1. Gọi request đóng giả trình duyệt
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cookie': 'CONSENT=YES+cb.20230509-06-p0.en+FX+804'
        }
    });
    
    if (!response.ok) throw new Error("Không thể kết nối đến YouTube");
    const html = await response.text();

    // 2. TÌM BỘ NÃO CỦA PLAYER (ytInitialPlayerResponse)
    // Đây là cục JSON khổng lồ chứa toàn bộ data của video
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+meta|<\/script|\n)/);
    
    if (!playerResponseMatch) {
        throw new Error("Bị YouTube chặn hoặc không tìm thấy dữ liệu video.");
    }

    const playerResponse = JSON.parse(playerResponseMatch[1]);

    // 3. TRUY XUẤT CÂY THƯ MỤC TÌM PHỤ ĐỀ
    const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!tracks || tracks.length === 0) {
        throw new Error("Video này không có phụ đề ẩn (CC).");
    }

    // 4. ƯU TIÊN LẤY SUB TIẾNG NHẬT
    // - Ưu tiên 1: Tiếng Nhật do người làm (không có thuộc tính kind="asr")
    // - Ưu tiên 2: Tiếng Nhật do Youtube tạo tự động (kind="asr")
    // - Ưu tiên 3: Lấy đại Sub đầu tiên có trong danh sách
    let selectedTrack = 
        tracks.find(t => t.languageCode === 'ja' && !t.kind) || 
        tracks.find(t => t.languageCode === 'ja' && t.kind === 'asr') || 
        tracks[0];

    // 5. TẢI FILE XML VỀ
    const xmlResponse = await fetch(selectedTrack.baseUrl);
    const xml = await xmlResponse.text();

    // 6. BÓC TÁCH XML THÀNH ARRAY THỜI GIAN VÀ TEXT
    const textRegex = /<text start="([\d.]+)"(?: dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
    let result = [];
    let m;
    
    while ((m = textRegex.exec(xml)) !== null) {
        const start = parseFloat(m[1]);
        const dur = m[2] ? parseFloat(m[2]) : 0.0;
        const text = m[3]
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
            .replace(/<[^>]+>/g, '') 
            .replace(/\n/g, ' '); 
        
        // Bỏ qua các đoạn sub trống
        if (text.trim().length > 0) {
            result.push({ offset: start, duration: dur, text: text });
        }
    }

    if (result.length === 0) throw new Error("Phụ đề bị rỗng.");
    return result;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt, images, videoId } = req.body;

    const keysString = process.env.GEMINI_API_KEYS; 
    if (!keysString) {
        return res.status(500).json({ error: 'Lỗi Server: Chưa cấu hình GEMINI_API_KEYS' });
    }

    const apiKeys = keysString.split(',').map(key => key.trim()).filter(key => key.length > 0);
    let startIndex = Math.floor(Math.random() * apiKeys.length);
    let lastErrorMessage = "";

    // ================= XỬ LÝ SUBTITLE YOUTUBE =================
    let finalPrompt = prompt;

    if (videoId) {
        try {
            const transcriptData = await fetchYoutubeTranscript(videoId);
            
            // Format Subtitle
            const formattedSubtitles = transcriptData.map(t => 
                `[${t.offset}s - ${(t.offset + t.duration).toFixed(1)}s]: ${t.text}`
            ).join('\n');

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

    // ================= CHUẨN BỊ PAYLOAD =================
    let partsArray = [{ text: finalPrompt }];

    if (images && Array.isArray(images) && images.length > 0) {
        images.forEach(imgString => {
            const cleanBase64 = imgString.includes(',') ? imgString.split(',')[1] : imgString;
            partsArray.push({
                inlineData: {
                    mimeType: "image/jpeg",
                    data: cleanBase64
                }
            });
        });
    }

    // ================= GỌI GEMINI API =================
    for (let i = 0; i < apiKeys.length; i++) {
        const currentIndex = (startIndex + i) % apiKeys.length;
        const currentKey = apiKeys[currentIndex];

        try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${currentKey}`;
            
            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: partsArray }], 
                    generationConfig: { 
                        temperature: 0.2,
                        maxOutputTokens: 8192 
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
