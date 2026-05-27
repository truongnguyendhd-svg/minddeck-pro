
export const config = {
  runtime: 'edge', // Kích hoạt môi trường Edge để chạy không giới hạn 10s
};

export default async function handler(req) {
  // 1. CHỈ CHẤP NHẬN PHƯƠNG THỨC POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // LẤY PROMPT VÀ MẢNG IMAGE(S) TỪ FRONTEND (Sử dụng await req.json())
    const body = await req.json();
    const { prompt, images } = body;

    const keysString = process.env.GEMINI_API_KEYS; 
    if (!keysString) {
      return new Response(JSON.stringify({ error: 'Lỗi Server: Chưa cấu hình GEMINI_API_KEYS' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKeys = keysString.split(',').map(key => key.trim()).filter(key => key.length > 0);
    let startIndex = Math.floor(Math.random() * apiKeys.length);
    let lastErrorMessage = "";

    // 2. CHUẨN BỊ DỮ LIỆU GỬI LÊN GOOGLE
    let partsArray = [{ text: prompt }];

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

    // 3. VÒNG LẶP XOAY TUA THỬ TỪNG KEY
    for (let i = 0; i < apiKeys.length; i++) {
      const currentIndex = (startIndex + i) % apiKeys.length;
      const currentKey = apiKeys[currentIndex];

      try {
        // Giữ nguyên model gemini-3-flash-preview theo cấu hình cũ của bạn
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${currentKey}`;
        
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: partsArray }], 
            generationConfig: { 
              temperature: 0.2,
              maxOutputTokens: 8192 // Cho phép AI trả lời dài tối đa
            } 
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Lỗi từ Google Gemini');
        }

        const text = data.candidates[0].content.parts[0].text;
        
        // Trả kết quả thành công về cho Frontend (Dùng Response chuẩn Web)
        return new Response(JSON.stringify({ result: text }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.warn(`⚠️ API Key thứ ${currentIndex + 1} thất bại:`, error.message);
        lastErrorMessage = error.message;
      }
    }

    console.error("❌ Tất cả API Keys đều đã cạn kiệt hoặc gặp lỗi.");
    return new Response(JSON.stringify({ 
      error: 'Hệ thống AI đang bận hoặc quá tải. Vui lòng thử lại sau!',
      detail: lastErrorMessage 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
