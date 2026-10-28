export const config = {
  runtime: 'edge', // Kích hoạt môi trường Edge chạy không giới hạn 10s
};

export default async function handler(req) {
  // Cấu hình CORS Headers tiêu chuẩn giống Worker
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Xử lý Preflight Request từ trình duyệt
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 1. CHỈ CHẤP NHẬN PHƯƠNG THỨC POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { prompt, images } = body;

    const keysString = process.env.GEMINI_API_KEYS; 
    if (!keysString) {
      return new Response(JSON.stringify({ error: 'Lỗi Server: Chưa cấu hình biến môi trường GEMINI_API_KEYS' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const apiKeys = keysString.split(',').map(key => key.trim()).filter(key => key.length > 0);
    let startIndex = Math.floor(Math.random() * apiKeys.length);
    let lastErrorMessage = "";

    // 2. CHUẨN BỊ DỮ LIỆU GỬI LÊN GOOGLE
    let partsArray = [{ text: prompt }];

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

    // 3. VÒNG LẶP XOAY TUA THỬ TỪNG KEY
    for (let i = 0; i < apiKeys.length; i++) {
      const currentIndex = (startIndex + i) % apiKeys.length;
      const currentKey = apiKeys[currentIndex];

      try {
        // Mẹo tự động hạ cấp xuống model ổn định nếu model preview bị chặn
        const modelName = i > 0 ? "gemini-3.5-flash" : "gemini-3-flash-preview";
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${currentKey}`;
        
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

        // Nếu API key lỗi, parse lỗi chi tiết để đưa vào log
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error?.message || `Lỗi HTTP ${response.status} từ Google Gemini`);
        }

        // Trả trực tiếp luồng Stream kèm CORS headers đầy đủ
        return new Response(response.body, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
          }
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
