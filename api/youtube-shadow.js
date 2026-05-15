// api/youtube-shadow.js
const { Innertube } = require('youtubei.js');

// Cache InnerTube instance để Vercel chạy nhanh hơn ở các request tiếp theo
let youtubeInstance = null;

// =========================================================================
// HÀM GỌI GEMINI (TÍCH HỢP VÒNG XOAY API KEY Y HỆT FILE CỦA BẠN)
// =========================================================================
async function translateWithGemini(promptText) {
    const keysString = process.env.GEMINI_API_KEYS; 
    if (!keysString) {
        throw new Error('Chưa cấu hình GEMINI_API_KEYS trên Vercel');
    }

    const apiKeys = keysString.split(',').map(key => key.trim()).filter(key => key.length > 0);
    let startIndex = Math.floor(Math.random() * apiKeys.length);
    let lastErrorMessage = "";

    for (let i = 0; i < apiKeys.length; i++) {
        const currentIndex = (startIndex + i) % apiKeys.length;
        const currentKey = apiKeys[currentIndex];

        try {
            // Dùng đúng model gemini-3-flash-preview như cấu hình của bạn
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

            if (!response.ok) {
                throw new Error(data.error?.message || 'Lỗi từ Google Gemini');
            }

            // Trả về text thành công
            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            console.warn(`⚠️ API Key thứ ${currentIndex + 1} thất bại, đang thử Key tiếp theo... Lỗi:`, error.message);
            lastErrorMessage = error.message;
        }
    }

    throw new Error('Hệ thống AI đang bận hoặc cạn kiệt Key. Lỗi cuối: ' + lastErrorMessage);
}
// =========================================================================

module.exports = async (req, res) => {
    // 1. CẤU HÌNH CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Nhận params từ URL hoặc Body
    const videoId = req.query.v || req.body?.v;
    const chunkIndex = parseInt(req.query.chunk || req.body?.chunk || 0);

    if (!videoId) {
        return res.status(400).json({ error: 'Thiếu Video ID.' });
    }

    try {
        // 2. KHỞI TẠO INNER-TUBE PROXY
        if (!youtubeInstance) {
            youtubeInstance = await Innertube.create({ gl: 'VN', hl: 'vi' });
        }
        
        // 3. KẾT NỐI VÀ LẤY THÔNG TIN VIDEO
        const info = await youtubeInstance.getInfo(videoId);
        
        const captionTracks = info.captions?.caption_tracks;
        if (!captionTracks || captionTracks.length === 0) {
            return res.status(404).json({ error: 'Video này không có Subtitle. Vui lòng chọn video khác!' });
        }

        // Tìm sub tiếng Nhật (ja), nếu không có tìm tiếng Anh (en), nếu không có lấy đại cái đầu tiên (thường là Auto-gen)
        const track = captionTracks.find(t => t.language_code === 'ja') || 
                      captionTracks.find(t => t.language_code === 'en') || 
                      captionTracks[0];
        
        // Gọi lấy transcript kèm theo xử lý lỗi sâu hơn
        let transcriptData;
        try {
            transcriptData = await info.getTranscript(); 
        } catch (e) {
            // Fallback: nếu gọi getTranscript() không tham số lỗi, thử dùng vss_id của track đã tìm
            transcriptData = await info.getTranscript(track.vss_id);
        }

        if (!transcriptData || !transcriptData.transcript || !transcriptData.transcript.content) {
            return res.status(404).json({ error: 'Không thể đọc được dữ liệu Subtitle của video này.' });
        }

        // 4. BÓC TÁCH & CHIA CHUNK (LAZY LOADING - 2 phút / chunk)
        const allLines = transcriptData.transcript.content.body.initial_segments;
        const chunkSize = 120; // 120 giây = 2 phút
        const startTimeWindow = chunkIndex * chunkSize;
        const endTimeWindow = (chunkIndex + 1) * chunkSize;

        let chunkLines = [];
        let rawTextForAI = [];

        // Lọc các câu thuộc chunk hiện tại
        allLines.forEach((line, index) => {
            const startSec = parseInt(line.start_ms) / 1000;
            const durationSec = parseInt(line.duration_ms) / 1000;

            if (startSec >= startTimeWindow && startSec < endTimeWindow) {
                const text = line.snippet.text.trim();
                if (text) {
                    chunkLines.push({
                        id: index,
                        start: startSec,
                        end: startSec + durationSec,
                        original: text
                    });
                    rawTextForAI.push({ id: index, original: text });
                }
            }
        });

        if (chunkLines.length === 0) {
            return res.status(200).json({ 
                isEnd: true, 
                message: 'Đã hết video.',
                data: [] 
            });
        }

        // 5. CHUẨN BỊ PROMPT VÀ GỌI AI BẰNG HÀM VỪA TẠO Ở TRÊN
        const prompt = `Đóng vai trò là chuyên gia ngôn ngữ tiếng Nhật. Dưới đây là phụ đề của một video (ngôn ngữ gốc có thể là tiếng Anh, Pháp, Hàn, Việt...). Ngôn ngữ mà người dùng thường dùng để hiểu là tiếng Việt.
        Nhiệm vụ của bạn:
        1. Tự động nhận diện ngôn ngữ gốc của video.
        2. Dịch từng dòng sang tiếng Nhật Bản một cách tự nhiên (phù hợp văn cảnh giao tiếp).
        3. BẮT BUỘC giữ nguyên ID của từng dòng.
        
        Dữ liệu đầu vào:
        ${JSON.stringify(rawTextForAI)}
        
        BẮT BUỘC trả về ĐÚNG MỘT MẢNG JSON theo định dạng sau (Không giải thích thêm, không dùng markdown block):
        [
          {"id": 0, "japanese": "Bản dịch tiếng Nhật"},
          {"id": 1, "japanese": "Bản dịch tiếng Nhật"}
        ]`;

        const aiRawText = await translateWithGemini(prompt);

        // 6. XỬ LÝ LÀM SẠCH KẾT QUẢ TỪ AI
        const cleanJsonStr = aiRawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const translatedArray = JSON.parse(cleanJsonStr);

        // 7. GỘP (MERGE) BẢN DỊCH CỦA AI VỚI MỐC THỜI GIAN GỐC
        const finalData = chunkLines.map(line => {
            const aiTranslation = translatedArray.find(t => t.id === line.id);
            return {
                start: line.start,
                end: line.end,
                original: line.original,
                japanese: aiTranslation ? aiTranslation.japanese : line.original 
            };
        });

        // 8. TRẢ VỀ CHO FRONTEND
        res.status(200).json({
            isEnd: false,
            videoTitle: info.basic_info.title, 
            data: finalData
        });

    } catch (error) {
        console.error("Lỗi Backend YouTube:", error);
        res.status(500).json({ error: error.message });
    }
};
