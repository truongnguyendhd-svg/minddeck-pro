const Parser = require('rss-parser');
const cheerio = require('cheerio');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { action, source, url } = req.query;
    const parser = new Parser({ headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' } });

    try {
        // --- 1. LẤY NỘI DUNG CHI TIẾT ---
        if (action === 'getContent') {
            const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const html = await response.text();
            const $ = cheerio.load(html);
            
            // Xóa mọi thứ trừ nội dung chính
            $('script, style, rt, rp, header, footer, nav, aside, .ad, .sns, .sharing, .news-footer').remove();

            // Nhắm vào các vùng chứa chữ lớn nhất
            let bodyText = $('.article-main__body, #js-article-body, .article_body, .news-text-body, #newsarticle, .caSec').text();

            // Nếu vẫn rỗng, quét mọi thẻ P và DIV có nhiều chữ
            if (!bodyText || bodyText.trim().length < 100) {
                bodyText = "";
                $('p, div').each((i, el) => {
                    const t = $(el).text().trim();
                    if (t.length > 40 && !t.includes('{')) bodyText += t + "\n\n";
                });
            }

            return res.status(200).json({ 
                content: bodyText.trim() || "Không thể lấy nội dung bài báo này. Có thể bài viết chỉ có Video hoặc yêu cầu đăng ký hội viên." 
            });
        }

        // --- 2. LẤY DANH SÁCH BÀI (NHK EASY) ---
        // Sử dụng nguồn RSS thay vì JSON để tránh bị chặn
        if (source === 'nhk_easy') {
            const feed = await parser.parseURL('https://www3.nhk.or.jp/rss/news/easy.xml');
            return res.status(200).json(feed.items.map(i => ({ title: i.title, link: i.link, date: i.pubDate })));
        }

        // --- 3. LẤY DANH SÁCH BÀI (NHK CHUẨN / YAHOO) ---
        const rssUrl = source === 'yahoo' 
            ? 'https://news.yahoo.co.jp/rss/topics/top-picks.xml' 
            : 'https://www.nhk.or.jp/rss/news/cat0.xml';
        
        const feed = await parser.parseURL(rssUrl);
        return res.status(200).json((feed.items || []).map(i => ({ title: i.title, link: i.link, date: i.pubDate })));

    } catch (e) {
        return res.status(200).json({ error: e.message, content: "Lỗi kết nối: " + e.message });
    }
};
