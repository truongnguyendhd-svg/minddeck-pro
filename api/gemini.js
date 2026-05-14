// Hàm cào Subtitle ẩn danh phiên bản "Bọc thép" (Vượt rào Cookie & Regex kép)
async function fetchYoutubeTranscript(videoId) {
    // BƯỚC 1: Gắn Cookie thần thánh để lách màn hình "Đồng ý điều khoản" của Youtube trên Server Vercel
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cookie': 'CONSENT=YES+cb.20230509-06-p0.en+FX+804' // <-- CHÌA KHÓA QUAN TRỌNG NHẤT
        }
    });
    
    if (!response.ok) throw new Error("Không thể kết nối đến YouTube");
    const html = await response.text();

    // BƯỚC 2: Tìm mảng chứa danh sách Subtitle (Xử lý cả 2 trường hợp Youtube mã hóa và không mã hóa)
    let captionTracks = [];
    
    // Thử cách 1: Tìm chuỗi JSON bình thường
    const regexNormal = /"captionTracks":(\[.*?\])/;
    const matchNormal = regexNormal.exec(html);
    
    if (matchNormal) {
        captionTracks = JSON.parse(matchNormal[1]);
    } else {
        // Thử cách 2: Tìm chuỗi JSON bị Youtube mã hóa (escaped)
        const regexEscaped = /\\"captionTracks\\":(\[.*?\])/;
        const matchEscaped = regexEscaped.exec(html);
        if (matchEscaped) {
            const unescapedStr = matchEscaped[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            captionTracks = JSON.parse(unescapedStr);
        }
    }

    if (!captionTracks || captionTracks.length === 0) {
        throw new Error("Không tìm thấy dải phụ đề. Hãy chắc chắn video có biểu tượng [CC] trên YouTube.");
    }

    // BƯỚC 3: Ưu tiên lấy Sub tiếng Nhật (ja), nếu không có thì lấy tiếng Anh (en) hoặc Sub đầu tiên (tự động)
    let selectedTrack = captionTracks.find(t => t.languageCode.includes('ja')) 
                     || captionTracks.find(t => t.languageCode.includes('en')) 
                     || captionTracks[0];

    // BƯỚC 4: Tải file XML chứa Text và Thời gian về
    const xmlResponse = await fetch(selectedTrack.baseUrl);
    const xml = await xmlResponse.text();

    // BƯỚC 5: Gọt sạch XML rác, chuyển thành mảng Array đẹp đẽ
    const textRegex = /<text start="([\d.]+)"(?: dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
    let result = [];
    let m;
    while ((m = textRegex.exec(xml)) !== null) {
        const start = parseFloat(m[1]);
        const dur = m[2] ? parseFloat(m[2]) : 0.0;
        // Chống lỗi ký tự đặc biệt của HTML
        const text = m[3]
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
            .replace(/<[^>]+>/g, '') 
            .replace(/\n/g, ' '); 
        
        result.push({ offset: start, duration: dur, text: text });
    }

    if (result.length === 0) throw new Error("File phụ đề bị rỗng.");
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

    // ================= TÍNH NĂNG CÀO SUBTITLE YOUTUBE =================
    let finalPrompt = prompt;

    if (videoId) {
        try {
            const transcriptData = await fetchYoutubeTranscript(videoId);
            
            // Format Subtitle thành chuỗi văn bản kèm theo Timestamp
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

    // ================= CHUẨN BỊ PAYLOAD GỬI GEMINI =================
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
