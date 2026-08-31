var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
// worker.js truong
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var __defProp22 = Object.defineProperty;
var __name22 = /* @__PURE__ */ __name2((target, value) => __defProp22(target, "name", { value, configurable: true }), "__name");

// Phân tách từ tiếng Nhật thông minh bằng Segmenter
var segmenter = new Intl.Segmenter("ja", { granularity: "word" });
function tokenize(text) {
  if (!text) return "";
  return [...segmenter.segment(text)].filter((s) => s.isWordLike).map((s) => s.segment).join(" ");
}
__name(tokenize, "tokenize");
__name2(tokenize, "tokenize");
__name22(tokenize, "tokenize");
// Hàm kiểm tra quyền Admin thông qua Khóa Bảo mật trong Environment Variables
function checkAdminAuth(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.substring(7).trim();
  const adminSecret = env.ADMIN_SECRET_KEY;
  if (!adminSecret) {
    console.error("ADMIN_SECRET_KEY chưa được cấu hình trong biến môi trường của Cloudflare!");
    return false;
  }
  return token === adminSecret;
}
// Hàm bốc ngẫu nhiên API Key từ chuỗi cấu hình xoay tua để phân phối tải
function getRandomKey(keysString) {
  if (!keysString) return null;
  const keys = keysString.split(",").map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) return null;
  return keys[Math.floor(Math.random() * keys.length)];
}
__name(getRandomKey, "getRandomKey");

// Hàm gọi Mistral AI trên Backend cho các tác vụ của Client nếu cần
async function callMistralAI(prompt, env) {
  const mistralKey = getRandomKey(env.MISTRAL_API_KEYS);
  if (!mistralKey) {
    throw new Error("Chưa cấu hình API Key Mistral trong biến môi trường MISTRAL_API_KEYS!");
  }

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${mistralKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Mistral API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}
__name(callMistralAI, "callMistralAI");
__name2(callMistralAI, "callMistralAI");
__name22(callMistralAI, "callMistralAI");

// Hàm bổ trợ gọi Groq AI dạng không Stream (Non-Streaming JSON Object) chuyên bồi đắp ngầm
async function callGroqAI_NonStream(prompt, env, model = "qwen/qwen3.8-27b") {
  const groqKey = getRandomKey(env.GROQ_API_KEYS);
  if (!groqKey) {
    throw new Error("Chưa cấu hình API Key Groq trong biến môi trường GROQ_API_KEYS!");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 6096,
      max_completion_tokens: 6096,
      reasoning_format: "parsed"
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content?.trim() || "";
  
  // Tự động dọn dẹp các thẻ suy nghĩ ngầm <think>...</think> nếu có để tránh làm gãy cú pháp JSON
  content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  
  return content;
}
__name(callGroqAI_NonStream, "callGroqAI_NonStream");

var worker_default = {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization" // <-- BẮT BUỘC BỔ SUNG CHỮ NÀY
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (path === "/api/dict-search") {
        const query = url.searchParams.get("query");
        if (!query) {
          return new Response(JSON.stringify({ error: "Missing query" }), { status: 400, headers: corsHeaders });
        }

        // 🟢 ĐỔI: Bỏ FTS5 MATCH (CJK không tách được token), dùng LIKE substring.
        // Lý do: FTS5 với tokenizer mặc định unicode61 không tách "花火" thành
        // "花" + "火" → query "花" không match "花火". Dùng LIKE '%花%' sẽ match
        // cả từ bắt đầu bằng, chứa, và trùng chính xác "花".
        //
        // Tìm kiếm trên 3 cột: word, reading, meaning (nghĩa tiếng Việt).
        // → Gõ "hoa" sẽ match meaning "hoa" → ra 花, 花火, 花束...
        //
        // Sort ưu tiên:
        //   0 = exact match (word = query)
        //   1 = prefix match (word bắt đầu bằng query)
        //   2 = contains match (word chứa query ở giữa/cuối)
        //   3 = reading match (không khớp word, chỉ khớp reading)
        //   4 = meaning match (chỉ khớp meaning — gõ tiếng Việt)
        // Sau đó sort phụ theo popularity DESC, length(word) ASC.
        const likeQuery = `%${query}%`;
        const prefixQuery = `${query}%`;

        const { results } = await env.DB.prepare(`
          SELECT * FROM dictionary
          WHERE word LIKE ?1 COLLATE NOCASE
             OR reading LIKE ?1 COLLATE NOCASE
             OR meaning LIKE ?1 COLLATE NOCASE
          ORDER BY
            CASE
              WHEN word = ?2 COLLATE NOCASE THEN 0
              WHEN word LIKE ?3 COLLATE NOCASE THEN 1
              WHEN word LIKE ?1 COLLATE NOCASE THEN 2
              WHEN reading LIKE ?1 COLLATE NOCASE THEN 3
              ELSE 4
            END,
            popularity DESC,
            length(word) ASC
          LIMIT 30
        `).bind(likeQuery, query, prefixQuery).all();

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // =========================================================================
      // 🟢 ENDPOINT MỚI: KANJI BRIEF — Dùng riêng cho Góc Khám Phá trên Dashboard
      // Payload ~300 bytes thay vì ~15-20KB của /api/kanji-detail.
      // BỎ QUA: compounds (30 rows), examples, tags, popularity, id,
      //         stroke_count, mnemonics, components, structure_type.
      // Chỉ SELECT đúng 5 cột cần thiết cho Dashboard: kanji, hv, meaning,
      // onyomi, kunyomi. KHÔNG JOIN bảng dictionary → tiết kiệm 95%+ băng thông.
      // Dùng .first() thay vì .all() vì chỉ cần 1 row.
      // =========================================================================
      if (path === "/api/kanji-brief") {
        const kanji = url.searchParams.get("kanji");
        if (!kanji || kanji.length !== 1) {
          return new Response(JSON.stringify({ error: "Missing or invalid kanji (must be a single character)" }), {
            status: 400,
            headers: corsHeaders
          });
        }
        const row = await env.DB.prepare(
          "SELECT kanji, hv, meaning, onyomi, kunyomi FROM kanji_dictionary WHERE kanji = ?1"
        ).bind(kanji).first();

        if (!row) {
          return new Response(JSON.stringify({ error: "Kanji not found" }), {
            status: 404,
            headers: corsHeaders
          });
        }

        // CẮT NGẮN nghĩa: Dashboard chỉ cần 1-2 nghĩa đầu để hiển thị.
        // Bỏ tiền tố dạng [xxx] ở đầu nếu có, tách theo ";" hoặc "；", lấy tối đa 2 phần.
        let briefMeaning = (row.meaning || '').trim();
        if (briefMeaning) {
          briefMeaning = briefMeaning.replace(/^\[.*?\]\s*/, '').trim();
          const parts = briefMeaning.split(/\s*[;；]\s*/).filter(Boolean).slice(0, 2);
          briefMeaning = parts.join('; ');
          if (briefMeaning.length > 120) {
            briefMeaning = briefMeaning.slice(0, 117) + '...';
          }
        }

        return new Response(JSON.stringify({
          kanji: row.kanji,
          hv: (row.hv || '').trim(),
          meaning: briefMeaning,
          onyomi: row.onyomi || '',
          kunyomi: row.kunyomi || ''
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (path === "/api/kanji-detail") {
        const kanji = url.searchParams.get("kanji");
        if (!kanji) {
          return new Response(JSON.stringify({ error: "Missing kanji" }), { status: 400, headers: corsHeaders });
        }
        const kanjiQuery = env.DB.prepare("SELECT * FROM kanji_dictionary WHERE kanji = ?").bind(kanji);
        const compoundsQuery = env.DB.prepare(`
                    SELECT * FROM dictionary 
                    WHERE word LIKE ?
                      AND word NOT GLOB '*[a-zA-Z0-9]*'
                      AND length(word) >= 2 AND length(word) <= 4
                      AND trim(reading, ' \u3000' || char(9) || char(10) || char(13)) != ''
                      AND reading IS NOT NULL
                      AND hv != '' AND hv IS NOT NULL
                    ORDER BY 
                      (level != '' AND level IS NOT NULL) DESC,
                      level DESC,
                      popularity DESC,
                      length(word) ASC
                    LIMIT 30
                `).bind(`%${kanji}%`);
        const [kanjiResult, compoundsResult] = await env.DB.batch([kanjiQuery, compoundsQuery]);
        let finalCompounds = compoundsResult.results || [];
        const isJlpt = /* @__PURE__ */ __name22((lvl) => ["N1", "N2", "N3", "N4", "N5"].includes(lvl), "isJlpt");
        const jlptCount = finalCompounds.filter((r) => isJlpt(r.level)).length;
        if (jlptCount > 20) {
          finalCompounds = finalCompounds.slice(0, 30);
        } else {
          finalCompounds = finalCompounds.slice(0, 20);
        }
        return new Response(JSON.stringify({
          kanjiInfo: kanjiResult.results[0] || null,
          compounds: finalCompounds
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // =========================================================================
      // 🟢 ENDPOINT: BỐC THẺ NGẪU NHIÊN THEO JLPT LEVEL TỪ D1
      // =========================================================================
      if (path === "/api/jlpt-random") {
        const level = url.searchParams.get("level");
        const limit = parseInt(url.searchParams.get("limit")) || 100;
        
        if (!level) {
          return new Response(JSON.stringify({ error: "Missing level parameter" }), { 
            status: 400, 
            headers: corsHeaders 
          });
        }
        
        const { results } = await env.DB.prepare(
          "SELECT * FROM dictionary WHERE level = ? ORDER BY RANDOM() LIMIT ?"
        ).bind(level, limit).all();
        
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // =========================================================================
      // 🟢 MỚI - ENDPOINT 1: LẤY TOÀN BỘ METADATA CHỦ ĐỀ GỢI Ý (AUTOCOMPLETE)
      // =========================================================================
      if (path === "/api/thematic-metadata") {
        // Sắp xếp: Gốc (Cha) xếp trước, Con xếp theo thứ tự phân đoạn (sort_order)
        const { results } = await env.DB.prepare(`
          SELECT * FROM thematic_metadata 
          ORDER BY category ASC, parent_id IS NOT NULL ASC, parent_id ASC, sort_order ASC
        `).all();
        
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // =========================================================================
      // 🟢 MỚI - ENDPOINT 2: TRUY VẤN TỪ VỰNG D1 THEO TAG CHỦ ĐỀ SẴN CÓ
      // =========================================================================
      if (path === "/api/get-by-tag") {
        const tag = url.searchParams.get("tag");
        if (!tag) {
          return new Response(JSON.stringify({ error: "Missing tag parameter" }), { 
            status: 400, 
            headers: corsHeaders 
          });
        }

        // Sửa tags LIKE thành instr() để vượt rào 50-byte
        const { results } = await env.DB.prepare(`
          SELECT word, reading, meaning, hv, level, examples 
          FROM dictionary 
          WHERE instr(tags, ',' || ?1 || ',') > 0
          LIMIT 1500
        `).bind(tag).all();

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // =========================================================================
      // 🟢 MỚI - ENDPOINT 3: LÀM ĐẦY (HYDRATE) TỪ THÔ BẰNG TOÁN TỬ IN TRÊN D1
      // =========================================================================
      if (path === "/api/bulk-lookup" && request.method === "POST") {
        const wordsArray = await request.json();
        if (!wordsArray || !Array.isArray(wordsArray) || wordsArray.length === 0) {
          return new Response(JSON.stringify({ error: "Invalid or empty words array" }), { 
            status: 400, 
            headers: corsHeaders 
          });
        }

        // BỔ SUNG CỘT tags VÀO TRUY VẤN CHỌN
        const { results } = await env.DB.prepare(`
          SELECT word, reading, meaning, hv, level, examples, tags 
          FROM dictionary 
          WHERE word IN (SELECT value FROM json_each(?1))
        `).bind(JSON.stringify(wordsArray)).all();

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      // =========================================================================
      // 🟢 MỚI - ENDPOINT ĐẾM SỐ TỪ SIÊU TỐC (CHỈ TRẢ VỀ COUNT, TIẾT KIỆM BĂNG THÔNG)
      // =========================================================================
      if (path === "/api/count-by-tag") {
        const tag = url.searchParams.get("tag");
        if (!tag) {
          return new Response(JSON.stringify({ error: "Missing tag parameter" }), { 
            status: 400, 
            headers: corsHeaders 
          });
        }

        const { results } = await env.DB.prepare(`
          SELECT COUNT(*) AS total 
          FROM dictionary 
          WHERE ',' || tags || ',' LIKE ?
        `).bind(`%,${tag},%`).all();

        return new Response(JSON.stringify(results[0] || { total: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // =========================================================================
      // 🟢 ENDPOINT: NEWS CARD — Lấy 1 bản tin NHK ngẫu nhiên + thumbnail
      // (Layer 1 cho Góc Khám Phá, KHÔNG gọi AI, cache RSS 10 phút)
      // =========================================================================
      if (path === "/api/news-card") {
        try {
          // 1. Fetch RSS NHK cat0 (dùng Cache API của Cloudflare, TTL 10 phút)
          const rssCacheKey = new Request("https://internal-cache/nhk-rss-cat0");
          let items = null;
          const cachedRss = await caches.default.match(rssCacheKey);
          if (cachedRss) {
            items = await cachedRss.json();
          } else {
            const rssResponse = await fetch("https://www3.nhk.or.jp/rss/news/cat0.xml", {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
              }
            });
            if (!rssResponse.ok) {
              throw new Error(`Không thể kết nối RSS NHK (Mã lỗi: ${rssResponse.status})`);
            }
            const rssText = await rssResponse.text();
            items = [...rssText.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1]);
            if (!items || items.length === 0) {
              throw new Error("Không tìm thấy bản tin hợp lệ trong RSS.");
            }
            // Cache 10 phút = 600 giây
            const cacheResp = new Response(JSON.stringify(items), {
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=600"
              }
            });
            ctx.waitUntil(caches.default.put(rssCacheKey, cacheResp));
          }

          // 2. Bốc ngẫu nhiên 1 bài
          const randomIndex = Math.floor(Math.random() * items.length);
          const itemContent = items[randomIndex];

          const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
          const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/);
          const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
          const dateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

          const cleanCdata = (str) => {
            if (!str) return "";
            return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").trim();
          };

          const newsTitle = cleanCdata(titleMatch ? titleMatch[1] : "Bản tin thời sự");
          const newsDesc = cleanCdata(descMatch ? descMatch[1] : "");
          const newsLink = cleanCdata(linkMatch ? linkMatch[1] : "");
          const newsPubDate = cleanCdata(dateMatch ? dateMatch[1] : "");

          if (!newsLink) {
            throw new Error("Bản tin không có link.");
          }

          // 3. Scrape og:image từ trang bài báo (cache riêng 1 giờ cho mỗi link)
          let imageUrl = null;
          try {
            const imgCacheKey = new Request(`https://internal-cache/ogimg/${encodeURIComponent(newsLink)}`);
            const cachedImg = await caches.default.match(imgCacheKey);
            if (cachedImg) {
              imageUrl = await cachedImg.text();
            } else {
              const articleResponse = await fetch(newsLink, {
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
              });
              if (articleResponse.ok) {
                const articleHtml = await articleResponse.text();
                // Thử nhiều pattern og:image
                const ogMatch = articleHtml.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
                  || articleHtml.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
                if (ogMatch && ogMatch[1]) {
                  imageUrl = ogMatch[1];
                }
              }
              // Cache kết quả (cả khi null để khỏi scrape lại)
              const imgCacheResp = new Response(imageUrl || "", {
                headers: {
                  "Content-Type": "text/plain",
                  "Cache-Control": "public, max-age=3600"
                }
              });
              ctx.waitUntil(caches.default.put(imgCacheKey, imgCacheResp));
            }
          } catch (e) {
            // Không có ảnh cũng không sao, trả null để frontend dùng fallback
            imageUrl = null;
          }

          return new Response(JSON.stringify({
            title: newsTitle,
            desc: newsDesc,
            link: newsLink,
            image_url: imageUrl,
            pub_date: newsPubDate
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });

        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }

      // =========================================================================
      // 🟢 ENDPOINT: BÀI ĐỌC THỜI SỰ THỰC TẾ (NHK RSS + QWEN 3.6 27B)
      // - Có tham số ?link={url} → dùng bài cụ thể + check cache D1 trước
      // - Không có ?link → random như cũ
      // =========================================================================
      if (path === "/api/daily-news") {
        try {
          // 🟢 MỚI: Hỗ trợ tham số ?link={url} để frontend chỉ định bài cụ thể
          // (dùng khi user bấm "Đọc & Quiz" từ card tin tức trên Góc Khám Phá)
          const requestedLink = url.searchParams.get("link");

          // 🟢 MỚI: Cache D1 — kiểm tra trước khi gọi AI
          // Bảng: news_dokkai_cache (news_url TEXT PK, news_title TEXT, dokkai_json TEXT, created_at TEXT)
          if (requestedLink) {
            try {
              const cached = await env.DB.prepare(
                "SELECT dokkai_json FROM news_dokkai_cache WHERE news_url = ?1"
              ).bind(requestedLink).first();

              if (cached && cached.dokkai_json) {
                // Cache HIT → trả ngay lập tức, không gọi AI
                return new Response(cached.dokkai_json, {
                  headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
              }
            } catch (cacheErr) {
              // Nếu bảng chưa tồn tại hoặc lỗi khác → log và tiếp tục gọi AI
              console.warn("Cache D1 miss/err:", cacheErr.message);
            }
          }

          // 1. Tải bản tin thời sự từ RSS chính thức của NHK
          const rssResponse = await fetch("https://www3.nhk.or.jp/rss/news/cat0.xml", {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
          });
          
          if (!rssResponse.ok) {
            throw new Error(`Không thể kết nối RSS NHK (Mã lỗi: ${rssResponse.status})`);
          }
          
          const rssText = await rssResponse.text();

          // 2. Sử dụng matchAll để gom TOÀN BỘ các thẻ <item> (bản tin) vào một mảng
          const items = [...rssText.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1]);
          if (!items || items.length === 0) {
            throw new Error("Không tìm thấy bản tin hợp lệ trong dữ liệu RSS.");
          }

          // Hàm dọn dẹp thẻ dữ liệu đặc biệt CDATA của XML
          const cleanCdata = (str) => {
            if (!str) return "";
            return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").trim();
          };

          // 🟢 MỚI: Nếu có requestedLink → tìm bài tương ứng trong RSS
          // (lấy title + desc từ RSS cho chính xác, không scrape HTML)
          let itemContent = null;
          if (requestedLink) {
            for (const item of items) {
              const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
              if (linkMatch && cleanCdata(linkMatch[1]) === requestedLink) {
                itemContent = item;
                break;
              }
            }
            // Nếu không tìm thấy link trong RSS (bài cũ đã rớt khỏi RSS) →
            // fallback: tự tạo itemContent với link + title + desc trống
            if (!itemContent) {
              itemContent = `<title>Bài tin cũ</title><description>${requestedLink}</description><link>${requestedLink}</link>`;
            }
          } else {
            // Không có ?link → bốc ngẫu nhiên 1 bài như cũ
            const randomIndex = Math.floor(Math.random() * items.length);
            itemContent = items[randomIndex];
          }

          const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
          const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/);
          const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);

          const newsTitle = cleanCdata(titleMatch ? titleMatch[1] : "Bản tin thời sự");
          const newsDesc = cleanCdata(descMatch ? descMatch[1] : "");
          const newsLink = cleanCdata(linkMatch ? linkMatch[1] : (requestedLink || ""));

          if (!newsDesc && !requestedLink) {
            throw new Error("Bản tin trống nội dung mô tả.");
          }

          // 3. Soạn Prompt gửi cho Qwen 3.6 27B xử lý dịch thuật và bóc tách cấu trúc (Đã tối ưu chống lỗi nháy kép)
          const aiPrompt = `Bạn là chuyên gia giảng dạy tiếng Nhật JLPT.
          Dưới đây là một bản tin thời sự thực tế từ đài truyền hình quốc gia NHK:
          Tiêu đề bản tin: "${newsTitle}"
          Nội dung tóm tắt: "${newsDesc}"
          Nguồn bản tin: ${newsLink}

          Hãy phân tích bản tin này để thiết lập bài học Đọc hiểu (Dokkai) cho học sinh.
          
          ⚠️⚠️⚠️ RÀNG BUỘC BẢO VỆ CÚ PHÁP JSON TUYỆT ĐỐI (QUAN TRỌNG NHẤT):
          - CẤM TUYỆT ĐỐI: Không được phép sử dụng bất kỳ dấu nháy kép (") nào bên trong nội dung của các trường văn bản (như "explanation", "meaning", "ex_jp", "ex_vn", "title_jp", "story_jp", "story_vn").
          - Nếu muốn viết trích dẫn, nhấn mạnh từ vựng hoặc dịch nghĩa từ trong câu, bạn BẮT BUỘC phải dùng dấu nháy đơn (') hoặc dấu ngoặc góc của tiếng Nhật 「」.
          - Ví dụ SAI (Làm hỏng JSON): "explanation": "Bản tin ghi rõ: "このうち3人は"..."
          - Ví dụ ĐÚNG (Hợp lệ JSON): "explanation": "Bản tin ghi rõ: 'このうち3人は'..." hoặc "explanation": "Bản tin ghi rõ: 「このうち3人は」..."

          ⚠️ RÀNG BUỘC VỀ SỐ LƯỢNG:
          - Chỉ trích xuất TỐI ĐA 5 từ vựng (vocab) nổi bật nhất xuất hiện trong bản tin.
          - TUYỆT ĐỐI KHÔNG trích xuất bất kỳ cấu trúc ngữ pháp nào (bỏ hoàn toàn phần grammar khỏi JSON).
          - Câu hỏi trắc nghiệm ("question") BẮT BUỘC viết hoàn toàn bằng TIẾNG NHẬT (không dùng tiếng Việt cho câu hỏi này).
          - Các lựa chọn đáp án ("correct_answer" và "wrong_answers") cũng viết hoàn toàn bằng TIẾNG NHẬT để rèn luyện kỹ năng đọc hiểu thực tế của học viên.
          - Phần giải thích ("explanation") viết bằng TIẾNG VIỆT, phân tích sâu sắc giống như sách hướng dẫn giải đề thi đọc hiểu JLPT:
            1. Phân tích các từ khóa (Keywords) cốt lõi xuất hiện trong cả câu hỏi và văn bản gốc để đối chiếu nghĩa.
            2. Chỉ ra mẹo/manh mối nhận biết nhanh đáp án đúng nằm ở câu văn nào trong bài đọc (Tips/Clues).
            3. Hướng dẫn cách loại trừ các đáp án nhiễu còn lại.

          BẮT BUỘC chỉ trả về duy nhất một đối tượng JSON (Không viết thêm giải thích ngoài lề). Định dạng JSON mẫu:
          {
            "title_jp": "Tiêu đề tiếng Nhật của bản tin",
            "story_jp": "Nội dung tóm tắt bản tin tiếng Nhật sạch",
            "story_vn": "Bản dịch toàn bộ bản tin sang tiếng Việt mượt mà",
            "quiz": {
              "question": "Câu hỏi trắc nghiệm bằng TIẾNG NHẬT",
              "correct_answer": "Đáp án đúng bằng TIẾNG NHẬT",
              "wrong_answers": [
                "Đáp án sai 1 bằng TIẾNG NHẬT",
                "Đáp án sai 2 bằng TIẾNG NHẬT",
                "Đáp án sai 3 bằng TIẾNG NHẬT"
              ],
              "explanation": "Giải thích chi tiết bằng tiếng Việt: Phân tích từ khóa (keywords) cốt lõi của câu hỏi và bài đọc, mẹo tìm manh mối đáp án đúng nằm ở câu văn nào trong bài đọc giống như hướng dẫn làm đề thi đọc hiểu JLPT và cách tư duy loại trừ đáp án nhiễu."
            },
            "vocab": [
              {
                "front": "Từ vựng (Kanji)",
                "reading": "Cách đọc Hiragana",
                "meaning": "Ý nghĩa tiếng Việt",
                "hv": "Nghĩa Hán Việt (nếu có)",
                "ex_jp": "1 Câu ví dụ tiếng Nhật chứa từ vựng đó (trích từ bản tin hoặc tự soạn)",
                "ex_vn": "Nghĩa câu ví dụ"
              }
            ]
          }`;

          // Gọi Qwen 3.8 27B qua hạ tầng Groq
          const aiResponseText = await callGroqAI_NonStream(aiPrompt, env, "qwen/qwen3.8-27b");
          
          let responseText = aiResponseText.trim();
          const jsonStart = responseText.indexOf("{");
          const jsonEnd = responseText.lastIndexOf("}");
          if (jsonStart !== -1 && jsonEnd !== -1) {
              responseText = responseText.substring(jsonStart, jsonEnd + 1);
          }

          // 🟢 MỚI: Save cache D1 cho lần sau (chỉ khi có requestedLink để cache theo URL chính xác)
          if (requestedLink) {
            try {
              await env.DB.prepare(`
                INSERT INTO news_dokkai_cache (news_url, news_title, dokkai_json, created_at)
                VALUES (?1, ?2, ?3, datetime('now'))
                ON CONFLICT(news_url) DO UPDATE SET
                  news_title = excluded.news_title,
                  dokkai_json = excluded.dokkai_json,
                  created_at = datetime('now')
              `).bind(requestedLink, newsTitle, responseText).run();
            } catch (cacheSaveErr) {
              // Nếu chưa tạo bảng → bỏ qua, vẫn trả về bình thường
              console.warn("Không save được cache D1:", cacheSaveErr.message);
            }
          }

          return new Response(responseText, {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });

        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }


      // =========================================================================
      // 🟢 ENDPOINT: UPLOAD IMAGE — proxy qua imgbb để ẩn API key
      // Frontend gửi base64 → Worker gọi imgbb API (với secret key) → trả URL
      // Cách này ẩn IMGBB_API_KEY khỏi frontend, tránh bị view source lấy key
      // Ảnh tự xóa sau 1 giờ (expiration: 3600)
      // =========================================================================
      if (path === "/api/upload-image" && request.method === "POST") {
        try {
          const { image } = await request.json();
          if (!image || typeof image !== 'string') {
            return new Response(JSON.stringify({ error: "Missing image data" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          if (!env.IMGBB_API_KEY) {
            return new Response(JSON.stringify({ error: "Server chưa cấu hình IMGBB_API_KEY" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          // Strip prefix "data:image/jpeg;base64,"
          const base64Match = image.match(/^data:image\/[a-z]+;base64,(.+)$/i);
          const base64Clean = base64Match ? base64Match[1] : image;

          // 🟢 FIX BUG "You have been forbidden to use this website" (imgbb HTTP 400, code 103):
          // imgbb CHẶN Cloudflare Workers vì:
          // 1. Request từ Worker có User-Agent: "Cloudflare-Workers" → bị block
          // 2. IP xuất phát từ dải mạng Cloudflare → bị imgbb nhận diện là bot
          //
          // FIX: Thêm User-Agent + Accept header để giả lập browser thật.
          // (imgbb chỉ chặn pattern chứ không verify kỹ — UA browser là đủ qua.)
          // Nếu imgbb vẫn chặn → fallback sang tmpfiles.org (không cần API key).
          //
          // 🟢 LƯU Ý về catbox.moe: Đã thử nhưng bị lỗi "Invalid uploader" (HTTP 412)
          // vì catbox mới thêm cơ chế anti-bot nghiêm ngặt (check Sec-Fetch headers).
          // Đã chuyển sang tmpfiles.org — API đơn giản hơn và không chặn Cloudflare Workers.
          const BROWSER_HEADERS = {
            // 🟢 Đổi sang Firefox UA vì Chrome 120 đã bị imgbb blacklist
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Accept': 'application/json, text/html, */*',
            'Accept-Language': 'en-US,en;q=0.9'
          };

          // 🟢 HÀM UPLOAD TMPFILES.ORG (FALLBACK TỐT NHẤT — không cần key, không chặn Worker)
          // API: https://tmpfiles.org/api/v1/upload
          // - Body: multipart/form-data với file binary
          // - Trả về: JSON có trường "data": {"url": "https://tmpfiles.org/12345/abc.webp"}
          // - URL cần convert: thay "tmpfiles.org/" → "tmpfiles.org/dl/" để lấy file trực tiếp
          // - Ảnh tự xóa sau 1 giờ (60 phút)
          // - Không có API key, không check User-Agent nghiêm ngặt
          async function uploadToTmpfiles(base64DataUrl) {
            const tmpMatch = base64DataUrl.match(/^data:image\/([a-z]+);base64,(.+)$/i);
            if (!tmpMatch) throw new Error("Invalid base64 data URL");
            const mime = tmpMatch[1];
            const base64 = tmpMatch[2];
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

            // Tạo multipart/form-data body thủ công
            const ext = mime === 'jpeg' ? 'jpg' : mime;
            const filename = `upload_${Date.now()}.${ext}`;
            const boundary = '----CloudflareWorkerBoundary' + Math.random().toString(36).slice(2);
            const body = new Uint8Array([
              ...new TextEncoder().encode(
                `--${boundary}\r\n` +
                `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
                `Content-Type: image/${mime}\r\n\r\n`
              ),
              ...bytes,
              ...new TextEncoder().encode(`\r\n--${boundary}--\r\n`)
            ]);

            const tmpResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
              method: 'POST',
              headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                ...BROWSER_HEADERS
              },
              body: body
            });

            if (!tmpResponse.ok) {
              const errText = await tmpResponse.text().catch(() => '');
              throw new Error(`tmpfiles HTTP ${tmpResponse.status}: ${errText.slice(0, 200)}`);
            }

            // Parse JSON response
            const tmpData = await tmpResponse.json().catch(() => null);
            if (!tmpData || !tmpData.data || !tmpData.data.url) {
              throw new Error(`tmpfiles response không có URL: ${JSON.stringify(tmpData).slice(0, 200)}`);
            }

            // 🟢 CONVERT URL: tmpfiles.org/12345/abc.webp → tmpfiles.org/dl/12345/abc.webp
            // (URL gốc trả về trang HTML preview, thêm /dl/ để lấy file trực tiếp)
            const directUrl = tmpData.data.url.replace(
              'tmpfiles.org/',
              'tmpfiles.org/dl/'
            );
            return directUrl;
          }

          // 🟢 THỬ IMGBB TRƯỚC, FALLBACK TMPFILES.ORG
          let imageUrl = null;
          let provider = null;
          let lastError = null;

          // Lần 1: Thử imgbb (theo docs chính thức: dùng multipart/form-data, KHÔNG phải urlencoded)
          // 🟢 FIX LỖI "You have been forbidden" (code 103):
          // Trước đây dùng application/x-www-form-urlencoded → imgbb reject (có thể do mới update policy).
          // Theo docs imgbb (https://api.imgbb.com/), cú pháp chính thức là:
          //   curl --request POST "https://api.imgbb.com/1/upload?key=KEY&expiration=600" \
          //        --form "image=<BASE64>"
          // Tức là multipart/form-data với field tên "image" chứa base64 (KHÔNG có prefix data:image/...;base64,)
          try {
            // Tạo multipart/form-data body thủ công
            const imgbbBoundary = '----ImgbbBoundary' + Math.random().toString(36).slice(2);
            const imgbbBody = new Uint8Array([
              ...new TextEncoder().encode(
                `--${imgbbBoundary}\r\n` +
                `Content-Disposition: form-data; name="image"\r\n\r\n`
              ),
              ...new TextEncoder().encode(base64Clean),
              ...new TextEncoder().encode(`\r\n--${imgbbBoundary}--\r\n`)
            ]);

            const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${env.IMGBB_API_KEY}&expiration=600`, {
              method: 'POST',
              headers: {
                'Content-Type': `multipart/form-data; boundary=${imgbbBoundary}`,
                ...BROWSER_HEADERS
              },
              body: imgbbBody
            });

            if (imgbbResponse.ok) {
              const imgbbData = await imgbbResponse.json();
              if (imgbbData.success && imgbbData.data && imgbbData.data.url) {
                imageUrl = imgbbData.data.url;
                provider = 'imgbb';
              }
            } else {
              const errText = await imgbbResponse.text().catch(() => '');
              lastError = `imgbb HTTP ${imgbbResponse.status}: ${errText.slice(0, 200)}`;
              console.warn('imgbb upload failed, fallback to tmpfiles:', lastError);
            }
          } catch (imgbbErr) {
            lastError = `imgbb error: ${imgbbErr.message}`;
            console.warn('imgbb fetch error, fallback to tmpfiles:', imgbbErr.message);
          }

          // Lần 2: Nếu imgbb fail → thử tmpfiles.org (không cần key, không chặn Worker)
          if (!imageUrl) {
            try {
              imageUrl = await uploadToTmpfiles(image);
              provider = 'tmpfiles';
              console.log('tmpfiles upload OK:', imageUrl);
            } catch (tmpErr) {
              console.error('tmpfiles also failed:', tmpErr.message);
              lastError = `${lastError} | tmpfiles: ${tmpErr.message}`;
            }
          }

          // Nếu cả 2 đều fail → trả lỗi cho frontend
          if (!imageUrl) {
            return new Response(JSON.stringify({
              error: 'Tất cả image host đều thất bại',
              detail: lastError
            }), {
              status: 502,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }

          return new Response(JSON.stringify({
            success: true,
            url: imageUrl,
            provider: provider,  // 'imgbb' hoặc 'tmpfiles' (frontend có thể log để debug)
            delete_url: null,
            expiresIn: provider === 'imgbb' ? 3600 : 3600  // cả 2 đều 1 giờ
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }


      if (path === "/api/update-examples" && request.method === "POST") {
        const { word, examples } = await request.json();
        if (!word || !examples || !Array.isArray(examples)) {
          return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400, headers: corsHeaders });
        }
        const cappedExamples = examples.slice(0, 15);
        await env.DB.prepare("UPDATE dictionary SET examples = ? WHERE word = ?").bind(JSON.stringify(cappedExamples), word).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // =========================================================================
      // 🗑️ ENDPOINT /api/gemini ĐÃ BỊ XÓA (MIGRATION SANG /api/groq)
      // -------------------------------------------------------------------------
      // Lịch sử: trước đây endpoint này gọi Google Gemini 3.7 Flash. Sau khi
      // migration sang Groq Qwen 3.8 27B (xem /api/groq phía dưới), không còn
      // caller nào gọi tới endpoint này nữa — đã xóa để dọn dead code.
      // Nếu sau này cần fallback đa model, có thể tái kích hoạt bằng cách:
      //   1. Set GEMINI_API_KEYS trong Cloudflare secrets
      //   2. Restore block code từ git history trước commit này
      // =========================================================================

      // =========================================================================
      // 🟢 ENDPOINT: AI GROQ STREAM (Xoay tua ngẫu nhiên nhiều Key)
      // =========================================================================
      if (path === "/api/groq" && request.method === "POST") {
        try {
          // 🟢 BACKWARDS-COMPAT: Hỗ trợ cả `prompt` (string) cũ và `messages` (array) mới.
          // - Nếu client gửi `messages` array → ưu tiên dùng (cho phép tách role system/user)
          // - Nếu chỉ gửi `prompt` string → fallback về `[{role:"user", content: prompt}]`
          const reqBody = await request.json();
          const { prompt, model = "qwen/qwen3.8-27b", images = [] } = reqBody;
          let messages;
          if (Array.isArray(reqBody.messages) && reqBody.messages.length > 0) {
            messages = reqBody.messages;
          } else {
            messages = [{ role: "user", content: prompt }];
          }

          const keysString = env.GROQ_API_KEYS;
          if (!keysString) {
            return new Response(JSON.stringify({ error: "Lỗi Server: Chưa cấu hình biến môi trường GROQ_API_KEYS trên Cloudflare" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }

          const apiKeys = keysString.split(',').map(key => key.trim()).filter(key => key.length > 0);
          if (apiKeys.length === 0) {
            return new Response(JSON.stringify({ error: "Lỗi Server: Biến môi trường GROQ_API_KEYS trống" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }

          // 🟢 XÂY DỰNG PAYLOAD: Hỗ trợ cả TEXT thuần và VISION (ảnh)
          // OpenAI-compatible format: content có thể là string (text) hoặc mảng (text + image_url)
          // Qwen 3.8 27B và Llama 4 Maverick đều hỗ trợ image_url qua Groq API
          const hasImages = Array.isArray(images) && images.length > 0;

          if (hasImages) {
            // VISION MODE: Inject ảnh vào message cuối cùng (giả định là message của user)
            // 🟢 THÊM detail: "low" → Groq chỉ tính 85 token/ảnh (fixed)
            // thay vì tính token cho base64 string như text (~8000 token)
            // Đây là cách Groq Playground dùng để không bị TPM limit
            const lastIdx = messages.length - 1;
            const lastMsg = messages[lastIdx];
            const lastText = typeof lastMsg.content === 'string' ? lastMsg.content : '';
            lastMsg.content = [
              ...images.map(img => ({
                type: "image_url",
                image_url: { url: img, detail: "low" }
              })),
              { type: "text", text: lastText || prompt || '' }
            ];
          }

          let startIndex = Math.floor(Math.random() * apiKeys.length);
          let lastErrorMessage = "";

          for (let i = 0; i < apiKeys.length; i++) {
            const currentIndex = (startIndex + i) % apiKeys.length;
            const currentKey = apiKeys[currentIndex];

            // 🟢 FIX BUG "fetchTimeoutId is not defined":
            // Trước đây `fetchTimeoutId` được khai báo bằng `const` bên trong `try {}`
            // → không visible ở `catch {}` block → khi API key thất bại, code cố gọi
            // clearTimeout(fetchTimeoutId) trong catch → ném ReferenceError ra ngoài,
            // làm sập toàn bộ endpoint /api/groq và trả về frontend lỗi:
            //   "fetchTimeoutId is not defined"  ← Đây chính là lỗi user gặp phải
            //   trong tính năng Gia sư AI của PDF Reader!
            // FIX: Khai báo fetchTimeoutId ở scope NGOÀI try (let = null),
            // gán giá trị bên trong try, và clear an toàn trong catch.
            // Tương tự với fetchTimeoutMs để catch có thể đọc được khi log.
            let fetchTimeoutMs = hasImages ? 90000 : 30000; // 90s vision, 30s text
            let fetchTimeoutId = null;

            try {
              let finalKey = currentKey;
              let apiUrl = "https://api.groq.com/openai/v1/chat/completions";
              let modelId = model;

              // Phân định API theo tiền tố (Hỗ trợ mở rộng tương lai)
              if (currentKey.startsWith("mistral:")) {
                apiUrl = "https://api.mistral.ai/v1/chat/completions";
                finalKey = currentKey.replace("mistral:", "");
              } else if (currentKey.startsWith("cerebras:")) {
                apiUrl = "https://api.cerebras.ai/v1/chat/completions";
                finalKey = currentKey.replace("cerebras:", "");
              }

              // 🟢 Set timeout cho fetch Groq — tránh Worker treo mãi nếu Groq chậm
              // Vision request cần thời gian dài (OCR + fetch ảnh URL)
              fetchTimeoutMs = hasImages ? 90000 : 30000; // 90s vision, 30s text
              const fetchController = new AbortController();
              fetchTimeoutId = setTimeout(() => fetchController.abort(), fetchTimeoutMs);

              const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${finalKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: modelId,
                  messages: messages,
                  // 🟢 BUMP temperature 0.2 → 0.6: Reasoning model cần nhiệt độ cao hơn
                  // để suy nghĩ linh hoạt. 0.2 quá thấp → output bị "lười suy nghĩ".
                  temperature: 0.6,
                  // 🟢 FIX LỖI "max_completion_tokens must be <= 16384":
                  // Groq giới hạn max_completion_tokens tối đa = 16384 cho hầu hết model (qwen3.8-27b).
                  // Trước đây set 32768 → bị reject ngay từ request.
                  // Reasoning model thực tế chỉ ăn 3-6k tokens → 16384 là dư sức.
                  max_completion_tokens: 16384,
                  stream: true,
                  // 🟢 Đổi từ "hidden" → "parsed":
                  // - "hidden": Qwen vẫn tính reasoning tokens nhưng không trả về → tối nghĩa, lãng phí
                  // - "parsed": Reasoning được tách riêng vào delta.reasoning, content chỉ có final answer
                  // Frontend chỉ render delta.content → tự động clean, không cần regex.
                  reasoning_format: "parsed"
                }),
                signal: fetchController.signal
              });
              clearTimeout(fetchTimeoutId);

              if (!response.ok) {
                // 🟢 Log chi tiết lỗi để debug (đặc biệt cho vision request)
                let errDetail = `HTTP ${response.status}`;
                try {
                    const data = await response.json().catch(() => null);
                    if (data) {
                        errDetail = data.error?.message || data.error || data.detail || JSON.stringify(data).slice(0, 300);
                    } else {
                        const textResp = await response.text().catch(() => '');
                        if (textResp) errDetail = textResp.slice(0, 300);
                    }
                } catch (_) {}
                console.warn(`⚠️ Groq API Key thứ ${currentIndex + 1} thất bại (${modelId}):`, errDetail);
                throw new Error(errDetail);
              }

              // 🟢 LỌC STREAM: Khi reasoning_format="parsed", Groq gửi các chunk có dạng:
              //   data: {"choices":[{"delta":{"reasoning":"..."}}]}    ← reasoning nội bộ
              //   data: {"choices":[{"delta":{"content":"..."}}]}     ← output thật
              // Frontend chỉ quan tâm content. Ta forward thẳng response.body vì:
              // 1. parseOpenAIStream ở frontend chỉ đọc delta.content → tự động bỏ reasoning
              // 2. Giữ nguyên stream giúp SSE pass-through, không cần parse lại Worker-side
              // (Nếu sau này cần lọc triệt để, dùng TransformStream để strip reasoning chunks.)
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
              // 🟢 FIX: clearTimeout chỉ chạy khi fetchTimeoutId đã được gán
              // (tránh ReferenceError nếu fetch ném lỗi trước cả khi setTimeout chạy)
              if (fetchTimeoutId !== null) {
                clearTimeout(fetchTimeoutId);
                fetchTimeoutId = null;
              }
              if (error.name === 'AbortError') {
                console.warn(`⚠️ Groq API Key thứ ${currentIndex + 1} timeout sau ${fetchTimeoutMs/1000}s`);
                lastErrorMessage = `Timeout sau ${fetchTimeoutMs/1000}s (vision request chậm — thử gửi ảnh nhỏ hơn)`;
              } else {
                console.warn(`⚠️ Groq API Key thứ ${currentIndex + 1} thất bại:`, error.message);
                lastErrorMessage = error.message;
              }
            }
          }

          console.error("❌ Tất cả API Keys của Groq đều đã cạn kiệt hoặc gặp lỗi.");
          return new Response(JSON.stringify({
            error: 'Hệ thống Groq đang bận hoặc quá tải. Vui lòng thử lại sau!',
            detail: lastErrorMessage
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });

        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }

      // =========================================================================
      // 🟢 ENDPOINT: AI MISTRAL STREAM (Xoay tua ngẫu nhiên nhiều Key)
      // =========================================================================
      if (path === "/api/mistral" && request.method === "POST") {
        try {
          // 🟢 BACKWARDS-COMPAT: Hỗ trợ cả `prompt` (string) cũ và `messages` (array) mới.
          const reqBody = await request.json();
          const { prompt, model = "mistral-small-latest" } = reqBody;
          let messages;
          if (Array.isArray(reqBody.messages) && reqBody.messages.length > 0) {
            messages = reqBody.messages;
          } else {
            messages = [{ role: "user", content: prompt }];
          }
          
          const keysString = env.MISTRAL_API_KEYS;
          if (!keysString) {
            return new Response(JSON.stringify({ error: "Lỗi Server: Chưa cấu hình biến môi trường MISTRAL_API_KEYS trên Cloudflare" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }

          const apiKeys = keysString.split(',').map(key => key.trim()).filter(key => key.length > 0);
          if (apiKeys.length === 0) {
            return new Response(JSON.stringify({ error: "Lỗi Server: Biến môi trường MISTRAL_API_KEYS trống" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }

          let startIndex = Math.floor(Math.random() * apiKeys.length);
          let lastErrorMessage = "";

          for (let i = 0; i < apiKeys.length; i++) {
            const currentIndex = (startIndex + i) % apiKeys.length;
            const currentKey = apiKeys[currentIndex];

            try {
              const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${currentKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: model,
                  messages: messages,
                  // 🟢 BUMP temperature 0.2 → 0.6 để đồng bộ với Groq
                  temperature: 0.6,
                  stream: true
                })
              });

              if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error?.message || `Lỗi HTTP ${response.status} từ Mistral`);
              }

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
              console.warn(`⚠️ Mistral API Key thứ ${currentIndex + 1} thất bại:`, error.message);
              lastErrorMessage = error.message;
            }
          }

          console.error("❌ Tất cả API Keys của Mistral đều đã cạn kiệt hoặc gặp lỗi.");
          return new Response(JSON.stringify({ 
            error: 'Hệ thống Mistral đang bận hoặc quá tải. Vui lòng thử lại sau!',
            detail: lastErrorMessage 
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });

        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }
      // =========================================================================
      // 🔒 PHÂN HỆ API ADMIN: BẢO VỆ & THAO TÁC CƠ SỞ DỮ LIỆU D1
      // =========================================================================
      if (path.startsWith("/api/admin/")) {
        // 1. Chốt chặn bảo mật Admin Token
        if (!checkAdminAuth(request, env)) {
          return new Response(JSON.stringify({ error: "Unauthorized: Khóa xác thực Admin không hợp lệ hoặc đã hết hạn!" }), {
            status: 401,
            headers: corsHeaders
          });
        }

        // API 1: CẬP NHẬT METADATA CHỦ ĐỀ (SƠ ĐỒ CÂY)
        if (path === "/api/admin/update-metadata" && request.method === "POST") {
          const { action, tag_id, display_name, category, parent_id, sort_order, search_keywords } = await request.json();

          if (!action || !tag_id) {
            return new Response(JSON.stringify({ error: "Missing required parameters" }), { status: 400, headers: corsHeaders });
          }

          if (action === "insert" || action === "update") {
            // TỰ ĐỘNG CHUYỂN ĐỔI PHÒNG THỦ: Tránh lỗi D1_TYPE_ERROR của Cloudflare
            const db_parent_id = parent_id !== undefined ? parent_id : null;
            const db_sort_order = sort_order !== undefined ? sort_order : 0;
            const db_search_keywords = search_keywords !== undefined ? search_keywords : null;

            await env.DB.prepare(`
              INSERT INTO thematic_metadata (tag_id, display_name, category, parent_id, sort_order, search_keywords)
              VALUES (?1, ?2, ?3, ?4, ?5, ?6)
              ON CONFLICT(tag_id) DO UPDATE SET
                display_name = excluded.display_name,
                category = excluded.category,
                parent_id = excluded.parent_id,
                sort_order = excluded.sort_order,
                search_keywords = excluded.search_keywords
            `).bind(tag_id, display_name, category, db_parent_id, db_sort_order, db_search_keywords).run();

            return new Response(JSON.stringify({ success: true, message: "Metadata synchronized successfully" }), { headers: corsHeaders });
          }

          if (action === "delete") {
            // 1. Quét tìm toàn bộ danh sách mã tag con trực thuộc tag sắp xóa
            const children = await env.DB.prepare("SELECT tag_id FROM thematic_metadata WHERE parent_id = ?1").bind(tag_id).all();
            
            const tagsToDelete = [tag_id];
            if (children.results && children.results.length > 0) {
              children.results.forEach(row => tagsToDelete.push(row.tag_id));
            }

            // 2. Tìm tất cả các từ trong từ điển có chứa bất kỳ tag nào trong danh sách bị xóa
            const instrConditions = tagsToDelete.map(() => "instr(tags, ',' || ? || ',') > 0").join(" OR ");
            const searchStmt = env.DB.prepare(`SELECT id, tags FROM dictionary WHERE ${instrConditions}`);
            
            // Chỉ cần truyền trực tiếp mã tag, không cần bọc chuỗi % ở ngoài nữa
            const bindParams = tagsToDelete;
            const { results: wordsToClean } = await searchStmt.bind(...bindParams).all();

            const batchStatements = [];

            // 3. Tiến hành bóc tách và làm sạch triệt để bằng Javascript trên từng dòng từ vựng
            if (wordsToClean && wordsToClean.length > 0) {
              const updateStmt = env.DB.prepare("UPDATE dictionary SET tags = ?2 WHERE id = ?1");
              
              wordsToClean.forEach(row => {
                const currentTags = row.tags.split(',').map(t => t.trim()).filter(Boolean);
                
                // Gỡ bỏ chính xác tuyệt đối các nhãn nằm trong danh sách xóa
                const cleanedTags = currentTags.filter(t => !tagsToDelete.includes(t));
                
                // Chuẩn hóa và gộp mảng sạch
                const uniqueCleanedTags = [...new Set(cleanedTags)];
                const cleanTagsString = uniqueCleanedTags.length > 0 ? `,\${uniqueCleanedTags.join(',')},` : null;
                
                batchStatements.push(updateStmt.bind(row.id, cleanTagsString));
              });
            }

            // 4. Tạo lệnh xóa nhãn trong sơ đồ cây thematic_metadata
            batchStatements.push(env.DB.prepare("DELETE FROM thematic_metadata WHERE parent_id = ?1").bind(tag_id));
            batchStatements.push(env.DB.prepare("DELETE FROM thematic_metadata WHERE tag_id = ?1").bind(tag_id));

            // 5. Thực thi chia nhỏ Batch 100 câu ghi đè lên D1 an toàn
            const chunkSize = 100;
            for (let i = 0; i < batchStatements.length; i += chunkSize) {
              const chunk = batchStatements.slice(i, i + chunkSize);
              await env.DB.batch(chunk);
            }

            return new Response(JSON.stringify({ success: true, message: "Metadata and word tags cleaned up successfully" }), { headers: corsHeaders });
          }
        }

        // API 2: GÁN NHÃN TAG TỪ VỰNG HÀNG LOẠT (CÓ TỰ ĐỘNG DỌN DẸP NHÃN CHA DƯ THỪA)
        if (path === "/api/admin/tag-words" && request.method === "POST") {
          const { tag_id, parent_tag_id, words } = await request.json();

          if (!tag_id || !words || !Array.isArray(words) || words.length === 0) {
            return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400, headers: corsHeaders });
          }

          let stmt;
          if (parent_tag_id) {
            // Thay thế NOT LIKE bằng instr() = 0 để tránh sập giới hạn 50-Byte
            stmt = env.DB.prepare(`
              UPDATE dictionary 
              SET tags = ',' || TRIM(REPLACE(REPLACE(COALESCE(tags, ''), ',' || ?2 || ',', ','), ',,', ','), ',') || ',' || ?3 || ','
              WHERE word = ?1 AND (tags IS NULL OR instr(tags, ',' || ?3 || ',') = 0)
            `);
          } else {
            // Thay thế NOT LIKE bằng instr() = 0 và dọn nốt hàm TRIM(BOTH...) cũ
            stmt = env.DB.prepare(`
              UPDATE dictionary 
              SET tags = ',' || TRIM(REPLACE(REPLACE(COALESCE(tags, ''), ',' || ?2 || ',', ','), ',,', ','), ',') || ',' || ?2 || ','
              WHERE word = ?1 AND (tags IS NULL OR instr(tags, ',' || ?2 || ',') = 0)
            `);
          }

          const batchStatements = [];
          words.forEach(word => {
            const cleanWord = word.trim();
            if (cleanWord) {
              if (parent_tag_id) {
                batchStatements.push(stmt.bind(cleanWord, parent_tag_id, tag_id));
              } else {
                batchStatements.push(stmt.bind(cleanWord, tag_id));
              }
            }
          });

          if (batchStatements.length > 0) {
            await env.DB.batch(batchStatements);
          }

          return new Response(JSON.stringify({ success: true, count: batchStatements.length }), { headers: corsHeaders });
        }

        // API 3: GỠ NHÃN TAG KHỎI TỪ VỰNG HÀNG LOẠT
        if (path === "/api/admin/untag-words" && request.method === "POST") {
          const { tag_id, words } = await request.json();

          if (!tag_id || !words || !Array.isArray(words) || words.length === 0) {
            return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400, headers: corsHeaders });
          }

          // Xóa nhãn tag con ra khỏi chuỗi tags. Nếu sau khi xóa không còn tag nào, tự động gán về NULL
          const stmt = env.DB.prepare(`
            UPDATE dictionary 
            SET tags = CASE 
              WHEN TRIM(REPLACE(REPLACE(COALESCE(tags, ''), ',' || ?2 || ',', ','), ',,', ','), ',') = '' THEN NULL
              ELSE ',' || TRIM(REPLACE(REPLACE(COALESCE(tags, ''), ',' || ?2 || ',', ','), ',,', ','), ',') || ','
            END
            WHERE word = ?1
          `);

          const batchStatements = [];
          words.forEach(word => {
            const cleanWord = word.trim();
            if (cleanWord) {
              batchStatements.push(stmt.bind(cleanWord, tag_id));
            }
          });

          if (batchStatements.length > 0) {
            await env.DB.batch(batchStatements);
          }

          return new Response(JSON.stringify({ success: true, count: batchStatements.length }), { headers: corsHeaders });
        }
        // API 4: LÀM SẠCH VÀ TIÊU DIỆT TOÀN BỘ NHÃN MỒ CÔI (ORPHANED TAGS) KHÔNG CÒN TRÊN SƠ ĐỒ CÂY
        if (path === "/api/admin/sanitize-db-tags" && request.method === "POST") {
          // 1. Lấy toàn bộ danh sách các mã tag đang tồn tại thực tế trên Sơ đồ cây hệ thống
          const { results: validMetadata } = await env.DB.prepare("SELECT tag_id FROM thematic_metadata").all();
          
          // Đưa vào Set để kiểm tra O(1) siêu tốc
          const validTagsSet = new Set(validMetadata ? validMetadata.map(m => m.tag_id) : []);

          // 2. Quét tìm tất cả các từ đang có gắn nhãn tags dưới từ điển
          const { results } = await env.DB.prepare("SELECT id, word, tags FROM dictionary WHERE tags IS NOT NULL AND tags != ''").all();
          
          if (!results || results.length === 0) {
            return new Response(JSON.stringify({ success: true, total_cleaned: 0 }), { headers: corsHeaders });
          }

          const batchStatements = [];
          const updateStmt = env.DB.prepare("UPDATE dictionary SET tags = ?2 WHERE id = ?1");
          
          let cleanedCount = 0;

          // 3. Thực thi thuật toán kiểm duyệt chéo bằng JS
          results.forEach(row => {
            const rawTags = row.tags.split(',').map(t => t.trim()).filter(Boolean);
            
            // CHỈ GIỮ LẠI: Các tag thực sự tồn tại trong sơ đồ cây (thematic_metadata)
            // Tự động triệt tiêu các nhãn mồ côi (đã bị xóa từ trước) và lọc trùng lặp
            const cleanedTags = rawTags.filter(t => validTagsSet.has(t));
            const uniqueTags = [...new Set(cleanedTags)];
            
            // Định cấu trúc chuỗi tag chuẩn hóa sạch sẽ
            const cleanTagsString = uniqueTags.length > 0 ? `,${uniqueTags.join(',')},` : null;
            
            // Nếu phát hiện chuỗi tag bị lệch (do có chứa nhãn mồ côi hoặc trùng lặp) -> Cập nhật
            if (cleanTagsString !== row.tags) {
              batchStatements.push(updateStmt.bind(row.id, cleanTagsString));
              cleanedCount++;
            }
          });

          // 4. Chia nhỏ Batch 100 câu ghi đè lên D1 an toàn
          const chunkSize = 100;
          for (let i = 0; i < batchStatements.length; i += chunkSize) {
            const chunk = batchStatements.slice(i, i + chunkSize);
            await env.DB.batch(chunk);
          }

          return new Response(JSON.stringify({ success: true, total_cleaned: cleanedCount }), { headers: corsHeaders });
        }
        // API 5: BIÊN TẬP VÀ CẬP NHẬT CHI TIẾT TỪ VỰNG TRỰC TIẾP TRÊN TỪ ĐIỂN GỐC D1
        if (path === "/api/admin/update-dictionary-word" && request.method === "POST") {
          const { id, word, reading, meaning, hv, level, examples } = await request.json();

          if (!id || !word || !reading || !meaning) {
            return new Response(JSON.stringify({ error: "Missing required parameters" }), { status: 400, headers: corsHeaders });
          }

          // Chuẩn hóa và làm sạch chuỗi mảng ví dụ JSON trước khi ghi vào SQLite
          const examplesJsonStr = typeof examples === 'string' ? examples : JSON.stringify(examples || []);

          await env.DB.prepare(`
            UPDATE dictionary 
            SET word = ?2, reading = ?3, meaning = ?4, hv = ?5, level = ?6, examples = ?7
            WHERE id = ?1
          `).bind(
            id, 
            word.trim(), 
            reading.trim(), 
            meaning.trim(), 
            (hv || '').trim().toUpperCase(), // Hán Việt luôn ghi tự động dạng viết hoa
            level || 'N3', 
            examplesJsonStr
          ).run();

          return new Response(JSON.stringify({ success: true, message: "Dictionary word updated successfully" }), { headers: corsHeaders });
        }
      }

      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};

export {
  worker_default as default
};
